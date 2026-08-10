import type { Product } from '../../data/products';
import { fmtScore } from '../scores';
import type { AlternativePeerView } from './loadAlternatives';

/** Metrics shown in the alternatives comparison table (not full Ratings & Specs). */
export const COMPARISON_TABLE_METRIC_KEYS = [
  'overall',
  'chat',
  'customization',
  'images',
  'video',
  'privacy',
  'price',
] as const;

export type ComparisonTableMetricKey = (typeof COMPARISON_TABLE_METRIC_KEYS)[number];

export const COMPARISON_TABLE_METRIC_LABELS: Record<ComparisonTableMetricKey, string> = {
  overall: 'Overall',
  chat: 'Chat',
  customization: 'Custom.',
  images: 'Images',
  video: 'Video',
  privacy: 'Privacy',
  price: 'Price',
};

const NEUTRAL_THRESHOLD = 0.3;
const STRONG_THRESHOLD = 0.8;
const PRICE_NEUTRAL_THRESHOLD = 0.5;

export type ComparisonCellTone = 'reference' | 'better' | 'worse' | 'neutral';
export type DeltaStrength = 'none' | 'subtle' | 'strong';

export interface ComparisonTableCell {
  display: string;
  signedDelta: number | null;
  tone: ComparisonCellTone;
  strength: DeltaStrength;
  kind: 'score' | 'price' | 'match';
}

export interface ComparisonTableRow {
  id: string;
  name: string;
  slug: string;
  thumb?: string;
  reviewUrl: string | null;
  descriptor?: string;
  isSource: boolean;
  similarity: number | null;
  cells: Record<ComparisonTableMetricKey, ComparisonTableCell>;
  matchLabel: string;
  matchVariant: 'reference' | 'match';
}

function parsePriceMonthly(product: Product): number | null {
  const match = product.overview.highlights.startingPrice.match(/\$([\d.]+)/);
  return match ? Number(match[1]) : null;
}

function formatPrice(product: Product): string {
  const raw = product.overview.highlights.startingPrice || '—';
  return raw.replace(/\s*\/\s*mo(nth)?/i, '').trim() || '—';
}

function deltaStrength(abs: number, neutralThreshold: number): DeltaStrength {
  if (abs < neutralThreshold) return 'none';
  if (abs >= STRONG_THRESHOLD) return 'strong';
  return 'subtle';
}

function scoreCell(peer: number | null, source: number | null): ComparisonTableCell {
  if (peer == null) {
    return { display: '—', signedDelta: null, tone: 'neutral', strength: 'none', kind: 'score' };
  }
  const display = fmtScore(peer);
  if (source == null) {
    return { display, signedDelta: null, tone: 'reference', strength: 'none', kind: 'score' };
  }
  const signed = peer - source;
  const strength = deltaStrength(Math.abs(signed), NEUTRAL_THRESHOLD);
  if (strength === 'none') {
    return { display, signedDelta: signed, tone: 'neutral', strength: 'none', kind: 'score' };
  }
  return {
    display,
    signedDelta: signed,
    tone: signed > 0 ? 'better' : 'worse',
    strength,
    kind: 'score',
  };
}

function priceCell(peerProduct: Product, sourceProduct: Product, isSource: boolean): ComparisonTableCell {
  const display = formatPrice(peerProduct);
  if (isSource) {
    return { display, signedDelta: null, tone: 'reference', strength: 'none', kind: 'price' };
  }
  const peer = parsePriceMonthly(peerProduct);
  const source = parsePriceMonthly(sourceProduct);
  if (peer == null || source == null) {
    return { display, signedDelta: null, tone: 'neutral', strength: 'none', kind: 'price' };
  }
  const signed = source - peer;
  const strength = deltaStrength(Math.abs(signed), PRICE_NEUTRAL_THRESHOLD);
  if (strength === 'none') {
    return { display, signedDelta: signed, tone: 'neutral', strength: 'none', kind: 'price' };
  }
  return {
    display,
    signedDelta: signed,
    tone: signed > 0 ? 'better' : 'worse',
    strength,
    kind: 'price',
  };
}

function productThumb(p: Product): string | undefined {
  return p.logo ?? p.gallery[0]?.thumb ?? p.gallery[0]?.full;
}

