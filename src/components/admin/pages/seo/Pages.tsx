// SEO Pages: the URL inventory, split into three beginner-friendly views:
// 1. Search pages     — real HTML pages users and Google can see (default)
// 2. Missing & redirects — URLs that send visitors elsewhere
// 3. Technical routes — admin, API, affiliate, preview, and sitemap files

import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api, dataApi } from '../../api';
import {
  Badge,
  Button,
  Card,
  DrawerCloseButton,
  EmptyState,
  ErrorNote,
  Field,
  Icon,
  Select,
  Spinner,
  TextArea,
  TextInput,
  Toggle,
  fmtDate,
  useAsync,
} from '../../ui';
import { RedirectModal } from '../Redirects';
import {
  INDEXING_BADGES,
  PROBLEM_TYPES,
  INDEXING_LABELS,
  PAGE_GROUPS,
  SOURCE_FILTERS,
  SOURCE_LABELS,
  STATUS_LABELS,
  VIEW_LABELS,
  indexingBadgeTone,
  invalidateRegistryCache,
  pageCreationLabel,
  pageGroupLabel,
  pageGroupOf,
  statusBadgeTone,
  submittedByMistake,
  useUrlRegistry,
  type RegistryUrl,
} from './registry';

const PAGE_SIZE = 100;
type View = 'search' | 'redirects' | 'technical';

