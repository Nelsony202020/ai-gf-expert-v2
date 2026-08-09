import { organizationConfig, organizationLogoUrl } from '../../../data/organization';
import { organizationId, siteOrigin } from './ids';
import type { JsonLdNode } from './omitEmpty';

/** Canonical Organization node — reuse @id across pages. */
export function buildOrganizationSchema(opts?: { full?: boolean }): JsonLdNode {
  const full = opts?.full ?? true;
  if (!full) {
    return { '@type': 'Organization', '@id': organizationId() };
  }

  return {
    '@type': 'Organization',
    '@id': organizationId(),
    name: organizationConfig.name,
    legalName: organizationConfig.legalName,
    url: organizationConfig.url,
    description: organizationConfig.description,
    logo: {
      '@type': 'ImageObject',
      url: organizationLogoUrl(),
    },
    sameAs: organizationConfig.sameAs,
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer service',
      email: organizationConfig.email,
      url: `${siteOrigin()}/contact/`,
    },
  };
}
