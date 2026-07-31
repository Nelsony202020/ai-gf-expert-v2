import { useEffect, useState } from 'react';
import { api, dataApi, type EntityRow } from '../../api';

export interface CategoryEvidenceEntry {
  id: string;
  slug: string;
  name: string;
  publicResult: string | null;
  publicExplanation: string | null;
  normalizedScore: number | null;
  required: boolean;
  complete: boolean;
}

function resultComplete(row: EntityRow | undefined): boolean {
  if (!row) return false;
  if (row.notApplicable || row.unableToVerify) return true;
  return Boolean(String(row.publicResult ?? '').trim());
}

export function useCategoryEvidence(
  testRunId: string | undefined,
  categoryId: string | undefined,
  enabled: boolean,
) {
  const [loading, setLoading] = useState(false);
  const [entries, setEntries] = useState<CategoryEvidenceEntry[]>([]);

  useEffect(() => {
    if (!enabled || !testRunId || !categoryId) {
      setEntries([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    void (async () => {
      try {
        const [structure, results] = await Promise.all([
          api.get<{
            subscores: EntityRow[];
            definitions: EntityRow[];
          }>(`/api/admin/test-runs/${testRunId}/structure`),
          dataApi.list('evidenceResults'),
        ]);
        if (cancelled) return;
        const subIds = new Set(
          structure.subscores.filter((s) => s.active && s.category?.id === categoryId).map((s) => s.id),
        );
        const categoryDefs = structure.definitions.filter((d) => d.active && subIds.has(d.subscore?.id));
        const resultByDef = new Map<string, EntityRow>();
        for (const r of results.rows) {
          if (r.testRun?.id === testRunId && r.evidenceDefinition?.id) {
            resultByDef.set(r.evidenceDefinition.id, r);
          }
        }
        setEntries(
          categoryDefs.map((def) => {
            const r = resultByDef.get(def.id);
            return {
              id: def.id,
              slug: String(def.slug),
              name: String(def.name ?? def.slug),
              publicResult: r?.publicResult ? String(r.publicResult) : null,
              publicExplanation: r?.publicExplanation ? String(r.publicExplanation) : null,
              normalizedScore: r?.normalizedScore != null ? Number(r.normalizedScore) : null,
              required: Boolean(def.required),
              complete: resultComplete(r),
            };
          }),
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [testRunId, categoryId, enabled]);

  return { loading, entries };
}
