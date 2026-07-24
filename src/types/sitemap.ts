export type SitemapContentType =
  | 'home'
  | 'review'
  | 'roundup'
  | 'guide'
  | 'directory'
  | 'test-hub'
  | 'test-category'
  | 'test-subscore'
  | 'test-archive'
  | 'methodology'
  | 'author'
  | 'legal'
  | 'company'
  | 'utility'
  | 'redirect';

export type SitemapSection =
  | 'reviews'
  | 'roundups'
  | 'guides'
  | 'tests'
  | 'authors'
  | 'resources'
  | 'legal'
  | 'company';

export interface SitemapEntry {
  title: string;
  url: string;
  contentType: SitemapContentType;
  parentCategory?: string;
  sitemapSection: SitemapSection;
  sitemapOrder: number;
  isPublished: boolean;
  showInHtmlSitemap: boolean;
  includeInXmlSitemap: boolean;
  lastmod?: string;
}

export interface HtmlSitemapLink {
  label: string;
  href: string;
}

export interface HtmlSitemapSection {
  id: string;
  title: string;
  count: number;
  icon: string;
  tone: 'amber' | 'lime' | 'green';
  links: HtmlSitemapLink[];
  viewAll: HtmlSitemapLink | null;
}
