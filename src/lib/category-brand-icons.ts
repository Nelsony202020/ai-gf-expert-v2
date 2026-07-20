/** Maps rating category keys to branded icon assets in /public/brand/branded/ */
export const categoryBrandIcons: Record<string, string> = {
  characters: '/brand/branded/branded-characters.svg',
  customization: '/brand/branded/branded-customization.png',
  chat: '/brand/branded/branded-chat.svg',
  'chat-features': '/brand/branded/branded-chat-features.svg',
  images: '/brand/branded/branded-images.svg',
  video: '/brand/branded/branded-video.svg',
  privacy: '/brand/branded/branded-privacy.svg',
  pricing: '/brand/branded/branded-pricing.svg',
};

export function getCategoryBrandIcon(key: string): string | undefined {
  return categoryBrandIcons[key];
}
