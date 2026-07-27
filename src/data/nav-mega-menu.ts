/** Explore mega menu — update links as content is published. */

import { buyingGuideSlug } from './buying-guide-content';

export interface MegaMenuLink {
  label: string;
  href: string;
}

export interface MegaMenuColumn {
  id: string;
  title: string;
  icon: string;
  description: string;
  links: MegaMenuLink[];
  viewAll: { label: string; href: string };
}

export const trustBadges = [
  {
    icon: 'verified_user',
    title: '100% Independent',
    sub: 'No sponsors. No bias.',
  },
  {
    icon: 'science',
    title: '200+ Hours Tested',
    sub: 'Hands-on testing and research.',
  },
  {
    icon: 'category',
    title: '20+ Categories',
    sub: 'Every detail that matters.',
  },
  {
    icon: 'groups',
    title: '50K+ Readers',
    sub: 'Trusted by thousands worldwide.',
  },
] as const;

export const megaMenuColumns: MegaMenuColumn[] = [
  {
    id: 'reviews',
    title: 'Reviews',
    icon: 'star',
    description: 'In-depth reviews and ratings of AI girlfriend platforms.',
    links: [
      { label: 'Aura AI Review', href: '/reviews/aura-ai' },
    ],
    viewAll: { label: 'View all reviews', href: '/reviews/' },
  },
  {
    id: 'best-picks',
    title: 'Best Picks',
    icon: 'emoji_events',
    description: 'Curated lists to help you find the best AI girlfriend apps.',
    links: [
      { label: 'Best AI Girlfriend Apps', href: '/best/ai-girlfriend' },
    ],
    viewAll: { label: 'View all best picks', href: '/best/ai-girlfriend' },
  },
  {
    id: 'guides',
    title: 'Guides',
    icon: 'menu_book',
    description: 'Practical guides to choosing and using AI girlfriend apps.',
    links: [
      {
        label: 'How to Choose an AI Girlfriend App',
        href: `/guides/${buyingGuideSlug}`,
      },
    ],
    viewAll: { label: 'View all guides', href: '/guides' },
  },
];
