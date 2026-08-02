import { getDb, id as newId } from '../db/server';
import { auditTx } from '../db/audit';
import type { AdminIdentity } from '../db/auth';
import { HttpError } from '../db/auth';
import { getOpenAIClient } from '../ai-verdict/openaiClient';
import { assertExplanationRateLimit } from './rateLimit';
import {
  assembleExplanationContext,
  assembleExplanationContextFromBundle,
} from './assembleContext';
import { findExplanationInMap, loadExplanationRowsByKey } from './db';
import { loadAssemblyInputs, deriveExplanationStatus } from './listGroups';
import { aiExplanationsConfig, PROMPT_VERSION } from './config';
import {
  buildExplanationSystemPrompt,
  buildExplanationUserPrompt,
} from './prompts/v1';
import { validateExplanationOutput } from './validateOutput';
import type { ExplanationApprovePatch, ExplanationRowDto, ExplanationStatus } from './types';
import {
  buildNotApplicableWhatThisMeans,
  isNotApplicableCategory,
} from '../draft-ratings/notApplicableExplanation';
import type { DraftMeasurement } from '../draft-ratings/types';

const SCHEMA_OUT_OF_DATE_MSG =
  'Database schema is out of date. Run `npm run db:push` in the project root, confirm the push, then try again.';

function isSchemaMismatchError(error: unknown): boolean {
  const parts: string[] = [];
  if (error instanceof Error) parts.push(error.message);
  if (error && typeof error === 'object') {
    const body = (error as { body?: { message?: string } }).body?.message;
    if (body) parts.push(body);
  }
  parts.push(String(error));
  const msg = parts.join(' ');
  return msg.includes('missing in your schema') || msg.includes('Attributes are missing');
}

async function transactOrSchemaError(chunks: unknown[]) {
  const db = getDb();
  try {
    await db.transact(chunks as any);
  } catch (e: unknown) {
    if (isSchemaMismatchError(e)) throw new HttpError(400, SCHEMA_OUT_OF_DATE_MSG);
    throw e;
  }
}

async function findExplanationRow(productId: string, groupKey: string) {
  const byKey = await loadExplanationRowsByKey(productId);
  return findExplanationInMap(byKey, groupKey);
}

function effectiveStatus(row: any, hasText: boolean): ExplanationStatus {
  if (!row && !hasText) return 'not_generated';
  const status = row?.explanationStatus as ExplanationStatus | undefined;
  if (!hasText && !status) return 'not_generated';
  return status ?? (hasText ? 'needs_review' : 'not_generated');
}

export async function upsertExplanationRow(
  productId: string,
  groupKey: string,
  fields: Record<string, unknown>,
  identity?: AdminIdentity,
  existingRow?: any | null,
) {
  const db = getDb();
  const existing = existingRow ?? (await findExplanationRow(productId, groupKey));
  const now = Date.now();

  if (existing) {
    await transactOrSchemaError([
      (db.tx as any).evidenceExplanations[existing.id].update({
        ...fields,
        updatedAt: now,
      }),
    ]);
    return existing.id as string;
  }

  const rowId = newId();
  const parsed = groupKey.split('/');
  await transactOrSchemaError([
    (db.tx as any).evidenceExplanations[rowId]
      .update({
        groupKey,
        categorySlug: parsed[0],
        subscoreSlug: parsed[1],
        groupSlug: parsed[2],
        groupName: String(fields.groupName ?? parsed[2]),
        explanationStatus: fields.explanationStatus ?? 'not_generated',
        updatedAt: now,
        ...fields,
      })
      .link({ product: productId }),
    ...(identity
      ? [
          auditTx({
            actorEmail: identity.email,
            action: 'evidence_explanation_created',
            recordType: 'evidenceExplanation',
            recordId: rowId,
            newValue: { groupKey, productId },
          }),
        ]
      : []),
  ]);
  return rowId;
}

