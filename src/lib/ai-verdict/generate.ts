import { getDb, id as newId } from '../db/server';
import { auditTx } from '../db/audit';
import type { AdminIdentity } from '../db/auth';
import { HttpError } from '../db/auth';
import { assembleEvidence, resolveTestRunId } from './assembleEvidence';
import { aiVerdictConfig, PROMPT_VERSION } from './config';
import { deriveKeyFindings } from './keyFindings';
import { getOpenAIClient } from './openaiClient';
import { buildSystemPrompt, buildUserPrompt } from './prompts/v1';
import { buildMetaDescriptionSystemPrompt, normalizeMetaDescriptionText } from './prompts/metaDescription';
import { isMetaDescriptionField } from './fieldPromptHelpers';
import { TONE_OF_VOICE_PROMPT } from './toneOfVoice';
import { assertRateLimit } from './rateLimit';
import { parseAiSuggestionOutput } from './normalizeOutput';
import { type GenerateRequest, validateEvidenceIds } from './suggestionSchema';

export async function generateAiSuggestion(
  body: GenerateRequest,
  identity: AdminIdentity,
) {
  const cfg = aiVerdictConfig();
  if (!cfg.enabled) throw new HttpError(503, 'AI verdict writer is disabled.');

  assertRateLimit(
    identity.email,
    // Cooldown is per target (field/category), not per product — the inline
    // per-field assist buttons fire many small requests for the same product.
    [body.productId, body.scope, body.categorySlug ?? '', body.targetField ?? ''].join(':'),
  );

  const testRunId = await resolveTestRunId(body.productId, body.testRunId);
  const payload = await assembleEvidence({
    productId: body.productId,
    testRunId,
    scope: body.scope,
    categorySlug: body.categorySlug,
    targetField: body.targetField,
    includeTesterNotes: body.includeTesterNotes ?? false,
  });

  const db = getDb();

  if (!body.regenerate) {
    const { aiEditorialSuggestions } = await (db.query as any)({
      aiEditorialSuggestions: {
        $: {
          where: {
            inputHash: payload.inputHash,
            status: 'generated',
          },
          limit: 1,
        },
      },
    });
    const cached = aiEditorialSuggestions?.[0];
    if (cached && Date.now() - Number(cached.generatedAt) < cfg.dedupeWindowMs) {
      return formatSuggestionRow(cached, payload.inputHash);
    }
  }

  const keyFindings = deriveKeyFindings(payload);
  const client = getOpenAIClient();
  const metaDescription = isMetaDescriptionField(body.targetField);
  const system = metaDescription
    ? buildMetaDescriptionSystemPrompt(payload.product.name)
    : `${buildSystemPrompt(body.scope)}\n\n${TONE_OF_VOICE_PROMPT}`;
  const user = buildUserPrompt(payload, keyFindings, body.targetField, {
    currentText: body.currentText,
    fieldMode: body.fieldMode,
    notesContext: body.notesContext,
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
      max_tokens: cfg.maxOutputTokens,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'OpenAI request failed';
    await db.transact(
      auditTx({
        actorEmail: identity.email,
        action: 'ai_suggest_failed',
        recordType: 'aiEditorialSuggestion',
        recordId: body.productId,
        newValue: { scope: body.scope, error: msg },
      }),
    );
    throw new HttpError(502, `AI generation failed: ${msg}`);
  }

  const raw = completion.choices[0]?.message?.content;
  if (!raw) throw new HttpError(502, 'Empty AI response');

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new HttpError(502, 'AI returned invalid JSON');
  }

  const output = parseAiSuggestionOutput(
    parsed,
    body.scope,
    body.categorySlug,
    body.targetField,
  );

  if (metaDescription && output.field_suggestion?.text) {
    output.field_suggestion.text = normalizeMetaDescriptionText(output.field_suggestion.text);
  }

  const allowedIds = new Set(payload.evidenceIds);
  const idErrors = validateEvidenceIds(output, allowedIds);
  if (idErrors.length > 0) {
    await db.transact(
      auditTx({
        actorEmail: identity.email,
        action: 'ai_suggest_failed',
        recordType: 'aiEditorialSuggestion',
        recordId: body.productId,
        newValue: { scope: body.scope, errors: idErrors },
      }),
    );
    throw new HttpError(422, `Invalid AI output: ${idErrors.slice(0, 3).join('; ')}`);
  }

  const suggestionId = newId();
  const now = Date.now();
  const tokenUsage = {
    input: completion.usage?.prompt_tokens ?? 0,
    output: completion.usage?.completion_tokens ?? 0,
  };

  await db.transact([
    db.tx.aiEditorialSuggestions[suggestionId].update({
      scope: body.scope,
      categorySlug: body.categorySlug,
      targetField: body.targetField,
      promptVersion: PROMPT_VERSION,
      model: cfg.model,
      evidenceIds: payload.evidenceIds,
      inputHash: payload.inputHash,
      structuredOutput: output,
      keyFindings,
      status: 'generated',
      tokenUsage,
      openaiRequestId: completion.id,
      generatedBy: identity.email,
      generatedAt: now,
    }),
    db.tx.aiEditorialSuggestions[suggestionId].link({
      product: body.productId,
      testRun: testRunId,
    }),
    auditTx({
      actorEmail: identity.email,
      action: 'ai_suggest_generated',
      recordType: 'aiEditorialSuggestion',
      recordId: suggestionId,
      newValue: {
        scope: body.scope,
        categorySlug: body.categorySlug,
        testRunId,
        evidenceCount: payload.evidenceIds.length,
        model: cfg.model,
      },
    }),
  ]);

  return formatSuggestionRow(
    {
      id: suggestionId,
      scope: body.scope,
      categorySlug: body.categorySlug,
      targetField: body.targetField,
      status: 'generated',
      structuredOutput: output,
      keyFindings,
      inputHash: payload.inputHash,
      evidenceIds: payload.evidenceIds,
      model: cfg.model,
      promptVersion: PROMPT_VERSION,
      generatedAt: now,
      tokenUsage,
      testRun: { id: testRunId },
    },
    payload.inputHash,
  );
}

