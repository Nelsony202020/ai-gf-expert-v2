import { organizationConfig } from '../../../data/organization';
import { websiteId } from './ids';
import type { JsonLdNode } from './omitEmpty';
import { buildOrganizationRef } from './organization';

export function buildWebsiteSchema(): JsonLdNode {
  return {
    '@type': 'WebSite',
    '@id': websiteId(),
    url: organizationConfig.url,
    name: organizationConfig.name,
    description: organizationConfig.description,
    publisher: buildOrganizationRef(),
  };
}
