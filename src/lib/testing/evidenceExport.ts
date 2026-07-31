// Structured test evidence export — evidence answers and proof only (no verdict/editorial).

import { getDb } from '../db/server';
import { HttpError } from '../db/auth';
import { TEST_SESSIONS } from '../../components/admin/testing/sessions';
import { testerQuestion as presentationTesterQuestion } from '../../components/admin/testing/presentation';

export interface EvidenceExportRow {
  product_name: string;
  product_slug: string;
  test_run_id: string;
  test_run_name: string;
  test_run_status: string;
  methodology_version: string;
  test_run_started_at: string;
  test_run_published_at: string;
  tester_email: string;
  category: string;
  category_slug: string;
  subscore: string;
  subscore_slug: string;
  session_id: string;
  session_title: string;
  question_slug: string;
  question: string;
  answer: string;
  answer_detail: string;
  answer_detail_readable: string;
  public_result: string;
  internal_notes: string;
  proof_count: number;
  proof_urls: string;
  proof_captions: string;
  not_applicable: boolean;
  is_unknown: boolean;
  normalized_score: string;
  test_date: string;
  evidence_result_id: string;
}

export interface EvidenceExportReport {
  meta: {
    productName: string;
    productSlug: string;
    testRunId: string;
    testRunName: string;
    exportedAt: string;
  };
  rows: EvidenceExportRow[];
}

type RawValue =
  | { value: number; detail?: Record<string, unknown> }
  | { status: string; detail?: Record<string, unknown> }
  | { text: string; detail?: Record<string, unknown> }
  | { structured: Record<string, unknown> };

function fmtDate(ts: number | undefined | null): string {
  if (!ts) return '';
  try {
    return new Date(ts).toISOString();
  } catch {
    return '';
  }
}

function testerQuestion(
  def: { slug?: string; name?: string; questionLabel?: string },
  categorySlug: string,
): string {
  return presentationTesterQuestion(def as any, categorySlug);
}

function sessionForDef(categorySlug: string, defSlug: string): { id: string; title: string } {
  const sessions = TEST_SESSIONS[categorySlug] ?? [];
  for (const session of sessions) {
    if (session.slugs.includes(defSlug)) {
      return { id: session.id, title: session.title };
    }
  }
  return { id: `${categorySlug}-other`, title: 'Other tests' };
}

function joinList(values: unknown): string {
  if (!Array.isArray(values)) return '';
  return values.map((v) => String(v)).filter(Boolean).join(', ');
}

/** Checklist answers stored as percentage + detail.checked — show "N of M" per methodology. */
export function formatChecklistAnswer(
  raw: unknown,
  opts?: { itemLabel?: string },
): string | null {
  if (!raw || typeof raw !== 'object' || !('value' in raw)) return null;
  const detail =
    'detail' in raw && raw.detail && typeof raw.detail === 'object'
      ? (raw.detail as Record<string, unknown>)
      : null;
  if (!detail) return null;
  const checked = Array.isArray(detail.checked) ? detail.checked : null;
  const total = typeof detail.total === 'number' ? detail.total : null;
  if (!checked || !total || total <= 0) return null;
  const n = checked.length;
  const label = opts?.itemLabel ?? 'items';
  return `${n} of ${total} ${label}`;
}

/** Human-readable primary answer from rawValue + flags. */
export function formatEvidenceAnswer(
  def: { unit?: string; measurementType?: string; slug?: string },
  raw: unknown,
  notApplicable: boolean,
  isUnknown: boolean,
): string {
  if (notApplicable) return 'N/A';
  if (isUnknown) return 'Unknown';
  if (!raw || typeof raw !== 'object') return '';
  const rv = raw as RawValue;

  const checklistLabel =
    def.slug === 'included-features' || def.slug === 'pricing-clarity' ? 'features' : 'items';
  const checklistText = formatChecklistAnswer(raw, { itemLabel: checklistLabel });
  if (checklistText) return checklistText;

  if ('status' in rv) {
    const map: Record<string, string> = {
      na: 'N/A',
      yes: 'Yes',
      no: 'No',
      limited: 'Limited',
      optional: 'Optional',
      unknown: 'Unknown',
    };
    return map[String(rv.status)] ?? String(rv.status);
  }
  if ('value' in rv && typeof rv.value === 'number') {
    const unit = def.unit ? ` ${def.unit}` : '';
    let base: string;
    if (def.measurementType === 'percentage') base = `${rv.value}%`;
    else base = `${rv.value}${unit}`;

    const detail =
      'detail' in rv && rv.detail && typeof rv.detail === 'object'
        ? (rv.detail as Record<string, unknown>)
        : null;
    const selected = detail && Array.isArray(detail.selected) ? joinList(detail.selected) : '';
    if (selected) return `${base} (${selected})`;
    return base;
  }
  if ('text' in rv && typeof rv.text === 'string') return rv.text.trim();
  if ('structured' in rv && rv.structured) {
    try {
      return JSON.stringify(rv.structured);
    } catch {
      return '[structured]';
    }
  }
  return '';
}

