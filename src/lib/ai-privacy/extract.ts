// Scrape policy docs + OpenAI structured extract for privacy evidence slugs.

import { createHash } from 'node:crypto';
import { z } from 'zod';
import { getDb } from '../db/server';
import { HttpError, type AdminIdentity } from '../db/auth';
import { getOpenAIClient } from '../ai-verdict/openaiClient';
import { assertRateLimit } from '../ai-verdict/rateLimit';
import { aiPrivacyConfig, AI_PRIVACY_PROMPT_VERSION } from './config';
import { buildPrivacySystemPrompt, buildPrivacyUserPrompt, slugsForPolicyDocuments } from './prompts';
import { inferDocumentLabelFromUrl } from './classifyUrl';
import {
  coercePrivacyModelOutput,
  normalizePrivacyAnswerRaws,
  validatePrivacyAnswer,
} from './normalizeOutput';
import { documentBodyText, scrapePolicyUrl } from './scrape';
import { getLatestPrivacyAnalysis, formatAnalysisRow, type AiPrivacyAnalysisRow } from './store';
import {
  AI_PRIVACY_SLUGS,
  privacyStructuredOutputSchema,
  type AiPrivacySlug,
  type PrivacyDocument,
  type PrivacyStructuredOutput,
} from './types';

export const analyzeRequestSchema = z.object({
  productId: z.string().min(1),
  testRunId: z.string().min(1),
  analysisId: z.string().min(1).optional(),
});

export type AnalyzeRequest = z.infer<typeof analyzeRequestSchema>;

function inputHash(documents: PrivacyDocument[]): string {
  const payload = documents.map((d) => ({
    id: d.id,
    label: d.label,
    sourceUrl: d.sourceUrl ?? '',
    text: documentBodyText(d).slice(0, 50_000),
  }));
  return createHash('sha256').update(JSON.stringify(payload)).digest('hex').slice(0, 32);
}

async function scrapeDocuments(documents: PrivacyDocument[]): Promise<PrivacyDocument[]> {
  const cfg = aiPrivacyConfig();
  const perDocLimit = Math.floor(cfg.maxTotalChars / Math.max(documents.length, 1));

  return Promise.all(
    documents.map(async (doc) => {
      const next = { ...doc, label: doc.label || inferDocumentLabelFromUrl(doc.sourceUrl ?? '') };
      const pasted = (doc.pastedText ?? '').trim();
      if (pasted.length >= cfg.minDocChars) {
        next.scrapeStatus = 'skipped';
        return next;
      }
      const url = (doc.sourceUrl ?? '').trim();
      if (!url) {
        next.scrapeStatus = 'failed';
        next.scrapeError = 'Add a source URL or paste the policy text.';
        return next;
      }
      const scraped = await scrapePolicyUrl(url, perDocLimit);
      if (scraped.status === 'ok') {
        next.scrapedText = scraped.text;
        next.scrapeStatus = 'ok';
        next.scrapeError = undefined;
      } else {
        next.scrapeStatus = 'failed';
        next.scrapeError = scraped.error ?? 'Scrape failed';
      }
      return next;
    }),
  );
}

function trimDocumentsForModel(documents: PrivacyDocument[]): PrivacyDocument[] {
  const cfg = aiPrivacyConfig();
  let remaining = cfg.maxTotalChars;
  return documents.map((d) => {
    const body = documentBodyText(d);
    const slice = body.slice(0, Math.max(0, remaining));
    remaining -= slice.length;
    if ((d.pastedText ?? '').trim()) {
      return { ...d, pastedText: slice, scrapedText: undefined };
    }
    return { ...d, scrapedText: slice };
  });
}

function ensureAllSlugs(
  output: PrivacyStructuredOutput,
  slugs: readonly AiPrivacySlug[],
): PrivacyStructuredOutput {
  const allowed = new Set(slugs);
  const filtered = output.answers.filter((a) => allowed.has(a.slug));
  const bySlug = new Map(filtered.map((a) => [a.slug, a]));
  const answers = slugs.map((slug) => {
    const existing = bySlug.get(slug);
    if (existing) return existing;
    return {
      slug,
      status: 'not_found' as const,
      confidence: 'low' as const,
      evidence: [],
      rationale: 'Model did not return an answer for this slug.',
    };
  });
  return { answers };
}

