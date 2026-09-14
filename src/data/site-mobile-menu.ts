import type { BrandNav } from './brand-nav';

export interface SiteMobileMenuLink {
  label: string;
  href: string;
}

export interface SiteMobileMenuGroup {
  title: string;
  links: SiteMobileMenuLink[];
}

export function buildSiteMobileMenu(brandNav: BrandNav): SiteMobileMenuGroup[] {
  const ourDream = brandNav.popular.find((brand) => brand.slug === 'ourdream-ai');
  const discover: SiteMobileMenuLink[] = [];
  if (ourDream) discover.push({ label: 'OurDream AI', href: ourDream.href });
  discover.push({ label: 'Glossary', href: '/glossary/' });

  return [
    {
      title: '',
      links: [
        { label: 'Best AI Girlfriend Apps', href: '/best/ai-girlfriend/' },
        { label: 'Reviews', href: '/reviews/' },
        { label: 'Guides', href: '/guides/' },
      ],
    },
    { title: 'Discover', links: discover },
    {
      title: 'How we test',
      links: [
        { label: 'How We Test', href: '/test/' },
        { label: 'Testing Categories', href: '/test/all/' },
        { label: 'How Scoring Works', href: '/test/tooltips/' },
      ],
    },
    {
      title: 'About',
      links: [
        { label: 'Herman Carter', href: '/author/herman-carter/' },
        { label: 'About', href: '/about/' },
        { label: 'Site Index', href: '/sitemap/' },
      ],
    },
  ];
}
