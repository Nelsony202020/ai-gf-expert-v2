/** @deprecated No products currently hide gallery imagery. Kept for call-site compatibility. */
export const HIDDEN_PRODUCT_IMAGE_SLUGS = new Set<string>();

export function hasHiddenProductImage(_slug: string): boolean {
  return false;
}
