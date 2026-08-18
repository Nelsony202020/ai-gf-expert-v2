// SEO Sitemaps: one sitemap index (/sitemap.xml) is submitted to Google.
// It points at five sub-sitemaps, all generated from the URL registry —
// nothing here is maintained by hand.

import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Badge, Card, ErrorNote, Icon, Spinner } from '../../ui';
import { useUrlRegistry, type RegistryUrl } from './registry';

const SUB_SITEMAPS: { key: string; path: string; label: string; description: string }[] = [
  { key: 'pages', path: '/sitemap-pages.xml', label: 'General pages', description: 'Homepage, archives, About, Contact, Editorial Guidelines, authors, legal pages' },
  { key: 'reviews', path: '/sitemap-reviews.xml', label: 'Reviews', description: 'Individual published app reviews' },
  { key: 'methodology', path: '/sitemap-methodology.xml', label: 'Methodology', description: 'How We Test plus category and subscore methodology pages' },
  { key: 'guides', path: '/sitemap-guides.xml', label: 'Guides', description: 'Individual published guides' },
  { key: 'roundups', path: '/sitemap-roundups.xml', label: 'Roundups', description: 'Individual published roundups' },
];

interface SubSitemapStat {
  key: string;
  path: string;
  label: string;
  description: string;
  urls: RegistryUrl[];
  problems: string[];
}

