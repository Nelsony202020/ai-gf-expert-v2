import { getDb, id as newId } from '../db/server';
import { auditTx } from '../db/audit';
import type { AdminIdentity } from '../db/auth';
import { HttpError } from '../db/auth';
import { assembleEvidence, resolveTestRunId } from './assembleEvidence';
import { buildCategoryPerformance } from './categoryPerformance';
import { aiVerdictConfig } from './config';
import { deriveKeyFindings } from './keyFindings';
import { getOpenAIClient } from './openaiClient';
import { buildNotesSystemPrompt, buildNotesUserPrompt, NOTES_PROMPT_VERSION } from './notesPrompts';
import { parseAiSuggestionOutput } from './normalizeOutput';
import {
  buildFieldSuggestions,
  normalizeFieldSuggestions,
  parseSectionKey,
  sanitizeKeyFindings,
  sectionConfig,
  type AiVerdictNotesDto,
  type GenerateNotesRequest,
  type LoadNotesRequest,
  type LoadNotesResponse,
} from './notesSchema';
import { assertRateLimit } from './rateLimit';
import type { KeyFinding } from './suggestionSchema';
import { validateEvidenceIds } from './suggestionSchema';

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

const SCHEMA_OUT_OF_DATE_MSG =
  'Database schema is out of date. Run `npm run db:push` in the project root, confirm the push, then try again.';

async function findSavedNotes(
  productId: string,
  testRunId: string,
  sectionKey: string,
): Promise<any | null> {
  const db = getDb();
  try {
    const { aiVerdictNotes } = await (db.query as any)({
      aiVerdictNotes: {
        $: { where: { sectionKey } },
        product: {},
        testRun: {},
      },
    });
    const rows = (aiVerdictNotes as any[]).filter(
      (r) => r.product?.id === productId && r.testRun?.id === testRunId,
    );
    rows.sort((a, b) => Number(b.updatedAt ?? b.generatedAt) - Number(a.updatedAt ?? a.generatedAt));
    return rows[0] ?? null;
  } catch (e: unknown) {
    if (isSchemaMismatchError(e)) return null;
    throw e;
  }
}

function notesScopeForSection(sectionKey: string): {
  scope: 'overall' | 'category' | 'outline';
  categorySlug?: string;
} {
  const cfg = sectionConfig(sectionKey);
  const parsed = parseSectionKey(sectionKey);
  if (parsed.kind === 'category' && parsed.categorySlug) {
    return { scope: 'category', categorySlug: parsed.categorySlug };
  }
  if (parsed.stepId === 'expert') return { scope: 'outline' };
  if (parsed.stepId === 'decision') {
    return { scope: 'overall' };
  }
  return { scope: cfg.scope === 'field' ? 'overall' : cfg.scope };
}

function overallProductScoreFromSnapshots(snapshots: { kind: string; refSlug: string; score: number }[]): number | null {
  return snapshots.find((s) => s.kind === 'overall')?.score ?? null;
}

async function categoryPerformanceForPayload(
  payload: Awaited<ReturnType<typeof assembleEvidence>>,
  categoryName?: string,
): Promise<ReturnType<typeof buildCategoryPerformance>> {
  if (!payload.categorySlug) return null;
  const db = getDb();
  const { testRuns } = await (db.query as any)({
    testRuns: {
      $: { where: { id: payload.testRun.id } },
      scoreSnapshots: {},
    },
  });
  const snapshots = (testRuns[0]?.scoreSnapshots ?? []).map((s: any) => ({
    kind: s.kind,
    refSlug: s.refSlug,
    score: s.score,
  }));
  const overall = overallProductScoreFromSnapshots(snapshots);
  const name = categoryName ?? payload.categorySlug;
  return buildCategoryPerformance(payload, name, overall);
}

function formatNotesRow(row: any, stale: boolean, performance?: ReturnType<typeof buildCategoryPerformance>): AiVerdictNotesDto {
  return {
    id: row.id,
    sectionKey: row.sectionKey,
    scope: row.scope,
    categorySlug: row.categorySlug ?? null,
    keyFindings: sanitizeKeyFindings((row.keyFindings as KeyFinding[]) ?? []),
    fieldSuggestions: normalizeFieldSuggestions(
      (row.fieldSuggestions as Record<string, unknown>) ?? {},
    ),
    inputHash: row.inputHash,
    evidenceIds: (row.evidenceIds as string[]) ?? [],
    model: row.model,
    promptVersion: row.promptVersion,
    status: row.status,
    generatedAt: Number(row.generatedAt),
    updatedAt: Number(row.updatedAt ?? row.generatedAt),
    generatedBy: row.generatedBy ?? null,
    testRunId: row.testRun?.id ?? null,
    stale,
    performance: performance ?? null,
  };
}

