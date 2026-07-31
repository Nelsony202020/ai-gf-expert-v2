// Dashboard overview — prioritized issues, pipeline, site health, and quick actions.

import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useCan } from '../context';
import { Button, Card, Spinner, ErrorNote, Badge, Icon, fmtDate } from '../ui';

type PipelineStage = 'draft' | 'testing' | 'review' | 'ready_to_publish' | 'published';

interface DashboardData {
  counts: {
    products: number;
    drafts: number;
    published: number;
    needAttention: number;
  };
  pipeline: Record<PipelineStage, { count: number; products: { id: string; name: string }[] }>;
  siteHealth: {
    testingCoverage: { ok: number; total: number; pct: number };
    retesting: { due: number; ok: boolean };
    pricingFreshness: { ok: number; total: number; pct: number };
    affiliateLinks: { ok: number; total: number; pct: number };
    seoMetadata: { ok: number; total: number; pct: number };
  };
  draftProducts: { id: string; name: string; status: string }[];
  productsWithoutPublishedRun: { id: string; name: string }[];
  productsMissingTestRun: { id: string; name: string }[];
  runsAwaitingReview: { id: string; name: string; status: string; product?: string }[];
  dueForRetest: { id: string; name: string; daysSinceTest: number }[];
  stalePrices: { id: string; name: string; product?: string; daysSinceVerified: number | null }[];
  problemLinks: { id: string; cloakedSlug: string; product?: string; issue: string }[];
  missingSeo: { id: string; name: string }[];
  scheduled: { id: string; name: string; scheduledAt?: number }[];
  recentActivity: {
    id: string;
    icon: string;
    title: string;
    detail?: string;
    createdAt: number;
  }[];
  topPicks: { id: string; name?: string; position: number; avatarUrl?: string | null }[];
  featuredCharacters: {
    id: string;
    name?: string;
    position: number;
    avatarUrl?: string | null;
  }[];
}

interface AttentionIssue {
  id: string;
  icon: string;
  title: string;
  description: string;
  priority: 'High' | 'Medium' | 'Low';
  actionLabel: string;
  to: string;
}

const PIPELINE_LABELS: Record<PipelineStage, string> = {
  draft: 'Draft',
  testing: 'Testing',
  review: 'Review',
  ready_to_publish: 'Ready to publish',
  published: 'Published',
};

const PIPELINE_FILTER: Record<PipelineStage, string> = {
  draft: 'draft',
  testing: 'testing',
  review: 'in_review',
  ready_to_publish: 'scheduled',
  published: 'published',
};

