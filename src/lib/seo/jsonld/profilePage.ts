import type { AuthorProfile } from '../../../data/authors';
import { absoluteUrl, organizationId, personId } from './ids';
import type { JsonLdNode } from './omitEmpty';
import { buildBreadcrumbSchema } from './breadcrumb';
import { buildOrganizationSchema } from './organization';
import { buildPersonSchema } from './person';
import { websiteId } from './ids';

export function buildProfilePageSchema(author: AuthorProfile): JsonLdNode[] {
  const pageUrl = absoluteUrl(author.profileUrl);
  const person = buildPersonSchema(author);

  const profilePage: JsonLdNode = {
    '@type': 'ProfilePage',
    '@id': pageUrl,
    url: pageUrl,
    name: author.name,
    description: author.bio,
    isPartOf: { '@id': websiteId() },
    mainEntity: { '@id': personId(author.slug) },
    publisher: { '@id': organizationId() },
  };

  return [
    profilePage,
    person,
    buildBreadcrumbSchema(author.profileUrl, [
      { label: 'Home', href: '/' },
      { label: author.name },
    ]),
    buildOrganizationSchema({ full: false }),
  ];
}
