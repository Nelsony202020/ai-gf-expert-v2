import { organizationConfig } from '../../../data/organization';
import { organizationId, websiteId } from './ids';
import type { JsonLdNode } from './omitEmpty';

export function buildWebsiteSchema(): JsonLdNode {
  return {
    '@type': 'WebSite',
    '@id': websiteId(),
    url: organizationConfig.url,
    name: organizationConfig.name,
    description: organizationConfig.description,
    publisher: { '@id': organizationId() },
  };
}
