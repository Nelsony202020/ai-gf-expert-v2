import type { AtGlanceData } from '../../data/roundups/ai-girlfriend';
import { getSegmentFill, getSegmentFillClass } from '../roundup-scores';

export const COMPARE_FEATURE_IDS = [
  'character-styles',
  'ai-phone-calls',
  'voice-messages',
  'video-generator',
] as const;

export const COMPARE_PRICING_IDS = [
  'pricing-model',
  'starting-price',
  'regular-use',
  'power-user',
] as const;

export function atGlanceValue(data: AtGlanceData | undefined, section: 'features' | 'pricing', id: string): string {
  const rows = section === 'features' ? data?.features : data?.pricing;
  return rows?.find((row) => row.id === id)?.value ?? '—';
}

export function atGlanceLabel(data: AtGlanceData | undefined, section: 'features' | 'pricing', id: string): string {
  const rows = section === 'features' ? data?.features : data?.pricing;
  return rows?.find((row) => row.id === id)?.label ?? id;
}

export function winnerPickIds(scores: Array<{ id: string; score: number }>): Set<string> {
  if (scores.length === 0) return new Set();
  const max = Math.max(...scores.map((s) => s.score));
  if (!Number.isFinite(max)) return new Set();
  return new Set(scores.filter((s) => s.score === max).map((s) => s.id));
}

/** Segmented 5-piece bar matching roundup product cards. */
export function segmentedCompareBarHtml(score: number, thin = true): string {
  const fillClass = getSegmentFillClass(score);
  const ratio = Math.min(Math.max(score / 10, 0), 1);
  const track = Array.from({ length: 5 }, () => `<span class="roundup-compare-bar__seg"></span>`).join('');
  const fill = Array.from({ length: 5 }, (_, i) => {
    const seg = getSegmentFill(score, i);
    if (seg.state === 'full') return `<span class="roundup-compare-bar__seg ${fillClass}"></span>`;
    if (seg.state === 'partial') {
      return `<span class="roundup-compare-bar__seg"><span class="roundup-compare-bar__fill ${fillClass}" style="width:${seg.partialPct}%"></span></span>`;
    }
    return `<span class="roundup-compare-bar__seg"></span>`;
  }).join('');
  const thinClass = thin ? ' roundup-compare-bar--segmented-thin' : '';
  return `<div class="roundup-compare-bar roundup-compare-bar--segmented${thinClass}" data-roundup-score-bar style="--score-fill-ratio:${ratio}" aria-hidden="true"><div class="roundup-score-bar__track">${track}</div><div class="roundup-score-bar__meter-fill">${fill}</div></div>`;
}

export function compareBestBadgeHtml(): string {
  return `<span class="roundup-compare__best-badge" aria-label="Best in row"><span class="material-symbols-outlined roundup-compare__best-icon" aria-hidden="true">crown</span>Best</span>`;
}

export function comparePerfCellInnerHtml(score: number, isWinner: boolean, formattedScore: string): string {
  const badge = isWinner ? compareBestBadgeHtml() : '';
  const cellClass = isWinner ? ' roundup-compare__perf-cell--best' : '';
  const bar = segmentedCompareBarHtml(score).replace(
    'roundup-compare-bar--segmented-thin"',
    `roundup-compare-bar--segmented-thin${isWinner ? ' roundup-compare-bar--winner' : ''}"`,
  );
  return `<div class="roundup-compare__perf-cell${cellClass}">${badge}<span class="roundup-compare__perf-score">${formattedScore}/10</span>${bar}</div>`;
}

export function splitVerdict(text: string): { lead: string; rest: string } {
  const trimmed = text.trim();
  if (!trimmed) return { lead: '', rest: '' };
  const match = trimmed.match(/^(.+?[.!?])(?:\s+([\s\S]+))?$/);
  if (!match) return { lead: trimmed, rest: '' };
  return { lead: match[1].trim(), rest: (match[2] ?? '').trim() };
}

export function truncateWords(text: string, maxWords = 120): string {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length <= maxWords) return text.trim();
  return `${words.slice(0, maxWords).join(' ')}…`;
}
