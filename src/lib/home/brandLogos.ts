/**
 * Square Product logo files used on the live roundup when InstantDB is not
 * configured locally. These match admin Setup → Product logo (title-logo URLs),
 * not gallery screenshots or horizontal brand wordmarks used as review heroes.
 */
const CDN = 'https://aigirlfriendpull.b-cdn.net';

export const SQUARE_PRODUCT_LOGO_BY_SLUG: Record<string, string> = {
  'ourdream-ai': `${CDN}/media/1785914888646-Ourdream_AI_Logo.webp`,
  'candy-ai': `${CDN}/media/shared/fee2c15c-da1d-40f1-bd66-6dcf6a87b866.jpg`,
  girlfriendgpt: `${CDN}/media/shared/b1d0f547-b7f0-4f23-9554-6b0e3b8a4a60.jpg`,
  'nectar-ai': `${CDN}/media/1786603603661-Nectar_AI.webp`,
  'juicychat-ai': `${CDN}/media/1786846462131-JuicyChat_AI_Logo.png`,
};

export function isPlaceholderLogo(url: string | undefined | null): boolean {
  const s = String(url ?? '').trim();
  if (!s) return true;
  return /picsum\.photos/i.test(s);
}

/** Product / ranking UI: square app logo only. Never use gallery/featured art. */
export function resolveSquareProductLogo(slug: string, current?: string | null): string {
  if (!isPlaceholderLogo(current)) return String(current);
  return SQUARE_PRODUCT_LOGO_BY_SLUG[slug] || current || '';
}
