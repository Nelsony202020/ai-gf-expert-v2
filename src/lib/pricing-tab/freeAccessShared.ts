/**
 * Client-safe free-access types + pure builders.
 * Keep server DB loading in freeAccess.ts so admin React never pulls node:fs.
 */

import type { RawValue } from '../scoring/engine';
import {
  FREE_ACCESS_ALLOWANCE_SLUGS,
  formatFreeAccessAllowanceSummary,
  parseFreeAccessAllowance,
  type FreeAccessPeriod,
} from '../testing/freeAccessAllowance';

export type PricingFreeAccessSource = 'subscription_plan' | 'testing';

export interface PricingFreeAccessAllowance {
  quantity: number;
  unit: string;
  period: FreeAccessPeriod;
  /** Display string, e.g. "5 messages total" */
  label: string;
}

export interface PricingFreeAccess {
  source: PricingFreeAccessSource;
  chat: PricingFreeAccessAllowance | null;
  characters: PricingFreeAccessAllowance | null;
  images: PricingFreeAccessAllowance | null;
  video: PricingFreeAccessAllowance | null;
  voice: PricingFreeAccessAllowance | null;
  /** Free trial without credit card — from free-value yes/limited/no */
  trialWithoutCreditCard: boolean | null;
}

const UNIT_BY_SLUG: Record<string, string> = {
  'free-chat': 'messages',
  'free-characters': 'characters',
  'free-images': 'images',
  'free-video': 'videos',
  'free-voice': 'seconds',
};

const PERIOD_PHRASE: Record<FreeAccessPeriod, string> = {
  total: 'total',
  day: 'per day',
  month: 'per month',
};

function formatAllowanceLabel(
  quantity: number,
  unit: string,
  period: FreeAccessPeriod,
): string {
  if (quantity === 0) return 'Not available';
  if (unit === 'seconds') {
    return `${quantity} sec ${PERIOD_PHRASE[period]}`;
  }
  let unitLabel = unit;
  if (quantity === 1) {
    if (unit === 'messages') unitLabel = 'message';
    else if (unit === 'characters') unitLabel = 'character';
    else if (unit === 'images') unitLabel = 'image';
    else if (unit === 'videos') unitLabel = 'video';
  }
  if (period === 'total') {
    return `${quantity} ${unitLabel} total`;
  }
  return `${quantity} ${unitLabel} ${PERIOD_PHRASE[period]}`;
}

function allowanceFromRaw(
  slug: string,
  raw: RawValue | undefined,
): PricingFreeAccessAllowance | null {
  const parsed = parseFreeAccessAllowance(raw);
  if (typeof parsed.amount !== 'number' || !Number.isFinite(parsed.amount)) return null;
  const unit = UNIT_BY_SLUG[slug] ?? 'units';
  return {
    quantity: parsed.amount,
    unit,
    period: parsed.period,
    label: formatAllowanceLabel(parsed.amount, unit, parsed.period),
  };
}

function trialFromRaw(raw: RawValue | undefined): boolean | null {
  if (!raw || typeof raw !== 'object' || !('status' in raw)) return null;
  const status = String((raw as { status?: unknown }).status ?? '').toLowerCase();
  if (status === 'yes') return true;
  if (status === 'no') return false;
  if (status === 'limited') return true;
  return null;
}

const FREE_SLUGS = new Set<string>([...FREE_ACCESS_ALLOWANCE_SLUGS, 'free-value']);

export interface FreeAccessEvidenceRow {
  rawValue?: RawValue;
  notApplicable?: boolean;
  testRunId?: string | null;
  slug?: string | null;
  /** When present and not free-access, the row is ignored. */
  subscoreSlug?: string | null;
}

/**
 * Pure builder used by the public loader and the Pricing admin preview.
 * Prefers the published run when it has free-access answers; otherwise the
 * run with the most free-access answers.
 */
export function buildPricingFreeAccessFromRows(
  rows: FreeAccessEvidenceRow[],
  opts?: { publishedRunId?: string | null },
): PricingFreeAccess | null {
  const freeRows = rows.filter((r) => {
    const slug = r.slug;
    if (!slug || !FREE_SLUGS.has(slug)) return false;
    if (r.subscoreSlug && r.subscoreSlug !== 'free-access') return false;
    return !r.notApplicable;
  });
  if (freeRows.length === 0) return null;

  const published = opts?.publishedRunId ?? null;
  let runId: string | null = null;
  if (published) {
    const forPublished = freeRows.filter((r) => r.testRunId === published);
    if (forPublished.length > 0) runId = published;
  }
  if (!runId) {
    const counts = new Map<string, number>();
    for (const r of freeRows) {
      if (!r.testRunId) continue;
      counts.set(r.testRunId, (counts.get(r.testRunId) ?? 0) + 1);
    }
    let bestCount = 0;
    for (const [id, n] of counts) {
      if (n > bestCount) {
        runId = id;
        bestCount = n;
      }
    }
  }
  if (!runId) return null;

  const bySlug = new Map<string, FreeAccessEvidenceRow>();
  for (const r of freeRows) {
    if (r.testRunId !== runId || !r.slug) continue;
    bySlug.set(r.slug, r);
  }

  const chat = allowanceFromRaw('free-chat', bySlug.get('free-chat')?.rawValue);
  const characters = allowanceFromRaw('free-characters', bySlug.get('free-characters')?.rawValue);
  const images = allowanceFromRaw('free-images', bySlug.get('free-images')?.rawValue);
  const video = allowanceFromRaw('free-video', bySlug.get('free-video')?.rawValue);
  const voice = allowanceFromRaw('free-voice', bySlug.get('free-voice')?.rawValue);
  const trialWithoutCreditCard = trialFromRaw(bySlug.get('free-value')?.rawValue);

  if (!chat && !characters && !images && !video && !voice && trialWithoutCreditCard == null) {
    return null;
  }

  return {
    source: 'testing',
    chat,
    characters,
    images,
    video,
    voice,
    trialWithoutCreditCard,
  };
}

/** Cell text for free-access comparison tables. */
export function freeAccessCellLabel(
  allowance: PricingFreeAccessAllowance | null | undefined,
): string {
  if (!allowance) return '—';
  if (allowance.quantity === 0) return 'Not available';
  return allowance.label;
}

/** Prefer publicResult-style summaries when building tips. */
export function freeAccessPublicSummary(slug: string, raw: RawValue | undefined): string {
  return formatFreeAccessAllowanceSummary(slug, raw);
}
