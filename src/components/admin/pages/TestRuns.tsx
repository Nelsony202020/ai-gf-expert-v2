// Test runs: versioned testing with evidence entry, automatic score
// calculation preview, blocking publish validation, and score history.

import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api, dataApi, type EntityRow } from '../api';
import { useCan } from '../context';
import {
  Button,
  Badge,
  statusTone,
  Card,
  Field,
  TextInput,
  TextArea,
  Select,
  Toggle,
  Spinner,
  ErrorNote,
  EmptyState,
  Modal,
  useAsync,
  fmtDate,
  Icon,
} from '../ui';
import { EvidenceResultForm } from '../testing/EvidenceResultForm';
import { testerQuestion } from '../testing/presentation';

export function TestRunsPage() {
  const [rows, setRows] = useState<EntityRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  function reload() {
    dataApi
      .list('testRuns')
      .then((r) => setRows(r.rows.sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0))))
      .catch((e) => setError(e.message));
  }
  useEffect(reload, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold">Test runs</h2>
          <p className="text-sm text-slate-500">
            Versioned test runs preserve historical scores and evidence — never overwrite a
            published run; create a new one.
          </p>
        </div>
        <Button onClick={() => setCreating(true)}>
          <Icon name="add" /> New test run
        </Button>
      </div>

      {error && <ErrorNote message={error} />}

      <Card>
        {!rows ? (
          <Spinner />
        ) : rows.length === 0 ? (
          <EmptyState message="No test runs yet." />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs uppercase text-slate-400">
                <th className="px-2 py-2">Run</th>
                <th className="px-2 py-2">Product</th>
                <th className="px-2 py-2">Methodology</th>
                <th className="px-2 py-2">Status</th>
                <th className="px-2 py-2">Live</th>
                <th className="px-2 py-2">Tester</th>
                <th className="px-2 py-2">Published</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-2 py-2">
                    <Link to={`/testing/runs/${r.id}`} className="font-medium hover:text-pink-600">
                      {r.name}
                    </Link>
                  </td>
                  <td className="px-2 py-2">{r.product?.name ?? '—'}</td>
                  <td className="px-2 py-2">{r.methodologyVersion?.version ?? '—'}</td>
                  <td className="px-2 py-2">
                    <Badge tone={statusTone(String(r.status))}>{r.status}</Badge>
                  </td>
                  <td className="px-2 py-2">
                    {r.isCurrentPublished ? <Badge tone="green">live</Badge> : '—'}
                  </td>
                  <td className="px-2 py-2 text-xs">{r.testerEmail ?? '—'}</td>
                  <td className="px-2 py-2">{fmtDate(r.publishedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      {creating && (
        <NewRunModal
          onClose={() => setCreating(false)}
          onDone={() => {
            setCreating(false);
            reload();
          }}
        />
      )}
    </div>
  );
}

function NewRunModal({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const [products, setProducts] = useState<EntityRow[]>([]);
  const [versions, setVersions] = useState<EntityRow[]>([]);
  const [productId, setProductId] = useState('');
  const [versionId, setVersionId] = useState('');
  const [name, setName] = useState('');
  const { busy, error, run } = useAsync();

  useEffect(() => {
    dataApi.list('products').then((r) => setProducts(r.rows)).catch(() => {});
    dataApi.list('methodologyVersions').then((r) => {
      setVersions(r.rows);
      const active = r.rows.find((v) => v.status === 'active');
      if (active) setVersionId(active.id);
    }).catch(() => {});
  }, []);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    const done = await run(async () => {
      await dataApi.create(
        'testRuns',
        {
          name: name || `Test run ${new Date().toLocaleDateString()}`,
          status: 'in_progress',
          startedAt: Date.now(),
        },
        { product: productId, methodologyVersion: versionId },
      );
      return true;
    });
    if (done) onDone();
  }

  return (
    <Modal title="New test run" onClose={onClose}>
      <form onSubmit={create} className="space-y-3">
        {error && <ErrorNote message={error} />}
        <Field label="Product" required>
          <Select value={productId} onChange={(e) => setProductId(e.target.value)} required>
            <option value="">— select —</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Methodology version" required>
          <Select value={versionId} onChange={(e) => setVersionId(e.target.value)} required>
            <option value="">— select —</option>
            {versions.map((v) => (
              <option key={v.id} value={v.id}>
                {v.version} {v.status === 'active' ? '(active)' : `(${v.status})`}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Run name">
          <TextInput value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Q3 2026 retest" />
        </Field>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={busy || !productId || !versionId}>
            {busy ? 'Creating…' : 'Create run'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Run detail: evidence entry + score preview + publish
// ---------------------------------------------------------------------------

interface ScoreTreeDto {
  overall: number | null;
  categories: {
    slug: string;
    name: string;
    weight: number;
    score: number | null;
    subscores: {
      slug: string;
      name: string;
      weight: number;
      score: number | null;
      evidence: {
        definitionId: string;
        name: string;
        status: string;
        normalizedScore: number | null;
        detail: string;
        required: boolean;
        overridden: boolean;
      }[];
    }[];
  }[];
  blockingErrors: string[];
  warnings: string[];
}

interface ImpactReportDto {
  previousRun: { id: string; name: string } | null;
  overall: { current: number | null; previous: number | null; delta: number | null };
  categories: { slug: string; current: number; previous: number | null; delta: number | null }[];
  affectedRoundups: { title: string; slug: string; publishedPosition: number | null }[];
}

export function TestRunDetail() {
  const { id } = useParams();
  const can = useCan();
  const [run, setRun] = useState<EntityRow | null>(null);
  const [categories, setCategories] = useState<EntityRow[]>([]);
  const [subscores, setSubscores] = useState<EntityRow[]>([]);
  const [definitions, setDefinitions] = useState<EntityRow[]>([]);
  const [results, setResults] = useState<EntityRow[]>([]);
  const [tree, setTree] = useState<ScoreTreeDto | null>(null);
  const [editingDef, setEditingDef] = useState<EntityRow | null>(null);
  const { busy, error, setError, run: exec } = useAsync();
  const [publishResult, setPublishResult] = useState<{ affectedRoundups: string[] } | null>(null);
  const [impact, setImpact] = useState<ImpactReportDto | null>(null);

  async function reload() {
    try {
      const [runRes, cats, subs, defs, allResults] = await Promise.all([
        dataApi.get('testRuns', id!),
        dataApi.list('categories'),
        dataApi.list('subscores'),
        dataApi.list('evidenceDefinitions'),
        dataApi.list('evidenceResults'),
      ]);
      setRun(runRes.row);
      setCategories(cats.rows.sort((a, b) => a.displayOrder - b.displayOrder));
      setSubscores(subs.rows.sort((a, b) => a.displayOrder - b.displayOrder));
      setDefinitions(defs.rows.sort((a, b) => a.displayOrder - b.displayOrder));
      setResults(allResults.rows.filter((r) => r.testRun?.id === id));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }
  useEffect(() => {
    reload();
  }, [id]);

  const resultByDef = useMemo(() => {
    const map = new Map<string, EntityRow>();
    for (const r of results) if (r.evidenceDefinition?.id) map.set(r.evidenceDefinition.id, r);
    return map;
  }, [results]);

  async function calculate() {
    const res = await exec(() => api.get<{ tree: ScoreTreeDto }>(`/api/admin/test-runs/${id}/calculate`));
    if (res) setTree(res.tree);
  }

  async function publish() {
    if (!confirm('Publish this test run? It becomes the live score source and supersedes the previous published run.')) return;
    const res = await exec(() =>
      api.post<{ tree: ScoreTreeDto; affectedRoundups: string[] }>(`/api/admin/test-runs/${id}/publish`),
    );
    if (res) {
      setTree(res.tree);
      setPublishResult({ affectedRoundups: res.affectedRoundups });
      reload();
    }
  }

  async function loadImpact() {
    const res = await exec(() => api.get<ImpactReportDto>(`/api/admin/test-runs/${id}/impact`));
    if (res) setImpact(res);
  }

  async function setStatus(status: string) {
    await exec(async () => {
      await dataApi.update('testRuns', id!, { status });
      return true;
    });
    reload();
  }

  if (!run) return <Spinner />;

  const catTree = categories
    .filter((c) => c.active)
    .map((cat) => ({
      cat,
      subs: subscores
        .filter((s) => s.active && s.category?.id === cat.id)
        .map((sub) => ({
          sub,
          defs: definitions.filter((d) => d.active && d.subscore?.id === sub.id),
        })),
    }));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Link to="/testing/runs" className="text-slate-400 hover:text-slate-600">
              <Icon name="arrow_back" />
            </Link>
            <h2 className="text-lg font-bold">{run.name}</h2>
            <Badge tone={statusTone(String(run.status))}>{run.status}</Badge>
            {run.isCurrentPublished && <Badge tone="green">live</Badge>}
          </div>
          <p className="ml-8 text-xs text-slate-400">
            {run.product?.name} · methodology {run.methodologyVersion?.version} · started{' '}
            {fmtDate(run.startedAt)}
          </p>
        </div>
        <div className="flex gap-2">
          {run.status === 'in_progress' && (
            <Button variant="secondary" onClick={() => setStatus('ready_for_review')} disabled={busy}>
              Mark ready for review
            </Button>
          )}
          {run.status === 'ready_for_review' && can('testing.review') && (
            <Button variant="secondary" onClick={() => setStatus('approved')} disabled={busy}>
              Approve
            </Button>
          )}
          <Button variant="secondary" onClick={calculate} disabled={busy}>
            <Icon name="calculate" /> Preview scores
          </Button>
          {(run.status === 'published' || run.status === 'superseded') && (
            <Button variant="secondary" onClick={loadImpact} disabled={busy}>
              <Icon name="difference" /> Impact report
            </Button>
          )}
          {can('content.publish') && (
            <Button onClick={publish} disabled={busy || run.status === 'published'}>
              <Icon name="publish" /> Publish run
            </Button>
          )}
        </div>
      </div>

      {error && <ErrorNote message={error} />}

      {publishResult && (
        <Card title="Published">
          <p className="text-sm text-green-700">Test run published — it is now the live score source.</p>
          {publishResult.affectedRoundups.length > 0 && (
            <p className="mt-1 text-sm text-amber-700">
              Affected roundups (recalculate rankings): {publishResult.affectedRoundups.join(', ')}
            </p>
          )}
        </Card>
      )}

      {impact && (
        <Card title="Score-change impact">
          {!impact.previousRun ? (
            <p className="text-sm text-slate-500">
              No previous published run to compare against — this is the first published run.
            </p>
          ) : (
            <>
              <p className="mb-2 text-sm text-slate-500">
                Compared to <span className="font-medium">{impact.previousRun.name}</span>
              </p>
              <div className="mb-3 flex items-baseline gap-2">
                <span className="text-2xl font-bold">{impact.overall.current ?? '—'}</span>
                {impact.overall.delta !== null && (
                  <Badge tone={impact.overall.delta > 0 ? 'green' : impact.overall.delta < 0 ? 'red' : 'gray'}>
                    {impact.overall.delta > 0 ? '+' : ''}
                    {impact.overall.delta} overall
                  </Badge>
                )}
              </div>
              <div className="grid grid-cols-4 gap-2 text-sm">
                {impact.categories.map((c) => (
                  <div key={c.slug} className="rounded-md border border-slate-100 p-2">
                    <div className="text-xs text-slate-400">{c.slug}</div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold">{c.current}</span>
                      {c.delta !== null && c.delta !== 0 && (
                        <span className={`text-xs font-semibold ${c.delta > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {c.delta > 0 ? '+' : ''}
                          {c.delta}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
          {impact.affectedRoundups.length > 0 && (
            <p className="mt-3 border-t border-slate-100 pt-2 text-sm text-amber-700">
              Appears in published roundups:{' '}
              {impact.affectedRoundups
                .map((r) => `${r.title}${r.publishedPosition ? ` (#${r.publishedPosition})` : ''}`)
                .join(', ')}{' '}
              — recalculate their rankings.
            </p>
          )}
        </Card>
      )}

      {tree && (
        <Card title="Score preview">
          <div className="mb-3 flex items-baseline gap-3">
            <span className="text-3xl font-bold">{tree.overall ?? '—'}</span>
            <span className="text-sm text-slate-400">overall (weighted)</span>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {tree.categories.map((c) => (
              <div key={c.slug} className="rounded-md border border-slate-100 p-2 text-sm">
                <div className="flex justify-between">
                  <span className="font-medium">{c.name}</span>
                  <span className="font-bold">{c.score ?? '—'}</span>
                </div>
                <div className="mt-1 space-y-0.5 text-xs text-slate-500">
                  {c.subscores.map((s) => (
                    <div key={s.slug} className="flex justify-between">
                      <span>{s.name}</span>
                      <span>{s.score ?? '—'}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          {tree.blockingErrors.length > 0 && (
            <div className="mt-3 space-y-1 border-t border-slate-100 pt-2">
              {tree.blockingErrors.map((e, i) => (
                <div key={i} className="flex items-start gap-2 text-sm text-red-700">
                  <Icon name="error" className="mt-0.5 shrink-0" /> {e}
                </div>
              ))}
            </div>
          )}
          {tree.warnings.length > 0 && (
            <div className="mt-2 space-y-1">
              {tree.warnings.map((w, i) => (
                <div key={i} className="flex items-start gap-2 text-xs text-amber-700">
                  <Icon name="warning" className="mt-0.5 shrink-0 !text-[16px]" /> {w}
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {catTree.map(({ cat, subs }) => (
        <Card key={cat.id} title={`${cat.name} (${cat.weight}%)`}>
          <div className="space-y-4">
            {subs.map(({ sub, defs }) => (
              <div key={sub.id}>
                <h4 className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
                  {sub.name} ({sub.weight}%)
                </h4>
                <table className="w-full text-sm">
                  <tbody>
                    {defs.map((def) => {
                      const result = resultByDef.get(def.id);
                      return (
                        <tr key={def.id} className="border-b border-slate-50">
                          <td className="w-2/5 px-2 py-1.5">
                            <span className="font-medium">{testerQuestion(def)}</span>
                            {def.required && <span className="text-red-400"> *</span>}
                            {def.shortDescription ? (
                              <div className="text-xs text-slate-400">{String(def.shortDescription)}</div>
                            ) : null}
                          </td>
                          <td className="px-2 py-1.5 text-sm">
                            {result ? (
                              <>
                                <span className="font-mono text-xs">
                                  {result.publicResult ?? JSON.stringify(result.rawValue)}
                                </span>
                                {result.normalizedScore !== undefined && result.normalizedScore !== null && (
                                  <Badge tone={result.normalizedScore >= 7.6 ? 'green' : result.normalizedScore >= 5.1 ? 'amber' : 'red'}>
                                    {result.normalizedScore}
                                  </Badge>
                                )}
                                {result.manualOverrideScore !== undefined && result.manualOverrideScore !== null && (
                                  <Badge tone="pink">override</Badge>
                                )}
                              </>
                            ) : (
                              <span className="text-xs text-slate-300">not entered</span>
                            )}
                          </td>
                          <td className="w-24 px-2 py-1.5 text-right">
                            <Button variant="ghost" onClick={() => setEditingDef(def)}>
                              <Icon name="edit" />
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        </Card>
      ))}

      {editingDef && (
        <EvidenceModal
          def={editingDef}
          runId={id!}
          productId={run.product?.id}
          existing={resultByDef.get(editingDef.id) ?? null}
          onClose={() => setEditingDef(null)}
          onDone={() => {
            setEditingDef(null);
            reload();
          }}
        />
      )}
    </div>
  );
}

export function EvidenceModal({
  def,
  runId,
  productId,
  existing,
  onClose,
  onDone,
}: {
  def: EntityRow;
  runId: string;
  productId?: string;
  existing: EntityRow | null;
  onClose: () => void;
  onDone: () => void;
}) {
  return (
    <Modal title={testerQuestion(def)} onClose={onClose} wide>
      <EvidenceResultForm
        def={def}
        runId={runId}
        productId={productId}
        existing={existing}
        onSaved={onDone}
      />
    </Modal>
  );
}
