import { runConcurrent } from '../concurrency';
import { getDb, id as newId } from '../db/server';
import { auditTx } from '../db/audit';
import type { AdminIdentity } from '../db/auth';
import { HttpError } from '../db/auth';
import { getOpenAIClient } from '../ai-verdict/openaiClient';
import { assertExplanationRateLimit } from '../ai-explanations/rateLimit';
import {
  assembleSubscoreTakeawayFromBundle,
  assembleSubscoreTakeawayContext,
  fmtScore,
} from './assembleContext';
import { findTakeawayInMap, loadTakeawayRowsByKey } from './db';
import { deriveTakeawayStatus, loadAssemblyInputs } from './listSubscores';
import { parseSubscoreKey } from './subscores';
import { subscoreTakeawaysConfig, PROMPT_VERSION } from './config';
import { buildTakeawaySystemPrompt, buildTakeawayUserPrompt } from './prompts/v1';
import { validateTakeawayOutput } from './validateOutput';
import type { TakeawayApprovePatch, TakeawayRowDto, TakeawayStatus } from './types';

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

async function findTakeawayRow(productId: string, subscoreKey: string) {
  const byKey = await loadTakeawayRowsByKey(productId);
  return findTakeawayInMap(byKey, subscoreKey);
}

function formatTakeawayRow(
  row: any,
  context: ReturnType<typeof assembleSubscoreTakeawayFromBundle>,
): TakeawayRowDto {
  const hasText = Boolean(row?.keyTakeaway?.trim());
  const resultsChanged = Boolean(row?.inputHash && row.inputHash !== context.inputHash);
  let status: TakeawayStatus = deriveTakeawayStatus(row, resultsChanged, context.hasUsableScores);

  return {
    id: row?.id,
    subscoreKey: context.subscore.subscoreKey,
    categorySlug: context.subscore.categorySlug,
    subscoreSlug: context.subscore.subscoreSlug,
    categoryName: context.subscore.categoryName,
    subscoreName: context.subscore.subscoreName,
    keyTakeaway: row?.keyTakeaway ?? undefined,
    takeawayStatus: status,
    inputHash: row?.inputHash ?? undefined,
    reviewerNote: row?.reviewerNote ?? undefined,
    generationError: row?.generationError ?? undefined,
    generatedAt: row?.generatedAt ?? undefined,
    generatedBy: row?.generatedBy ?? undefined,
    approvedAt: row?.approvedAt ?? undefined,
    approvedBy: row?.approvedBy ?? undefined,
    finalScore: context.finalScore,
    breakdown: context.breakdown,
    resultsChanged,
    hasUsableScores: context.hasUsableScores,
  };
}

function toApprovePatch(
  subscoreKey: string,
  text: string,
  identity: AdminIdentity,
  inputHash: string,
  now: number,
): TakeawayApprovePatch {
  return {
    subscoreKey,
    keyTakeaway: text,
    takeawayStatus: 'approved',
    approvedAt: now,
    approvedBy: identity.email,
    inputHash,
  };
}

export async function upsertTakeawayRow(
  productId: string,
  subscoreKey: string,
  fields: Record<string, unknown>,
  identity?: AdminIdentity,
  existingRow?: any | null,
) {
  const db = getDb();
  const existing = existingRow ?? (await findTakeawayRow(productId, subscoreKey));
  const now = Date.now();
  const parsed = parseSubscoreKey(subscoreKey);

  if (existing) {
    await transactOrSchemaError([
      (db.tx as any).subscoreTakeaways[existing.id].update({
        ...fields,
        updatedAt: now,
      }),
    ]);
    return existing.id as string;
  }

  const rowId = newId();
  await transactOrSchemaError([
    (db.tx as any).subscoreTakeaways[rowId]
      .update({
        subscoreKey,
        categorySlug: parsed.categorySlug,
        subscoreSlug: parsed.subscoreSlug,
        categoryName: String(fields.categoryName ?? parsed.categorySlug),
        subscoreName: String(fields.subscoreName ?? parsed.subscoreSlug),
        takeawayStatus: fields.takeawayStatus ?? 'not_generated',
        updatedAt: now,
        ...fields,
      })
      .link({ product: productId }),
    ...(identity
      ? [
          auditTx({
            actorEmail: identity.email,
            action: 'subscore_takeaway_created',
            recordType: 'subscoreTakeaway',
            recordId: rowId,
            newValue: { subscoreKey, productId },
          }),
        ]
      : []),
  ]);
  return rowId;
}

