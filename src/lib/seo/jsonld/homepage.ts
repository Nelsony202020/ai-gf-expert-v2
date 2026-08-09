import type { JsonLdNode } from './omitEmpty';
import { buildOrganizationSchema } from './organization';
import { buildWebsiteSchema } from './website';

/** Homepage: full WebSite + Organization definitions. */
export function buildHomepageSchema(): JsonLdNode[] {
  return [buildWebsiteSchema(), buildOrganizationSchema({ full: true })];
}
