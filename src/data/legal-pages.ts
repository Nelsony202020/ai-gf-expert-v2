export type LegalPageEntry = {
  slug: string;
  title: string;
  href: string;
  description: string;
  shortLabel?: string;
};

export const legalPages: LegalPageEntry[] = [
  {
    slug: 'terms',
    title: 'Terms of Service',
    href: '/legal/terms/',
    description: 'Rules for using AI Girlfriend Expert and our services.',
    shortLabel: 'Terms',
  },
  {
    slug: 'privacy',
    title: 'Privacy Policy',
    href: '/legal/privacy/',
    description: 'How we collect, use, and protect your personal information.',
    shortLabel: 'Privacy',
  },
  {
    slug: 'accessibility',
    title: 'Accessibility',
    href: '/legal/accessibility/',
    description: 'Our commitment to accessible design and inclusive browsing.',
    shortLabel: 'Accessibility',
  },
  {
    slug: 'affiliate-disclosure',
    title: 'Affiliate Disclosure',
    href: '/legal/affiliate-disclosure/',
    description: 'How affiliate links work and how we stay independent.',
    shortLabel: 'Affiliate',
  },
  {
    slug: 'copyright',
    title: 'Copyright Policy',
    href: '/legal/copyright/',
    description: 'Copyright, permissions, and content usage on our site.',
    shortLabel: 'Copyright',
  },
  {
    slug: 'disclaimer',
    title: 'Disclaimer',
    href: '/legal/disclaimer/',
    description: 'Limitations of liability and informational disclaimers.',
    shortLabel: 'Disclaimer',
  },
];

export function getLegalPage(slug: string): LegalPageEntry | undefined {
  return legalPages.find((page) => page.slug === slug);
}
