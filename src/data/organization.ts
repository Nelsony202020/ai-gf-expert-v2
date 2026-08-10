// Canonical Organization / Website entity for JSON-LD and shared site identity.
// Keep factual — do not invent addresses, phones, or social profiles here.

import { cdnAsset, getCdnBaseUrl } from '../lib/media/cdn';
import { PRODUCTION_SITE_ORIGIN } from '../lib/siteOrigin';
import { companyLegalName } from './site-contact';
import { BRAND_SAME_AS } from './social-links';

export interface OrganizationConfig {
  name: string;
  legalName: string;
  url: string;
  description: string;
  email: string;
  sameAs: string[];
  /** Public logo path under /public (resolved to absolute CDN/production URL). */
  logoPath: string;
}

export const organizationConfig: OrganizationConfig = {
  name: 'AI Girlfriend Expert',
  legalName: companyLegalName,
  url: `${PRODUCTION_SITE_ORIGIN}/`,
  description:
    'Independent AI companion reviews based on data driven objective test results.',
  email: 'hermanjcarter@gmail.com',
  sameAs: BRAND_SAME_AS,
  logoPath: '/brand/girlfriend-expert-logo.png',
};

/** Absolute HTTPS logo URL for schema (never localhost). */
export function organizationLogoUrl(): string {
  const viaCdn = cdnAsset(organizationConfig.logoPath);
  if (/^https?:\/\//i.test(viaCdn) && !/localhost|127\.0\.0\.1/i.test(viaCdn)) {
    return viaCdn;
  }
  const base = getCdnBaseUrl();
  if (base) return `${base}${organizationConfig.logoPath}`;
  return `${PRODUCTION_SITE_ORIGIN}${organizationConfig.logoPath}`;
}