/** Full structured detail (JSON) for complex answers — used in CSV. */
export function formatEvidenceAnswerDetail(raw: unknown): string {
  if (raw == null) return '';
  try {
    return JSON.stringify(raw);
  } catch {
    return String(raw);
  }
}

/** Plain-English detail for PDF / readable exports. */
export function formatEvidenceDetailReadable(raw: unknown): string {
  if (raw == null) return '';
  if (typeof raw !== 'object') return String(raw);

  const rv = raw as Record<string, unknown>;
  const parts: string[] = [];
  const detail =
    rv.detail && typeof rv.detail === 'object' ? (rv.detail as Record<string, unknown>) : null;

  if (detail) {
    const selected = joinList(detail.selected);
    if (selected) parts.push(`Selected: ${selected}`);
    const checked = joinList(detail.checked);
    if (checked) parts.push(`Checked: ${checked}`);
    const options = joinList(detail.options);
    if (options) parts.push(`Options: ${options}`);
    if (typeof detail.numerator === 'number' && typeof detail.denominator === 'number') {
      parts.push(`Ratio: ${detail.numerator}/${detail.denominator}`);
    }
    if (typeof detail.notes === 'string' && detail.notes.trim()) {
      parts.push(`Notes: ${detail.notes.trim()}`);
    }
  }

  if ('text' in rv && typeof rv.text === 'string' && rv.text.trim()) {
    parts.push(rv.text.trim());
  }

  if (parts.length > 0) return parts.join(' | ');

  try {
    return JSON.stringify(raw);
  } catch {
    return String(raw);
  }
}

export function formatExportDate(ts: number | string | undefined | null): string {
  if (!ts) return '';
  try {
    const d = new Date(ts);
    return d.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short',
    });
  } catch {
    return String(ts);
  }
}

export function truncateForPdf(text: string, maxLen = 72): string {
  const s = text.replace(/\s+/g, ' ').trim();
  if (s.length <= maxLen) return s;
  return `${s.slice(0, maxLen - 3)}...`;
}

