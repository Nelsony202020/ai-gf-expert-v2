// Guides loaded from Sanity at build time (empty when Sanity is not
// configured). Consumed by the guide routes and the sitemap.

import { listGuides, type GuideSummary } from '../lib/sanity/guides';

export const guides: GuideSummary[] = await listGuides();

export function getGuideSummary(slug: string): GuideSummary | undefined {
  return guides.find((g) => g.slug === slug);
}