export async function generateSubscoreTakeaway(
  productId: string,
  subscoreKey: string,
  identity: AdminIdentity,
  opts?: { regenerate?: boolean; reviewerNote?: string; skipRateLimit?: boolean },
) {
  const cfg = subscoreTakeawaysConfig();
  if (!cfg.enabled) throw new HttpError(503, 'AI subscore takeaways are disabled.');

  assertExplanationRateLimit(identity.email, productId, { skip: opts?.skipRateLimit });

  const context = await assembleSubscoreTakeawayContext(productId, subscoreKey, {
    reviewerNote: opts?.reviewerNote,
  });

  if (!context.hasUsableScores) {
    throw new HttpError(400, 'No usable scores for this subscore.');
  }

  const byKey = await loadTakeawayRowsByKey(productId);
  const existing = findTakeawayInMap(byKey, subscoreKey);
  if (
    existing?.takeawayStatus === 'approved' &&
    existing.inputHash === context.inputHash &&
    !opts?.regenerate
  ) {
    return formatTakeawayRow(existing, context);
  }

  const client = getOpenAIClient();
  const system = buildTakeawaySystemPrompt();
  const user = buildTakeawayUserPrompt({
    productName: context.product.name,
    subscoreName: context.subscore.subscoreName,
    finalScore: fmtScore(context.finalScore),
    scoreBreakdown: context.scoreBreakdownText,
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
    await upsertTakeawayRow(
      productId,
      subscoreKey,
      {
        categoryName: context.subscore.categoryName,
        subscoreName: context.subscore.subscoreName,
        takeawayStatus: 'error',
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
    await upsertTakeawayRow(
      productId,
      subscoreKey,
      {
        categoryName: context.subscore.categoryName,
        subscoreName: context.subscore.subscoreName,
        takeawayStatus: 'error',
        generationError: 'AI returned invalid JSON',
        generatedAt: Date.now(),
        generatedBy: identity.email,
      },
      identity,
      existing,
    );
    throw new HttpError(502, 'AI returned invalid JSON');
  }

  let output: { keyTakeaway: string };
  try {
    output = validateTakeawayOutput(parsed);
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Invalid AI output';
    await upsertTakeawayRow(
      productId,
      subscoreKey,
      {
        categoryName: context.subscore.categoryName,
        subscoreName: context.subscore.subscoreName,
        takeawayStatus: 'error',
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
  await upsertTakeawayRow(
    productId,
    subscoreKey,
    {
      categoryName: context.subscore.categoryName,
      subscoreName: context.subscore.subscoreName,
      keyTakeaway: output.keyTakeaway,
      takeawayStatus: 'needs_review',
      inputHash: context.inputHash,
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

  const saved = findTakeawayInMap(await loadTakeawayRowsByKey(productId), subscoreKey);
  return formatTakeawayRow(saved ?? { keyTakeaway: output.keyTakeaway, takeawayStatus: 'needs_review' }, context);
}

export async function approveTakeaway(
  productId: string,
  subscoreKey: string,
  identity: AdminIdentity,
  body?: { keyTakeaway?: string; reviewerNote?: string },
): Promise<{ patch: TakeawayApprovePatch; row?: TakeawayRowDto }> {
  const { bundle, byKey } = await loadAssemblyInputs(productId);
  const context = assembleSubscoreTakeawayFromBundle(bundle, subscoreKey, {
    reviewerNote: body?.reviewerNote,
  });
  const existing = byKey.get(subscoreKey);
  const text = body?.keyTakeaway?.trim() ?? existing?.keyTakeaway ?? '';
  if (!text) throw new HttpError(400, 'Nothing to approve — add or generate text first.');

  const now = Date.now();
  await upsertTakeawayRow(
    productId,
    subscoreKey,
    {
      categoryName: context.subscore.categoryName,
      subscoreName: context.subscore.subscoreName,
      keyTakeaway: text,
      takeawayStatus: 'approved',
      inputHash: context.inputHash,
      reviewerNote: body?.reviewerNote ?? existing?.reviewerNote,
      approvedAt: now,
      approvedBy: identity.email,
      generationError: undefined,
    },
    identity,
    existing,
  );

  const patch = toApprovePatch(subscoreKey, text, identity, context.inputHash, now);
  const saved = { ...existing, ...patch, takeawayStatus: 'approved' as const };
  return { patch, row: formatTakeawayRow(saved, context) };
}

export async function approveAllTakeaways(
  productId: string,
  identity: AdminIdentity,
): Promise<{ approved: number; patches: TakeawayApprovePatch[] }> {
  const { bundle, byKey } = await loadAssemblyInputs(productId);
  const db = getDb();
  const now = Date.now();
  const chunks: unknown[] = [];
  const patches: TakeawayApprovePatch[] = [];

  for (const [subscoreKey, existing] of byKey.entries()) {
    if (!existing?.keyTakeaway?.trim()) continue;
    let context;
    try {
      context = assembleSubscoreTakeawayFromBundle(bundle, subscoreKey);
    } catch {
      continue;
    }
    if (!context.hasUsableScores) continue;
    const resultsChanged = Boolean(existing.inputHash && existing.inputHash !== context.inputHash);
    const status = deriveTakeawayStatus(existing, resultsChanged, context.hasUsableScores);
    if (status !== 'needs_review') continue;

    const text = String(existing.keyTakeaway).trim();
    chunks.push(
      (db.tx as any).subscoreTakeaways[existing.id].update({
        keyTakeaway: text,
        takeawayStatus: 'approved',
        inputHash: context.inputHash,
        approvedAt: now,
        approvedBy: identity.email,
        generationError: undefined,
        updatedAt: now,
      }),
    );
    patches.push(toApprovePatch(subscoreKey, text, identity, context.inputHash, now));
  }

  if (chunks.length === 0) return { approved: 0, patches: [] };
  await transactOrSchemaError(chunks);
  return { approved: patches.length, patches };
}

export async function discardAllTakeaways(
  productId: string,
  identity: AdminIdentity,
): Promise<{ discarded: number }> {
  const { bundle, byKey } = await loadAssemblyInputs(productId);
  const db = getDb();
  const now = Date.now();
  const chunks: unknown[] = [];
  let discarded = 0;

  for (const [subscoreKey, existing] of byKey.entries()) {
    if (!existing?.keyTakeaway?.trim()) continue;
    let context;
    try {
      context = assembleSubscoreTakeawayFromBundle(bundle, subscoreKey);
    } catch {
      continue;
    }
    const resultsChanged = Boolean(existing.inputHash && existing.inputHash !== context.inputHash);
    const status = deriveTakeawayStatus(existing, resultsChanged, context.hasUsableScores);
    if (status !== 'needs_review' && status !== 'draft') continue;

    chunks.push(
      (db.tx as any).subscoreTakeaways[existing.id].update({
        keyTakeaway: undefined,
        takeawayStatus: 'not_generated',
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

export async function discardTakeawayReview(
  productId: string,
  subscoreKey: string,
  identity: AdminIdentity,
) {
  const { bundle, byKey } = await loadAssemblyInputs(productId);
  const context = assembleSubscoreTakeawayFromBundle(bundle, subscoreKey);
  const existing = byKey.get(subscoreKey);
  if (!existing) throw new HttpError(404, 'No takeaway row to discard.');

  const resultsChanged = Boolean(existing.inputHash && existing.inputHash !== context.inputHash);
  const status = deriveTakeawayStatus(existing, resultsChanged, context.hasUsableScores);
  if (status === 'approved') {
    throw new HttpError(400, 'Cannot discard an approved takeaway.');
  }
  if (status === 'not_generated') {
    return { patch: { subscoreKey, takeawayStatus: 'not_generated' as const } };
  }

  await upsertTakeawayRow(
    productId,
    subscoreKey,
    {
      categoryName: context.subscore.categoryName,
      subscoreName: context.subscore.subscoreName,
      keyTakeaway: undefined,
      takeawayStatus: 'not_generated',
      generationError: undefined,
      reviewerNote: undefined,
    },
    identity,
    existing,
  );

  return { patch: { subscoreKey, takeawayStatus: 'not_generated' as const } };
}

export async function generateAllMissingTakeaways(
  productId: string,
  identity: AdminIdentity,
): Promise<{ generated: number; errors: Array<{ subscoreKey: string; error: string }> }> {
  const { summary, rows } = await import('./listSubscores').then((m) =>
    m.listProductTakeawaysSlim(productId),
  );
  void summary;
  const targets = rows.filter(
    (r) =>
      r.hasUsableScores &&
      (r.takeawayStatus === 'not_generated' || r.takeawayStatus === 'error'),
  );

  const cfg = subscoreTakeawaysConfig();
  let generated = 0;
  const errors: Array<{ subscoreKey: string; error: string }> = [];

  await runConcurrent(targets, cfg.concurrency, async (row) => {
    try {
      await generateSubscoreTakeaway(productId, row.subscoreKey, identity, {
        skipRateLimit: true,
      });
      generated += 1;
    } catch (e) {
      errors.push({
        subscoreKey: row.subscoreKey,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  });

  return { generated, errors };
}