function buildRow(
  product: Product,
  source: Product,
  sourceScores: Record<string, number | null>,
  peer: AlternativePeerView | null,
  isSource: boolean,
): ComparisonTableRow {
  const scores = isSource ? sourceScores : (peer?.categoryScores ?? {});
  const overall = isSource ? product.overallScore : peer?.product.overallScore ?? null;
  const srcOverall = source.overallScore;

  const cells = {} as Record<ComparisonTableMetricKey, ComparisonTableCell>;

  for (const key of COMPARISON_TABLE_METRIC_KEYS) {
    if (key === 'overall') {
      if (isSource) {
        cells.overall = {
          display: fmtScore(overall),
          signedDelta: null,
          tone: 'reference',
          strength: 'none',
          kind: 'score',
        };
      } else {
        cells.overall = scoreCell(overall, srcOverall);
      }
      continue;
    }
    if (key === 'price') {
      cells.price = priceCell(product, source, isSource);
      continue;
    }
    const val = scores[key] ?? null;
    if (isSource) {
      cells[key] = {
        display: val != null ? fmtScore(val) : '—',
        signedDelta: null,
        tone: 'reference',
        strength: 'none',
        kind: 'score',
      };
    } else {
      cells[key] = scoreCell(val, sourceScores[key] ?? null);
    }
  }

  return {
    id: product.slug,
    name: product.name,
    slug: product.slug,
    thumb: productThumb(product),
    reviewUrl: isSource ? `/reviews/${product.slug}/` : peer?.reviewUrl ?? null,
    descriptor: isSource ? undefined : peer?.editorial.tableDescriptor,
    isSource,
    similarity: isSource ? null : peer?.similarity ?? null,
    cells,
    matchLabel: isSource ? 'Reference' : `${peer?.similarity ?? 0}% match`,
    matchVariant: isSource ? 'reference' : 'match',
  };
}

export function buildComparisonTableRows(
  source: Product,
  sourceScores: Record<string, number | null>,
  peers: AlternativePeerView[],
): ComparisonTableRow[] {
  const sourceRow = buildRow(source, source, sourceScores, null, true);
  const peerRows = peers.map((peer) => buildRow(peer.product, source, sourceScores, peer, false));
  return [sourceRow, ...peerRows];
}

export function fmtSignedDelta(signed: number, kind: 'score' | 'price'): string {
  if (Math.abs(signed) < 0.05) return '=';
  const sign = signed >= 0 ? '+' : '−';
  if (kind === 'price') {
    return `${sign}$${Math.abs(signed).toFixed(2)}`;
  }
  return `${sign}${Math.abs(signed).toFixed(1)}`;
}

export interface ComparisonTableTakeaway {
  peerName: string;
  advantageLabel: string;
  sourceStrengthLabels: string[];
  text: string;
}

export function buildComparisonTableTakeaway(
  source: Product,
  sourceScores: Record<string, number | null>,
  topPeer: AlternativePeerView | null,
): ComparisonTableTakeaway | null {
  if (!topPeer) return null;

  let bestAdvKey: ComparisonTableMetricKey | null = null;
  let bestAdvDelta = -Infinity;
  const sourceWins: string[] = [];

  for (const key of COMPARISON_TABLE_METRIC_KEYS) {
    if (key === 'price') continue;
    const src = key === 'overall' ? source.overallScore : sourceScores[key];
    const peer = key === 'overall' ? topPeer.product.overallScore : topPeer.categoryScores[key];
    if (src == null || peer == null) continue;
    const signed = peer - src;
    if (signed > bestAdvDelta && signed >= NEUTRAL_THRESHOLD) {
      bestAdvDelta = signed;
      bestAdvKey = key;
    }
    if (src - peer >= NEUTRAL_THRESHOLD) {
      sourceWins.push(COMPARISON_TABLE_METRIC_LABELS[key].replace('.', ''));
    }
  }

  const advantageLabel = bestAdvKey
    ? COMPARISON_TABLE_METRIC_LABELS[bestAdvKey].replace('.', '').toLowerCase()
    : 'overall performance';
  const sourceStrength =
    sourceWins.length > 0
      ? sourceWins.slice(0, 2).join(' and ')
      : 'privacy and video';

  const text = `${topPeer.product.name} is the closest overall alternative to ${source.name}. Its biggest advantage is ${advantageLabel}, while ${source.name} remains stronger in ${sourceStrength}.`;

  return {
    peerName: topPeer.product.name,
    advantageLabel,
    sourceStrengthLabels: sourceWins,
    text,
  };
}
