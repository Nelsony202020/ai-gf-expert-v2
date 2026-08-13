// Free-access allowance — count + reset period (total / per day / per month).

import type { RawValue } from '../scoring/engine';

export const FREE_ACCESS_ALLOWANCE_SLUGS = [
  'free-chat',
  'free-characters',
  'free-images',
  'free-video',
  'free-voice',
] as const;

export type FreeAccessAllowanceSlug = (typeof FREE_ACCESS_ALLOWANCE_SLUGS)[number];

export type FreeAccessPeriod = 'total' | 'day' | 'month';

export interface FreeAccessAllowance {
  amount: number | undefined;
  period: FreeAccessPeriod;
}

export const FREE_ACCESS_PERIOD_OPTIONS: Array<{ value: FreeAccessPeriod; label: string }> = [
  { value: 'total', label: 'Total' },
  { value: 'day', label: 'Per day' },
  { value: 'month', label: 'Per month' },
];

const COUNT_LABEL: Record<string, string> = {
  'free-chat': 'messages',
  'free-characters': 'characters',
  'free-images': 'images',
  'free-video': 'videos',
  'free-voice': 'sec voice',
};

const PERIOD_SUFFIX: Record<FreeAccessPeriod, string> = {
  total: '',
  day: ' / day',
  month: ' / month',
};

export function isFreeAccessAllowanceSlug(slug: string | undefined | null): boolean {
  return Boolean(slug && (FREE_ACCESS_ALLOWANCE_SLUGS as readonly string[]).includes(slug));
}

export function isFreeAccessPeriod(value: unknown): value is FreeAccessPeriod {
  return value === 'total' || value === 'day' || value === 'month';
}

/** Default period for new / unset answers — Total (one-time / until used up). */
export const DEFAULT_FREE_ACCESS_PERIOD: FreeAccessPeriod = 'total';

export function parseFreeAccessAllowance(raw: RawValue | undefined): FreeAccessAllowance {
  if (!raw || typeof raw !== 'object' || !('value' in raw)) {
    return { amount: undefined, period: DEFAULT_FREE_ACCESS_PERIOD };
  }
  const detail =
    'detail' in raw && raw.detail && typeof raw.detail === 'object'
      ? (raw.detail as Record<string, unknown>)
      : undefined;
  const incomplete = detail?.incomplete === true;
  let amount =
    typeof raw.value === 'number' && Number.isFinite(raw.value) ? raw.value : undefined;
  if (incomplete && amount === 0 && detail?.period == null) amount = undefined;
  const period: FreeAccessPeriod = isFreeAccessPeriod(detail?.period)
    ? detail.period
    : DEFAULT_FREE_ACCESS_PERIOD;
  return { amount, period };
}

export function freeAccessAllowanceToRaw(parsed: FreeAccessAllowance): RawValue | undefined {
  const hasAmount = typeof parsed.amount === 'number' && Number.isFinite(parsed.amount);
  const period = isFreeAccessPeriod(parsed.period) ? parsed.period : DEFAULT_FREE_ACCESS_PERIOD;
  if (!hasAmount) return undefined;
  return {
    value: parsed.amount!,
    detail: { period },
  };
}

export function formatFreeAccessAllowanceSummary(
  slug: string | undefined,
  raw: RawValue | undefined,
): string {
  const parsed = parseFreeAccessAllowance(raw);
  if (typeof parsed.amount !== 'number' || !Number.isFinite(parsed.amount)) return '—';
  const unit = (slug && COUNT_LABEL[slug]) || 'units';
  return `${parsed.amount} ${unit}${PERIOD_SUFFIX[parsed.period]}`;
}

export function freeAccessUnitLabel(slug: string | undefined): string {
  if (!slug) return '';
  return COUNT_LABEL[slug] ?? '';
}