export async function analyzePrivacyPolicies(
  body: AnalyzeRequest,
  identity: AdminIdentity,
): Promise<{ analysis: AiPrivacyAnalysisRow; output: PrivacyStructuredOutput }> {
  const cfg = aiPrivacyConfig();
  if (!cfg.enabled) throw new HttpError(503, 'AI privacy analysis is disabled.');
  assertRateLimit(identity.email, body.productId);

  const existing = await getLatestPrivacyAnalysis(body.testRunId);
  if (!existing) throw new HttpError(400, 'Save at least one policy document first.');
  if (body.analysisId && body.analysisId !== existing.id) {
    throw new HttpError(400, 'Analysis id does not match the latest draft for this test run.');
  }
  if (existing.productId && existing.productId !== body.productId) {
    throw new HttpError(400, 'Analysis belongs to a different product.');
  }

  const db = getDb();
  const scrapedDocs = await scrapeDocuments(existing.documents);
  const usable = scrapedDocs.filter((d) => documentBodyText(d).length >= cfg.minDocChars);

  // Persist scrape outcomes before the model call so a timeout still leaves
  // usable text / failure reasons in the admin UI.
  await db.transact([
    db.tx.aiPrivacyAnalyses[existing.id].update({
      documents: scrapedDocs,
      status: usable.length === 0 ? 'failed' : 'running',
      error:
        usable.length === 0
          ? 'No readable policy text. Paste the policy contents or fix the URLs.'
          : undefined,
      updatedAt: Date.now(),
    }),
  ]);

  if (usable.length === 0) {
    throw new HttpError(
      422,
      'No readable policy text. Paste the policy contents (or fix URLs that failed to scrape) and try again.',
    );
  }

  const modelDocs = trimDocumentsForModel(usable);
  const targetSlugs = slugsForPolicyDocuments(modelDocs);
  const hash = inputHash(modelDocs);
  const client = getOpenAIClient();

  let completion;
  try {
    completion = await client.chat.completions.create(
      {
        model: cfg.model,
        response_format: { type: 'json_object' },
        max_tokens: cfg.maxOutputTokens,
        temperature: 0.1,
        messages: [
          { role: 'system', content: buildPrivacySystemPrompt() },
          { role: 'user', content: buildPrivacyUserPrompt(modelDocs) },
        ],
      },
      // Large multi-page policy sets regularly exceed the shared 45s client default.
      { timeout: 90_000 },
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    await db.transact([
      db.tx.aiPrivacyAnalyses[existing.id].update({
        documents: scrapedDocs,
        status: 'failed',
        error: msg.slice(0, 500),
        updatedAt: Date.now(),
      }),
    ]);
    throw new HttpError(502, `OpenAI request failed: ${msg.slice(0, 200)}`);
  }

  const content = completion.choices[0]?.message?.content ?? '';
  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch {
    await db.transact([
      db.tx.aiPrivacyAnalyses[existing.id].update({
        documents: scrapedDocs,
        status: 'failed',
        error: 'AI returned invalid JSON',
        updatedAt: Date.now(),
      }),
    ]);
    throw new HttpError(502, 'AI returned invalid JSON');
  }

  const validated = privacyStructuredOutputSchema.safeParse(coercePrivacyModelOutput(parsed));
  if (!validated.success) {
    const detail = validated.error.issues
      .slice(0, 5)
      .map((i) => (i.path.length ? `${i.path.join('.')}: ${i.message}` : i.message))
      .join('; ');
    await db.transact([
      db.tx.aiPrivacyAnalyses[existing.id].update({
        documents: scrapedDocs,
        status: 'failed',
        error: detail.slice(0, 500),
        updatedAt: Date.now(),
      }),
    ]);
    throw new HttpError(422, `Invalid AI output: ${detail.slice(0, 300)}`);
  }

  const ensured = ensureAllSlugs(validated.data, targetSlugs);
  const output: PrivacyStructuredOutput = {
    answers: normalizePrivacyAnswerRaws(ensured.answers).map((a) => validatePrivacyAnswer(a)),
  };
  const now = Date.now();
  const tokenUsage = {
    input: completion.usage?.prompt_tokens ?? 0,
    output: completion.usage?.completion_tokens ?? 0,
  };

  await db.transact([
    db.tx.aiPrivacyAnalyses[existing.id].update({
      documents: scrapedDocs,
      structuredOutput: output,
      status: 'draft',
      promptVersion: AI_PRIVACY_PROMPT_VERSION,
      model: cfg.model,
      inputHash: hash,
      tokenUsage,
      generatedBy: identity.email,
      generatedAt: now,
      updatedAt: now,
      error: undefined,
    }),
  ]);

  const { aiPrivacyAnalyses } = await (db.query as any)({
    aiPrivacyAnalyses: {
      $: { where: { id: existing.id } },
      product: {},
      testRun: {},
    },
  });

  return {
    analysis: formatAnalysisRow(
      aiPrivacyAnalyses?.[0] ?? {
        ...existing,
        id: existing.id,
        documents: scrapedDocs,
        structuredOutput: output,
        status: 'draft',
      },
    ),
    output,
  };
}
