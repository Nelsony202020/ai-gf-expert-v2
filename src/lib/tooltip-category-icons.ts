/** Canonical category keys used for tooltip border icons. */

export type TooltipCategoryKey =
  | 'general'
  | 'characters'
  | 'customization'
  | 'chat'
  | 'chat-features'
  | 'images'
  | 'video'
  | 'privacy'
  | 'pricing';

export const TOOLTIP_CATEGORY_ICON_FILES: Record<TooltipCategoryKey, string> = {
  general: '/brand/tooltip-categories/general.png',
  characters: '/brand/tooltip-categories/characters.png',
  customization: '/brand/tooltip-categories/customization.png',
  chat: '/brand/tooltip-categories/chat.png',
  'chat-features': '/brand/tooltip-categories/chat-features.png',
  images: '/brand/tooltip-categories/images.png',
  video: '/brand/tooltip-categories/video.png',
  privacy: '/brand/tooltip-categories/privacy.png',
  pricing: '/brand/tooltip-categories/pricing.png',
};

/** Map glossary display labels + rating category keys → icon key. */
const CATEGORY_ALIASES: Record<string, TooltipCategoryKey> = {
  general: 'general',
  characters: 'characters',
  customization: 'customization',
  chat: 'chat',
  'chat features': 'chat-features',
  'chat-features': 'chat-features',
  images: 'images',
  video: 'video',
  videos: 'video',
  privacy: 'privacy',
  pricing: 'pricing',
};

export function normalizeTooltipCategoryKey(raw?: string | null): TooltipCategoryKey {
  const key = String(raw ?? '')
    .trim()
    .toLowerCase()
    .replace(/[_/]+/g, '-')
    .replace(/\s+/g, ' ');
  return CATEGORY_ALIASES[key] ?? CATEGORY_ALIASES[key.replace(/\s+/g, '-')] ?? 'general';
}

/** Absolute public path (no CDN) — safe for admin/browser code. */
export function getTooltipCategoryIconLocal(category?: string | null): string {
  const key = normalizeTooltipCategoryKey(category);
  return TOOLTIP_CATEGORY_ICON_FILES[key];
}
