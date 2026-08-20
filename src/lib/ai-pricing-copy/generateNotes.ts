import { z } from 'zod';
import { getDb } from '../db/server';
import { HttpError, type AdminIdentity } from '../db/auth';
import { getOpenAIClient } from '../ai-verdict/openaiClient';
import { assertRateLimit } from '../ai-verdict/rateLimit';
import { env } from '../env';
import { pricingAiNotesSchema, type PricingAiNotes } from '../validation/schemas';
import { assemblePricingFacts } from './context';
import {
  PRICING_NOTES_PROMPT_VERSION,
  PRICING_NOTES_SYSTEM_PROMPT,
  buildPricingNotesUserPrompt,
} from './prompts';

function aiPricingCopyConfig() {
  return {
    enabled: env('AI_PRICING_ENABLED') !== 'false',
    model: env('OPENAI_PRICING_MODEL') ?? env('OPENAI_VERDICT_MODEL') ?? 'gpt-4o-mini',
    maxOutputTokens: Number(env('AI_PRICING_COPY_MAX_OUTPUT_TOKENS') ?? 900),
  };
}

const notesModelSchema = z.object({
  importantFindings: z.array(z.string()).max(8).default([]),
  pros: z.array(z.string()).max(5).default([]),
  watchOuts: z.array(z.string()).max(5).default([]),
});

function clampList(items: string[], max: number): string[] {
  return items
    .map((s) => String(s ?? '').trim())
    .filter(Boolean)
    .slice(0, max);
}

function parseNotesJson(raw: string): z.infer<typeof notesModelSchema> {
  const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
  const parsed = notesModelSchema.safeParse(JSON.parse(cleaned));
  if (!parsed.success) throw new HttpError(502, 'AI returned invalid notes JSON');
  return parsed.data;
}

export interface PricingAiNotesDto extends PricingAiNotes {
  stale: boolean;
}

export async function loadPricingAiNotes(productId: string): Promise<{
  notes: PricingAiNotesDto | null;
  currentInputHash: string;
}> {
  const facts = await assemblePricingFacts(productId);
  const db = getDb();
  const { pricingSnapshots } = await db.query({
    pricingSnapshots: { $: { where: { id: facts.snapshotId } } },
  });
  const snapshot = (pricingSnapshots as any[])?.[0];
  const saved = pricingAiNotesSchema.safeParse(snapshot?.aiPricingNotes);
  if (!saved.success) {
    return { notes: null, currentInputHash: facts.notesInputHash };
  }
  return {
    notes: {
      ...saved.data,
      stale: saved.data.inputHash !== facts.notesInputHash,
    },
    currentInputHash: facts.notesInputHash,
  };
}

export async function generatePricingAiNotes(
  productId: string,
  identity: AdminIdentity,
  opts?: { regenerate?: boolean },
): Promise<PricingAiNotesDto> {
  const cfg = aiPricingCopyConfig();
  if (!cfg.enabled) throw new HttpError(503, 'AI pricing is disabled');
  assertRateLimit(identity.email, 'pricing-notes');

  const facts = await assemblePricingFacts(productId);
  const existing = await loadPricingAiNotes(productId);
  if (!opts?.regenerate && existing.notes && !existing.notes.stale) {
    return existing.notes;
  }

  const client = getOpenAIClient();
  const completion = await client.chat.completions.create({
    model: cfg.model,
    temperature: 0.3,
    max_tokens: cfg.maxOutputTokens,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: PRICING_NOTES_SYSTEM_PROMPT },
      {
        role: 'user',
        content: buildPricingNotesUserPrompt({
          productName: facts.productName,
          factLines: facts.factLines,
        }),
      },
    ],
  });

  const content = completion.choices[0]?.message?.content ?? '';
  const parsed = parseNotesJson(content);
  const notes: PricingAiNotes = {
    importantFindings: clampList(parsed.importantFindings, 6),
    pros: clampList(parsed.pros, 3),
    watchOuts: clampList(parsed.watchOuts, 3),
    inputHash: facts.notesInputHash,
    promptVersion: PRICING_NOTES_PROMPT_VERSION,
    model: cfg.model,
    generatedAt: Date.now(),
  };

  const db = getDb();
  await db.transact([
    (db as any).tx.pricingSnapshots[facts.snapshotId].update({
      aiPricingNotes: notes,
      updatedAt: Date.now(),
    }),
  ]);

  return { ...notes, stale: false };
}
