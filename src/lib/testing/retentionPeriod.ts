// Data retention period — numeric amount + unit (weeks, months, years).

import type { RawValue } from '../scoring/engine';

export type RetentionUnit = 'weeks' | 'months' | 'years' | '';

export interface RetentionPeriod {
  amount: number | undefined;
  unit: RetentionUnit;
}

const SINGULAR_UNIT: Record<Exclude<RetentionUnit, ''>, string> = {
  weeks: 'week',
  months: 'month',
  years: 'year',
};

export function parseRetentionPeriod(raw: RawValue | undefined): RetentionPeriod {
  if (!raw || typeof raw !== 'object' || !('value' in raw)) {
    return { amount: undefined, unit: '' };
  }
  const detail =
    'detail' in raw && raw.detail && typeof raw.detail === 'object'
      ? (raw.detail as Record<string, unknown>)
      : undefined;
  const incomplete = detail?.incomplete === true;
  let amount =
    typeof raw.value === 'number' && Number.isFinite(raw.value) ? raw.value : undefined;
  if (incomplete && amount === 0) amount = undefined;
  const unitRaw = detail?.unit;
  const unit: RetentionUnit =
    unitRaw === 'weeks' || unitRaw === 'months' || unitRaw === 'years' ? unitRaw : '';
  return { amount, unit };
}

export function retentionPeriodToRaw(parsed: RetentionPeriod): RawValue | undefined {
  const hasAmount = typeof parsed.amount === 'number' && parsed.amount > 0;
  if (!hasAmount && !parsed.unit) return undefined;
  if (hasAmount && parsed.unit) {
    return { value: parsed.amount!, detail: { unit: parsed.unit } };
  }
  // Persist partial input so number and unit can be filled in either order.
  return {
    value: hasAmount ? parsed.amount! : 0,
    detail: { ...(parsed.unit ? { unit: parsed.unit } : {}), incomplete: true },
  };
}

export function isRetentionPeriodComplete(raw: RawValue | undefined): boolean {
  if (!raw) return false;
  if ('status' in raw && (raw.status === 'unknown' || raw.status === 'not_stated')) return true;
  const parsed = parseRetentionPeriod(raw);
  return typeof parsed.amount === 'number' && parsed.amount > 0 && parsed.unit !== '';
}

export function formatRetentionPeriodSummary(raw: RawValue | undefined): string {
  if (!raw) return '—';
  if ('status' in raw) {
    if (raw.status === 'unknown') return 'Unknown';
    if (raw.status === 'not_stated') return 'Not stated';
  }
  const parsed = parseRetentionPeriod(raw);
  if (typeof parsed.amount !== 'number' || parsed.amount <= 0 || !parsed.unit) return '—';
  const unitLabel = parsed.amount === 1 ? SINGULAR_UNIT[parsed.unit] : parsed.unit;
  return `${parsed.amount} ${unitLabel}`;
}
