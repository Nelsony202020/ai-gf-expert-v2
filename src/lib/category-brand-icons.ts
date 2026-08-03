import { cdnAsset } from './media/cdn';

/** Maps rating category keys to branded icon assets in /public/brand/branded/ */
const rawCategoryBrandIcons: Record<string, string> = {
  characters: '/brand/branded/branded-characters.svg',
  customization: '/brand/branded/branded-customization.png',
  chat: '/brand/branded/branded-chat.png',
  'chat-features': '/brand/branded/branded-chat-features.svg',
  images: '/brand/branded/branded-images.svg',
  video: '/brand/branded/branded-video.svg',
  privacy: '/brand/branded/branded-privacy.svg',
  pricing: '/brand/branded/branded-pricing.svg',
};

export const categoryBrandIcons: Record<string, string> = Object.fromEntries(
  Object.entries(rawCategoryBrandIcons).map(([key, path]) => [key, cdnAsset(path)]),
);

export const categoryBrandIconsLight: Record<string, string> = {};

export function getCategoryBrandIcon(key: string): string | undefined {
  return categoryBrandIcons[key];
}

export function getCategoryBrandIconLight(key: string): string | undefined {
  return categoryBrandIconsLight[key];
}