function escapeCsvCell(value: string | number | boolean): string {
  const s = String(value ?? '');
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function evidenceRowsToCsv(rows: EvidenceExportRow[]): string {
  if (rows.length === 0) {
    return 'product_name,product_slug,test_run_id,test_run_name,test_run_status,methodology_version,test_run_started_at,test_run_published_at,tester_email,category,category_slug,subscore,subscore_slug,session_id,session_title,question_slug,question,answer,answer_detail,public_result,internal_notes,proof_count,proof_urls,proof_captions,not_applicable,is_unknown,normalized_score,test_date,evidence_result_id\n';
  }
  const headers = Object.keys(rows[0]) as (keyof EvidenceExportRow)[];
  const lines = [headers.join(',')];
  for (const row of rows) {
    lines.push(headers.map((h) => escapeCsvCell(row[h] as string | number | boolean)).join(','));
  }
  // UTF-8 BOM for Excel compatibility
  return `\uFEFF${lines.join('\n')}\n`;
}

export async function buildEvidenceExportReport(testRunId: string): Promise<EvidenceExportReport> {
  const db = getDb();
  const { testRuns } = await (db.query as any)({
    testRuns: {
      $: { where: { id: testRunId } },
      product: {},
      methodologyVersion: { categories: { subscores: { evidenceDefinitions: {} } } },
      evidenceResults: { evidenceDefinition: {}, attachments: {} },
    },
  });

  const run = testRuns[0];
  if (!run) throw new HttpError(404, 'Test run not found');
  if (!run.product) throw new HttpError(400, 'Test run has no product');
  if (!run.methodologyVersion) throw new HttpError(400, 'Test run has no methodology version');

  const product = run.product;
  const mv = run.methodologyVersion;
  const resultByDef = new Map<string, any>();
  for (const r of run.evidenceResults ?? []) {
    if (r.evidenceDefinition?.id) resultByDef.set(r.evidenceDefinition.id, r);
  }

  const rows: EvidenceExportRow[] = [];

  const categories = (mv.categories ?? [])
    .filter((c: any) => c.active)
    .sort((a: any, b: any) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));

  for (const cat of categories) {
    const subs = (cat.subscores ?? [])
      .filter((s: any) => s.active)
      .sort((a: any, b: any) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));

    for (const sub of subs) {
      const defs = (sub.evidenceDefinitions ?? [])
        .filter((d: any) => d.active)
        .sort((a: any, b: any) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));

      for (const def of defs) {
        const result = resultByDef.get(def.id);
        const categorySlug = String(cat.slug ?? '');
        const defSlug = String(def.slug ?? '');
        const session = sessionForDef(categorySlug, defSlug);

        const attachments = (result?.attachments ?? []).filter((m: any) => !m.deletedAt);
        const proofUrls = attachments
          .map((m: any) => String(m.url ?? '').trim())
          .filter(Boolean);
        const linkUrls = Array.isArray(result?.proofLinks)
          ? (result.proofLinks as Array<{ url?: string }>)
              .map((l) => String(l?.url ?? '').trim())
              .filter(Boolean)
          : [];
        const allProofUrls = [...proofUrls, ...linkUrls];
        const proofCaptions = attachments.map((m: any) => {
          const parts = [m.altText, m.caption].filter(Boolean);
          return parts.join(' — ') || m.url || 'attachment';
        });
        if (Array.isArray(result?.proofLinks)) {
          for (const link of result.proofLinks as Array<{ url?: string; label?: string }>) {
            const url = String(link?.url ?? '').trim();
            if (!url) continue;
            proofCaptions.push(link.label ? `${link.label} — ${url}` : url);
          }
        }

        rows.push({
          product_name: String(product.name ?? ''),
          product_slug: String(product.slug ?? ''),
          test_run_id: testRunId,
          test_run_name: String(run.name ?? ''),
          test_run_status: String(run.status ?? ''),
          methodology_version: String(mv.version ?? ''),
          test_run_started_at: fmtDate(run.startedAt ?? run.createdAt),
          test_run_published_at: fmtDate(run.publishedAt),
          tester_email: String(result?.testerEmail ?? run.testerEmail ?? ''),
          category: String(cat.name ?? ''),
          category_slug: categorySlug,
          subscore: String(sub.name ?? ''),
          subscore_slug: String(sub.slug ?? ''),
          session_id: session.id,
          session_title: session.title,
          question_slug: defSlug,
          question: testerQuestion(def, categorySlug),
          answer: formatEvidenceAnswer(
            def,
            result?.rawValue,
            Boolean(result?.notApplicable),
            Boolean(result?.isUnknown),
          ),
          answer_detail: formatEvidenceAnswerDetail(result?.rawValue),
          answer_detail_readable: formatEvidenceDetailReadable(result?.rawValue),
          public_result: String(result?.publicResult ?? ''),
          internal_notes: String(result?.internalNotes ?? ''),
          proof_count: attachments.length + linkUrls.length,
          proof_urls: allProofUrls.join('; '),
          proof_captions: proofCaptions.join('; '),
          not_applicable: Boolean(result?.notApplicable),
          is_unknown: Boolean(result?.isUnknown),
          normalized_score:
            result?.normalizedScore != null && Number.isFinite(result.normalizedScore)
              ? String(result.normalizedScore)
              : '',
          test_date: fmtDate(result?.testDate),
          evidence_result_id: String(result?.id ?? ''),
        });
      }
    }
  }

  return {
    meta: {
      productName: String(product.name ?? ''),
      productSlug: String(product.slug ?? ''),
      testRunId,
      testRunName: String(run.name ?? ''),
      exportedAt: new Date().toISOString(),
    },
    rows,
  };
}

export function slugifyFilename(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60);
}
