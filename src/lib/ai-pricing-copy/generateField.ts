import { z } from 'zod';
import { HttpError, type AdminIdentity } from '../db/auth';
import { getOpenAIClient } from '../ai-verdict/openaiClient';
import { assertRateLimit } from '../ai-verdict/rateLimit';
import { env } from '../env';
import { pricingAiNotesSchema } from '../validation/schemas';
import { getDb } from '../db/server';
import {
  assemblePricingFacts,
  fieldContextLines,
  fieldMeta,
  type PricingCopyFieldId,
} from './context';
import {
  PRICING_WRITE_SYSTEM_PROMPT,
  buildPricingWriteUserPrompt,
  type PricingWriteAction,
} from './prompts';

function aiPricingCopyConfig() {
  return {
    enabled: env('AI_PRICING_ENABLED') !== 'false',
    model: env('OPENAI_PRICING_MODEL') ?? env('OPENAI_VERDICT_MODEL') ?? 'gpt-4o-mini',
    maxOutputTokens: Number(env('AI_PRICING_COPY_MAX_OUTPUT_TOKENS') ?? 700),
  };
}

export const pricingWriteRequestSchema = z.object({
  productId: z.string().min(1),
  field: z.enum([
    'introduction',
    'marketPositionCommentary',
    'comparisonCommentary',
    'expertOpinion',
    'plansNote',
    'realWorldCostCommentary',
  ]),
  action: z.enum([
    'write_fresh',
    'easier',
    'shorter',
    'more_detail',
    'another',
    'notes_to_copy',
  ]),
  currentText: z.string().max(4000).optional(),
  privateNotes: z.string().max(2000).optional(),
});

export type PricingWriteRequest = z.infer<typeof pricingWriteRequestSchema>;

function cleanFieldText(raw: string, _field: PricingCopyFieldId): string {
  let text = raw.trim();
  text = text.replace(/^```(?:\w+)?\s*/i, '').replace(/\s*```$/i, '').trim();
  text = text.replace(/^["']|["']$/g, '').trim();
  return text;
}

export async function generatePricingFieldCopy(
  body: PricingWriteRequest,
  identity: AdminIdentity,
): Promise<{ text: string; model: string }> {
  const cfg = aiPricingCopyConfig();
  if (!cfg.enabled) throw new HttpError(503, 'AI pricing is disabled');
  assertRateLimit(identity.email, `pricing-write:${body.field}`);

  const facts = await assemblePricingFacts(body.productId);
  const meta = fieldMeta(body.field, facts.productName);
  const factLines = fieldContextLines(body.field, facts);

  let automaticText: string | null = null;
  if (body.field === 'marketPositionCommentary') automaticText = facts.autoMarketLead;
  if (body.field === 'comparisonCommentary') automaticText = facts.autoCompareIntro;
  if (body.field === 'introduction' && !body.currentText?.trim()) {
    automaticText = facts.autoPageIntro;
  }

  const db = getDb();
  const { pricingSnapshots } = await db.query({
    pricingSnapshots: { $: { where: { id: facts.snapshotId } } },
  });
  const snapshot = (pricingSnapshots as any[])?.[0];
  const notes = pricingAiNotesSchema.safeParse(snapshot?.aiPricingNotes);

  const action = body.action as PricingWriteAction;
  const client = getOpenAIClient();
  const completion = await client.chat.completions.create({
    model: cfg.model,
    temperature: action === 'another' ? 0.7 : 0.4,
    max_tokens: cfg.maxOutputTokens,
    messages: [
      { role: 'system', content: PRICING_WRITE_SYSTEM_PROMPT },
      {
        role: 'user',
        content: buildPricingWriteUserPrompt({
          productName: facts.productName,
          field: body.field,
          fieldLabel: meta.label,
          purpose: meta.purpose,
          targetLength: meta.targetLength,
          automaticText,
          factLines,
          currentText: body.currentText,
          privateNotes: body.privateNotes,
          action,
          pricingNotes: notes.success
            ? {
                importantFindings: notes.data.importantFindings,
                pros: notes.data.pros,
                watchOuts: notes.data.watchOuts,
              }
            : null,
        }),
      },
    ],
  });

  const raw = completion.choices[0]?.message?.content ?? '';
  const text = cleanFieldText(raw, body.field);
  if (!text) throw new HttpError(502, 'AI returned empty copy');
  return { text, model: cfg.model };
}
