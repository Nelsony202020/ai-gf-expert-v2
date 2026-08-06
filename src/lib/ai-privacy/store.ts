import { z } from 'zod';
import { getDb, id as newId } from '../db/server';
import { HttpError } from '../db/auth';
import { privacyDocumentSchema, type PrivacyDocument } from './types';

export const saveDocumentsRequestSchema = z.object({
  productId: z.string().min(1),
  testRunId: z.string().min(1),
  documents: z.array(privacyDocumentSchema).max(20),
});

export type SaveDocumentsRequest = z.infer<typeof saveDocumentsRequestSchema>;

export interface AiPrivacyAnalysisRow {
  id: string;
  status: string;
  documents: PrivacyDocument[];
  structuredOutput?: unknown;
  error?: string;
  model?: string;
  promptVersion?: string;
  tokenUsage?: unknown;
  generatedAt?: number;
  updatedAt?: number;
  productId?: string;
  testRunId?: string;
}

function normalizeDoc(doc: PrivacyDocument): PrivacyDocument {
  const sourceUrl = (doc.sourceUrl ?? '').trim();
  return {
    ...doc,
    sourceUrl: sourceUrl || undefined,
    pastedText: doc.pastedText?.trim() || undefined,
    scrapedText: doc.scrapedText?.trim() || undefined,
  };
}

export async function getLatestPrivacyAnalysis(testRunId: string): Promise<AiPrivacyAnalysisRow | null> {
  const db = getDb();
  const { aiPrivacyAnalyses } = await (db.query as any)({
    aiPrivacyAnalyses: {
      $: { where: { 'testRun.id': testRunId } },
      product: {},
      testRun: {},
    },
  });
  const rows = (aiPrivacyAnalyses ?? []) as any[];
  if (rows.length === 0) return null;
  rows.sort((a, b) => Number(b.updatedAt ?? b.generatedAt ?? 0) - Number(a.updatedAt ?? a.generatedAt ?? 0));
  const row = rows[0];
  return formatAnalysisRow(row);
}

export function formatAnalysisRow(row: any): AiPrivacyAnalysisRow {
  return {
    id: row.id,
    status: String(row.status ?? 'draft'),
    documents: Array.isArray(row.documents) ? row.documents : [],
    structuredOutput: row.structuredOutput,
    error: row.error,
    model: row.model,
    promptVersion: row.promptVersion,
    tokenUsage: row.tokenUsage,
    generatedAt: row.generatedAt ? Number(row.generatedAt) : undefined,
    updatedAt: row.updatedAt ? Number(row.updatedAt) : undefined,
    productId: row.product?.id,
    testRunId: row.testRun?.id,
  };
}

export async function savePrivacyDocuments(body: SaveDocumentsRequest): Promise<AiPrivacyAnalysisRow> {
  const db = getDb();
  const docs = body.documents.map(normalizeDoc);

  // Verify test run belongs to product.
  const { testRuns } = await (db.query as any)({
    testRuns: {
      $: { where: { id: body.testRunId } },
      product: {},
    },
  });
  const run = testRuns?.[0];
  if (!run) throw new HttpError(404, 'Test run not found');
  if (run.product?.id && run.product.id !== body.productId) {
    throw new HttpError(400, 'Test run does not belong to this product');
  }

  const existing = await getLatestPrivacyAnalysis(body.testRunId);
  const now = Date.now();

  if (existing) {
    await db.transact([
      db.tx.aiPrivacyAnalyses[existing.id].update({
        documents: docs,
        status: existing.status === 'applied' ? 'draft' : existing.status,
        updatedAt: now,
        error: undefined,
      }),
    ]);
    return {
      ...existing,
      documents: docs,
      status: existing.status === 'applied' ? 'draft' : existing.status,
      updatedAt: now,
      error: undefined,
    };
  }

  const analysisId = newId();
  await db.transact([
    db.tx.aiPrivacyAnalyses[analysisId].update({
      status: 'draft',
      documents: docs,
      updatedAt: now,
    }),
    db.tx.aiPrivacyAnalyses[analysisId].link({
      product: body.productId,
      testRun: body.testRunId,
    }),
  ]);

  return {
    id: analysisId,
    status: 'draft',
    documents: docs,
    updatedAt: now,
    productId: body.productId,
    testRunId: body.testRunId,
  };
}
