// Shared client-side loader + display helpers for the SEO URL registry.

import { useCallback, useEffect, useState } from 'react';
import { api } from '../../api';
import type { UrlRegistry, RegistryUrl } from '../../../../lib/seo/urlRegistry';

export type { UrlRegistry, RegistryUrl };

let cached: UrlRegistry | null = null;

export function useUrlRegistry() {
  const [registry, setRegistry] = useState<UrlRegistry | null>(cached);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(!cached);

  const load = useCallback(async (refresh = false) => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.get<UrlRegistry>(`/api/admin/seo/urls${refresh ? '?refresh=1' : ''}`);
      cached = data;
      setRegistry(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load URL registry');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!cached) void load();
  }, [load]);

  return { registry, error, loading, reload: load };
}

/** Invalidate the client cache (after edits that change registry contents). */
export function invalidateRegistryCache() {
  cached = null;
}

// ---------------------------------------------------------------------------
// Display helpers
// ---------------------------------------------------------------------------

/** Preferred ordering for the page-type filter (types not listed sort last). */
export const PAGE_TYPE_ORDER = [
  // Main pages
  'Homepage',
  'App Directory',
  'Reviews page',
  'Guides page',
  'Testing page',
  'All Tests page',
  // Content
  'Review',
  'Guide',
  'Roundup',
  'Methodology',
  // Trust pages
  'Editorial Guidelines',
  'Author',
  'About',
  'Contact',
  'Legal',
  'Company page',
  // Utility & technical
  'HTML Sitemap',
  'XML Sitemap',
  'Redirect',
  'Affiliate link',
  'Admin page',
  'API route',
  'Preview page',
  'Page',
];

export function sortPageTypes(types: string[]): string[] {
  return [...types].sort((a, b) => {
    const ia = PAGE_TYPE_ORDER.indexOf(a);
    const ib = PAGE_TYPE_ORDER.indexOf(b);
    return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
  });
}

/** "Managed in" — where the content of a page is edited. */
export const SOURCE_LABELS: Record<string, string> = {
  instantdb: 'Admin',
  'redirect-map': 'Admin',
  code: 'Site code',
  generated: 'Site code',
  sanity: 'Sanity',
};

/** "Managed in" filter options (Sanity is hidden when no Sanity content exists). */
export const SOURCE_FILTERS: { value: string; label: string; matches: string[] }[] = [
  { value: 'admin', label: 'Admin', matches: ['instantdb', 'redirect-map'] },
  { value: 'code', label: 'Site code', matches: ['code', 'generated'] },
  { value: 'sanity', label: 'Sanity', matches: ['sanity'] },
];

/** How the URL is produced (secondary info, shown under "Managed in"). */
export function pageCreationLabel(row: RegistryUrl): 'Automatically generated' | 'Fixed page' {
  if (row.source === 'instantdb' || row.source === 'sanity' || row.source === 'generated') {
    return 'Automatically generated';
  }
  if (row.sourceFile?.includes('[')) return 'Automatically generated';
  return 'Fixed page';
}

export const VIEW_LABELS: Record<string, string> = {
  search: 'Search pages',
  redirects: 'Missing & redirects',
  technical: 'Technical routes',
};

export const STATUS_LABELS: Record<string, string> = {
  published: 'Published',
  draft: 'Draft',
  preview: 'Preview',
  redirect: 'Redirect',
  affiliate: 'Affiliate',
  admin: 'Admin',
  api: 'API',
  legacy: 'Legacy redirect',
  noindex: 'Published',
};

/** "Search visibility" — what Google can do with the page. */
export const INDEXING_LABELS: Record<string, string> = {
  index: 'Visible to Google',
  noindex: 'Hidden from Google',
  blocked: 'Blocked from crawling',
  canonicalized: 'Points to another page',
  unknown: 'Needs checking',
};

/** Short badge text for table cells. */
export const INDEXING_BADGES: Record<string, string> = {
  index: 'Visible',
  noindex: 'Hidden',
  blocked: 'Blocked',
  canonicalized: 'Points elsewhere',
  unknown: 'Check',
};

/** Page groups — mirror the child sitemaps. */
export const PAGE_GROUPS: { value: string; label: string }[] = [
  { value: 'pages', label: 'General pages' },
  { value: 'reviews', label: 'Reviews' },
  { value: 'methodology', label: 'Methodology' },
  { value: 'guides', label: 'Guides' },
  { value: 'roundups', label: 'Roundups' },
  { value: 'not-submitted', label: 'Not submitted to Google' },
];

export function pageGroupOf(row: RegistryUrl): string {
  return row.inXmlSitemap && row.sitemapSection ? row.sitemapSection : 'not-submitted';
}

export function pageGroupLabel(value: string): string {
  return PAGE_GROUPS.find((g) => g.value === value)?.label ?? value;
}

/** Groups of issue codes for the beginner-facing "Problem type" filter. */
export const PROBLEM_TYPES: { value: string; label: string; codes: string[] }[] = [
  { value: 'duplicate-url', label: 'Duplicate URL', codes: ['duplicate-url-variant', 'redirect-duplicate'] },
  {
    value: 'sitemap-status',
    label: 'Wrong sitemap status',
    codes: ['noindex-in-sitemap', 'redirect-in-sitemap', 'draft-in-sitemap'],
  },
  {
    value: 'redirect-issue',
    label: 'Redirect issue',
    codes: ['redirect-loop', 'redirect-chain', 'redirect-self', 'redirect-to-home', 'redirect-temporary', 'redirect-dest-unknown'],
  },
  {
    value: 'missing-metadata',
    label: 'Missing metadata',
    codes: ['missing-title', 'missing-description', 'title-too-long', 'title-too-short', 'duplicate-title'],
  },
  {
    value: 'canonical-issue',
    label: 'Canonical issue',
    codes: ['canonical-points-to-redirect', 'canonical-target-unknown', 'canonical-trailing-slash'],
  },
  { value: 'broken-page', label: 'Broken page', codes: ['no-page-file'] },
];

/** "Submitted by mistake" — in the sitemap but shouldn't be. */
export function submittedByMistake(row: RegistryUrl): boolean {
  return Boolean(
    row.inXmlSitemap &&
      row.issues.some((i) =>
        ['noindex-in-sitemap', 'redirect-in-sitemap', 'draft-in-sitemap'].includes(i.code),
      ),
  );
}

export function statusBadgeTone(status: string): 'gray' | 'green' | 'amber' | 'red' | 'blue' | 'pink' {
  switch (status) {
    case 'published':
      return 'green';
    case 'draft':
    case 'preview':
      return 'amber';
    case 'redirect':
    case 'legacy':
      return 'blue';
    case 'noindex':
      return 'gray';
    case 'affiliate':
      return 'pink';
    default:
      return 'gray';
  }
}

export function indexingBadgeTone(indexing: string): 'gray' | 'green' | 'amber' | 'red' | 'blue' | 'pink' {
  switch (indexing) {
    case 'index':
      return 'green';
    case 'noindex':
      return 'amber';
    case 'blocked':
      return 'gray';
    case 'canonicalized':
      return 'blue';
    default:
      return 'gray';
  }
}
