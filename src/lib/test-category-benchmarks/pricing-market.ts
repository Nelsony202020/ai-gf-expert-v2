import { collectPricingStats } from '../pricing/statistics';
import type { BenchmarkMainRowConfig } from './types';

function formatUsd(amount: number, plus = false): string {
  const rounded = amount >= 10 ? `$${Math.round(amount)}` : `$${amount.toFixed(2)}`;
  return plus ? `${rounded}+` : rounded;
}

function percentile(values: number[], p: number): number | null {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = (p / 100) * (sorted.length - 1);
  const lower = Math.floor(idx);
  const upper = Math.ceil(idx);
  if (lower === upper) return sorted[lower];
  return sorted[lower] + (sorted[upper] - sorted[lower]) * (idx - lower);
}

const PLACEHOLDER_ROWS: BenchmarkMainRowConfig[] = [
  { label: 'Monthly plan', good: '$0', typical: '$10', weak: '$20+' },
  { label: 'Real monthly spend', good: '$0', typical: '$25', weak: '$45+' },
  { label: 'Cost per image', good: '$0', typical: '$0.20', weak: '$0.50+' },
];

/** Live market rows from published pricing data; falls back to editorial placeholders. */
export async function loadPricingMarketRows(): Promise<BenchmarkMainRowConfig[]> {
  try {
    const stats = await collectPricingStats();
    const monthly = stats.products
      .map((p) => p.lowestMonthly)
      .filter((v): v is number => v != null);

    if (monthly.length < 3) {
      return PLACEHOLDER_ROWS;
    }

    const low = percentile(monthly, 10);
    const mid = percentile(monthly, 50);
    const high = percentile(monthly, 90);

    if (low == null || mid == null || high == null) {
      return PLACEHOLDER_ROWS;
    }

    return [
      {
        label: 'Monthly plan',
        good: formatUsd(Math.max(0, low)),
        typical: formatUsd(mid),
        weak: formatUsd(high, true),
      },
      PLACEHOLDER_ROWS[1],
      PLACEHOLDER_ROWS[2],
    ];
  } catch {
    return PLACEHOLDER_ROWS;
  }
}

export const PRICING_FREE_ACCESS_MINIMUMS = [
  { label: 'Chat messages', value: '50+' },
  { label: 'Images', value: '10+' },
  { label: 'Videos', value: '3+' },
  { label: 'Voice messages', value: '5+' },
  { label: 'Characters', value: '5+' },
  { label: 'Credit card required', value: 'No' },
];

export const PRICING_RED_FLAGS = [
  'Prices hidden until checkout',
  'No useful free trial',
  'Extra credits needed for most features',
];
