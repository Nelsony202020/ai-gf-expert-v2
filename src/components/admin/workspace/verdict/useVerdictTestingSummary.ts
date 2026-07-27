import { useEffect, useMemo, useState } from 'react';
import { api } from '../../api';
import type { EntityRow } from '../../api';
import type { ScoreTreePreview } from './types';

function pickCurrentRun(runs: EntityRow[]): EntityRow | null {
  const active = runs
    .filter((r) => ['in_progress', 'ready_for_review', 'approved', 'not_started'].includes(r.status))
    .sort((a, b) => (b.startedAt ?? b.createdAt ?? 0) - (a.startedAt ?? a.createdAt ?? 0));
  if (active.length > 0) return active[0];
  return runs.find((r) => r.isCurrentPublished) ?? null;
}

export function countRemainingRequired(tree: ScoreTreePreview): number {
  let count = 0;
  for (const cat of tree.categories) {
    count += countCategoryRemainingRequired(tree, cat.slug);
  }
  return count;
}

export function countCategoryRemainingRequired(tree: ScoreTreePreview, categorySlug: string): number {
  const cat = tree.categories.find((c) => c.slug === categorySlug);
  if (!cat) return 0;
  let count = 0;
  for (const sub of cat.subscores) {
    for (const e of sub.evidence) {
      if (e.required && e.status === 'missing') count++;
    }
  }
  return count;
}

function topCategoryScores(tree: ScoreTreePreview, limit = 3) {
  return tree.categories
    .filter((c) => c.score != null)
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
    .slice(0, limit)
    .map((c) => ({ name: c.name, score: c.score as number }));
}

export function useVerdictTestingSummary(testRuns: EntityRow[]) {
  const currentRun = useMemo(() => pickCurrentRun(testRuns), [testRuns]);
  const publishedRun = useMemo(() => testRuns.find((r) => r.isCurrentPublished) ?? null, [testRuns]);
  const [tree, setTree] = useState<ScoreTreePreview | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!currentRun) {
      setTree(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(false);
    void api
      .get<{ tree: ScoreTreePreview }>(`/api/admin/test-runs/${currentRun.id}/calculate`)
      .then((res) => {
        if (!cancelled) setTree(res.tree);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [currentRun?.id]);

  const previewScore = tree?.overall ?? null;
  const categoryScores = useMemo(() => {
    const map = new Map<string, number | null>();
    if (!tree) return map;
    for (const c of tree.categories) map.set(c.slug, c.score);
    return map;
  }, [tree]);
  const topCategories = tree ? topCategoryScores(tree) : [];
  const remainingRequired = tree ? countRemainingRequired(tree) : null;
  const isPreview = Boolean(currentRun && !currentRun.isCurrentPublished);

  return {
    currentRun,
    publishedRun,
    previewScore,
    topCategories,
    categoryScores,
    remainingRequired,
    tree,
    loading,
    calcError: error,
    isPreview,
    evidenceCount: tree
      ? tree.categories.reduce(
          (n, c) => n + c.subscores.reduce((m, s) => m + s.evidence.length, 0),
          0,
        )
      : undefined,
  };
}
