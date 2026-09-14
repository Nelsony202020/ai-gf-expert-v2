/** Append YouTube subscribe confirmation for channel links. */
export function youtubeSubscribeUrl(channelUrl: string): string {
  const url = new URL(channelUrl);
  url.searchParams.set('sub_confirmation', '1');
  return url.toString();
}

/** Canonical public profiles for AI Girlfriend Expert (brand). */
export const BRAND_SOCIAL = {
  youtube: youtubeSubscribeUrl('https://www.youtube.com/@ai-girlfriend-expert'),
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
    label: 'AI Girlfriend Expert',
    descriptor: 'Reviews, rankings & app testing',
    href: BRAND_SOCIAL.youtube,
    icon: 'youtube',
  },
  {
    label: 'AI Girlfriend Help Desk',
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
    descriptor: 'Coming soon',
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
