/**
 * TEMPORARY (Aug 2026): products whose screenshot/gallery imagery is hidden
 * site-wide while a YouTube nudity-policy re-review is pending. The brand
 * logo is shown in place of the flagged photo wherever a card/carousel would
 * otherwise render one. Remove the slug once the re-review clears.
 */
export const HIDDEN_PRODUCT_IMAGE_SLUGS = new Set(['candy-ai']);

export function hasHiddenProductImage(slug: string): boolean {
  return HIDDEN_PRODUCT_IMAGE_SLUGS.has(slug);
}
