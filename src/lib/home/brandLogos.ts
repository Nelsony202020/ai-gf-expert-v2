/** Production Bunny logos for localhost when InstantDB media is unavailable. */
const CDN = 'https://aigirlfriendpull.b-cdn.net';

export const BRAND_LOGO_BY_SLUG: Record<string, string> = {
  'ourdream-ai': `${CDN}/media/1785914888646-Ourdream_AI_Logo.webp`,
  'candy-ai': `${CDN}/media/shared/fee2c15c-da1d-40f1-bd66-6dcf6a87b866.jpg`,
  girlfriendgpt: `${CDN}/media/girlfriendgpt/6ab6b560-90a8-40a1-81ee-35197de313a0.png`,
  'nectar-ai': `${CDN}/media/1786603603661-Nectar_AI.webp`,
  'juicychat-ai': `${CDN}/media/1786846462131-JuicyChat_AI_Logo.png`,
};

export function isPlaceholderLogo(url: string | undefined | null): boolean {
  const s = String(url ?? '').trim();
  if (!s) return true;
  return /picsum\.photos/i.test(s);
}

export function resolveBrandLogo(slug: string, current?: string | null): string {
  if (!isPlaceholderLogo(current)) return String(current);
  return BRAND_LOGO_BY_SLUG[slug] || current || '';
}
