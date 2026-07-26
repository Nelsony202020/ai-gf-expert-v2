// Roundups: ranking formulas, calculated vs published positions, and
// audited editorial overrides.

import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api, dataApi, type EntityRow } from '../api';
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

export function RoundupsPage() {
  const [rows, setRows] = useState<EntityRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    dataApi
      .list('roundups')
      .then((r) => setRows(r.rows))
      .catch((e) => setError(e.message));
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold">Roundups</h2>
          <p className="text-sm text-slate-500">
            Ranked "best of" pages at /best/[slug], driven by per-roundup ranking formulas.
          </p>
        </div>
        <Button onClick={() => setCreating(true)}>
          <Icon name="add" /> New roundup
        </Button>
      </div>
      {error && <ErrorNote message={error} />}
      <Card>
        {!rows ? (
          <Spinner />
        ) : rows.length === 0 ? (
          <EmptyState message="No roundups yet." />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs uppercase text-slate-400">
                <th className="px-2 py-2">Title</th>
                <th className="px-2 py-2">Slug</th>
                <th className="px-2 py-2">Status</th>
                <th className="px-2 py-2">Updated</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-2 py-2">
                    <Link to={`/content/roundups/${r.id}`} className="font-medium hover:text-pink-600">
                      {r.title}
                    </Link>
                  </td>
                  <td className="px-2 py-2 font-mono text-xs">/best/{r.slug}</td>
                  <td className="px-2 py-2">
                    <Badge tone={statusTone(String(r.status))}>{r.status}</Badge>
                  </td>
                  <td className="px-2 py-2">{fmtDate(r.updatedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      {creating && (
        <Modal title="New roundup" onClose={() => setCreating(false)}>
          <NewRoundupForm
            onDone={(newId) => {
              setCreating(false);
              navigate(`/content/roundups/${newId}`);
            }}
            onCancel={() => setCreating(false)}
          />
        </Modal>
      )}
    </div>
  );
}

function NewRoundupForm({ onDone, onCancel }: { onDone: (id: string) => void; onCancel: () => void }) {
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const { busy, error, run } = useAsync();

  async function create(e: React.FormEvent) {
    e.preventDefault();
    const result = await run(() =>
      dataApi.create('roundups', {
        title,
        slug,
        status: 'draft',
        rankingFormula: { metrics: [{ kind: 'overall', key: 'overall', weight: 1 }] },
      }),
    );
    if (result) onDone(result.id);
  }

  return (
    <form onSubmit={create} className="space-y-3">
      {error && <ErrorNote message={error} />}
      <Field label="Title" required>
        <TextInput value={title} onChange={(e) => setTitle(e.target.value)} required />
      </Field>
      <Field label="Slug" required help="Public URL: /best/[slug]">
        <TextInput value={slug} onChange={(e) => setSlug(e.target.value)} required />
      </Field>
      <div className="flex justify-end gap-2">
        <Button variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={busy}>
          Create
        </Button>
      </div>
    </form>
  );
}

interface RankedEntryDto {
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

export function RoundupEditor() {
  const { id } = useParams();
  const [roundup, setRoundup] = useState<EntityRow | null>(null);
  const [entries, setEntries] = useState<EntityRow[]>([]);
  const [products, setProducts] = useState<EntityRow[]>([]);
  const [ranking, setRanking] = useState<RankedEntryDto[] | null>(null);
  const [fields, setFields] = useState<Record<string, any>>({});
  const [formulaJson, setFormulaJson] = useState('');
  const [addProductId, setAddProductId] = useState('');
  const { busy, error, setError, run } = useAsync();

  async function reload() {
    const [r, allEntries, prods] = await Promise.all([
      dataApi.get('roundups', id!),
      dataApi.list('roundupEntries'),
      dataApi.list('products'),
    ]);
    setRoundup(r.row);
    setFields({ ...r.row });
    setFormulaJson(JSON.stringify(r.row.rankingFormula ?? { metrics: [] }, null, 2));
    setEntries(allEntries.rows.filter((e) => e.roundup?.id === id));
    setProducts(prods.rows);
  }
  useEffect(() => {
    reload().catch((e) => setError(e.message));
  }, [id]);

  async function save() {
    let rankingFormula;
    try {
      rankingFormula = JSON.parse(formulaJson);
    } catch {
      setError('Ranking formula is not valid JSON');
      return;
    }
    await run(async () => {
      await dataApi.update('roundups', id!, {
        title: fields.title,
        slug: fields.slug,
        h1: fields.h1 || undefined,
        intro: fields.intro || undefined,
        status: fields.status,
        methodologyNote: fields.methodologyNote || undefined,
        seoTitle: fields.seoTitle || undefined,
        seoDescription: fields.seoDescription || undefined,
        rankingFormula,
        faqs: fields.faqs,
      });
      return true;
    });
    reload();
  }

  async function addEntry() {
    if (!addProductId) return;
    await run(() =>
      dataApi.create(
        'roundupEntries',
        { included: true },
        { roundup: id!, product: addProductId },
      ),
    );
    setAddProductId('');
    reload();
  }

  async function computeRanking() {
    const res = await run(() => api.get<{ entries: RankedEntryDto[] }>(`/api/admin/roundups/${id}/rank`));
    if (res) setRanking(res.entries);
  }

  async function applyRanking() {
    const res = await run(() => api.post<{ entries: RankedEntryDto[] }>(`/api/admin/roundups/${id}/rank`));
    if (res) {
      setRanking(res.entries);
      reload();
    }
  }

  async function updateEntry(entry: EntityRow, patch: Record<string, unknown>) {
    // Editorial overrides require a reason (server also validates via audit).
    if (patch.publishedPosition !== undefined && patch.publishedPosition !== entry.calculatedPosition) {
      const reason = prompt(
        'Published position differs from calculated position (editorial override). Reason (required, audited):',
        entry.overrideReason ?? '',
      );
      if (!reason) return;
      patch.editorialOverride = true;
      patch.overrideReason = reason;
    }
    await run(async () => {
      await dataApi.update('roundupEntries', entry.id, patch);
      return true;
    });
    reload();
  }

  async function removeEntry(entry: EntityRow) {
    if (!confirm(`Remove ${entry.product?.name} from this roundup?`)) return;
    await run(async () => {
      await dataApi.remove('roundupEntries', entry.id);
      return true;
    });
    reload();
  }

  if (!roundup) return <Spinner />;

  const entryProductIds = new Set(entries.map((e) => e.product?.id));
  const sortedEntries = [...entries].sort(
    (a, b) => (a.publishedPosition ?? a.calculatedPosition ?? 999) - (b.publishedPosition ?? b.calculatedPosition ?? 999),
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link to="/content/roundups" className="text-slate-400 hover:text-slate-600">
            <Icon name="arrow_back" />
          </Link>
          <h2 className="text-lg font-bold">{roundup.title}</h2>
          <Badge tone={statusTone(String(fields.status))}>{fields.status}</Badge>
        </div>
        <Button onClick={save} disabled={busy}>
          {busy ? 'Saving…' : 'Save'}
        </Button>
      </div>

      {error && <ErrorNote message={error} />}

      <Card title="Details">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Title" required>
            <TextInput value={fields.title ?? ''} onChange={(e) => setFields({ ...fields, title: e.target.value })} />
          </Field>
          <Field label="Slug" required>
            <TextInput value={fields.slug ?? ''} onChange={(e) => setFields({ ...fields, slug: e.target.value })} />
          </Field>
          <Field label="H1">
            <TextInput value={fields.h1 ?? ''} onChange={(e) => setFields({ ...fields, h1: e.target.value })} />
          </Field>
          <Field label="Status">
            <Select value={fields.status ?? 'draft'} onChange={(e) => setFields({ ...fields, status: e.target.value })}>
              {['draft', 'in_review', 'scheduled', 'published', 'archived'].map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
          </Field>
          <div className="col-span-2">
            <Field label="Introduction">
              <TextArea value={fields.intro ?? ''} onChange={(e) => setFields({ ...fields, intro: e.target.value })} />
            </Field>
          </div>
          <Field label="SEO title">
            <TextInput value={fields.seoTitle ?? ''} onChange={(e) => setFields({ ...fields, seoTitle: e.target.value })} />
          </Field>
          <Field label="Meta description">
            <TextInput value={fields.seoDescription ?? ''} onChange={(e) => setFields({ ...fields, seoDescription: e.target.value })} />
          </Field>
          <div className="col-span-2">
            <Field label="Methodology note">
              <TextArea rows={2} value={fields.methodologyNote ?? ''} onChange={(e) => setFields({ ...fields, methodologyNote: e.target.value })} />
            </Field>
          </div>
        </div>
      </Card>

      <Card
        title="Ranking formula"
        actions={
          <div className="flex gap-2">
            <Button variant="secondary" onClick={computeRanking} disabled={busy}>
              <Icon name="calculate" /> Preview ranking
            </Button>
            <Button variant="secondary" onClick={applyRanking} disabled={busy}>
              Apply calculated positions
            </Button>
          </div>
        }
      >
        <Field
          label="Metrics (JSON)"
          help='kinds: overall | category | subscore | evidence. e.g. {"metrics":[{"kind":"category","key":"images","weight":3},{"kind":"evidence","key":"prompt-accuracy","weight":2},{"kind":"overall","key":"overall","weight":1}]}'
        >
          <TextArea
            rows={6}
            className="font-mono text-xs"
            value={formulaJson}
            onChange={(e) => setFormulaJson(e.target.value)}
          />
        </Field>
      </Card>

      <Card
        title="Ranked entries"
        actions={
          <div className="flex items-center gap-2">
            <Select value={addProductId} onChange={(e) => setAddProductId(e.target.value)} className="w-52">
              <option value="">Add product…</option>
              {products
                .filter((p) => !entryProductIds.has(p.id))
                .map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
            </Select>
            <Button variant="secondary" onClick={addEntry} disabled={!addProductId || busy}>
              Add
            </Button>
          </div>
        }
      >
        {sortedEntries.length === 0 ? (
          <EmptyState message="No products in this roundup yet." />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs uppercase text-slate-400">
                <th className="px-2 py-2">Product</th>
                <th className="px-2 py-2">Calculated</th>
                <th className="px-2 py-2">Published</th>
                <th className="px-2 py-2">Award label</th>
                <th className="px-2 py-2">Included</th>
                <th className="px-2 py-2">Override</th>
                <th className="px-2 py-2" />
              </tr>
            </thead>
            <tbody>
              {sortedEntries.map((entry) => {
                const rank = ranking?.find((r) => r.entryId === entry.id);
                return (
                  <tr key={entry.id} className="border-b border-slate-100">
                    <td className="px-2 py-2 font-medium">{entry.product?.name ?? '—'}</td>
                    <td className="px-2 py-2">
                      #{entry.calculatedPosition ?? rank?.calculatedPosition ?? '—'}
                      {rank?.formulaScore != null && (
                        <span className="ml-1 text-xs text-slate-400">({rank.formulaScore})</span>
                      )}
                    </td>
                    <td className="px-2 py-2">
                      <TextInput
                        type="number"
                        className="w-16"
                        value={entry.publishedPosition ?? ''}
                        onChange={(e) =>
                          updateEntry(entry, {
                            publishedPosition: e.target.value === '' ? undefined : Number(e.target.value),
                          })
                        }
                      />
                    </td>
                    <td className="px-2 py-2">
                      <TextInput
                        className="w-40"
                        value={entry.awardLabel ?? ''}
                        placeholder="e.g. Best for Voice"
                        onBlur={(e) => {
                          if (e.target.value !== (entry.awardLabel ?? ''))
                            updateEntry(entry, { awardLabel: e.target.value || undefined });
                        }}
                        onChange={(e) =>
                          setEntries((prev) =>
                            prev.map((x) => (x.id === entry.id ? { ...x, awardLabel: e.target.value } : x)),
                          )
                        }
                      />
                    </td>
                    <td className="px-2 py-2">
                      <Toggle
                        checked={entry.included}
                        onChange={(v) => updateEntry(entry, { included: v })}
                      />
                    </td>
                    <td className="px-2 py-2">
                      {entry.editorialOverride ? (
                        <Badge tone="amber">override</Badge>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>
                    <td className="px-2 py-2 text-right">
                      <button className="text-slate-400 hover:text-red-600" onClick={() => removeEntry(entry)}>
                        <Icon name="delete" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
        <p className="mt-2 text-xs text-slate-400">
          Calculated positions come from the ranking formula over published scores. Published
          positions may differ only with an audited override reason.
        </p>
      </Card>
    </div>
  );
}