export async function loadAiVerdictNotes(
  body: LoadNotesRequest,
): Promise<LoadNotesResponse> {
  const { scope, categorySlug } = notesScopeForSection(body.sectionKey);
  const payload = await assembleEvidence({
    productId: body.productId,
    testRunId: body.testRunId,
    scope,
    categorySlug,
  });

  const performance =
    parsedCategorySection(body.sectionKey) != null
      ? await categoryPerformanceForPayload(payload, body.categoryName)
      : null;

  const saved = await findSavedNotes(body.productId, body.testRunId, body.sectionKey);
  if (!saved) {
    return { notes: null, currentInputHash: payload.inputHash, performance };
  }

  const stale = saved.inputHash !== payload.inputHash || saved.status === 'stale';
  return {
    notes: formatNotesRow(saved, stale, performance ?? undefined),
    currentInputHash: payload.inputHash,
    performance,
  };
}

function parsedCategorySection(sectionKey: string): string | null {
  if (!sectionKey.startsWith('category:')) return null;
  return sectionKey.slice(9);
}

export async function generateAiVerdictNotes(
  body: GenerateNotesRequest,
  identity: AdminIdentity,
): Promise<AiVerdictNotesDto> {
  const cfg = aiVerdictConfig();
  if (!cfg.enabled) throw new HttpError(503, 'AI verdict writer is disabled.');

  assertRateLimit(identity.email, `notes:${body.productId}:${body.sectionKey}`);

  const testRunId = await resolveTestRunId(body.productId, body.testRunId);
  const { scope, categorySlug } = notesScopeForSection(body.sectionKey);

  const payload = await assembleEvidence({
    productId: body.productId,
    testRunId,
    scope,
    categorySlug,
  });

  if (payload.evidenceIds.length === 0) {
    throw new HttpError(
      422,
      'Not enough completed testing data to generate reliable findings.',
    );
  }

  const db = getDb();

  const performance = await categoryPerformanceForPayload(payload, body.categoryName);

  if (!body.regenerate) {
    const saved = await findSavedNotes(body.productId, testRunId, body.sectionKey);
    if (saved) {
      const stale = saved.inputHash !== payload.inputHash;
      return formatNotesRow(saved, stale, performance ?? undefined);
    }
  }

  const derivedFindings = deriveKeyFindings(payload);
  const client = getOpenAIClient();
  const system = buildNotesSystemPrompt(scope, body.sectionKey);
  const user = buildNotesUserPrompt(body.sectionKey, payload, derivedFindings);

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

  const output = parseAiSuggestionOutput(parsed, scope, categorySlug);

  const allowedIds = new Set(payload.evidenceIds);
  const idErrors = validateEvidenceIds(output, allowedIds);
  if (idErrors.length > 0) {
    throw new HttpError(422, `Invalid AI output: ${idErrors.slice(0, 3).join('; ')}`);
  }

  const aiFindings = sanitizeKeyFindings(output.key_findings ?? []);
  const keyFindings: KeyFinding[] =
    aiFindings.length >= 3
      ? aiFindings.slice(0, 6)
      : [...aiFindings, ...derivedFindings].slice(0, 6);

  if (keyFindings.length === 0) {
    throw new HttpError(
      422,
      'Not enough completed testing data to generate reliable findings.',
    );
  }

  const fieldSuggestions = buildFieldSuggestions(body.sectionKey, output);
  const now = Date.now();
  const tokenUsage = {
    input: completion.usage?.prompt_tokens ?? 0,
    output: completion.usage?.completion_tokens ?? 0,
  };

  const existing = await findSavedNotes(body.productId, testRunId, body.sectionKey);
  const notesId = existing?.id ?? newId();

  const notesFields = {
    sectionKey: body.sectionKey,
    scope,
    categorySlug,
    promptVersion: NOTES_PROMPT_VERSION,
    model: cfg.model,
    evidenceIds: payload.evidenceIds,
    inputHash: payload.inputHash,
    keyFindings,
    fieldSuggestions,
    status: 'generated',
    tokenUsage,
    openaiRequestId: completion.id,
    generatedBy: identity.email,
    generatedAt: existing?.generatedAt ?? now,
    updatedAt: now,
  };

  try {
    await db.transact([
      db.tx.aiVerdictNotes[notesId].update(notesFields),
      db.tx.aiVerdictNotes[notesId].link({
        product: body.productId,
        testRun: testRunId,
      }),
      auditTx({
        actorEmail: identity.email,
        action: body.regenerate ? 'ai_suggest_regenerated' : 'ai_suggest_generated',
        recordType: 'aiVerdictNotes',
        recordId: notesId,
        newValue: {
          sectionKey: body.sectionKey,
          testRunId,
          findingCount: keyFindings.length,
        },
      }),
    ]);
  } catch (e: unknown) {
    if (isSchemaMismatchError(e)) {
      throw new HttpError(400, SCHEMA_OUT_OF_DATE_MSG);
    }
    throw e;
  }

  return formatNotesRow(
    {
      id: notesId,
      sectionKey: body.sectionKey,
      scope,
      categorySlug,
      keyFindings,
      fieldSuggestions,
      inputHash: payload.inputHash,
      evidenceIds: payload.evidenceIds,
      model: cfg.model,
      promptVersion: NOTES_PROMPT_VERSION,
      status: 'generated',
      generatedAt: existing?.generatedAt ?? now,
      updatedAt: now,
      generatedBy: identity.email,
      testRun: { id: testRunId },
    },
    false,
    performance ?? undefined,
  );
}
