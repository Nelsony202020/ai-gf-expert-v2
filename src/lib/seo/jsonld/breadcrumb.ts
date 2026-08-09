import { absoluteUrl, breadcrumbId } from './ids';
import type { JsonLdNode } from './omitEmpty';

export interface BreadcrumbInput {
  label: string;
  /** Omit href for the current page (last crumb). */
  href?: string;
}

export function buildBreadcrumbSchema(
  pathname: string,
  items: BreadcrumbInput[],
): JsonLdNode {
  return {
    '@type': 'BreadcrumbList',
    '@id': breadcrumbId(pathname),
    itemListElement: items.map((item, index) => {
      const position = index + 1;
      const entry: JsonLdNode = {
        '@type': 'ListItem',
        position,
        name: item.label,
      };
      if (item.href) {
        entry.item = absoluteUrl(item.href);
      }
      return entry;
    }),
  };
}
