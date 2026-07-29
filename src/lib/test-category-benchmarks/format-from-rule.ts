import type { ScoringRule } from '../scoring/engine';

const DEFAULT_GOOD_SCORE = 8;
const DEFAULT_TYPICAL_MIN = 5;

export interface BenchmarkTierOptions {
  goodMinScore?: number;
  typicalMinScore?: number;
  unit?: string;
  measurementType?: string;
}

function formatCountRange(min: number, max: number, suffix = ''): string {
  if (min === max) return `${min}${suffix}`;
  if (max >= 999999) return `${min}+${suffix}`;
  return `${min}–${max}${suffix}`;
}

function bandRanges(rule: Extract<ScoringRule, { kind: 'bands' }>) {
  const sorted = [...rule.bands].sort((a, b) => a.upTo - b.upTo);
  const ranges: { min: number; max: number; score: number }[] = [];
  let prev = -1;
  for (const band of sorted) {
    ranges.push({ min: prev + 1, max: band.upTo, score: band.score });
    prev = band.upTo;
  }
  return ranges;
}

function isLowerBetterBands(rule: Extract<ScoringRule, { kind: 'bands' }>) {
  const sorted = [...rule.bands].sort((a, b) => a.upTo - b.upTo);
  if (sorted.length < 2) return false;
  return sorted[0]!.score > sorted[sorted.length - 1]!.score;
}

function pickBandLabel(
  ranges: { min: number; max: number; score: number }[],
  predicate: (score: number) => boolean,
  suffix = '',
) {
  const matched = ranges.filter((r) => predicate(r.score));
  if (!matched.length) return null;
  const min = Math.min(...matched.map((r) => r.min));
  const max = Math.max(...matched.map((r) => r.max));
  if (min === max && max >= 999999) return `${min - 1}+${suffix}`;
  if (min === 0 && max < 999999) return formatCountRange(min, max, suffix);
  if (min > 0 && max >= 999999) return `${min}+${suffix}`;
  return formatCountRange(min, max, suffix);
}

function formatLinear(rule: Extract<ScoringRule, { kind: 'linear' }>) {
  const unit = rule.max === 100 ? '%' : '';
  if (rule.invert) {
    return {
      good: `20${unit} or less`,
      typical: rule.max === 100 ? '21–40%' : '21–40%',
      weak: rule.max === 100 ? 'Over 40%' : 'Over 40%',
    };
  }
  return {
    good: `80${unit}+`,
    typical: rule.max === 100 ? '60–79%' : '60–79%',
    weak: rule.max === 100 ? 'Under 60%' : 'Under 60%',
  };
}

function formatTimeBandLabel(maxSeconds: number) {
  if (maxSeconds <= 60) return `${maxSeconds} sec or less`;
  if (maxSeconds % 60 === 0) return `${maxSeconds / 60} min or less`;
  const minutes = Math.floor(maxSeconds / 60);
  const seconds = maxSeconds % 60;
  return `${minutes} min ${seconds} sec or less`;
}

