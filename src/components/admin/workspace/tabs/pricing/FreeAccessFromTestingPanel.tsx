import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { dataApi, linkedEntityId, type EntityRow } from '../../../api';
import {
  buildPricingFreeAccessFromRows,
  type PricingFreeAccess,
} from '../../../../../lib/pricing-tab/freeAccessShared';
import type { RawValue } from '../../../../../lib/scoring/engine';
import { workspaceTabPath } from '../../completion';
import { useWorkspace } from '../../context';
import { PricingSection } from './PricingSection';

const FREE_SLUGS = new Set([
  'free-chat',
  'free-characters',
  'free-images',
  'free-video',
  'free-voice',
  'free-value',
]);

function trialLabel(value: boolean | null | undefined): string {
  if (value == null) return '—';
  return value ? 'Yes' : 'No';
}

export function FreeAccessFromTestingPanel() {
  const ws = useWorkspace();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<PricingFreeAccess | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const [defsRes, resultsRes] = await Promise.all([
          dataApi.list('evidenceDefinitions'),
          dataApi.list('evidenceResults'),
        ]);
        const defById = new Map<string, EntityRow>();
        for (const d of defsRes.rows) {
          if (FREE_SLUGS.has(String(d.slug ?? ''))) defById.set(d.id, d);
        }
        const published = ws.related.testRuns.find((r) => r.isCurrentPublished);
        const productResults = resultsRes.rows.filter((r: EntityRow) => {
          const productId = linkedEntityId(r.product);
          const defId = linkedEntityId(r.evidenceDefinition);
          if (productId && productId !== ws.productId) return false;
          if (!defId || !defById.has(defId)) return false;
          // Prefer product-scoped rows; also accept rows tied to this product's runs.
          const runId = linkedEntityId(r.testRun);
          if (!productId && runId) {
            return ws.related.testRuns.some((t) => t.id === runId);
          }
          return true;
        });

        const built = buildPricingFreeAccessFromRows(
          productResults.map((r: EntityRow) => {
            const defId = linkedEntityId(r.evidenceDefinition);
            const def = defId ? defById.get(defId) : undefined;
            return {
              rawValue: r.rawValue as RawValue | undefined,
              notApplicable: Boolean(r.notApplicable),
              testRunId: linkedEntityId(r.testRun),
              slug: def ? String(def.slug) : null,
              subscoreSlug: null,
            };
          }),
          { publishedRunId: published?.id ?? null },
        );
        if (!cancelled) setData(built);
      } catch {
        if (!cancelled) setData(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [ws.productId, ws.related.testRuns]);

  const testingHref = `${workspaceTabPath(ws.productId, 'testing')}?category=pricing`;

  return (
    <PricingSection
      title="3. Free access"
      badge="FROM TESTING"
      description="Read-only preview of Free access answers from Testing. Edit them in the Pricing → Free access session."
      actions={
        <Link
          to={testingHref}
          className="text-xs font-medium text-pink-600 hover:text-pink-700 dark:text-pink-400"
        >
          Edit in Testing → Pricing → Free access
        </Link>
      }
    >
      {loading ? (
        <p className="text-sm text-slate-400">Loading free access…</p>
      ) : !data ? (
        <p className="text-sm text-slate-400">
          No free-access testing answers yet. Complete the Free access session in Testing.
        </p>
      ) : (
        <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {(
            [
              ['Chat', data.chat?.label ?? '—'],
              ['Images', data.images?.label ?? '—'],
              ['Video', data.video?.label ?? '—'],
              ['Voice', data.voice?.label ?? '—'],
              ['Characters', data.characters?.label ?? '—'],
              ['Trial without card', trialLabel(data.trialWithoutCreditCard)],
            ] as const
          ).map(([label, value]) => (
            <div key={label} className="rounded-lg border border-slate-100 px-3 py-2 dark:border-slate-800">
              <dt className="text-[11px] font-medium uppercase tracking-wide text-slate-400">{label}</dt>
              <dd className="mt-0.5 text-sm text-slate-800 dark:text-slate-100">{value}</dd>
            </div>
          ))}
        </dl>
      )}
    </PricingSection>
  );
}
