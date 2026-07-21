/** Explore mega menu — update links as content is published. */

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
      { label: 'FantasyGF Review', href: '#' },
      { label: 'DreamGF Review', href: '#' },
      { label: 'Candy AI Review', href: '#' },
      { label: 'Kindroid Review', href: '#' },
    ],
    viewAll: { label: 'View all reviews', href: '/' },
  },
  {
    id: 'best-picks',
    title: 'Best Picks',
    icon: 'emoji_events',
    description: 'Curated lists to help you find the best AI girlfriend apps.',
    links: [
      { label: 'Best AI Girlfriend Apps', href: '/best/ai-girlfriend' },
      { label: 'Best Free AI Girlfriends', href: '#' },
      { label: 'Most Realistic AI Girlfriends', href: '#' },
      { label: 'Best AI Roleplay Apps', href: '#' },
      { label: 'Best AI Sexting Apps', href: '#' },
    ],
    viewAll: { label: 'View all best picks', href: '/best/ai-girlfriend' },
  },
  {
    id: 'guides',
    title: 'Guides',
    icon: 'menu_book',
    description: 'Expert guides and tips to get the most from AI companions.',
    links: [
      { label: 'AI Girlfriend Buying Guide', href: '#' },
      { label: 'Getting Started', href: '#' },
      { label: 'Privacy & Safety', href: '#' },
      { label: 'Pricing Guides', href: '#' },
      { label: 'Prompting Tips', href: '#' },
    ],
    viewAll: { label: 'View all guides', href: '#' },
  },
];