function formatDuration(totalSeconds: number) {
  if (totalSeconds < 60) return `${totalSeconds} sec`;
  if (totalSeconds % 60 === 0) return `${totalSeconds / 60} min`;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes} min ${seconds} sec`;
}

function formatInvertedBands(rule: Extract<ScoringRule, { kind: 'bands' }>, options: BenchmarkTierOptions) {
  const ranges = bandRanges(rule);
  const goodMin = options.goodMinScore ?? DEFAULT_GOOD_SCORE;
  const typicalMin = options.typicalMinScore ?? DEFAULT_TYPICAL_MIN;
  const isTime = options.unit === 'seconds' || options.measurementType === 'seconds';

  const goodMax = ranges.filter((r) => r.score >= goodMin).reduce((max, r) => Math.max(max, r.max), 0);
  const typicalRanges = ranges.filter((r) => r.score >= typicalMin && r.score < goodMin);
  const weakRanges = ranges.filter((r) => r.score < typicalMin);

  const typicalMinVal = typicalRanges.length ? Math.min(...typicalRanges.map((r) => r.min)) : null;
  const typicalMaxVal = typicalRanges.length ? Math.max(...typicalRanges.map((r) => r.max)) : null;
  const weakMinVal = weakRanges.length ? Math.min(...weakRanges.map((r) => r.min)) : null;

  if (isTime) {
    const good = goodMax >= 999999 ? 'Instant' : formatTimeBandLabel(goodMax);
    let typical = '—';
    if (typicalMinVal != null && typicalMaxVal != null) {
      if (typicalMinVal === typicalMaxVal) {
        typical = formatDuration(typicalMinVal);
      } else if (typicalMinVal < 60 && typicalMaxVal < 60) {
        typical = `${typicalMinVal}–${typicalMaxVal} sec`;
      } else {
        typical = `${formatDuration(typicalMinVal)}–${formatDuration(typicalMaxVal)}`;
      }
    }
    const weak =
      typicalMaxVal != null
        ? `Over ${formatDuration(typicalMaxVal)}`
        : weakMinVal != null
          ? `Over ${formatDuration(goodMax)}`
          : '—';
    return { good, typical, weak };
  }

  const good = goodMax >= 999999 ? `${goodMax}+` : `${goodMax}`;
  const typical =
    typicalMinVal != null && typicalMaxVal != null
      ? typicalMinVal === typicalMaxVal
        ? `${typicalMinVal}`
        : formatCountRange(typicalMinVal, typicalMaxVal)
      : '—';
  const weak =
    weakMinVal != null
      ? weakRanges.some((r) => r.max >= 999999)
        ? `${weakMinVal}+`
        : formatCountRange(weakMinVal, Math.max(...weakRanges.map((r) => r.max)))
      : '—';

  return { good, typical, weak };
}

function formatBands(rule: Extract<ScoringRule, { kind: 'bands' }>, options: BenchmarkTierOptions) {
  if (isLowerBetterBands(rule)) {
    return formatInvertedBands(rule, options);
  }

  const ranges = bandRanges(rule);
  const goodMin = options.goodMinScore ?? DEFAULT_GOOD_SCORE;
  const typicalMin = options.typicalMinScore ?? DEFAULT_TYPICAL_MIN;
  const isTime = options.unit === 'seconds' || options.measurementType === 'seconds';
  const suffix = isTime ? ' sec' : '';

  const good = pickBandLabel(ranges, (score) => score >= goodMin, suffix);
  const typical = pickBandLabel(ranges, (score) => score >= typicalMin && score < goodMin, suffix);
  const weak = pickBandLabel(ranges, (score) => score < typicalMin, suffix);
  return {
    good: good ?? '—',
    typical: typical ?? '—',
    weak: weak ?? '—',
  };
}

function formatYnl(rule: Extract<ScoringRule, { kind: 'ynl' }>) {
  if (rule.no >= DEFAULT_GOOD_SCORE && rule.yes < rule.no) {
    return { good: 'No', typical: 'Unknown or limited', weak: 'Yes' };
  }
  if (rule.yes >= DEFAULT_GOOD_SCORE) {
    return { good: 'Yes', typical: 'Limited', weak: 'No' };
  }
  return { good: 'Yes', typical: 'Limited', weak: 'No' };
}

export function formatGoodThresholdFromRule(
  rule: ScoringRule,
  options: BenchmarkTierOptions = {},
): string | null {
  const tiers = formatBenchmarkTiersFromRule(rule, options);
  return tiers?.good ?? null;
}

export function formatBenchmarkTiersFromRule(
  rule: ScoringRule,
  options: BenchmarkTierOptions = {},
): {
  good: string;
  typical: string;
  weak: string;
} | null {
  switch (rule.kind) {
    case 'linear':
      return formatLinear(rule);
    case 'bands':
      return formatBands(rule, options);
    case 'ynl':
      return formatYnl(rule);
    default:
      return null;
  }
}

export function formatYnlPassCountTiers(count: number) {
  if (count <= 0) return null;
  return {
    good: `${count} of ${count} work`,
    typical: count > 1 ? `1–${count - 1} of ${count} work` : `0 of ${count} work`,
    weak: `0 of ${count} work`,
  };
}

/** Human-readable scoring band lines for methodology pages, e.g. "4 styles = 8/10". */
export function formatScoringBandsForDisplay(
  rule: ScoringRule,
  options?: { singular?: string; plural?: string },
): string[] {
  if (rule.kind !== 'bands') return [];

  const singular = options?.singular ?? 'item';
  const plural = options?.plural ?? `${singular}s`;
  const sorted = [...rule.bands].sort((a, b) => a.upTo - b.upTo);
  const lines: string[] = [];
  let prev = -1;

  for (const band of sorted) {
    const min = prev + 1;
    const max = band.upTo;
    let rangeLabel: string;

    if (max >= 999999) {
      rangeLabel = min <= 1 ? `${min === 0 ? 1 : min}+ ${plural}` : `${min + 1}+ ${plural}`;
    } else if (min === max) {
      rangeLabel = `${max} ${max === 1 ? singular : plural}`;
    } else if (min === 0) {
      rangeLabel = `${max} or fewer ${plural}`;
    } else {
      rangeLabel = `${min}–${max} ${plural}`;
    }

    lines.push(`${rangeLabel} = ${band.score}/10`);
    prev = max;
  }

  return lines;
}

export function formatSubscoreControlTiers(count: number) {
  if (count <= 0) return null;
  const weakMax = Math.max(0, Math.floor(count / 2) - 1);
  const typicalMin = weakMax + 1;
  const typicalMax = Math.max(typicalMin, count - 2);
  const goodMin = Math.max(1, count - 1);

  return {
    good: goodMin === count ? `${count} available` : `${goodMin}–${count} available`,
    typical:
      typicalMin <= typicalMax ? `${typicalMin}–${typicalMax} available` : `${typicalMin} available`,
    weak: weakMax === 0 ? '0 available' : `0–${weakMax} available`,
  };
}
