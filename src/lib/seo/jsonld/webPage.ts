import { absoluteUrl, websiteId } from './ids';
import type { JsonLdNode } from './omitEmpty';
import { buildBreadcrumbSchema, type BreadcrumbInput } from './breadcrumb';
import { buildOrganizationRef, buildOrganizationSchema } from './organization';

export function buildWebPageSchema(opts: {
  pathname: string;
  name: string;
  description?: string;
  breadcrumbs?: BreadcrumbInput[];
  mainEntityId?: string;
  includeOrganizationRef?: boolean;
}): JsonLdNode[] {
  const pageUrl = absoluteUrl(opts.pathname);
  const page: JsonLdNode = {
    '@type': 'WebPage',
    '@id': pageUrl,
    url: pageUrl,
    name: opts.name,
    description: opts.description,
    isPartOf: { '@id': websiteId() },
    publisher: buildOrganizationRef(),
  };
  if (opts.mainEntityId) {
    page.mainEntity = { '@id': opts.mainEntityId };
  }

  const graph: JsonLdNode[] = [page];
  if (opts.breadcrumbs?.length) {
    graph.push(buildBreadcrumbSchema(opts.pathname, opts.breadcrumbs));
  }
  if (opts.includeOrganizationRef !== false) {
    graph.push(buildOrganizationSchema({ full: false }));
  }
  return graph;
}