function formatExplanationRow(row: any, context: Awaited<ReturnType<typeof assembleExplanationContext>>): ExplanationRowDto {
  const hasText = Boolean(row?.whatThisMeans?.trim());
  const resultsChanged = Boolean(row?.inputHash && row.inputHash !== context.inputHash);
  let status = effectiveStatus(row, hasText);
  if (resultsChanged && status === 'approved') status = 'outdated';

  return {
    id: row?.id,
    groupKey: context.group.groupKey,
    categorySlug: context.group.categorySlug,
    subscoreSlug: context.group.subscoreSlug,
    groupSlug: context.group.groupSlug,
    groupName: context.group.groupName,
    categoryName: context.group.categoryName,
    subscoreName: context.group.subscoreName,
    whatThisMeans: row?.whatThisMeans ?? undefined,
    explanationStatus: status,
    inputHash: row?.inputHash ?? undefined,
    generatedFromMethodologyVersion: row?.generatedFromMethodologyVersion ?? undefined,
    reviewerNote: row?.reviewerNote ?? undefined,
    generationError: row?.generationError ?? undefined,
    generatedAt: row?.generatedAt ?? undefined,
    generatedBy: row?.generatedBy ?? undefined,
    approvedAt: row?.approvedAt ?? undefined,
    approvedBy: row?.approvedBy ?? undefined,
    score: context.score,
    resultsChanged,
    hasUsableResults: context.hasUsableResults,
    methodology: context.methodology,
    results: context.results,
  };
}

function toApprovePatch(
  groupKey: string,
  text: string,
  identity: AdminIdentity,
  inputHash: string,
  now: number,
): ExplanationApprovePatch {
  return {
    groupKey,
    whatThisMeans: text,
    explanationStatus: 'approved',
    approvedAt: now,
    approvedBy: identity.email,
    inputHash,
  };
}

