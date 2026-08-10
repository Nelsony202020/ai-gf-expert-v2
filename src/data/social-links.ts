/** Canonical public profiles for AI Girlfriend Expert (brand). */
export const BRAND_SOCIAL = {
  youtube: 'https://www.youtube.com/@ai-girlfriend-expert',
  instagram: 'https://www.instagram.com/ai.girlfriend.expert/',
  tiktok: 'https://www.tiktok.com/@ai.girlfriend.expert',
} as const;

/** Organization schema sameAs — trailing slashes optional for Instagram. */
export const BRAND_SAME_AS: string[] = [
  BRAND_SOCIAL.instagram.replace(/\/$/, ''),
  BRAND_SOCIAL.tiktok,
  BRAND_SOCIAL.youtube,
];