export function Dashboard() {
  const can = useCan();
  const canHomepage = can('homepage.edit');
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    api
      .get<DashboardData>('/api/admin/dashboard')
      .then(setData)
      .catch((e) => setError(e.message));
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchRef.current?.focus();
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const issues = useMemo(() => (data ? buildIssues(data) : []), [data]);

  function submitSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = search.trim();
    if (!q) return;
    navigate(`/products?q=${encodeURIComponent(q)}`);
  }

  if (error) return <ErrorNote message={error} />;
  if (!data) return <Spinner />;

  return (
    <div className="admin-dashboard space-y-5">
      {/* Page header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Dashboard</h1>
          <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
            Manage products, testing, content, and site health.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <form onSubmit={submitSearch} className="relative min-w-0 flex-1 sm:w-72">
            <Icon
              name="search"
              className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 !text-[18px] text-slate-400"
            />
            <input
              ref={searchRef}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products, reviews, tests…"
              className="admin-input w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-16 text-sm dark:border-slate-700 dark:bg-slate-900"
            />
            <kbd className="pointer-events-none absolute right-2 top-1/2 hidden -translate-y-1/2 rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px] text-slate-400 sm:inline dark:border-slate-600 dark:bg-slate-800">
              ⌘K
            </kbd>
          </form>
          <div className="flex shrink-0 gap-2">
            <Link to="/products/new">
              <Button variant="secondary" className="whitespace-nowrap">
                <Icon name="add" /> Add product
              </Button>
            </Link>
            <Link to="/testing/runs">
              <Button className="whitespace-nowrap">
                <Icon name="science" /> Start test run
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <SummaryCard
          icon="inventory_2"
          iconTone="pink"
          label="Total products"
          value={data.counts.products}
          hint="Across all stages"
          to="/products"
        />
        <SummaryCard
          icon="draft"
          iconTone="amber"
          label="Drafts"
          value={data.counts.drafts}
          hint="Awaiting review"
          to="/products?status=draft"
        />
        <SummaryCard
          icon="check_circle"
          iconTone="green"
          label="Published"
          value={data.counts.published}
          hint="Live on site"
          to="/products?status=published"
        />
        <SummaryCard
          icon="warning"
          iconTone={data.counts.needAttention > 0 ? 'red' : 'green'}
          label="Need attention"
          value={data.counts.needAttention}
          hint={data.counts.needAttention > 0 ? 'Require your action' : 'All clear'}
          warn={data.counts.needAttention > 0}
          healthy={data.counts.needAttention === 0}
        />
      </div>

      {/* Needs attention + quick actions */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card
          title="Needs Attention"
          className="lg:col-span-2"
          actions={
            issues.length > 0 ? (
              <Link to="/administration/audit" className="text-xs font-medium text-pink-600 hover:underline">
                View all issues
              </Link>
            ) : undefined
          }
        >
          {issues.length === 0 ? (
            <div className="flex items-start gap-3 rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-900 dark:bg-green-950/40">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-700 dark:bg-green-900/60 dark:text-green-300">
                <Icon name="check_circle" className="!text-[20px]" />
              </span>
              <div>
                <p className="font-medium text-green-900 dark:text-green-100">Everything is up to date</p>
                <p className="mt-0.5 text-sm text-green-700 dark:text-green-300/80">
                  No expired links, missing metadata, overdue retests, or unverified prices.
                </p>
              </div>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
              {issues.map((issue) => (
                <li key={issue.id} className="flex flex-col gap-3 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center">
                  <div className="flex min-w-0 flex-1 items-start gap-3">
                    <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                      <Icon name={issue.icon} className="!text-[18px]" />
                    </span>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium text-slate-900 dark:text-slate-100">{issue.title}</p>
                        <Badge tone={priorityTone(issue.priority)}>{issue.priority}</Badge>
                      </div>
                      <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">{issue.description}</p>
                    </div>
                  </div>
                  <Link to={issue.to} className="shrink-0 self-start sm:self-center">
                    <Button variant="secondary" className="text-xs">
                      {issue.actionLabel}
                    </Button>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Quick Actions">
          <div className="grid grid-cols-2 gap-2">
            <QuickAction icon="add" title="Add product" hint="Create a new review record" to="/products/new" />
            <QuickAction icon="science" title="Start test run" hint="Score a product" to="/testing/runs" />
            {canHomepage && (
              <QuickAction icon="home" title="Manage homepage" hint="Top picks & featured characters" to="/homepage" />
            )}
            <QuickAction icon="compare" title="Comparisons" hint="Coming soon" to="/content/comparisons" />
          </div>
        </Card>
      </div>

      {/* Pipeline + site health + activity */}
      <div className="grid gap-4 xl:grid-cols-3">
        <Card
          title="Content Pipeline"
          className="xl:col-span-2"
          actions={
            <Link to="/products" className="text-xs font-medium text-pink-600 hover:underline">
              View all products
            </Link>
          }
        >
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {(Object.keys(PIPELINE_LABELS) as PipelineStage[]).map((stage) => {
              const bucket = data.pipeline?.[stage] ?? { count: 0, products: [] };
              return (
                <PipelineColumn
                  key={stage}
                  label={PIPELINE_LABELS[stage]}
                  count={bucket.count}
                  products={bucket.products}
                  filter={PIPELINE_FILTER[stage]}
                />
              );
            })}
          </div>
        </Card>

        <Card title="Site Health">
          <ul className="space-y-3">
            <HealthRow
              icon="science"
              label="Testing coverage"
              hint="Products with completed test runs"
              ok={data.siteHealth.testingCoverage.ok}
              total={data.siteHealth.testingCoverage.total}
              pct={data.siteHealth.testingCoverage.pct}
              warnBelow={50}
            />
            <HealthRow
              icon="history"
              label="Retesting"
              hint="Products currently due for retesting"
              ok={data.siteHealth.retesting.ok ? data.siteHealth.testingCoverage.total : data.siteHealth.testingCoverage.total - data.siteHealth.retesting.due}
              total={data.siteHealth.testingCoverage.total}
              customStatus={data.siteHealth.retesting.ok ? 'Good' : `${data.siteHealth.retesting.due} due`}
              warn={!data.siteHealth.retesting.ok}
            />
            <HealthRow
              icon="payments"
              label="Pricing freshness"
              hint="Prices verified within the required period"
              ok={data.siteHealth.pricingFreshness.ok}
              total={data.siteHealth.pricingFreshness.total}
              pct={data.siteHealth.pricingFreshness.pct}
              warnBelow={80}
            />
            <HealthRow
              icon="link"
              label="Affiliate links"
              hint="Healthy affiliate links"
              ok={data.siteHealth.affiliateLinks.ok}
              total={data.siteHealth.affiliateLinks.total}
              pct={data.siteHealth.affiliateLinks.pct}
              warnBelow={100}
            />
            <HealthRow
              icon="travel_explore"
              label="SEO metadata"
              hint="Products with complete metadata"
              ok={data.siteHealth.seoMetadata.ok}
              total={data.siteHealth.seoMetadata.total}
              pct={data.siteHealth.seoMetadata.pct}
              warnBelow={100}
            />
          </ul>
          <Link
            to="/seo/overview"
            className="mt-4 inline-block text-xs font-medium text-pink-600 hover:underline"
          >
            View full site health
          </Link>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card
          title="Recent Activity"
          actions={
            <Link to="/administration/audit" className="text-xs font-medium text-pink-600 hover:underline">
              View all activity
            </Link>
          }
        >
          {data.recentActivity.length === 0 ? (
            <p className="text-sm text-slate-400">No recent activity recorded yet.</p>
          ) : (
            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
              {data.recentActivity.map((item) => (
                <li key={item.id} className="flex gap-3 py-2.5 first:pt-0 last:pb-0">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500 dark:bg-slate-800">
                    <Icon name={item.icon} className="!text-[16px]" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{item.title}</p>
                    {item.detail && (
                      <p className="text-xs text-slate-500 dark:text-slate-400">{item.detail}</p>
                    )}
                  </div>
                  <span className="shrink-0 text-xs text-slate-400">{fmtRelative(item.createdAt)}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card
          title="Homepage Overview"
          actions={
            canHomepage ? (
              <Link to="/homepage">
                <Button variant="secondary" className="text-xs">
                  <Icon name="open_in_new" className="!text-[14px]" /> Manage homepage
                </Button>
              </Link>
            ) : undefined
          }
        >
          <div className="space-y-4">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Top picks</p>
              {data.topPicks.length === 0 ? (
                <p className="text-sm text-slate-400">No top picks configured.</p>
              ) : (
                <ul className="flex flex-wrap gap-2">
                  {data.topPicks.map((pick) => (
                    <li
                      key={pick.id}
                      className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 py-1 pl-1 pr-3 text-sm dark:border-slate-700 dark:bg-slate-800/60"
                    >
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-pink-100 text-xs font-bold text-pink-700 dark:bg-pink-950 dark:text-pink-300">
                        {pick.position}
                      </span>
                      {pick.avatarUrl ? (
                        <img src={pick.avatarUrl} alt="" className="h-6 w-6 rounded-full object-cover" />
                      ) : (
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-200 text-[10px] dark:bg-slate-700">
                          <Icon name="inventory_2" className="!text-[14px]" />
                        </span>
                      )}
                      <span className="font-medium text-slate-800 dark:text-slate-200">{pick.name}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                Featured characters
              </p>
              {data.featuredCharacters.length === 0 ? (
                <p className="text-sm text-slate-400">No featured characters configured.</p>
              ) : (
                <ul className="flex flex-wrap gap-3">
                  {data.featuredCharacters.map((char) => (
                    <li key={char.id} className="flex flex-col items-center gap-1 text-center">
                      {char.avatarUrl ? (
                        <img
                          src={char.avatarUrl}
                          alt=""
                          className="h-12 w-12 rounded-full border-2 border-white object-cover shadow-sm dark:border-slate-700"
                        />
                      ) : (
                        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-200 dark:bg-slate-700">
                          <Icon name="person" className="!text-[20px] text-slate-500" />
                        </span>
                      )}
                      <span className="max-w-[5rem] truncate text-xs font-medium text-slate-700 dark:text-slate-300">
                        {char.name}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

function buildIssues(data: DashboardData): AttentionIssue[] {
  const issues: AttentionIssue[] = [];

  if (data.draftProducts.length > 0) {
    issues.push({
      id: 'drafts',
      icon: 'draft',
      title: `${data.draftProducts.length} product${data.draftProducts.length === 1 ? '' : 's'} in draft`,
      description: 'Draft reviews waiting for your review.',
      priority: 'High',
      actionLabel: 'Review drafts',
      to: '/products?status=draft',
    });
  }
  if (data.stalePrices.length > 0) {
    issues.push({
      id: 'prices',
      icon: 'payments',
      title: `${data.stalePrices.length} product${data.stalePrices.length === 1 ? '' : 's'} need pricing verification`,
      description: 'Prices have not been verified recently.',
      priority: 'High',
      actionLabel: 'Verify prices',
      to: '/products',
    });
  }
  if (data.productsMissingTestRun.length > 0) {
    issues.push({
      id: 'missing-test',
      icon: 'science',
      title: `${data.productsMissingTestRun.length} product${data.productsMissingTestRun.length === 1 ? '' : 's'} missing a test run`,
      description: 'No completed test run exists for these products.',
      priority: 'Medium',
      actionLabel: 'Start test',
      to: '/testing/runs',
    });
  }
  if (data.dueForRetest.length > 0) {
    issues.push({
      id: 'retest',
      icon: 'history',
      title: `${data.dueForRetest.length} product${data.dueForRetest.length === 1 ? '' : 's'} due for retesting`,
      description: 'Published products past the retest window.',
      priority: 'Medium',
      actionLabel: 'View products',
      to: '/products?status=published',
    });
  }
  if (data.missingSeo.length > 0) {
    issues.push({
      id: 'seo',
      icon: 'travel_explore',
      title: `${data.missingSeo.length} product${data.missingSeo.length === 1 ? '' : 's'} missing SEO metadata`,
      description: 'Published pages need title and description.',
      priority: 'Medium',
      actionLabel: 'Fix metadata',
      to: '/seo/pages?issue=missing-description',
    });
  }
  if (data.problemLinks.length > 0) {
    issues.push({
      id: 'links',
      icon: 'link_off',
      title: `${data.problemLinks.length} broken or expired affiliate link${data.problemLinks.length === 1 ? '' : 's'}`,
      description: 'Links need attention before they affect monetization.',
      priority: 'High',
      actionLabel: 'Check links',
      to: '/monetization/affiliate-links',
    });
  }
  if (data.productsWithoutPublishedRun.length > 0) {
    issues.push({
      id: 'no-live-score',
      icon: 'scoreboard',
      title: `${data.productsWithoutPublishedRun.length} published product${data.productsWithoutPublishedRun.length === 1 ? '' : 's'} without live scores`,
      description: 'Published but no current published test run.',
      priority: 'High',
      actionLabel: 'View products',
      to: '/products?status=published',
    });
  }
  if (data.runsAwaitingReview.length > 0) {
    issues.push({
      id: 'review-runs',
      icon: 'rate_review',
      title: `${data.runsAwaitingReview.length} test run${data.runsAwaitingReview.length === 1 ? '' : 's'} awaiting review`,
      description: 'Completed runs ready for approval or publishing.',
      priority: 'Medium',
      actionLabel: 'Review runs',
      to: '/testing/runs',
    });
  }
  if (data.scheduled.length > 0) {
    issues.push({
      id: 'scheduled',
      icon: 'schedule',
      title: `${data.scheduled.length} scheduled publication${data.scheduled.length === 1 ? '' : 's'}`,
      description: 'Products queued to go live.',
      priority: 'Low',
      actionLabel: 'View schedule',
      to: '/products?status=scheduled',
    });
  }

  const order = { High: 0, Medium: 1, Low: 2 };
  return issues.sort((a, b) => order[a.priority] - order[b.priority]);
}

function priorityTone(p: AttentionIssue['priority']) {
  if (p === 'High') return 'red' as const;
  if (p === 'Medium') return 'amber' as const;
  return 'gray' as const;
}

function SummaryCard({
  icon,
  iconTone,
  label,
  value,
  hint,
  to,
  warn,
  healthy,
}: {
  icon: string;
  iconTone: 'pink' | 'amber' | 'green' | 'red';
  label: string;
  value: number;
  hint: string;
  to?: string;
  warn?: boolean;
  healthy?: boolean;
}) {
  const toneClasses = {
    pink: 'bg-pink-50 text-pink-600 dark:bg-pink-950/50 dark:text-pink-400',
    amber: 'bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400',
    green: 'bg-green-50 text-green-600 dark:bg-green-950/50 dark:text-green-400',
    red: 'bg-red-50 text-red-600 dark:bg-red-950/50 dark:text-red-400',
  };
  const inner = (
    <div
      className={`rounded-xl border bg-white p-4 shadow-sm transition-shadow hover:shadow-md dark:bg-slate-900 ${
        warn
          ? 'border-amber-200 dark:border-amber-900/60'
          : healthy
            ? 'border-green-200 dark:border-green-900/60'
            : 'border-slate-200 dark:border-slate-800'
      } ${to ? 'cursor-pointer' : ''}`}
    >
      <div className="flex items-start justify-between gap-2">
        <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${toneClasses[iconTone]}`}>
          <Icon name={icon} className="!text-[20px]" />
        </span>
        <span className="text-2xl font-bold tabular-nums text-slate-900 dark:text-slate-100">{value}</span>
      </div>
      <p className="mt-2 text-sm font-semibold text-slate-800 dark:text-slate-200">{label}</p>
      <p className="text-xs text-slate-500 dark:text-slate-400">{hint}</p>
    </div>
  );
  return to ? <Link to={to}>{inner}</Link> : inner;
}

function QuickAction({
  icon,
  title,
  hint,
  to,
}: {
  icon: string;
  title: string;
  hint: string;
  to: string;
}) {
  return (
    <Link
      to={to}
      className="group rounded-lg border border-slate-200 bg-slate-50/50 p-3 transition-colors hover:border-pink-200 hover:bg-pink-50/50 dark:border-slate-700 dark:bg-slate-800/40 dark:hover:border-pink-900 dark:hover:bg-pink-950/30"
    >
      <Icon name={icon} className="!text-[20px] text-pink-600 dark:text-pink-400" />
      <p className="mt-2 text-sm font-semibold text-slate-800 group-hover:text-pink-700 dark:text-slate-200">
        {title}
      </p>
      <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{hint}</p>
    </Link>
  );
}

function PipelineColumn({
  label,
  count,
  products,
  filter,
}: {
  label: string;
  count: number;
  products: { id: string; name: string }[];
  filter: string;
}) {
  const shown = products.slice(0, 5);
  const more = products.length - shown.length;
  const listTo = filter === 'testing' ? '/testing/runs' : `/products?status=${filter}`;
  return (
    <div className="rounded-lg border border-slate-100 bg-slate-50/60 p-3 dark:border-slate-800 dark:bg-slate-800/40">
      <Link to={listTo} className="group block">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
        <p className="mt-0.5 text-lg font-bold text-slate-900 group-hover:text-pink-600 dark:text-slate-100">
          {count}
        </p>
      </Link>
      <ul className="mt-2 space-y-1">
        {shown.length === 0 ? (
          <li className="text-xs text-slate-400">—</li>
        ) : (
          shown.map((p) => (
            <li key={p.id}>
              <Link
                to={`/products/${p.id}`}
                className="block truncate text-xs font-medium text-slate-600 hover:text-pink-600 dark:text-slate-400"
              >
                {p.name}
              </Link>
            </li>
          ))
        )}
        {more > 0 && (
          <li>
            <Link to={listTo} className="text-xs font-medium text-pink-600 hover:underline">
              +{more} more
            </Link>
          </li>
        )}
      </ul>
    </div>
  );
}

function HealthRow({
  icon,
  label,
  hint,
  ok,
  total,
  pct,
  customStatus,
  warn,
  warnBelow = 100,
}: {
  icon: string;
  label: string;
  hint: string;
  ok: number;
  total: number;
  pct?: number;
  customStatus?: string;
  warn?: boolean;
  warnBelow?: number;
}) {
  const needsAction = warn ?? (pct != null && pct < warnBelow);
  const statusText =
    customStatus ?? (total ? `${ok} / ${total} — ${pct}%` : '—');
  return (
    <li className="flex items-start gap-3">
      <span
        className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md ${
          needsAction
            ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400'
            : 'bg-green-50 text-green-600 dark:bg-green-950/50 dark:text-green-400'
        }`}
      >
        <Icon name={needsAction ? 'warning' : 'check_circle'} className="!text-[16px]" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{label}</p>
          <span
            className={`shrink-0 text-xs font-medium tabular-nums ${
              needsAction ? 'text-amber-600 dark:text-amber-400' : 'text-green-600 dark:text-green-400'
            }`}
          >
            {statusText}
          </span>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400">{hint}</p>
      </div>
      <Icon name={icon} className="!text-[16px] shrink-0 text-slate-300 dark:text-slate-600" />
    </li>
  );
}

function fmtRelative(ms: number): string {
  const diff = Date.now() - ms;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return fmtDate(ms);
}
