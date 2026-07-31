// SEO Overview: what is wrong, and where do I fix it?

import { Link } from 'react-router-dom';
import { Card, Spinner, ErrorNote, Badge, Icon, Button } from '../../ui';
import { useUrlRegistry } from './registry';

function SummaryCard({ label, value, to, tone }: { label: string; value: number; to: string; tone?: 'alert' }) {
  return (
    <Link
      to={to}
      className={`block rounded-xl border p-4 transition-colors hover:border-pink-300 dark:hover:border-pink-800 ${
        tone === 'alert' && value > 0
          ? 'border-amber-200 bg-amber-50/60 dark:border-amber-900 dark:bg-amber-950/30'
          : 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900'
      }`}
    >
      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-1 text-2xl font-bold tabular-nums text-slate-900 dark:text-slate-100">{value}</p>
    </Link>
  );
}

export function SeoOverviewPage() {
  const { registry, error, loading, reload } = useUrlRegistry();

  if (error) return <ErrorNote message={error} />;
  if (loading || !registry) return <Spinner />;

  const { summary, issueGroups, generatedAt } = registry;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold">SEO overview</h2>
          <p className="text-sm text-slate-500">
            Health of every known URL — database content, hard-coded routes, generated pages, and
            redirects. Updated {new Date(generatedAt).toLocaleTimeString()}.
          </p>
        </div>
        <Button variant="secondary" onClick={() => reload(true)}>
          <Icon name="refresh" /> Refresh
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <SummaryCard label="Search pages" value={summary.searchPages} to="/seo/pages" />
        <SummaryCard label="Visible to Google" value={summary.indexable} to="/seo/pages?indexing=index" />
        <SummaryCard label="Hidden from Google" value={summary.noindex} to="/seo/pages?indexing=noindex" />
        <SummaryCard label="Needs attention" value={summary.needsAttention} to="/seo/pages?issue=any" tone="alert" />
        <SummaryCard label="Redirects" value={summary.redirects} to="/seo/pages?view=redirects" tone="alert" />
        <SummaryCard label="Not found" value={summary.notFound} to="/seo/pages?view=redirects&issue=redirect-dest-unknown" tone="alert" />
      </div>

      <Card>
        <div className="mb-2 flex items-center gap-2">
          <Icon name="report" className="text-amber-500" />
          <h3 className="text-sm font-semibold">Needs attention</h3>
        </div>
        {issueGroups.length === 0 ? (
          <div className="flex items-center gap-2 py-4 text-sm text-slate-500">
            <Icon name="check_circle" className="text-green-600" />
            No SEO issues detected across {summary.totalUrls} URLs.
          </div>
        ) : (
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {issueGroups.map((group) => (
              <li key={group.code}>
                <Link
                  to={`/seo/pages?view=${group.view}&issue=${encodeURIComponent(group.code)}`}
                  className="flex items-center gap-3 px-1 py-2.5 text-sm hover:bg-slate-50 dark:hover:bg-slate-800/60"
                >
                  <Badge tone={group.severity === 'error' ? 'red' : 'amber'}>
                    {group.count}
                  </Badge>
                  <span className="flex-1 text-slate-700 dark:text-slate-300">
                    {group.count === 1 ? '1 URL has' : `${group.count} URLs have`}: {group.label}
                  </span>
                  <Icon name="chevron_right" className="text-slate-300" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
