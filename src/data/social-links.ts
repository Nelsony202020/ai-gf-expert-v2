/** Canonical public profiles for AI Girlfriend Expert (brand). */
export const BRAND_SOCIAL = {
  youtube: 'https://www.youtube.com/@ai-girlfriend-expert?sub_confirmation=1',
  instagram: 'https://www.instagram.com/ai.girlfriend.expert/',
  tiktok: 'https://www.tiktok.com/@ai.girlfriend.expert',
  helpDeskYoutube: 'https://www.youtube.com/@ai-girlfriend-help-desk?sub_confirmation=1',
} as const;

export type BrandChannelIcon = 'youtube' | 'tiktok' | 'reddit';

export interface BrandChannel {
  label: string;
  descriptor: string;
  href: string;
  icon: BrandChannelIcon;
}

/** Public community links used by the footer and mobile menu. */
export const BRAND_CHANNELS: BrandChannel[] = [
  {
    label: 'AI Girlfriend Expert — YouTube',
    descriptor: 'Reviews, rankings & app testing',
    href: BRAND_SOCIAL.youtube,
    icon: 'youtube',
  },
  {
    label: 'AI Girlfriend Help Desk — YouTube',
    descriptor: 'Tutorials, FAQs & how-to guides',
    href: BRAND_SOCIAL.helpDeskYoutube,
    icon: 'youtube',
  },
  {
    label: 'TikTok',
    descriptor: '',
    href: BRAND_SOCIAL.tiktok,
    icon: 'tiktok',
  },
  {
    label: 'Reddit Community',
    descriptor: 'New community coming soon',
    href: '',
    icon: 'reddit',
  },
];

/** Organization schema sameAs — trailing slashes optional for Instagram. */
export const BRAND_SAME_AS: string[] = [
  BRAND_SOCIAL.instagram.replace(/\/$/, ''),
  BRAND_SOCIAL.tiktok,
  BRAND_SOCIAL.youtube,
];
