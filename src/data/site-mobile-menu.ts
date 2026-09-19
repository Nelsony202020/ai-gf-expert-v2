import type { BrandNav } from './brand-nav';

export interface SiteMobileMenuLink {
  label: string;
  href: string;
  /** Lucide key from LUCIDE_MENU_ICONS. Omitted where no glyph is honest. */
  icon?: 'trophy' | 'star' | 'book-open';
}

export interface SiteMobileMenuGroup {
  title: string;
  /** 'primary' rows are the three we want tapped; 'secondary' is everything else. */
  tier: 'primary' | 'secondary';
  /** Hide the group label when the title is structural rather than editorial. */
  showTitle?: boolean;
  links: SiteMobileMenuLink[];
}

export function buildSiteMobileMenu(brandNav: BrandNav): SiteMobileMenuGroup[] {
  const ourDream = brandNav.popular.find((brand) => brand.slug === 'ourdream-ai');
  const discover: SiteMobileMenuLink[] = [];
  // No icons: "OurDream AI" is a brand name and no glyph denotes it — sparkles
  // would be decoration, not meaning. Same call that left Testing iconless.
  if (ourDream) discover.push({ label: 'OurDream AI', href: ourDream.href });
  discover.push({ label: 'Glossary', href: '/glossary/' });

  return [
    {
      title: 'Primary',
      tier: 'primary',
      showTitle: false,
      links: [
        { label: 'Best AI Girlfriend Apps', href: '/best/ai-girlfriend/', icon: 'trophy' },
        { label: 'Reviews', href: '/reviews/', icon: 'star' },
        { label: 'Guides', href: '/guides/', icon: 'book-open' },
      ],
    },
    { title: 'Discover', tier: 'secondary', showTitle: true, links: discover },
    {
      // No icons: "Testing Categories" has no honest glyph, and a group with
      // two icons and one gap reads worse than a group with none.
      title: 'Testing',
      tier: 'secondary',
      showTitle: true,
      links: [
        { label: 'How We Test', href: '/test/' },
        { label: 'Testing Categories', href: '/test/all/' },
        { label: 'How Scoring Works', href: '/test/tooltips/' },
      ],
    },
  ];
}

/** Footer-grade links — rendered as a small wrapping row, not as menu rows. */
export const SITE_MOBILE_MENU_COMPANY_LINKS: SiteMobileMenuLink[] = [
  { label: 'Herman Carter', href: '/author/herman-carter/' },
  { label: 'About', href: '/about/' },
  { label: 'Site Index', href: '/sitemap/' },
];
