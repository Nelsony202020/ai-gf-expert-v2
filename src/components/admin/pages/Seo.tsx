// SEO overview pages: metadata completeness + canonical/indexing flags
// across products and roundups (editing happens on each record's SEO tab).

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { dataApi, type EntityRow } from '../api';
import { Card, Spinner, ErrorNote, Badge, Icon, EmptyState } from '../ui';

function useSeoRows() {
  const [products, setProducts] = useState<EntityRow[] | null>(null);
  const [roundups, setRoundups] = useState<EntityRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    dataApi.list('products').then((r) => setProducts(r.rows)).catch((e) => setError(e.message));
    dataApi.list('roundups').then((r) => setRoundups(r.rows)).catch((e) => setError(e.message));
  }, []);
  return { products, roundups, error };
}

export function SeoMetadataPage() {
  const { products, roundups, error } = useSeoRows();
  if (error) return <ErrorNote message={error} />;
  if (!products || !roundups) return <Spinner />;

  const rows = [
    ...products.map((p) => ({
      key: `p-${p.id}`,
      path: `/reviews/${p.slug}`,
      name: p.name,
      status: p.status,
      seoTitle: p.seoTitle,
      seoDescription: p.seoDescription,
      to: `/products/${p.id}`,
    })),
    ...roundups.map((r) => ({
      key: `r-${r.id}`,
      path: `/best/${r.slug}`,
      name: r.title,
      status: r.status,
      seoTitle: r.seoTitle,
      seoDescription: r.seoDescription,
      to: `/content/roundups/${r.id}`,
    })),
  ];

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-bold">SEO metadata</h2>
        <p className="text-sm text-slate-500">
          Completeness across managed pages. Edit metadata on each record's SEO tab.
        </p>
      </div>
      <Card>
        {rows.length === 0 ? (
          <EmptyState message="No managed pages yet." />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs uppercase text-slate-400">
                <th className="px-2 py-2">Page</th>
                <th className="px-2 py-2">Status</th>
                <th className="px-2 py-2">Title</th>
                <th className="px-2 py-2">Description</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.key} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-2 py-2">
                    <Link to={row.to} className="font-medium hover:text-pink-600">
                      {row.name}
                    </Link>
                    <div className="font-mono text-xs text-slate-400">{row.path}</div>
                  </td>
                  <td className="px-2 py-2">
                    <Badge tone={row.status === 'published' ? 'green' : 'gray'}>{row.status}</Badge>
                  </td>
                  <td className="px-2 py-2">
                    {row.seoTitle ? (
                      <span className="text-xs">{row.seoTitle}</span>
                    ) : (
                      <Badge tone="red">missing</Badge>
                    )}
                  </td>
                  <td className="px-2 py-2">
                    {row.seoDescription ? (
                      <Icon name="check" className="text-green-600" />
                    ) : (
                      <Badge tone="red">missing</Badge>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}

export function SeoIndexingPage() {
  const { products, roundups, error } = useSeoRows();
  if (error) return <ErrorNote message={error} />;
  if (!products || !roundups) return <Spinner />;

  const rows = [
    ...products.map((p) => ({
      key: `p-${p.id}`,
      path: `/reviews/${p.slug}`,
      name: p.name,
      canonicalUrl: p.canonicalUrl,
      noindex: p.noindex,
      nofollow: p.nofollow,
      to: `/products/${p.id}`,
    })),
    ...roundups.map((r) => ({
      key: `r-${r.id}`,
      path: `/best/${r.slug}`,
      name: r.title,
      canonicalUrl: r.canonicalUrl,
      noindex: r.noindex,
      nofollow: false,
      to: `/content/roundups/${r.id}`,
    })),
  ];

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-bold">Canonicals & indexing</h2>
        <p className="text-sm text-slate-500">
          Canonical URLs default to the page's own URL; overrides and robots flags are set per
          record.
        </p>
      </div>
      <Card>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-xs uppercase text-slate-400">
              <th className="px-2 py-2">Page</th>
              <th className="px-2 py-2">Canonical</th>
              <th className="px-2 py-2">noindex</th>
              <th className="px-2 py-2">nofollow</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.key} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="px-2 py-2">
                  <Link to={row.to} className="font-medium hover:text-pink-600">
                    {row.name}
                  </Link>
                  <div className="font-mono text-xs text-slate-400">{row.path}</div>
                </td>
                <td className="px-2 py-2 text-xs">
                  {row.canonicalUrl ? (
                    <span className="font-mono">{row.canonicalUrl}</span>
                  ) : (
                    <span className="text-slate-400">self (default)</span>
                  )}
                </td>
                <td className="px-2 py-2">
                  {row.noindex ? <Badge tone="red">noindex</Badge> : <span className="text-slate-300">—</span>}
                </td>
                <td className="px-2 py-2">
                  {row.nofollow ? <Badge tone="amber">nofollow</Badge> : <span className="text-slate-300">—</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
