/**
 * Shared JSON-LD builders for aigirlfriend.expert.
 *
 * Post-deploy Rich Results Test checklist:
 * - https://aigirlfriend.expert/
 * - https://aigirlfriend.expert/reviews/ourdream-ai/
 * - https://aigirlfriend.expert/reviews/candy-ai/
 * - https://aigirlfriend.expert/best/ai-girlfriend/
 * - https://aigirlfriend.expert/author/herman-carter/
 * - https://aigirlfriend.expert/test/
 * - https://aigirlfriend.expert/ai-girlfriend-apps/
 *
 * Confirm: no localhost, no AggregateRating, editorial reviewRating 0–10,
 * roundup/directory ItemList order matches default server-rendered lists,
 * pros/cons match page, author @id.
 */

export type { JsonLdNode } from './omitEmpty';
export { omitEmpty } from './omitEmpty';
export { buildJsonLdDocument, serializeJsonLd, assertNoLocalhostInGraph } from './serialize';
export {
  websiteId,
  organizationId,
  personId,
  productId,
  reviewId,
  reviewPageId,
  breadcrumbId,
  absoluteUrl,
} from './ids';
export { buildOrganizationSchema } from './organization';
export { buildWebsiteSchema } from './website';
export { buildHomepageSchema } from './homepage';
export { buildPersonSchema, buildPersonRef } from './person';
export { buildBreadcrumbSchema, type BreadcrumbInput } from './breadcrumb';
export { buildReviewProductSchema } from './reviewProduct';
export { buildRoundupItemListSchema } from './roundupItemList';
export { buildDirectoryItemListSchema } from './directoryItemList';
export { buildProfilePageSchema } from './profilePage';
export { buildWebPageSchema } from './webPage';
