import type { AuthorProfile } from '../../../data/authors';
import { cdnAsset } from '../../media/cdn';
import { isLocalUrl, PRODUCTION_SITE_ORIGIN } from '../../siteOrigin';
import { absoluteUrl, personId } from './ids';
import type { JsonLdNode } from './omitEmpty';
import { buildOrganizationRef } from './organization';

function absoluteAssetUrl(pathOrUrl: string): string | undefined {
  const trimmed = pathOrUrl.trim();
  if (!trimmed) return undefined;
  if (/^https?:\/\//i.test(trimmed)) {
    return isLocalUrl(trimmed) ? undefined : trimmed;
  }
  const viaCdn = cdnAsset(trimmed.startsWith('/') ? trimmed : `/${trimmed}`);
  if (/^https?:\/\//i.test(viaCdn) && !isLocalUrl(viaCdn)) return viaCdn;
  return `${PRODUCTION_SITE_ORIGIN}${trimmed.startsWith('/') ? trimmed : `/${trimmed}`}`;
}

/** Full Person node for author profile pages. */
export function buildPersonSchema(author: AuthorProfile): JsonLdNode {
  const sameAs = author.socials.map((s) => s.url).filter((u) => u && !isLocalUrl(u));
  const image = absoluteAssetUrl(author.photo ?? author.avatar);

  return {
    '@type': 'Person',
    '@id': personId(author.slug),
    name: author.name,
    url: absoluteUrl(author.profileUrl),
    image,
    jobTitle: author.title,
    description: author.bio,
    sameAs: sameAs.length > 0 ? sameAs : undefined,
    worksFor: buildOrganizationRef(),
  };
}

/**
 * Person reference for Review.author.
 * Google Product snippets require `name` even when `@id` is present.
 */
export function buildPersonRef(author: {
  name: string;
  slug?: string;
}): JsonLdNode {
  if (author.slug) {
    return {
      '@type': 'Person',
      '@id': personId(author.slug),
      name: author.name,
    };
  }
  return { '@type': 'Person', name: author.name };
}