export async function generateExplanation(
  productId: string,
  groupKey: string,
  identity: AdminIdentity,
  opts?: { regenerate?: boolean; reviewerNote?: string; testRunId?: string; skipRateLimit?: boolean },
) {
  const cfg = aiExplanationsConfig();
  if (!cfg.enabled) throw new HttpError(503, 'AI result explanations are disabled.');

  assertExplanationRateLimit(identity.email, productId, { skip: opts?.skipRateLimit });

  const context = await assembleExplanationContext(productId, groupKey, {
    testRunId: opts?.testRunId,
    reviewerNote: opts?.reviewerNote,
  });

  const naMeasurements: DraftMeasurement[] = context.results.map((row) => ({
    slug: row.slug,
    label: row.label,
    value: row.value,
    status: row.value.trim().toLowerCase() === 'not applicable' ? 'not-applicable' : 'verified',
    normalizedScore: row.normalizedScore ?? null,
  }));

  if (isNotApplicableCategory(naMeasurements)) {
    const templateText = buildNotApplicableWhatThisMeans({
      productName: context.product.name,
      categorySlug: context.group.categorySlug,
      subscoreSlug: context.group.subscoreSlug,
      evidenceSlug: context.group.groupSlug,
      evidenceName: context.group.groupName,
      testResults: naMeasurements,
    });

    if (templateText) {
      const byKey = await loadExplanationRowsByKey(productId);
      const existing = findExplanationInMap(byKey, groupKey);
      const now = Date.now();
      await upsertExplanationRow(
        productId,
        groupKey,
        {
          groupName: context.group.groupName,
          whatThisMeans: templateText,
          explanationStatus: 'needs_review',
          inputHash: context.inputHash,
          generatedFromMethodologyVersion: context.methodologyVersion ?? undefined,
          reviewerNote: opts?.reviewerNote ?? existing?.reviewerNote,
          generationError: undefined,
          promptVersion: 'not-applicable-template',
          generatedAt: now,
          generatedBy: identity.email,
        },
        identity,
        existing,
      );
      const saved = findExplanationInMap(await loadExplanationRowsByKey(productId), groupKey);
      return formatExplanationRow(
        saved ?? { whatThisMeans: templateText, explanationStatus: 'needs_review' },
        context,
      );
    }
  }

  if (!context.hasUsableResults) {
    throw new HttpError(400, 'No usable test results for this evidence group.');
  }

  const byKey = await loadExplanationRowsByKey(productId);
  const existing = findExplanationInMap(byKey, groupKey);
  if (
    existing?.explanationStatus === 'approved' &&
    existing.inputHash === context.inputHash &&
    !opts?.regenerate
  ) {
    return formatExplanationRow(existing, context);
  }

  const client = getOpenAIClient();
  const system = buildExplanationSystemPrompt();
  const user = buildExplanationUserPrompt({
    productName: context.product.name,
    whatThisMeasures: context.methodology.whatThisMeasures,
    howWeTested: context.methodology.howWeTested,
    results: context.results,
    reviewerNote: opts?.reviewerNote ?? existing?.reviewerNote,
  });

  let completion;
  try {
    completion = await client.chat.completions.create({
      model: cfg.model,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
      response_format: { type: 'json_object' },
      temperature: cfg.temperature,
      max_tokens: cfg.maxOutputTokens,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'OpenAI request failed';
    await upsertExplanationRow(
      productId,
      groupKey,
      {
        groupName: context.group.groupName,
        explanationStatus: 'error',
        generationError: msg,
        generatedAt: Date.now(),
        generatedBy: identity.email,
      },
      identity,
      existing,
    );
    throw new HttpError(502, `AI generation failed: ${msg}`);
  }

  const raw = completion.choices[0]?.message?.content;
  if (!raw) throw new HttpError(502, 'Empty AI response');

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    await upsertExplanationRow(
      productId,
      groupKey,
      {
        groupName: context.group.groupName,
        explanationStatus: 'error',
        generationError: 'AI returned invalid JSON',
        generatedAt: Date.now(),
        generatedBy: identity.email,
      },
      identity,
      existing,
    );
    throw new HttpError(502, 'AI returned invalid JSON');
  }

  let output: { whatThisMeans: string };
  try {
    output = validateExplanationOutput(parsed);
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Invalid AI output';
    await upsertExplanationRow(
      productId,
      groupKey,
      {
        groupName: context.group.groupName,
        explanationStatus: 'error',
        generationError: msg,
        generatedAt: Date.now(),
        generatedBy: identity.email,
      },
      identity,
      existing,
    );
    throw new HttpError(422, msg);
  }

  const now = Date.now();
  await upsertExplanationRow(
    productId,
    groupKey,
    {
      groupName: context.group.groupName,
      whatThisMeans: output.whatThisMeans,
      explanationStatus: 'needs_review',
      inputHash: context.inputHash,
      generatedFromMethodologyVersion: context.methodologyVersion ?? undefined,
      reviewerNote: opts?.reviewerNote ?? existing?.reviewerNote,
      generationError: undefined,
      promptVersion: PROMPT_VERSION,
      model: cfg.model,
      tokenUsage: completion.usage ?? undefined,
      generatedAt: now,
      generatedBy: identity.email,
    },
    identity,
    existing,
  );

  const saved = findExplanationInMap(await loadExplanationRowsByKey(productId), groupKey);
  return formatExplanationRow(saved ?? { whatThisMeans: output.whatThisMeans, explanationStatus: 'needs_review' }, context);
}

export async function saveExplanation(
  productId: string,
  groupKey: string,
  identity: AdminIdentity,
  body: { whatThisMeans?: string; reviewerNote?: string },
) {
  const context = await assembleExplanationContext(productId, groupKey);
  const existing = await findExplanationRow(productId, groupKey);
  const text = body.whatThisMeans?.trim() ?? existing?.whatThisMeans ?? '';
  if (!text) throw new HttpError(400, 'whatThisMeans is required to save.');

  let status: ExplanationStatus = 'draft';
  if (existing?.explanationStatus === 'needs_review') status = 'draft';
  if (existing?.explanationStatus === 'outdated') status = 'outdated';
  if (existing?.explanationStatus === 'approved' && text !== existing.whatThisMeans) {
    status = 'draft';
  } else if (existing?.explanationStatus === 'approved' && text === existing.whatThisMeans) {
    status = 'approved';
  }

  await upsertExplanationRow(
    productId,
    groupKey,
    {
      groupName: context.group.groupName,
      whatThisMeans: text,
      explanationStatus: status,
      reviewerNote: body.reviewerNote ?? existing?.reviewerNote,
      inputHash: existing?.inputHash ?? context.inputHash,
      generatedFromMethodologyVersion:
        existing?.generatedFromMethodologyVersion ?? context.methodologyVersion ?? undefined,
    },
    identity,
    existing,
  );

  const saved = await findExplanationRow(productId, groupKey);
  return formatExplanationRow(saved, context);
}

/** Fast approve — one bundle load, one row map, one transact, slim response. */
export async function approveExplanation(
  productId: string,
  groupKey: string,
  identity: AdminIdentity,
  body?: { whatThisMeans?: string; reviewerNote?: string },
): Promise<{ patch: ExplanationApprovePatch; row?: ExplanationRowDto }> {
  const { bundle, byKey } = await loadAssemblyInputs(productId);
  const context = assembleExplanationContextFromBundle(bundle, groupKey, {
    reviewerNote: body?.reviewerNote,
  });
  const existing = byKey.get(groupKey);
  const text = body?.whatThisMeans?.trim() ?? existing?.whatThisMeans ?? '';
  if (!text) throw new HttpError(400, 'Nothing to approve — add or generate text first.');

  const now = Date.now();
  await upsertExplanationRow(
    productId,
    groupKey,
    {
      groupName: context.group.groupName,
      whatThisMeans: text,
      explanationStatus: 'approved',
      inputHash: context.inputHash,
      generatedFromMethodologyVersion: context.methodologyVersion ?? undefined,
      reviewerNote: body?.reviewerNote ?? existing?.reviewerNote,
      approvedAt: now,
      approvedBy: identity.email,
      generationError: undefined,
    },
    identity,
    existing,
  );

  const patch = toApprovePatch(groupKey, text, identity, context.inputHash, now);
  const saved = { ...existing, ...patch, explanationStatus: 'approved' as const };
  return { patch, row: formatExplanationRow(saved, context) };
}

export async function approveAllExplanations(
  productId: string,
  identity: AdminIdentity,
  opts?: { status?: 'needs_review' | 'all_reviewable' },
): Promise<{ approved: number; patches: ExplanationApprovePatch[] }> {
  const { bundle, byKey } = await loadAssemblyInputs(productId);
  const db = getDb();
  const now = Date.now();
  const chunks: unknown[] = [];
  const patches: ExplanationApprovePatch[] = [];

  for (const [groupKey, existing] of byKey.entries()) {
    if (!existing?.whatThisMeans?.trim()) continue;
    let context;
    try {
      context = assembleExplanationContextFromBundle(bundle, groupKey);
    } catch {
      continue;
    }
    if (!context.hasUsableResults) continue;
    const resultsChanged = Boolean(existing.inputHash && existing.inputHash !== context.inputHash);
    const status = deriveExplanationStatus(existing, resultsChanged, context.hasUsableResults);
    if (status !== 'needs_review' && !(opts?.status === 'all_reviewable' && status === 'draft')) continue;

    const text = String(existing.whatThisMeans).trim();
    chunks.push(
      (db.tx as any).evidenceExplanations[existing.id].update({
        whatThisMeans: text,
        explanationStatus: 'approved',
        inputHash: context.inputHash,
        approvedAt: now,
        approvedBy: identity.email,
        generationError: undefined,
        updatedAt: now,
      }),
    );
    patches.push(toApprovePatch(groupKey, text, identity, context.inputHash, now));
  }

  if (chunks.length === 0) return { approved: 0, patches: [] };
  await transactOrSchemaError(chunks);
  return { approved: patches.length, patches };
}

export async function discardAllExplanations(
  productId: string,
  identity: AdminIdentity,
): Promise<{ discarded: number }> {
  const { bundle, byKey } = await loadAssemblyInputs(productId);
  const db = getDb();
  const now = Date.now();
  const chunks: unknown[] = [];
  let discarded = 0;

  for (const [groupKey, existing] of byKey.entries()) {
    if (!existing?.whatThisMeans?.trim()) continue;
    let context;
    try {
      context = assembleExplanationContextFromBundle(bundle, groupKey);
    } catch {
      continue;
    }
    const resultsChanged = Boolean(existing.inputHash && existing.inputHash !== context.inputHash);
    const status = deriveExplanationStatus(existing, resultsChanged, context.hasUsableResults);
    if (status !== 'needs_review' && status !== 'draft') continue;

    chunks.push(
      (db.tx as any).evidenceExplanations[existing.id].update({
        whatThisMeans: undefined,
        explanationStatus: 'not_generated',
        generationError: undefined,
        reviewerNote: undefined,
        updatedAt: now,
      }),
    );
    discarded += 1;
  }

  if (chunks.length === 0) return { discarded: 0 };
  await transactOrSchemaError(chunks);
  return { discarded };
}

/** Discard AI copy awaiting review — resets to not_generated. */
export async function discardExplanationReview(
  productId: string,
  groupKey: string,
  identity: AdminIdentity,
) {
  const { bundle, byKey } = await loadAssemblyInputs(productId);
  const context = assembleExplanationContextFromBundle(bundle, groupKey);
  const existing = byKey.get(groupKey);
  if (!existing) throw new HttpError(404, 'No explanation row to discard.');

  const resultsChanged = Boolean(existing.inputHash && existing.inputHash !== context.inputHash);
  const status = deriveExplanationStatus(existing, resultsChanged, context.hasUsableResults);
  if (status === 'approved') {
    throw new HttpError(400, 'Cannot discard an approved explanation.');
  }
  if (status === 'not_generated') {
    return { patch: { groupKey, explanationStatus: 'not_generated' as const } };
  }

  await upsertExplanationRow(
    productId,
    groupKey,
    {
      groupName: context.group.groupName,
      whatThisMeans: undefined,
      explanationStatus: 'not_generated',
      generationError: undefined,
      reviewerNote: undefined,
    },
    identity,
    existing,
  );

  return { patch: { groupKey, explanationStatus: 'not_generated' as const } };
}

export { findExplanationRow, formatExplanationRow };
