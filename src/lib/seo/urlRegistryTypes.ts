// Client-safe types for the SEO URL registry (no server/Node imports).

export type RegistrySource = 'instantdb' | 'code' | 'generated' | 'redirect-map' | 'sanity';

export type RegistryStatus =
  | 'published'
  | 'draft'
  | 'preview'
  | 'redirect'
  | 'affiliate'
  | 'admin'
  | 'api'
  | 'legacy'
  | 'noindex';

export type RegistryIndexing = 'index' | 'noindex' | 'blocked' | 'canonicalized' | 'unknown';

export type RegistryView = 'search' | 'redirects' | 'technical';

export type IssueSeverity = 'error' | 'warning';

export interface RegistryIssue {
  code: string;
  label: string;
  severity: IssueSeverity;
  detail?: string;
}

export interface RegistryUrl {
  path: string;
  title: string;
  contentType: string;
  pageType: string;
  view: RegistryView;
  source: RegistrySource;
  sourceDetail: string;
  sourceFile?: string;
  status: RegistryStatus;
  recordStatus?: string;
  indexing: RegistryIndexing;
  access: 'public' | 'authenticated';
  sections?: string[];
  altPaths?: string[];
  seoTitle?: string;
  seoDescription?: string;
  h1Override?: string;
  canonicalUrl?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  noindexFlag?: boolean;
  nofollowFlag?: boolean;
  inXmlSitemap?: boolean;
  sitemapSection?: string;
  draftOverride?: boolean;
  destination?: string;
  redirectType?: number;
  redirectActive?: boolean;
  issues: RegistryIssue[];
  updatedAt?: number;
  editHref?: string;
  entity?: 'products' | 'roundups' | 'redirects' | 'affiliateLinks';
  recordId?: string;
  notes?: string;
}

export interface SuggestedRedirect {
  sourcePath: string;
  suggestedDestination?: string;
  reason: string;
}

export interface RegistrySummary {
  searchPages: number;
  indexable: number;
  noindex: number;
  needsAttention: number;
  redirects: number;
  notFound: number;
  totalUrls: number;
}

export interface IssueGroup {
  code: string;
  label: string;
  severity: IssueSeverity;
  count: number;
  paths: string[];
  view: RegistryView;
}

export interface UrlRegistry {
  generatedAt: string;
  siteOrigin: string;
  urls: RegistryUrl[];
  summary: RegistrySummary;
  issueGroups: IssueGroup[];
  suggestedRedirects: SuggestedRedirect[];
  robotsTxt: string | null;
}