export function SeoPagesPage() {
  const { registry, error, loading, reload } = useUrlRegistry();
  const [params, setParams] = useSearchParams();
  const [selected, setSelected] = useState<RegistryUrl | null>(null);
  const [redirectFrom, setRedirectFrom] = useState<RegistryUrl | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);

  const rawView = params.get('view');
  const q = params.get('q') ?? '';
  const group = params.get('group') ?? '';
  const managed = params.get('managed') ?? '';
  const status = params.get('status') ?? '';
  const indexing = params.get('indexing') ?? '';
  const submitted = params.get('submitted') ?? '';
  const health = params.get('health') ?? '';
  const problem = params.get('problem') ?? '';
  const issue = params.get('issue') ?? ''; // raw issue-code deep links (Overview / Indexing)

  // Explicit ?view= wins; otherwise, when following an issue deep link,
  // open the view where most affected URLs live so counts match what's shown.
  const view: View = useMemo(() => {
    if (rawView === 'search' || rawView === 'redirects' || rawView === 'technical') return rawView;
    if (issue && issue !== 'none' && registry) {
      const counts: Record<View, number> = { search: 0, redirects: 0, technical: 0 };
      for (const r of registry.urls) {
        const match = issue === 'any' ? r.issues.length > 0 : r.issues.some((i) => i.code === issue);
        if (match) counts[r.view] += 1;
      }
      const best = (Object.entries(counts) as [View, number][]).sort((a, b) => b[1] - a[1])[0];
      if (best && best[1] > 0) return best[0];
    }
    return 'search';
  }, [rawView, issue, registry]);

  function setFilter(key: string, value: string) {
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (value) next.set(key, value);
        else next.delete(key);
        // The problem filter only applies while "Needs attention" is active.
        if (key === 'health' && value !== 'attention') next.delete('problem');
        return next;
      },
      { replace: true },
    );
    setPage(1);
  }

  function switchView(next: View) {
    setParams(
      () => {
        const p = new URLSearchParams();
        if (next !== 'search') p.set('view', next);
        if (q) p.set('q', q);
        return p;
      },
      { replace: true },
    );
    setPage(1);
    setExpandedSections(new Set());
  }

  const viewRows = useMemo(
    () => (registry ? registry.urls.filter((r) => r.view === view) : []),
    [registry, view],
  );

  const groupOptions = useMemo(() => {
    const present = new Set(viewRows.map((r) => pageGroupOf(r)));
    return PAGE_GROUPS.filter((g) => present.has(g.value));
  }, [viewRows]);
  const managedOptions = useMemo(() => {
    const present = new Set(viewRows.map((r) => r.source));
    return SOURCE_FILTERS.filter((s) => s.matches.some((m) => present.has(m as RegistryUrl['source'])));
  }, [viewRows]);
  const statusOptions = useMemo(() => [...new Set(viewRows.map((r) => r.status))], [viewRows]);
  const problemOptions = useMemo(() => {
    const codes = new Set(viewRows.flatMap((r) => r.issues.map((i) => i.code)));
    return PROBLEM_TYPES.filter((p) => p.codes.some((c) => codes.has(c)));
  }, [viewRows]);

  const filtered = useMemo(() => {
    const managedFilter = SOURCE_FILTERS.find((s) => s.value === managed);
    const problemFilter = PROBLEM_TYPES.find((p) => p.value === problem);
    return viewRows.filter((row) => {
      if (q && !`${row.path} ${row.title} ${row.seoTitle ?? ''}`.toLowerCase().includes(q.toLowerCase())) return false;
      if (group && pageGroupOf(row) !== group) return false;
      if (managedFilter && !managedFilter.matches.includes(row.source)) return false;
      if (status && row.status !== status) return false;
      if (indexing && row.indexing !== indexing) return false;
      if (submitted === 'submitted' && !row.inXmlSitemap) return false;
      if (submitted === 'not-submitted' && row.inXmlSitemap) return false;
      if (submitted === 'mistake' && !submittedByMistake(row)) return false;
      if (health === 'attention' && row.issues.length === 0) return false;
      if (health === 'ok' && row.issues.length > 0) return false;
      if (problemFilter && !row.issues.some((i) => problemFilter.codes.includes(i.code))) return false;
      // Raw issue-code deep links from Overview / Indexing
      if (issue === 'any' && row.issues.length === 0) return false;
      if (issue && issue !== 'any' && issue !== 'none' && !row.issues.some((i) => i.code === issue)) return false;
      return true;
    });
  }, [viewRows, q, group, managed, status, indexing, submitted, health, problem, issue]);

  if (error) return <ErrorNote message={error} />;
  if (loading || !registry) return <Spinner />;

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const visible = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const hasFilters = Boolean(q || group || managed || status || indexing || submitted || health || problem || issue);

  const viewCounts: Record<View, number> = {
    search: registry.summary.searchPages,
    redirects: registry.summary.redirects,
    technical: registry.urls.filter((r) => r.view === 'technical').length,
  };

  function toggleSections(path: string) {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold">Pages</h2>
          <p className="text-sm text-slate-500">
            {view === 'search' && 'Real pages users and Google can see. Jump links are shown as sections of their page, not separate URLs.'}
            {view === 'redirects' && 'URLs that send visitors somewhere else. A fresh site should have zero — redirects only matter once old URLs exist.'}
            {view === 'technical' && 'Internal application routes: admin, API, affiliate links, previews, and sitemap files. Not normal SEO pages.'}
          </p>
        </div>
        <Button variant="secondary" onClick={() => reload(true)}>
          <Icon name="refresh" /> Refresh
        </Button>
      </div>

      {/* View tabs */}
      <div className="flex gap-1 border-b border-slate-200 dark:border-slate-800">
        {(['search', 'redirects', 'technical'] as View[]).map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => switchView(v)}
            className={`-mb-px border-b-2 px-3 py-2 text-sm font-medium transition-colors ${
              view === v
                ? 'border-pink-600 text-pink-700 dark:text-pink-300'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            {VIEW_LABELS[v]} ({viewCounts[v]})
          </button>
        ))}
      </div>

      {/* Summary chips (search view only) */}
      {view === 'search' && (
        <div className="flex flex-wrap gap-2 text-sm">
          <SummaryChip label="Search pages" value={registry.summary.searchPages} />
          <SummaryChip label="Visible to Google" value={registry.summary.indexable} tone="green" onClick={() => setFilter('indexing', indexing === 'index' ? '' : 'index')} active={indexing === 'index'} />
          <SummaryChip label="Hidden from Google" value={registry.summary.noindex} tone="amber" onClick={() => setFilter('indexing', indexing === 'noindex' ? '' : 'noindex')} active={indexing === 'noindex'} />
          <SummaryChip
            label="Needs attention"
            value={viewRows.filter((r) => r.issues.length > 0).length}
            tone="red"
            onClick={() => setFilter('health', health === 'attention' ? '' : 'attention')}
            active={health === 'attention'}
          />
        </div>
      )}

      <Card>
        {/* Filters */}
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <div className="w-52">
            <TextInput placeholder="Search URL or title…" value={q} onChange={(e) => setFilter('q', e.target.value)} />
          </div>
          {view === 'search' && (
            <div className="w-52">
              <Select value={group} onChange={(e) => setFilter('group', e.target.value)}>
                <option value="">All pages</option>
                {groupOptions.map((g) => (
                  <option key={g.value} value={g.value}>{g.label}</option>
                ))}
              </Select>
            </div>
          )}
          <div className="w-40">
            <Select value={managed} onChange={(e) => setFilter('managed', e.target.value)}>
              <option value="">All locations</option>
              {managedOptions.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </Select>
          </div>
          {view !== 'technical' && (
            <div className="w-40">
              <Select value={status} onChange={(e) => setFilter('status', e.target.value)}>
                <option value="">All statuses</option>
                {statusOptions.map((s) => (
                  <option key={s} value={s}>{STATUS_LABELS[s] ?? s}</option>
                ))}
              </Select>
            </div>
          )}
          {view === 'search' && (
            <>
              <div className="w-48">
                <Select value={indexing} onChange={(e) => setFilter('indexing', e.target.value)}>
                  <option value="">All visibility</option>
                  {Object.entries(INDEXING_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </Select>
              </div>
              <div className="w-48">
                <Select value={submitted} onChange={(e) => setFilter('submitted', e.target.value)}>
                  <option value="">Any submission status</option>
                  <option value="submitted">Submitted to Google</option>
                  <option value="not-submitted">Not submitted</option>
                  <option value="mistake">Submitted by mistake</option>
                </Select>
              </div>
            </>
          )}
          <div className="w-44">
            <Select value={health} onChange={(e) => setFilter('health', e.target.value)}>
              <option value="">Page health: all</option>
              <option value="attention">Needs attention</option>
              <option value="ok">No problems</option>
            </Select>
          </div>
          {health === 'attention' && problemOptions.length > 0 && (
            <div className="w-48">
              <Select value={problem} onChange={(e) => setFilter('problem', e.target.value)}>
                <option value="">Any problem</option>
                {problemOptions.map((p) => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </Select>
            </div>
          )}
          {hasFilters && (
            <button
              type="button"
              className="text-xs font-medium text-pink-600 hover:underline"
              onClick={() => switchView(view)}
            >
              Clear filters
            </button>
          )}
          <span className="ml-auto text-xs text-slate-400">
            {filtered.length} URL{filtered.length === 1 ? '' : 's'}
          </span>
        </div>

        {visible.length === 0 ? (
          <EmptyState
            message={
              view === 'redirects' && !hasFilters
                ? 'No redirects — exactly right for a site that has never been live.'
                : 'No URLs match the current filters.'
            }
          />
        ) : view === 'search' ? (
          <SearchPagesTable
            rows={visible}
            expanded={expandedSections}
            onToggleSections={toggleSections}
            onSelect={setSelected}
          />
        ) : view === 'redirects' ? (
          <RedirectsTable rows={visible} onSelect={setSelected} />
        ) : (
          <TechnicalTable rows={visible} onSelect={setSelected} />
        )}

        {totalPages > 1 && (
          <div className="mt-3 flex items-center justify-end gap-2 text-sm">
            <Button variant="secondary" disabled={currentPage <= 1} onClick={() => setPage(currentPage - 1)}>
              Prev
            </Button>
            <span className="text-xs text-slate-400">
              Page {currentPage} of {totalPages}
            </span>
            <Button variant="secondary" disabled={currentPage >= totalPages} onClick={() => setPage(currentPage + 1)}>
              Next
            </Button>
          </div>
        )}
      </Card>

      {selected && (
        <PageDetailDrawer
          row={selected}
          siteOrigin={registry.siteOrigin}
          onClose={() => setSelected(null)}
          onCreateRedirect={() => setRedirectFrom(selected)}
          onSaved={async () => {
            invalidateRegistryCache();
            await reload(true);
            setSelected(null);
          }}
        />
      )}

      {redirectFrom && (
        <RedirectModal
          redirect={null}
          initial={{ sourcePath: redirectFrom.path.split('#')[0] }}
          onClose={() => setRedirectFrom(null)}
          onDone={async () => {
            setRedirectFrom(null);
            invalidateRegistryCache();
            await reload(true);
          }}
        />
      )}
    </div>
  );
}

function SummaryChip({
  label,
  value,
  tone,
  onClick,
  active,
}: {
  label: string;
  value: number;
  tone?: 'green' | 'amber' | 'red';
  onClick?: () => void;
  active?: boolean;
}) {
  const toneClass =
    tone === 'green'
      ? 'text-green-700 dark:text-green-400'
      : tone === 'amber'
        ? 'text-amber-700 dark:text-amber-400'
        : tone === 'red'
          ? 'text-red-700 dark:text-red-400'
          : 'text-slate-700 dark:text-slate-300';
  const Tag = onClick ? 'button' : 'div';
  return (
    <Tag
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={`flex items-center gap-1.5 rounded-full border px-3 py-1 ${
        active
          ? 'border-pink-400 bg-pink-50 dark:border-pink-700 dark:bg-pink-950/40'
          : 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900'
      } ${onClick ? 'cursor-pointer hover:border-pink-300' : ''}`}
    >
      <span className="text-xs text-slate-400">{label}</span>
      <span className={`text-sm font-bold tabular-nums ${toneClass}`}>{value}</span>
    </Tag>
  );
}

// ---------------------------------------------------------------------------
// Tables per view
// ---------------------------------------------------------------------------

function SearchPagesTable({
  rows,
  expanded,
  onToggleSections,
  onSelect,
}: {
  rows: RegistryUrl[];
  expanded: Set<string>;
  onToggleSections: (path: string) => void;
  onSelect: (row: RegistryUrl) => void;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-left text-xs uppercase text-slate-400 dark:border-slate-700">
            <th className="px-2 py-2">Page</th>
            <th className="px-2 py-2">Type</th>
            <th className="px-2 py-2">Managed in</th>
            <th className="px-2 py-2">Status</th>
            <th className="px-2 py-2">Visibility</th>
            <th className="px-2 py-2">Submitted</th>
            <th className="px-2 py-2">Sections</th>
            <th className="px-2 py-2">Issues</th>
            <th className="px-2 py-2">Updated</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <SearchPageRow
              key={row.path}
              row={row}
              expanded={expanded.has(row.path)}
              onToggleSections={() => onToggleSections(row.path)}
              onSelect={() => onSelect(row)}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SearchPageRow({
  row,
  expanded,
  onToggleSections,
  onSelect,
}: {
  row: RegistryUrl;
  expanded: boolean;
  onToggleSections: () => void;
  onSelect: () => void;
}) {
  const sectionCount = row.sections?.length ?? 0;
  return (
    <>
      <tr
        className="cursor-pointer border-b border-slate-100 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/60"
        onClick={onSelect}
      >
        <td className="max-w-[22rem] px-2 py-2">
          <div className="truncate font-mono text-xs text-slate-700 dark:text-slate-300">{row.path}</div>
          <div className="truncate text-xs text-slate-400">{row.title}</div>
        </td>
        <td className="whitespace-nowrap px-2 py-2 text-xs">{row.pageType}</td>
        <td className="whitespace-nowrap px-2 py-2 text-xs">
          <div>{SOURCE_LABELS[row.source] ?? row.source}</div>
          <div className="text-[11px] text-slate-400">{pageCreationLabel(row)}</div>
        </td>
        <td className="px-2 py-2">
          <Badge tone={statusBadgeTone(row.status)}>{STATUS_LABELS[row.status] ?? row.status}</Badge>
        </td>
        <td className="px-2 py-2">
          <Badge tone={indexingBadgeTone(row.indexing)}>{INDEXING_BADGES[row.indexing]}</Badge>
        </td>
        <td className="whitespace-nowrap px-2 py-2 text-xs">
          {row.inXmlSitemap ? (
            <span className="inline-flex items-center gap-1 text-green-700 dark:text-green-400">
              <Icon name="check" className="!text-[15px]" /> {pageGroupLabel(pageGroupOf(row))}
            </span>
          ) : (
            <span className="text-slate-400">Not submitted</span>
          )}
        </td>
        <td className="px-2 py-2">
          {sectionCount > 0 ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleSections();
              }}
              className="inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-xs font-medium text-slate-600 hover:bg-slate-100 hover:text-pink-700 dark:text-slate-400 dark:hover:bg-slate-800"
            >
              {sectionCount}
              <Icon name={expanded ? 'expand_less' : 'expand_more'} className="!text-[15px]" />
            </button>
          ) : (
            <span className="text-slate-300">—</span>
          )}
        </td>
        <td className="px-2 py-2">
          {row.issues.length > 0 ? (
            <Badge tone={row.issues.some((i) => i.severity === 'error') ? 'red' : 'amber'}>{row.issues.length}</Badge>
          ) : (
            <span className="text-slate-300">—</span>
          )}
        </td>
        <td className="whitespace-nowrap px-2 py-2 text-xs text-slate-400">
          {row.updatedAt ? fmtDate(row.updatedAt) : '—'}
        </td>
      </tr>
      {expanded && sectionCount > 0 && (
        <tr className="border-b border-slate-100 bg-slate-50/60 dark:border-slate-800 dark:bg-slate-800/30">
          <td colSpan={9} className="px-4 py-2">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs text-slate-400">Sections of this page (jump links, not separate URLs):</span>
              {row.sections!.map((s) => (
                <code
                  key={s}
                  className="rounded bg-white px-1.5 py-0.5 font-mono text-xs text-slate-600 ring-1 ring-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:ring-slate-700"
                >
                  {s}
                </code>
              ))}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

function RedirectsTable({ rows, onSelect }: { rows: RegistryUrl[]; onSelect: (row: RegistryUrl) => void }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-left text-xs uppercase text-slate-400 dark:border-slate-700">
            <th className="px-2 py-2">Source URL</th>
            <th className="px-2 py-2">Result</th>
            <th className="px-2 py-2">Destination</th>
            <th className="px-2 py-2">Managed by</th>
            <th className="px-2 py-2">Issues</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.path}
              className="cursor-pointer border-b border-slate-100 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/60"
              onClick={() => onSelect(row)}
            >
              <td className="max-w-[20rem] truncate px-2 py-2 font-mono text-xs">{row.path}</td>
              <td className="whitespace-nowrap px-2 py-2">
                <Badge tone={row.redirectType === 302 ? 'amber' : 'blue'}>{row.redirectType ?? 301}</Badge>
                {row.redirectActive === false && <Badge tone="gray">inactive</Badge>}
              </td>
              <td className="max-w-[20rem] truncate px-2 py-2 font-mono text-xs">{row.destination ?? '—'}</td>
              <td className="whitespace-nowrap px-2 py-2 text-xs">
                {row.entity === 'redirects' ? (
                  <Link
                    to="/seo/redirects"
                    onClick={(e) => e.stopPropagation()}
                    className="text-pink-600 hover:underline"
                  >
                    Redirects manager
                  </Link>
                ) : (
                  <span className="text-slate-500">{SOURCE_LABELS[row.source] ?? row.source}</span>
                )}
              </td>
              <td className="px-2 py-2">
                {row.issues.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {row.issues.map((i) => (
                      <Badge key={i.code} tone={i.severity === 'error' ? 'red' : 'amber'}>{i.label}</Badge>
                    ))}
                  </div>
                ) : (
                  <span className="text-slate-300">—</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TechnicalTable({ rows, onSelect }: { rows: RegistryUrl[]; onSelect: (row: RegistryUrl) => void }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-left text-xs uppercase text-slate-400 dark:border-slate-700">
            <th className="px-2 py-2">Route</th>
            <th className="px-2 py-2">Type</th>
            <th className="px-2 py-2">Access</th>
            <th className="px-2 py-2">Visibility</th>
            <th className="px-2 py-2">Submitted</th>
            <th className="px-2 py-2">Managed in</th>
            <th className="px-2 py-2">Notes</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.path}
              className="cursor-pointer border-b border-slate-100 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/60"
              onClick={() => onSelect(row)}
            >
              <td className="max-w-[24rem] truncate px-2 py-2 font-mono text-xs">{row.path}</td>
              <td className="whitespace-nowrap px-2 py-2 text-xs">{row.pageType}</td>
              <td className="whitespace-nowrap px-2 py-2 text-xs">
                {row.access === 'authenticated' ? (
                  <span className="inline-flex items-center gap-1"><Icon name="lock" className="!text-[14px] text-slate-400" /> Authenticated</span>
                ) : (
                  'Public'
                )}
              </td>
              <td className="px-2 py-2">
                <Badge tone={indexingBadgeTone(row.indexing)}>{INDEXING_BADGES[row.indexing]}</Badge>
              </td>
              <td className="px-2 py-2">
                {row.inXmlSitemap ? <Icon name="check" className="text-green-600" /> : <span className="text-slate-300">—</span>}
              </td>
              <td className="whitespace-nowrap px-2 py-2 text-xs">{SOURCE_LABELS[row.source] ?? row.source}</td>
              <td className="max-w-[16rem] truncate px-2 py-2 text-xs text-slate-400">{row.notes ?? '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Detail drawer
// ---------------------------------------------------------------------------

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 py-1.5 text-sm">
      <span className="w-32 shrink-0 text-xs font-medium uppercase tracking-wide text-slate-400">{label}</span>
      <span className="min-w-0 flex-1 text-slate-700 dark:text-slate-300">{children}</span>
    </div>
  );
}

function PageDetailDrawer({
  row,
  siteOrigin,
  onClose,
  onCreateRedirect,
  onSaved,
}: {
  row: RegistryUrl;
  siteOrigin: string;
  onClose: () => void;
  onCreateRedirect: () => void;
  onSaved: () => Promise<void>;
}) {
  const editable = Boolean(row.entity && row.recordId && (row.entity === 'products' || row.entity === 'roundups'));
  const [seoTitle, setSeoTitle] = useState(row.seoTitle ?? '');
  const [seoDescription, setSeoDescription] = useState(row.seoDescription ?? '');
  const [canonicalUrl, setCanonicalUrl] = useState(row.canonicalUrl ?? '');
  const [noindex, setNoindex] = useState(Boolean(row.noindexFlag));
  const [copied, setCopied] = useState(false);
  const { busy, error, run } = useAsync();

  const dirty =
    editable &&
    (seoTitle !== (row.seoTitle ?? '') ||
      seoDescription !== (row.seoDescription ?? '') ||
      canonicalUrl !== (row.canonicalUrl ?? '') ||
      noindex !== Boolean(row.noindexFlag));

  async function save() {
    if (!row.entity || !row.recordId) return;
    const done = await run(async () => {
      await dataApi.update(row.entity!, row.recordId!, {
        seoTitle: seoTitle || undefined,
        seoDescription: seoDescription || undefined,
        canonicalUrl: canonicalUrl || undefined,
        noindex,
      });
      return true;
    });
    if (done) await onSaved();
  }

  async function setPageStatus(nextStatus: 'draft' | 'published') {
    const done = await run(async () => {
      await api.post('/api/admin/seo/page-status', {
        path: row.path.split('#')[0],
        status: nextStatus,
      });
      return true;
    });
    if (done) await onSaved();
  }

  async function copyUrl() {
    try {
      await navigator.clipboard.writeText(`${siteOrigin}${row.path}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable */
    }
  }

  const livePath = row.path.split('#')[0];
  const isDraftReview = row.status === 'draft' && row.contentType === 'review';
  const isOpenable =
    !row.path.includes('{') &&
    (row.status === 'published' ||
      row.status === 'noindex' ||
      row.status === 'preview' ||
      isDraftReview);
  const isDrafted = Boolean(row.draftOverride);

  return (
    <>
      <div className="fixed inset-0 z-40 bg-slate-900/30" onClick={onClose} />
      <aside className="fixed inset-y-0 right-0 z-50 flex w-full max-w-lg flex-col overflow-y-auto border-l border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 dark:border-slate-800">
          <div className="min-w-0">
            <p className="truncate font-mono text-sm font-semibold text-slate-900 dark:text-slate-100">{row.path}</p>
            <p className="truncate text-xs text-slate-400">{row.title}</p>
          </div>
          <DrawerCloseButton onClick={onClose} />
        </div>

        <div className="flex-1 space-y-5 px-4 py-4">
          {error && <ErrorNote message={error} />}

          {isDrafted && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300">
              This page is set to draft: it is served as 404 and excluded from the sitemaps. Use
              “Publish page” below to bring it back.
            </div>
          )}

          {/* Identity */}
          <section>
            <h3 className="mb-1 text-xs font-bold uppercase tracking-wide text-slate-400">Page identity</h3>
            <DetailRow label="Type">{row.pageType}</DetailRow>
            <DetailRow label="Managed in">
              {SOURCE_LABELS[row.source] ?? row.source}
              <span className="ml-1 text-xs text-slate-400">{row.sourceDetail}</span>
            </DetailRow>
            <DetailRow label="Page creation">{pageCreationLabel(row)}</DetailRow>
            {row.sourceFile && (
              <DetailRow label="File">
                <code className="rounded bg-slate-100 px-1 py-0.5 text-xs dark:bg-slate-800">{row.sourceFile}</code>
              </DetailRow>
            )}
            <DetailRow label="Status">
              <Badge tone={statusBadgeTone(row.status)}>{STATUS_LABELS[row.status] ?? row.status}</Badge>
              {row.recordStatus && row.recordStatus !== row.status && (
                <span className="ml-2 text-xs text-slate-400">record: {row.recordStatus}</span>
              )}
            </DetailRow>
            {row.view === 'technical' && (
              <DetailRow label="Access">{row.access === 'authenticated' ? 'Authenticated' : 'Public'}</DetailRow>
            )}
            {row.destination && (
              <DetailRow label="Redirects to">
                <code className="font-mono text-xs">{row.destination}</code>
                {row.redirectType && <Badge tone="blue">{row.redirectType}</Badge>}
              </DetailRow>
            )}
            {row.altPaths && row.altPaths.length > 0 && (
              <DetailRow label="Also registered as">
                <div className="space-y-0.5">
                  {row.altPaths.map((p) => (
                    <code key={p} className="block font-mono text-xs text-amber-700 dark:text-amber-400">{p}</code>
                  ))}
                  <p className="text-xs text-slate-400">
                    Both URL versions resolve. The one shown above is in the sitemap and should be the canonical version.
                  </p>
                </div>
              </DetailRow>
            )}
            {row.updatedAt && <DetailRow label="Updated">{fmtDate(row.updatedAt)}</DetailRow>}
            {row.notes && <DetailRow label="Notes">{row.notes}</DetailRow>}
          </section>

          {/* Sections */}
          {row.sections && row.sections.length > 0 && (
            <section>
              <h3 className="mb-1 text-xs font-bold uppercase tracking-wide text-slate-400">
                Sections ({row.sections.length})
              </h3>
              <p className="mb-1.5 text-xs text-slate-400">
                Jump links within this page. They are parts of the same document — Google does not index them separately.
              </p>
              <div className="flex flex-wrap gap-1.5">
                {row.sections.map((s) => (
                  <code
                    key={s}
                    className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                  >
                    {s}
                  </code>
                ))}
              </div>
            </section>
          )}

          {/* Search appearance */}
          {row.view === 'search' && (
            <section>
              <h3 className="mb-1 text-xs font-bold uppercase tracking-wide text-slate-400">Search appearance</h3>
              {editable ? (
                <div className="space-y-3">
                  <Field label="SEO title" help={`${seoTitle.length} characters`}>
                    <TextInput value={seoTitle} onChange={(e) => setSeoTitle(e.target.value)} />
                  </Field>
                  <Field label="Meta description" help={`${seoDescription.length} characters`}>
                    <TextArea rows={3} value={seoDescription} onChange={(e) => setSeoDescription(e.target.value)} />
                  </Field>
                  <Field label="Canonical URL" help="Leave empty for self-canonical (default)">
                    <TextInput value={canonicalUrl} onChange={(e) => setCanonicalUrl(e.target.value)} />
                  </Field>
                  <Toggle checked={noindex} onChange={setNoindex} label="Hide from Google (noindex)" />
                  {dirty && (
                    <Button onClick={save} disabled={busy}>
                      {busy ? 'Saving…' : 'Save changes'}
                    </Button>
                  )}
                </div>
              ) : (
                <div>
                  <DetailRow label="SEO title">{row.seoTitle ?? <span className="text-slate-400">Managed in code</span>}</DetailRow>
                  <DetailRow label="Description">{row.seoDescription ?? <span className="text-slate-400">Managed in code</span>}</DetailRow>
                  <DetailRow label="Canonical">
                    {row.canonicalUrl ?? <span className="text-slate-400">self (default)</span>}
                  </DetailRow>
                </div>
              )}
              {row.h1Override && <DetailRow label="H1 override">{row.h1Override}</DetailRow>}
              {(row.ogTitle || row.ogDescription || row.ogImage) && (
                <>
                  {row.ogTitle && <DetailRow label="OG title">{row.ogTitle}</DetailRow>}
                  {row.ogDescription && <DetailRow label="OG description">{row.ogDescription}</DetailRow>}
                  {row.ogImage && (
                    <DetailRow label="OG image">
                      <a href={row.ogImage} target="_blank" rel="noreferrer" className="text-pink-600 hover:underline">
                        {row.ogImage}
                      </a>
                    </DetailRow>
                  )}
                </>
              )}
            </section>
          )}

          {/* Search visibility */}
          <section>
            <h3 className="mb-1 text-xs font-bold uppercase tracking-wide text-slate-400">Search visibility</h3>
            <DetailRow label="Visibility">
              <Badge tone={indexingBadgeTone(row.indexing)}>{INDEXING_LABELS[row.indexing]}</Badge>
            </DetailRow>
            {row.indexing === 'canonicalized' && row.canonicalUrl && (
              <DetailRow label="Canonical points to">
                <code className="font-mono text-xs">{row.canonicalUrl}</code>
              </DetailRow>
            )}
            <DetailRow label="Submitted to Google">
              {row.inXmlSitemap ? (
                <span className="inline-flex items-center gap-1 text-green-700 dark:text-green-400">
                  <Icon name="check" /> Yes — {pageGroupLabel(pageGroupOf(row))} sitemap
                </span>
              ) : (
                'No'
              )}
            </DetailRow>
          </section>

          {/* Health checks */}
          <section>
            <h3 className="mb-1 text-xs font-bold uppercase tracking-wide text-slate-400">Page health</h3>
            {row.issues.length === 0 ? (
              <p className="flex items-center gap-2 py-1 text-sm text-slate-500">
                <Icon name="check_circle" className="text-green-600" /> No problems detected.
              </p>
            ) : (
              <ul className="space-y-1.5">
                {row.issues.map((issue) => (
                  <li key={issue.code} className="text-sm">
                    <div className="flex items-center gap-2">
                      <Badge tone={issue.severity === 'error' ? 'red' : 'amber'}>{issue.severity}</Badge>
                      <span className="text-slate-700 dark:text-slate-300">{issue.label}</span>
                    </div>
                    {issue.detail && <p className="ml-1 mt-0.5 text-xs text-slate-400">{issue.detail}</p>}
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Actions */}
          <section>
            <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">Actions</h3>
            <div className="flex flex-wrap gap-2">
              {row.view === 'search' && (
                isDrafted ? (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => setPageStatus('published')}
                    className="inline-flex items-center gap-1 rounded-lg border border-green-300 bg-green-50 px-3 py-1.5 text-sm font-medium text-green-800 hover:border-green-400 dark:border-green-800 dark:bg-green-950/40 dark:text-green-300"
                  >
                    <Icon name="publish" className="!text-[16px]" /> {busy ? 'Working…' : 'Publish page'}
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => setPageStatus('draft')}
                    className="inline-flex items-center gap-1 rounded-lg border border-amber-300 bg-amber-50 px-3 py-1.5 text-sm font-medium text-amber-800 hover:border-amber-400 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300"
                  >
                    <Icon name="visibility_off" className="!text-[16px]" /> {busy ? 'Working…' : 'Put in draft'}
                  </button>
                )
              )}
              {isOpenable && (
                <a
                  href={livePath}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 hover:border-pink-300 hover:text-pink-700 dark:border-slate-700 dark:text-slate-300"
                >
                  <Icon name="open_in_new" className="!text-[16px]" />{' '}
                  {row.status === 'draft'
                    ? 'Open draft page'
                    : row.status === 'preview'
                      ? 'Open preview'
                      : 'Open live page'}
                </a>
              )}
              {row.editHref && (
                <Link
                  to={row.editHref}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 hover:border-pink-300 hover:text-pink-700 dark:border-slate-700 dark:text-slate-300"
                >
                  <Icon name="edit" className="!text-[16px]" /> Open editor
                </Link>
              )}
              {row.view === 'search' && (
                <button
                  type="button"
                  onClick={onCreateRedirect}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 hover:border-pink-300 hover:text-pink-700 dark:border-slate-700 dark:text-slate-300"
                >
                  <Icon name="alt_route" className="!text-[16px]" /> Create redirect
                </button>
              )}
              <button
                type="button"
                onClick={copyUrl}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 hover:border-pink-300 hover:text-pink-700 dark:border-slate-700 dark:text-slate-300"
              >
                <Icon name={copied ? 'check' : 'content_copy'} className="!text-[16px]" />
                {copied ? 'Copied' : 'Copy URL'}
              </button>
            </div>
          </section>
        </div>
      </aside>
    </>
  );
}
