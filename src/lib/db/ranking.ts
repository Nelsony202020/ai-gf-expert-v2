// Roundup ranking: compute calculated positions from each roundup's ranking
// formula over published score snapshots. Editorial overrides are separate
// (publishedPosition) and always audited.

import { getDb } from './server';
import { HttpError, type AdminIdentity } from './auth';
import { auditTx } from './audit';

export interface RankingMetric {
  kind: 'overall' | 'category' | 'subscore' | 'evidence';
  key: string;
  weight: number;
}

export interface RankedEntry {
  entryId: string;
  productId: string;
  productName: string;
  formulaScore: number | null;
  calculatedPosition: number | null;
  publishedPosition: number | null;
  included: boolean;
  editorialOverride: boolean;
  metricValues: Record<string, number | null>;
}

/** Get a product's published metric value for a ranking metric. */
function metricValue(
  metric: RankingMetric,
  snapshots: any[],
  evidenceResults: any[],
): number | null {
  if (metric.kind === 'overall') {
    return snapshots.find((s) => s.kind === 'overall')?.score ?? null;
  }
  if (metric.kind === 'category') {
    return snapshots.find((s) => s.kind === 'category' && s.refSlug === metric.key)?.score ?? null;
  }
  if (metric.kind === 'subscore') {
    return snapshots.find((s) => s.kind === 'subscore' && s.refSlug === metric.key)?.score ?? null;
  }
  // evidence: normalized score from the current published run
  const result = evidenceResults.find((r) => r.evidenceDefinition?.slug === metric.key);
  return result?.normalizedScore ?? null;
}

export async function computeRoundupRanking(roundupId: string): Promise<{
  entries: RankedEntry[];
  formula: RankingMetric[];
}> {
  const db = getDb();
  const { roundups } = await db.query({
    roundups: {
      $: { where: { id: roundupId } },
      entries: { product: {} },
    },
  });
  const roundup = roundups[0];
  if (!roundup) throw new HttpError(404, 'Roundup not found');

  const formula: RankingMetric[] = roundup.rankingFormula?.metrics ?? [
    { kind: 'overall', key: 'overall', weight: 1 },
  ];
  const totalWeight = formula.reduce((sum, m) => sum + m.weight, 0) || 1;

  // Load published snapshots + current-run evidence per product
  const { scoreSnapshots } = await db.query({
    scoreSnapshots: { $: {}, product: {}, testRun: {} },
  });
  const { evidenceResults } = await db.query({
    evidenceResults: { $: {}, product: {}, testRun: {}, evidenceDefinition: {} },
  });

  const entries: RankedEntry[] = (roundup.entries ?? []).map((entry: any) => {
    const productId = entry.product?.id;
    const productSnapshots = scoreSnapshots.filter(
      (s: any) => s.product?.id === productId && s.testRun?.isCurrentPublished,
    );
    const productEvidence = evidenceResults.filter(
      (r: any) => r.product?.id === productId && r.testRun?.isCurrentPublished,
    );

    const metricValues: Record<string, number | null> = {};
    let acc = 0;
    let scorable = true;
    for (const metric of formula) {
      const value = metricValue(metric, productSnapshots, productEvidence);
      metricValues[`${metric.kind}:${metric.key}`] = value;
      if (value === null) scorable = false;
      else acc += (value * metric.weight) / totalWeight;
    }

    return {
      entryId: entry.id,
      productId,
      productName: entry.product?.name ?? '(missing product)',
      formulaScore: scorable ? Math.round(acc * 100) / 100 : null,
      calculatedPosition: null,
      publishedPosition: entry.publishedPosition ?? null,
      included: Boolean(entry.included),
      editorialOverride: Boolean(entry.editorialOverride),
      metricValues,
    };
  });

  // Rank included, scorable entries
  const ranked = entries
    .filter((e) => e.included && e.formulaScore !== null)
    .sort((a, b) => b.formulaScore! - a.formulaScore!);
  ranked.forEach((entry, index) => {
    entry.calculatedPosition = index + 1;
  });

  return { entries, formula };
}

/** Persist calculated positions; published positions stay editorial. */
export async function applyCalculatedRanking(roundupId: string, identity: AdminIdentity) {
  const { entries } = await computeRoundupRanking(roundupId);
  const db = getDb();
  const chunks: any[] = [];
  for (const entry of entries) {
    chunks.push(
      db.tx.roundupEntries[entry.entryId].update({
        calculatedPosition: entry.calculatedPosition,
        updatedAt: Date.now(),
      }),
    );
  }
  chunks.push(
    auditTx({
      actorEmail: identity.email,
      action: 'recalculate',
      recordType: 'roundups',
      recordId: roundupId,
      newValue: {
        positions: Object.fromEntries(
          entries.map((e) => [e.productName, e.calculatedPosition]),
        ),
      },
    }),
  );
  await db.transact(chunks);
  return entries;
}
