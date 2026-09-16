export type SitemapContentType =
  | 'home'
  | 'hub'
  | 'review'
  | 'roundup'
  | 'guide'
  | 'directory'
  | 'test-hub'
  | 'test-category'
  | 'test-subscore'
  | 'test-archive'
  | 'methodology'
  | 'glossary'
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
  href: string;
  label: string;
}

export interface HtmlSitemapMethodologyLink extends HtmlSitemapLink {
  description: string;
}

export interface HtmlSitemapExploreColumn {
  heading: string;
  count: number;
  links: HtmlSitemapLink[];
}

export interface HtmlSitemapTestItem {
  href: string;
  label: string;
}

export interface HtmlSitemapSubcategory {
  href: string;
  label: string;
  slug: string;
  testCount: number;
  tests: HtmlSitemapTestItem[];
}

export interface HtmlSitemapTestCategory {
  slug: string;
  href: string;
  label: string;
  testCount: number;
  subcategoryCount: number;
  subcategories: HtmlSitemapSubcategory[];
}

export interface HtmlSitemapSearchHit {
  href: string;
  title: string;
  kind: string;
  location: string;
  section?: string;
  parent?: string;
  group: string;
  kindLabel: string;
  context?: string;
}

export interface HtmlSitemapSearchGroup {
  group: string;
  hits: HtmlSitemapSearchHit[];
}

export interface HtmlSitemapFullPage {
  reviewsCount: number;
  rankingsCount: number;
  roundupsCount: number;
  guidesCount: number;
  authorsCount: number;
  testsCount: number;
  reviews: HtmlSitemapExploreColumn;
  roundups: HtmlSitemapExploreColumn;
  guides: HtmlSitemapExploreColumn;
  authors: HtmlSitemapExploreColumn;
  testingPagesCount: number;
  testingCategoriesCount: number;
  testingSubcategoriesCount: number;
  methodologyPagesCount: number;
  categoryCount: number;
  subcategoryCount: number;
  scoredTestsCount: number;
  mainMethodology: HtmlSitemapMethodologyLink[];
  methodology: HtmlSitemapMethodologyLink[];
  testCategories: HtmlSitemapTestCategory[];
  supportingMethodology: HtmlSitemapLink[];
  supporting: HtmlSitemapLink[];
  resources: HtmlSitemapExploreColumn;
  resourcesCount: number;
  company: HtmlSitemapExploreColumn;
  legal: HtmlSitemapLink[];
  searchHits?: HtmlSitemapSearchHit[];
  seoTitle: string;
  seoDescription: string;
}
