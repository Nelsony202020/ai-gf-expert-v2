import type { Product } from '../../data/products';
import { COMPARISON_CATEGORY_LABELS, COMPARISON_CATEGORY_KEYS } from '../../data/product-alternatives-config';
import type { AlternativePeerView } from './loadAlternatives';

const DIFF_THRESHOLD = 0.3;

export interface CategoryDelta {
  label: string;
  delta: number;
}

export interface PeerDifferenceGroup {
  peerName: string;
  diffs: CategoryDelta[];
}

export interface BiggestDifferencesModel {
  peerGroups: PeerDifferenceGroup[];
  sourceWins: CategoryDelta[];
}

function categoryDeltasPeerWins(
  sourceScores: Record<string, number | null>,
  peerScores: Record<string, number | null>,
): CategoryDelta[] {
  const diffs: CategoryDelta[] = [];
  for (const key of COMPARISON_CATEGORY_KEYS) {
    const src = sourceScores[key];
    const peer = peerScores[key];
    if (src == null || peer == null) continue;
    const delta = peer - src;
    if (delta >= DIFF_THRESHOLD) {
      diffs.push({ label: COMPARISON_CATEGORY_LABELS[key], delta });
    }
  }
  return diffs.sort((a, b) => b.delta - a.delta).slice(0, 4);
}

function sourceWinDeltas(
  sourceScores: Record<string, number | null>,
  peers: AlternativePeerView[],
): CategoryDelta[] {
  const diffs: CategoryDelta[] = [];
  for (const key of COMPARISON_CATEGORY_KEYS) {
    const src = sourceScores[key];
    if (src == null) continue;
    let maxPeer = -Infinity;
    for (const peer of peers) {
      const ps = peer.categoryScores[key];
      if (ps != null && ps > maxPeer) maxPeer = ps;
    }
    if (maxPeer === -Infinity) continue;
    const delta = src - maxPeer;
    if (delta >= DIFF_THRESHOLD) {
      diffs.push({ label: COMPARISON_CATEGORY_LABELS[key], delta });
    }
  }
  return diffs.sort((a, b) => b.delta - a.delta).slice(0, 4);
}

export function buildBiggestDifferences(
  source: Product,
  sourceScores: Record<string, number | null>,
  tablePeers: AlternativePeerView[],
): BiggestDifferencesModel {
  const peerGroups: PeerDifferenceGroup[] = tablePeers
    .map((peer) => ({
      peerName: peer.product.name,
      diffs: categoryDeltasPeerWins(sourceScores, peer.categoryScores),
    }))
    .filter((g) => g.diffs.length > 0);

  return {
    peerGroups,
    sourceWins: sourceWinDeltas(sourceScores, tablePeers),
  };
}

export interface CompactPeerBullets {
  wins: string[];
  losses: string[];
}

export function compactPeerBullets(peer: AlternativePeerView): CompactPeerBullets {
  return {
    wins: peer.winsOverSource.map((w) => w.label).slice(0, 3),
    losses: peer.sourceWinsOver.map((w) => w.label).slice(0, 2),
  };
}
