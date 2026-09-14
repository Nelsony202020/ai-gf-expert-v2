import { BRAND_SOCIAL } from './social-links';
import type { BrandNav } from './brand-nav';

export interface SiteMobileMenuLink {
  label: string;
  href: string;
}

export interface SiteMobileMenuGroup {
  title: string;
  links: SiteMobileMenuLink[];
}

export interface SiteMobileSocialLink {
  label: string;
  href: string;
  platform: 'youtube' | 'instagram' | 'tiktok';
}

export function buildSiteMobileMenu(brandNav: BrandNav): SiteMobileMenuGroup[] {
  const groups: SiteMobileMenuGroup[] = [
    {
      title: 'Explore',
      links: [
        { label: 'Best AI Girlfriend Apps', href: '/best/ai-girlfriend/' },
        { label: 'Reviews', href: '/reviews/' },
        { label: 'Guides', href: '/guides/' },
      ],
    },
  ];

  if (brandNav.popular.length) {
    groups.push({
      title: 'Brands',
      links: brandNav.popular.map((brand) => ({ label: brand.name, href: brand.href })),
    });
  }

  groups.push(
    {
      title: 'Testing',
      links: [
        { label: 'How We Test', href: '/test/' },
        { label: 'Testing Categories', href: '/test/all/' },
        { label: 'How Scoring Works', href: '/test/tooltips/' },
      ],
    },
    {
      title: 'Resources',
      links: [
        { label: 'Glossary', href: '/glossary/' },
        { label: 'Site Index', href: '/sitemap/' },
      ],
    },
    {
      title: 'Company',
      links: [
        { label: 'About', href: '/about/' },
        { label: 'Herman Carter', href: '/author/herman-carter/' },
      ],
    },
  );

  return groups;
}

export const SITE_MOBILE_SOCIAL: SiteMobileSocialLink[] = [
  { label: 'YouTube', href: BRAND_SOCIAL.youtube, platform: 'youtube' },
  { label: 'Instagram', href: BRAND_SOCIAL.instagram, platform: 'instagram' },
  { label: 'TikTok', href: BRAND_SOCIAL.tiktok, platform: 'tiktok' },
];