function formatSuggestionRow(row: any, inputHash: string) {
  return {
    id: row.id,
    scope: row.scope,
    categorySlug: row.categorySlug ?? null,
    targetField: row.targetField ?? null,
    status: row.status,
    structuredOutput: row.structuredOutput,
    keyFindings: row.keyFindings ?? [],
    inputHash: row.inputHash ?? inputHash,
    evidenceIds: row.evidenceIds ?? [],
    model: row.model,
    promptVersion: row.promptVersion,
    generatedAt: row.generatedAt,
    tokenUsage: row.tokenUsage ?? null,
    testRunId: row.testRun?.id ?? null,
  };
}

export async function getSuggestion(id: string) {
  const db = getDb();
  const { aiEditorialSuggestions } = await (db.query as any)({
    aiEditorialSuggestions: {
      $: { where: { id } },
      product: {},
      testRun: {},
    },
  });
  const row = aiEditorialSuggestions?.[0];
  if (!row) throw new HttpError(404, 'Suggestion not found');
  return formatSuggestionRow(row, row.inputHash);
}

export async function markSuggestionInserted(id: string, identity: AdminIdentity) {
  const db = getDb();
  const row = await getSuggestion(id);
  const now = Date.now();
  await db.transact([
    db.tx.aiEditorialSuggestions[id].update({
      status: 'inserted',
      insertedAt: now,
      insertedBy: identity.email,
    }),
    auditTx({
      actorEmail: identity.email,
      action: 'ai_suggest_inserted',
      recordType: 'aiEditorialSuggestion',
      recordId: id,
      newValue: { scope: row.scope, categorySlug: row.categorySlug },
    }),
  ]);
  return row;
}

export async function markSuggestionRejected(id: string, identity: AdminIdentity) {
  const db = getDb();
  const row = await getSuggestion(id);
  const now = Date.now();
  await db.transact([
    db.tx.aiEditorialSuggestions[id].update({
      status: 'rejected',
      rejectedAt: now,
      rejectedBy: identity.email,
    }),
    auditTx({
      actorEmail: identity.email,
      action: 'ai_suggest_rejected',
      recordType: 'aiEditorialSuggestion',
      recordId: id,
      newValue: { scope: row.scope },
    }),
  ]);
  return row;
}

export async function getUsageSummary() {
  const db = getDb();
  const since = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const { aiEditorialSuggestions } = await (db.query as any)({
    aiEditorialSuggestions: { $: {} },
  });
  const rows = (aiEditorialSuggestions as any[]).filter(
    (r) => Number(r.generatedAt) >= since && r.status !== 'failed',
  );
  let input = 0;
  let output = 0;
  for (const r of rows) {
    input += r.tokenUsage?.input ?? 0;
    output += r.tokenUsage?.output ?? 0;
  }
  return {
    periodDays: 30,
    requestCount: rows.length,
    tokenUsage: { input, output },
    byScope: rows.reduce<Record<string, number>>((acc, r) => {
      acc[r.scope] = (acc[r.scope] ?? 0) + 1;
      return acc;
    }, {}),
  };
}
