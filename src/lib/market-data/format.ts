/** Distinguish real zero from missing/unavailable market values. */

export type MarketValue<T> =
  | { status: 'ok'; value: T }
  | { status: 'unavailable' };

export function marketOk<T>(value: T | null | undefined): MarketValue<T> {
  if (value === null || value === undefined) return { status: 'unavailable' };
  if (typeof value === 'number' && !Number.isFinite(value)) return { status: 'unavailable' };
  return { status: 'ok', value };
}

export function formatUnavailable(label = 'Not enough data'): string {
  return label;
}

export function formatInterest(interest: MarketValue<number>): string {
  if (interest.status === 'unavailable') return formatUnavailable();
  return `${interest.value}/100`;
}

export function formatGrowth(growth: MarketValue<number>): string {
  if (growth.status === 'unavailable') return formatUnavailable();
  const sign = growth.value >= 0 ? '+' : '';
  return `${sign}${growth.value}%`;
}

export function formatRank(rank: MarketValue<number>, total: MarketValue<number>): string {
  if (rank.status === 'unavailable' || total.status === 'unavailable' || total.value <= 0) {
    return formatUnavailable();
  }
  return `#${rank.value}`;
}

export function formatRankSub(rank: MarketValue<number>, total: MarketValue<number>): string {
  if (rank.status === 'unavailable' || total.status === 'unavailable' || total.value <= 0) {
    return '';
  }
  return `of ${total.value} AI companion apps`;
}

export function formatPrice(price: MarketValue<number>): string {
  if (price.status === 'unavailable') return formatUnavailable();
  return `$${price.value.toFixed(2)}`;
}

export function formatMarketRankCell(rank: MarketValue<number>): string {
  if (rank.status === 'unavailable') return formatUnavailable();
  return `#${rank.value}`;
}
