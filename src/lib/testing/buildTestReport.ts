// Aggregates all data needed for a human-readable test evidence PDF.

import { getDb } from '../db/server';
import { HttpError } from '../db/auth';
import { calculateRun } from '../scoring/testRuns';
import type { ScoreTree } from '../scoring/engine';
import {
  buildEvidenceExportReport,
  type EvidenceExportRow,
  formatExportDate,
} from './evidenceExport';

export type ReportMode = 'reader' | 'full';

export interface TestReportData {
  meta: {
    productName: string;
    productSlug: string;
    testRunId: string;
    testRunName: string;
    status: string;
    statusLabel: string;
    methodologyVersion: string;
    exportedAt: string;
    startedAt: string;
    completedAt: string;
    publishedAt: string;
    testerName: string;
    factCheckerName: string;
    siteUrl: string;
  };
  scores: ScoreTree;
  evidence: EvidenceExportRow[];
  stats: {
    totalEvidence: number;
    answered: number;
    screenshots: number;
    unknown: number;
    notApplicable: number;
    missing: number;
  };
}

const STATUS_LABELS: Record<string, string> = {
  draft: 'Draft',
  in_progress: 'In progress',
  ready_for_review: 'Ready for review',
  approved: 'Approved',
  published: 'Published',
  superseded: 'Historical',
};

function fmtShortDate(ts: number | string | undefined | null): string {
  if (!ts) return '';
  try {
    return new Date(ts).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return '';
  }
}

export async function buildTestReportData(testRunId: string): Promise<TestReportData> {
  const db = getDb();
  const { testRuns } = await (db.query as any)({
    testRuns: {
      $: { where: { id: testRunId } },
      product: { author: {}, factChecker: {} },
      methodologyVersion: {},
    },
  });
  const run = testRuns[0];
  if (!run) throw new HttpError(404, 'Test run not found');

  const [{ tree }, evidenceReport] = await Promise.all([
    calculateRun(testRunId),
    buildEvidenceExportReport(testRunId),
  ]);

  const product = run.product ?? {};
  const rows = evidenceReport.rows;
  const answered = rows.filter(
    (r) => r.answer && !r.not_applicable && !r.is_unknown,
  ).length;
  const screenshots = rows.reduce((n, r) => n + r.proof_count, 0);
  const unknown = rows.filter((r) => r.is_unknown).length;
  const notApplicable = rows.filter((r) => r.not_applicable).length;
  const missing = rows.filter((r) => !r.answer && !r.not_applicable && !r.is_unknown).length;

  const siteUrl =
    typeof process.env.PUBLIC_SITE_URL === 'string' && process.env.PUBLIC_SITE_URL
      ? process.env.PUBLIC_SITE_URL.replace(/\/$/, '')
      : 'https://aigirlfriendexpert.com';

  return {
    meta: {
      productName: String(product.name ?? evidenceReport.meta.productName),
      productSlug: String(product.slug ?? evidenceReport.meta.productSlug),
      testRunId,
      testRunName: String(run.name ?? evidenceReport.meta.testRunName),
      status: String(run.status ?? ''),
      statusLabel: STATUS_LABELS[String(run.status ?? '')] ?? String(run.status ?? 'Draft'),
      methodologyVersion: String(
        run.methodologyVersion?.version ?? rows[0]?.methodology_version ?? '',
      ),
      exportedAt: formatExportDate(new Date().toISOString()),
      startedAt: fmtShortDate(run.startedAt ?? run.createdAt),
      completedAt: fmtShortDate(run.completedAt),
      publishedAt: fmtShortDate(run.publishedAt),
      testerName: String(run.product?.author?.name ?? run.testerEmail ?? ''),
      factCheckerName: String(
        run.product?.factChecker?.name ?? run.factCheckerEmail ?? '',
      ),
      siteUrl,
    },
    scores: tree,
    evidence: rows,
    stats: {
      totalEvidence: rows.length,
      answered,
      screenshots,
      unknown,
      notApplicable,
      missing,
    },
  };
}

export function reportFilename(
  data: TestReportData,
  mode: ReportMode,
  ext: 'pdf' | 'csv',
): string {
  const slug = data.meta.productSlug || 'product';
  const run = data.meta.testRunName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  if (ext === 'csv') return `${slug}-${run}-evidence.csv`;
  return mode === 'full'
    ? `${slug}-full-evidence-${run}.pdf`
    : `${slug}-test-report-${run}.pdf`;
}
