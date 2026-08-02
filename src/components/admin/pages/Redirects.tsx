// Redirect manager with live loop/chain/destination validation, registry-based
// issue detection, and suggested redirects (never auto-created).

import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, dataApi, type EntityRow } from '../api';
import {
  Button,
  Badge,
  Card,
  Field,
  TextInput,
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
import { invalidateRegistryCache, useUrlRegistry } from './seo/registry';
import type { RegistryIssue } from '../../../lib/seo/urlRegistryTypes';

type TabId = 'active' | 'suggested';

export function RedirectsPage() {
  const [rows, setRows] = useState<EntityRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<EntityRow | null | 'new'>(null);
  const [prefill, setPrefill] = useState<{ sourcePath?: string; destinationPath?: string } | null>(null);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<TabId>('active');
  const { registry, reload: reloadRegistry } = useUrlRegistry();

  function reload() {
    dataApi
      .list('redirects')
      .then((r) => setRows(r.rows.sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0))))
      .catch((e) => setError(e.message));
  }
  useEffect(reload, []);

  // Issues per redirect record, detected by the URL registry.
  const issuesById = useMemo(() => {
    const map = new Map<string, RegistryIssue[]>();
    if (!registry) return map;
    for (const url of registry.urls) {
      if (url.entity === 'redirects' && url.recordId && url.issues.length > 0) {
        map.set(url.recordId, url.issues);
      }
    }
    return map;
  }, [registry]);

  const suggestions = registry?.suggestedRedirects ?? [];

  async function remove(row: EntityRow) {
    if (!confirm(`Delete redirect ${row.sourcePath} → ${row.destinationPath}?`)) return;
    await dataApi.remove('redirects', row.id).catch((e) => setError(e.message));
    afterChange();
  }

  function afterChange() {
    reload();
    invalidateRegistryCache();
    void reloadRegistry(true);
  }

  const filtered = rows?.filter(
    (r) => !search || `${r.sourcePath} ${r.destinationPath}`.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold">Redirects</h2>
          <p className="text-sm text-slate-500">
            Redirect rules you manage here (slug changes auto-create 301s). Loops and chains are
            validated before saving. Redirects built into the code (legacy URL cleanups) are listed
            under{' '}
            <Link to="/seo/pages?view=redirects" className="text-pink-600 hover:underline">
              Pages → Missing &amp; redirects
            </Link>
            .
          </p>
        </div>
        <div className="flex gap-2">
          <TextInput placeholder="Search…" value={search} onChange={(e) => setSearch(e.target.value)} className="w-56" />
          <Button onClick={() => { setPrefill(null); setEditing('new'); }}>
            <Icon name="add" /> Add redirect
          </Button>
        </div>
      </div>

      {error && <ErrorNote message={error} />}

      <div className="flex gap-1 border-b border-slate-200 dark:border-slate-800">
        {(
          [
            { id: 'active' as TabId, label: `Active redirects${rows ? ` (${rows.length})` : ''}` },
            { id: 'suggested' as TabId, label: `Suggested (${suggestions.length})` },
          ]
        ).map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`-mb-px border-b-2 px-3 py-2 text-sm font-medium transition-colors ${
              tab === t.id
                ? 'border-pink-600 text-pink-700 dark:text-pink-300'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'active' ? (
        <Card>
          {!filtered ? (
            <Spinner />
          ) : filtered.length === 0 ? (
            <EmptyState message="No redirects." />
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs uppercase text-slate-400">
                  <th className="px-2 py-2">Source</th>
                  <th className="px-2 py-2">Destination</th>
                  <th className="px-2 py-2">Type</th>
                  <th className="px-2 py-2">Active</th>
                  <th className="px-2 py-2">Hits</th>
                  <th className="px-2 py-2">Created</th>
                  <th className="px-2 py-2">Issues</th>
                  <th className="px-2 py-2" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => {
                  const issues = issuesById.get(r.id) ?? [];
                  return (
                    <tr key={r.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="px-2 py-2 font-mono text-xs">{r.sourcePath}</td>
                      <td className="px-2 py-2 font-mono text-xs">{r.destinationPath}</td>
                      <td className="px-2 py-2">
                        <Badge tone={r.redirectType === 301 ? 'blue' : 'amber'}>{r.redirectType}</Badge>
                      </td>
                      <td className="px-2 py-2">
                        {r.active ? <Icon name="check" className="text-green-600" /> : <Icon name="close" className="text-slate-300" />}
                      </td>
                      <td className="px-2 py-2">{r.hitCount ?? 0}</td>
                      <td className="px-2 py-2">{fmtDate(r.createdAt)}</td>
                      <td className="px-2 py-2">
                        {issues.length === 0 ? (
                          <span className="text-slate-300">—</span>
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            {issues.map((i) => (
                              <Badge key={i.code} tone={i.severity === 'error' ? 'red' : 'amber'}>
                                {i.label}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="px-2 py-2 text-right whitespace-nowrap">
                        <button className="mr-2 text-slate-400 hover:text-pink-600" onClick={() => { setPrefill(null); setEditing(r); }}>
                          <Icon name="edit" />
                        </button>
                        <button className="text-slate-400 hover:text-red-600" onClick={() => remove(r)}>
                          <Icon name="delete" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </Card>
      ) : (
        <Card>
          <p className="mb-3 text-sm text-slate-500">
            URLs that probably need a redirect (e.g. deleted records whose old URLs now 404).
            Nothing is created automatically — review each suggestion first.
          </p>
          {suggestions.length === 0 ? (
            <EmptyState message="No suggested redirects — every known gap is covered." />
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs uppercase text-slate-400">
                  <th className="px-2 py-2">Source</th>
                  <th className="px-2 py-2">Suggested destination</th>
                  <th className="px-2 py-2">Reason</th>
                  <th className="px-2 py-2" />
                </tr>
              </thead>
              <tbody>
                {suggestions.map((s) => (
                  <tr key={s.sourcePath} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-2 py-2 font-mono text-xs">{s.sourcePath}</td>
                    <td className="px-2 py-2 font-mono text-xs">{s.suggestedDestination ?? '—'}</td>
                    <td className="px-2 py-2 text-xs text-slate-500">{s.reason}</td>
                    <td className="px-2 py-2 text-right">
                      <Button
                        variant="secondary"
                        onClick={() => {
                          setPrefill({ sourcePath: s.sourcePath, destinationPath: s.suggestedDestination });
                          setEditing('new');
                        }}
                      >
                        Create redirect
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      )}

      {editing !== null && (
        <RedirectModal
          redirect={editing === 'new' ? null : editing}
          initial={editing === 'new' ? (prefill ?? undefined) : undefined}
          onClose={() => setEditing(null)}
          onDone={() => {
            setEditing(null);
            afterChange();
          }}
        />
      )}
    </div>
  );
}

export function RedirectModal({
  redirect,
  initial,
  onClose,
  onDone,
}: {
  redirect: EntityRow | null;
  /** Prefill for new redirects (e.g. "Create redirect" from the Pages drawer). */
  initial?: { sourcePath?: string; destinationPath?: string };
  onClose: () => void;
  onDone: () => void;
}) {
  const [sourcePath, setSourcePath] = useState(redirect?.sourcePath ?? initial?.sourcePath ?? '');
  const [destinationPath, setDestinationPath] = useState(
    redirect?.destinationPath ?? initial?.destinationPath ?? '',
  );
  const [redirectType, setRedirectType] = useState(String(redirect?.redirectType ?? 301));
  const [active, setActive] = useState(redirect ? Boolean(redirect.active) : true);
  const [notes, setNotes] = useState(redirect?.notes ?? '');
  const [validation, setValidation] = useState<{ errors: string[]; warnings: string[] } | null>(null);
  const { busy, error, run } = useAsync();

  async function validate(): Promise<{ errors: string[]; warnings: string[] } | undefined> {
    return run(() =>
      api.post<{ errors: string[]; warnings: string[] }>('/api/admin/redirects/validate', {
        sourcePath,
        destinationPath,
        excludeId: redirect?.id,
      }),
    );
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const result = await validate();
    if (!result) return;
    setValidation(result);
    if (result.errors.length > 0) return;

    const fields = {
      sourcePath,
      destinationPath,
      redirectType: Number(redirectType),
      active,
      notes: notes || undefined,
    };
    const done = await run(async () => {
      if (redirect) await dataApi.update('redirects', redirect.id, fields);
      else await dataApi.create('redirects', fields);
      return true;
    });
    if (done) onDone();
  }

  return (
    <Modal title={redirect ? 'Edit redirect' : 'New redirect'} onClose={onClose}>
      <form onSubmit={save} className="space-y-3">
        {error && <ErrorNote message={error} />}
        {validation && validation.errors.length > 0 && (
          <div className="space-y-1">
            {validation.errors.map((e, i) => (
              <ErrorNote key={i} message={e} />
            ))}
          </div>
        )}
        {validation && validation.warnings.length > 0 && (
          <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            {validation.warnings.map((w, i) => (
              <div key={i}>{w}</div>
            ))}
          </div>
        )}
        <Field label="Source path" required help="e.g. /reviews/old-name">
          <TextInput value={sourcePath} onChange={(e) => setSourcePath(e.target.value)} required />
        </Field>
        <Field label="Destination" required help="Internal path (/reviews/new-name) or full URL">
          <TextInput value={destinationPath} onChange={(e) => setDestinationPath(e.target.value)} required />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Type">
            <Select value={redirectType} onChange={(e) => setRedirectType(e.target.value)}>
              <option value="301">301 (permanent)</option>
              <option value="302">302 (temporary)</option>
            </Select>
          </Field>
          <div className="flex items-end pb-1">
            <Toggle checked={active} onChange={setActive} label="Active" />
          </div>
        </div>
        <Field label="Notes">
          <TextInput value={notes} onChange={(e) => setNotes(e.target.value)} />
        </Field>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={busy}>
            {busy ? 'Validating…' : 'Validate & save'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
