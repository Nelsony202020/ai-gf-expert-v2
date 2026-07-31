// SEO Indexing: index rules summary, canonical exceptions only, robots rules.

import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Badge, Card, ErrorNote, Icon, Spinner } from '../../ui';
import { INDEXING_LABELS, useUrlRegistry } from './registry';

const CANONICAL_ISSUE_CODES = new Set([
  'canonical-points-to-redirect',
  'canonical-target-unknown',
  'canonical-trailing-slash',
]);

const ROUTE_GROUP_RULES = [
  { group: '/admin/*', rule: 'Blocked', detail: 'Admin SPA — served with noindex, requires authentication' },
  { group: '/api/*', rule: 'Blocked', detail: 'Server endpoints — no HTML, not crawlable content' },
  { group: '/reviews/preview/*', rule: 'Noindex', detail: 'Editor previews force noindex, nofollow' },
  { group: '/guides/preview', rule: 'Noindex', detail: 'Sanity draft preview — requires secret query param' },
  { group: '/go/*', rule: 'Noindex', detail: 'Affiliate cloaks — 302 with X-Robots-Tag: noindex' },
];

export function SeoIndexingPage() {
  const { registry, error, loading } = useUrlRegistry();

  const stats = useMemo(() => {
    if (!registry) return null;
    // Scope to search pages — technical routes and redirects have their own views.
    const rows = registry.urls.filter((r) => r.view === 'search');
    const byIndexing: Record<string, number> = {};
    for (const row of rows) {
      byIndexing[row.indexing] = (byIndexing[row.indexing] ?? 0) + 1;
    }
    const canonicalProblems = rows.filter((r) => r.issues.some((i) => CANONICAL_ISSUE_CODES.has(i.code)));
    const canonicalizedElsewhere = rows.filter((r) => r.indexing === 'canonicalized');
    return { byIndexing, canonicalProblems, canonicalizedElsewhere };
  }, [registry]);

  if (error) return <ErrorNote message={error} />;
  if (loading || !registry || !stats) return <Spinner />;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-bold">Indexing</h2>
        <p className="text-sm text-slate-500">
          What Google can see and index, counted over real search pages (redirects and technical
          routes are handled in their own views). Canonical is a property of each page — this view
          shows only the exceptions.
        </p>
      </div>

      {/* Search visibility */}
      <Card>
        <h3 className="mb-2 text-sm font-semibold">Search visibility</h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {(['index', 'noindex', 'blocked', 'canonicalized', 'unknown'] as const).map((key) => (
            <Link
              key={key}
              to={`/seo/pages?indexing=${key}`}
              className="rounded-lg border border-slate-200 p-3 transition-colors hover:border-pink-300 dark:border-slate-800 dark:hover:border-pink-800"
            >
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{INDEXING_LABELS[key]}</p>
              <p className="mt-1 text-xl font-bold tabular-nums">{stats.byIndexing[key] ?? 0}</p>
            </Link>
          ))}
        </div>
      </Card>

      {/* Canonical problems */}
      <Card>
        <h3 className="mb-2 text-sm font-semibold">Canonical problems</h3>
        {stats.canonicalProblems.length === 0 ? (
          <p className="flex items-center gap-2 py-2 text-sm text-slate-500">
            <Icon name="check_circle" className="text-green-600" />
            No canonical problems detected. Pages without an override are self-canonical by default.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs uppercase text-slate-400 dark:border-slate-700">
                <th className="px-2 py-2">Page</th>
                <th className="px-2 py-2">Canonical</th>
                <th className="px-2 py-2">Problem</th>
              </tr>
            </thead>
            <tbody>
              {stats.canonicalProblems.map((row) => (
                <tr key={row.path} className="border-b border-slate-100 dark:border-slate-800">
                  <td className="px-2 py-2">
                    <Link
                      to={`/seo/pages?q=${encodeURIComponent(row.path)}`}
                      className="font-mono text-xs hover:text-pink-600"
                    >
                      {row.path}
                    </Link>
                  </td>
                  <td className="px-2 py-2 font-mono text-xs">{row.canonicalUrl ?? '—'}</td>
                  <td className="px-2 py-2">
                    {row.issues
                      .filter((i) => CANONICAL_ISSUE_CODES.has(i.code))
                      .map((i) => (
                        <Badge key={i.code} tone={i.severity === 'error' ? 'red' : 'amber'}>
                          {i.label}
                        </Badge>
                      ))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {stats.canonicalizedElsewhere.length > 0 && (
          <p className="mt-3 text-xs text-slate-400">
            {stats.canonicalizedElsewhere.length} page
            {stats.canonicalizedElsewhere.length === 1 ? ' is' : 's are'} intentionally canonicalized
            elsewhere —{' '}
            <Link to="/seo/pages?indexing=canonicalized" className="text-pink-600 hover:underline">
              view them
            </Link>
            .
          </p>
        )}
      </Card>

      {/* Robots rules */}
      <Card>
        <h3 className="mb-2 text-sm font-semibold">Robots rules</h3>
        <table className="mb-4 w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-xs uppercase text-slate-400 dark:border-slate-700">
              <th className="px-2 py-2">Route group</th>
              <th className="px-2 py-2">Rule</th>
              <th className="px-2 py-2">How it's enforced</th>
            </tr>
          </thead>
          <tbody>
            {ROUTE_GROUP_RULES.map((r) => (
              <tr key={r.group} className="border-b border-slate-100 dark:border-slate-800">
                <td className="px-2 py-2 font-mono text-xs">{r.group}</td>
                <td className="px-2 py-2">
                  <Badge tone={r.rule === 'Blocked' ? 'gray' : 'amber'}>{r.rule}</Badge>
                </td>
                <td className="px-2 py-2 text-xs text-slate-500">{r.detail}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <h4 className="mb-1 text-xs font-bold uppercase tracking-wide text-slate-400">
          Global robots.txt <span className="ml-1 font-normal normal-case">(public/robots.txt — managed in code)</span>
        </h4>
        {registry.robotsTxt ? (
          <pre className="overflow-x-auto rounded-lg bg-slate-50 p-3 font-mono text-xs text-slate-700 dark:bg-slate-800 dark:text-slate-300">
            {registry.robotsTxt.trim()}
          </pre>
        ) : (
          <p className="text-sm text-slate-400">robots.txt could not be read in this environment.</p>
        )}
      </Card>
    </div>
  );
}
