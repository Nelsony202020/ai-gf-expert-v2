import type { Product } from '../../data/products';
import {
  ALTERNATIVE_BEAT_THRESHOLD,
  PRODUCT_ALTERNATIVES,
  COMPARISON_CATEGORY_KEYS,
  COMPARISON_CATEGORY_LABELS,
  type AlternativeEditorial,
} from '../../data/product-alternatives-config';
import { loadComparisonProducts } from '../content/comparisonProducts';
import {
  beatsThreshold,
  categoryScoreMap,
  computeSimilarityScore,
  sourceBeatsThreshold,
} from './similarity';
import { popularitySnapshotFromProducts, resolveAlternativeProduct } from './profiles';

export interface AlternativePeerView {
  product: Product;
  similarity: number;
  editorial: AlternativeEditorial;
  categoryScores: Record<string, number | null>;
  priceMonthly: number | null;
  reviewUrl: string | null;
  winsOverSource: Array<{ label: string; peerScore: number; sourceScore: number }>;
  sourceWinsOver: Array<{ label: string; sourceScore: number; peerScore: number }>;
}

export interface WinLossRow {
  categoryLabel: string;
  leaderName: string;
  leaderScore: number;
  trailingName: string;
  trailingScore: number;
}

export interface AlternativesViewModel {
  source: Product;
  updatedLabel: string;
  intro: string;
  peers: AlternativePeerView[];
  bestOverall: AlternativePeerView | null;
  otherPeers: AlternativePeerView[];
  alternativeWins: WinLossRow[];
  sourceWins: WinLossRow[];
  popularity: Array<{ name: string; slug: string; searchInterest: number | null; highlight?: boolean }>;
  showPopularity: boolean;
  popularitySource: string;
  stickWithSourceIf: string;
  stickWithDecisionHook: string;
  stickWithDecisionIcon: string;
}

function buildWinRows(
  source: Product,
  sourceScores: Record<string, number | null>,
  peers: AlternativePeerView[],
): { alternativeWins: WinLossRow[]; sourceWins: WinLossRow[] } {
  const alternativeWins: WinLossRow[] = [];
  const sourceWins: WinLossRow[] = [];

  for (const key of COMPARISON_CATEGORY_KEYS) {
    const src = sourceScores[key];
    if (src == null) continue;

    let bestPeer: AlternativePeerView | null = null;
    let bestPeerScore = -Infinity;
    for (const peer of peers) {
      const ps = peer.categoryScores[key];
      if (ps == null) continue;
      if (ps > bestPeerScore) {
        bestPeerScore = ps;
        bestPeer = peer;
      }
    }
    if (!bestPeer || bestPeerScore === -Infinity) continue;

    if (beatsThreshold(src, bestPeerScore, ALTERNATIVE_BEAT_THRESHOLD)) {
      alternativeWins.push({
        categoryLabel: COMPARISON_CATEGORY_LABELS[key],
        leaderName: bestPeer.product.name,
        leaderScore: bestPeerScore,
        trailingName: source.name,
        trailingScore: src,
      });
    } else if (sourceBeatsThreshold(src, bestPeerScore, ALTERNATIVE_BEAT_THRESHOLD)) {
      sourceWins.push({
        categoryLabel: COMPARISON_CATEGORY_LABELS[key],
        leaderName: source.name,
        leaderScore: src,
        trailingName: bestPeer.product.name,
        trailingScore: bestPeerScore,
      });
    }
  }

  return {
    alternativeWins: alternativeWins.slice(0, 5),
    sourceWins: sourceWins.slice(0, 5),
  };
}

function peerCategoryWins(
  sourceScores: Record<string, number | null>,
  peerScores: Record<string, number | null>,
): Array<{ label: string; peerScore: number; sourceScore: number }> {
  const out: Array<{ label: string; peerScore: number; sourceScore: number }> = [];
  for (const key of COMPARISON_CATEGORY_KEYS) {
    const src = sourceScores[key];
    const tgt = peerScores[key];
    if (!beatsThreshold(src, tgt, ALTERNATIVE_BEAT_THRESHOLD) || tgt == null || src == null) continue;
    out.push({
      label: COMPARISON_CATEGORY_LABELS[key],
      peerScore: tgt,
      sourceScore: src,
    });
  }
  return out.slice(0, 4);
}

function sourceCategoryWins(
  sourceScores: Record<string, number | null>,
  peerScores: Record<string, number | null>,
): Array<{ label: string; sourceScore: number; peerScore: number }> {
  const out: Array<{ label: string; sourceScore: number; peerScore: number }> = [];
  for (const key of COMPARISON_CATEGORY_KEYS) {
    const src = sourceScores[key];
    const tgt = peerScores[key];
    if (!sourceBeatsThreshold(src, tgt, ALTERNATIVE_BEAT_THRESHOLD) || tgt == null || src == null) continue;
    out.push({
      label: COMPARISON_CATEGORY_LABELS[key],
      sourceScore: src,
      peerScore: tgt,
    });
  }
  return out.slice(0, 4);
}

export async function loadAlternativesViewModel(source: Product): Promise<AlternativesViewModel | null> {
  const config = PRODUCT_ALTERNATIVES[source.slug];
  if (!config) return null;

  const comparisonProducts = await loadComparisonProducts();
  const sourceScores = categoryScoreMap(source);

  const peers: AlternativePeerView[] = [];
  for (const slug of config.slugs) {
    const product = await resolveAlternativeProduct(slug, comparisonProducts);
    if (!product) continue;

    const categoryScores = categoryScoreMap(product);
    const editorialBase = config.editorials[slug];
    if (!editorialBase) continue;

    const priceMatch = product.overview.highlights.startingPrice.match(/\$([\d.]+)/);
    peers.push({
      product,
      similarity: computeSimilarityScore(source, categoryScores),
      editorial: { slug, ...editorialBase },
      categoryScores,
      priceMonthly: priceMatch ? Number(priceMatch[1]) : null,
      reviewUrl: product.slug ? `/reviews/${product.slug}/` : null,
      winsOverSource: peerCategoryWins(sourceScores, categoryScores),
      sourceWinsOver: sourceCategoryWins(sourceScores, categoryScores),
    });
  }

  peers.sort((a, b) => b.similarity - a.similarity);

  const bestOverall = peers[0] ?? null;
  const otherPeers = peers.slice(1);
  const { alternativeWins, sourceWins } = buildWinRows(source, sourceScores, peers);

  const popularity = popularitySnapshotFromProducts(source, peers.map((p) => p.product));
  const popularityWithData = popularity.filter((p) => p.searchInterest != null && p.searchInterest > 0);

  return {
    source,
    updatedLabel: config.updatedLabel,
    intro: `We compared ${source.name} against every app we've tested. These are the closest alternatives based on our scores, features, pricing, and hands-on testing.`,
    peers,
    bestOverall,
    otherPeers,
    alternativeWins,
    sourceWins,
    popularity,
    showPopularity: popularityWithData.length >= 3,
    popularitySource: 'Google Trends relative search interest',
    stickWithSourceIf:
      'You prioritize chat realism and video generation in one app, and you are comfortable with slower image generation speeds.',
    stickWithDecisionHook: config.stickWithDecisionHook,
    stickWithDecisionIcon: config.stickWithDecisionIcon,
  };
}

export { COMPARISON_CATEGORY_KEYS, COMPARISON_CATEGORY_LABELS };