export function SeoSitemapsPage() {
  const { registry, error, loading } = useUrlRegistry();
  const [showChildren, setShowChildren] = useState(true);
  const [expandedChild, setExpandedChild] = useState<string | null>(null);

  const subs = useMemo<SubSitemapStat[]>(() => {
    if (!registry) return [];
    const inSitemap = registry.urls.filter((r) => r.inXmlSitemap);
    return SUB_SITEMAPS.map((def) => {
      const urls = inSitemap.filter((r) => (r.sitemapSection ?? 'pages') === def.key);
      const problems: string[] = [];
      const noindexIncluded = urls.filter((u) => u.indexing === 'noindex');
      const draftsIncluded = urls.filter((u) => u.issues.some((i) => i.code === 'draft-in-sitemap'));
      if (noindexIncluded.length > 0) problems.push(`${noindexIncluded.length} hidden page${noindexIncluded.length > 1 ? 's' : ''} included`);
      if (draftsIncluded.length > 0) problems.push(`${draftsIncluded.length} draft${draftsIncluded.length > 1 ? 's' : ''} included`);
      if (urls.length === 0) problems.push('Empty');
      return { ...def, urls, problems };
    });
  }, [registry]);

  if (error) return <ErrorNote message={error} />;
  if (loading || !registry) return <Spinner />;

  const totalUrls = subs.reduce((n, s) => n + s.urls.length, 0);
  const totalProblems = subs.reduce((n, s) => n + s.problems.filter((p) => p !== 'Empty').length, 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold">Sitemaps</h2>
          <p className="text-sm text-slate-500">
            You submit exactly one sitemap to Google: <code className="font-mono text-xs">/sitemap.xml</code>. It is an
            index that points at {SUB_SITEMAPS.length} sub-sitemaps, and Google scans all of them from that one URL.
          </p>
        </div>
        <a
          href="/sitemap/"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 hover:border-pink-300 hover:text-pink-700 dark:border-slate-700 dark:text-slate-300"
        >
          <Icon name="map" className="!text-[16px]" /> HTML sitemap
        </a>
      </div>

      {/* The one sitemap submitted to Google */}
      <Card>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-pink-100 text-pink-700 dark:bg-pink-950/60 dark:text-pink-300">
            <Icon name="account_tree" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm font-semibold">/sitemap.xml</span>
              <Badge tone="green">Submit this one URL to Google</Badge>
            </div>
            <p className="text-xs text-slate-400">
              Sitemap index · {totalUrls} URLs across {SUB_SITEMAPS.length} sub-sitemaps ·{' '}
              {totalProblems === 0 ? 'no problems' : `${totalProblems} problem${totalProblems > 1 ? 's' : ''}`}
            </p>
          </div>
          <a
            href="/sitemap.xml"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 hover:border-pink-300 hover:text-pink-700 dark:border-slate-700 dark:text-slate-300"
          >
            <Icon name="code" className="!text-[16px]" /> Open XML
          </a>
          <button
            type="button"
            onClick={() => setShowChildren((v) => !v)}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 hover:border-pink-300 hover:text-pink-700 dark:border-slate-700 dark:text-slate-300"
          >
            <Icon name={showChildren ? 'expand_less' : 'expand_more'} className="!text-[16px]" />
            {showChildren ? 'Hide sub-sitemaps' : 'View sub-sitemaps'}
          </button>
        </div>

        {showChildren && (
          <div className="mt-4 space-y-2 border-t border-slate-100 pt-3 dark:border-slate-800">
            {subs.map((s) => (
              <div key={s.key} className="rounded-lg border border-slate-200/70 dark:border-slate-800">
                <div className="flex items-center gap-3 px-3 py-2.5">
                  <span className="text-slate-300 dark:text-slate-600">└─</span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold">{s.label}</span>
                      <code className="font-mono text-xs text-slate-400">{s.path}</code>
                    </div>
                    <p className="truncate text-xs text-slate-400">{s.description}</p>
                  </div>
                  <span className="text-sm tabular-nums text-slate-500">{s.urls.length} URL{s.urls.length === 1 ? '' : 's'}</span>
                  {s.problems.filter((p) => p !== 'Empty').length > 0 ? (
                    <div className="flex gap-1">
                      {s.problems.filter((p) => p !== 'Empty').map((p) => (
                        <Badge key={p} tone="red">{p}</Badge>
                      ))}
                    </div>
                  ) : s.urls.length === 0 ? (
                    <Badge tone="gray">Empty</Badge>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs text-green-700 dark:text-green-400">
                      <Icon name="check" className="!text-[15px]" /> OK
                    </span>
                  )}
                  <a
                    href={s.path}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-medium text-slate-500 hover:text-pink-700 hover:underline"
                  >
                    Open XML
                  </a>
                  <button
                    type="button"
                    onClick={() => setExpandedChild(expandedChild === s.key ? null : s.key)}
                    className="text-xs font-medium text-pink-600 hover:underline"
                  >
                    {expandedChild === s.key ? 'Hide URLs' : 'View URLs'}
                  </button>
                </div>
                {expandedChild === s.key && (
                  <div className="border-t border-slate-100 px-3 py-2 dark:border-slate-800">
                    {s.urls.length === 0 ? (
                      <p className="py-1 text-xs text-slate-400">No URLs in this sub-sitemap yet.</p>
                    ) : (
                      <ul className="max-h-64 space-y-0.5 overflow-y-auto">
                        {s.urls.map((u) => (
                          <li key={u.path} className="flex items-center gap-2 text-xs">
                            <code className="font-mono text-slate-600 dark:text-slate-400">{u.path}</code>
                            <span className="truncate text-slate-400">{u.title}</span>
                            {u.indexing === 'noindex' && <Badge tone="red">hidden but submitted</Badge>}
                          </li>
                        ))}
                      </ul>
                    )}
                    <div className="mt-2">
                      <Link
                        to={`/seo/pages?group=${s.key}`}
                        className="text-xs font-medium text-pink-600 hover:underline"
                      >
                        Open in Pages with this filter →
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card>
        <h3 className="mb-1 text-sm font-semibold">How the sitemaps are generated</h3>
        <p className="text-sm text-slate-500">
          <code className="font-mono text-xs">/sitemap.xml</code> and its sub-sitemaps are rendered from{' '}
          <code className="font-mono text-xs">src/lib/sitemap.ts</code> plus published products from the database.
          Publishing, unpublishing, or drafting a page updates them automatically — never maintain sitemap URLs by
          hand. Pages set to draft from the admin are excluded automatically.
        </p>
      </Card>
    </div>
  );
}
