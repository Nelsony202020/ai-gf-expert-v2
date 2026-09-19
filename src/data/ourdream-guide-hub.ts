import { guideHref, guidesForBrand } from './guides';

export interface HubGuide {
  title: string;
  href: string;
  description?: string;
  tags: string[];
}

export const ourdreamHubMeta = {
  title: 'OurDream AI Guides',
  seoTitle: 'OurDream AI Guides: Prompts, Images, Comics and More',
  description: 'Guides for prompts, characters, images, videos, comics and more.',
  productName: 'OurDream AI',
  reviewHref: '/reviews/ourdream-ai/',
  visitLabel: 'Visit OurDream AI',
  /** Cloaked affiliate slug for hub Visit CTAs (manage destination in Admin → Affiliate links). */
  visitGoHref: '/go/ourdream-ai-yt',
  /**
   * Hero glow hue — outer bloom only; it resolves into Expert pink at the core.
   * Logo samples at 330, which is Expert pink itself, so it is pushed to violet
   * to give the bloom something to resolve FROM. Biggest deviation of the five.
   */
  glowHue: 290,
};

/*
 * Hub rows are DERIVED from the guide registry (src/data/guides.ts) — the only
 * place a guide title, slug or blurb lives. Row 0 is the review, which is not a
 * guide, so it is composed from the hub meta instead.
 */
export const ourdreamHubGuides: HubGuide[] = [
  {
    title: `${ourdreamHubMeta.productName} Review`,
    href: ourdreamHubMeta.reviewHref,
    description: 'Our full testing, scores, pricing and verdict.',
    tags: ['review', 'scores', 'pricing'],
  },
  ...guidesForBrand('ourdream-ai').map((guide) => ({
    title: guide.hubTitle ?? guide.title,
    href: guideHref(guide.slug),
    description: guide.hubDescription ?? guide.description,
    tags: guide.tags ?? [],
  })),
];

/** Look a hub row up by its registry slug, so topic lists never index by position. */
export function ourdreamHubGuide(slug: string): HubGuide {
  const href = guideHref(slug);
  const found = ourdreamHubGuides.find((g) => g.href === href);
  if (!found) throw new Error(`[ourdream-guide-hub] no guide in GUIDES for slug "${slug}"`);
  return found;
}

/** The review, then the first two guides in registry reading order. */
export const ourdreamHubStartHere = ourdreamHubGuides.slice(0, 3);

export const ourdreamHubPopular = [
  { label: 'Prompts', query: 'prompts' },
  { label: 'Images', query: 'images' },
  { label: 'Video', query: 'video' },
  { label: 'DreamCoins', query: 'dreamcoins' },
] as const;

/** Primary Browse by topic labels — single source for hub (and any shared OurDream nav). */
export const ourdreamHubCategoryTitles = {
  promptsCharacters: 'Prompts & Characters',
  imagesVideoComics: 'Images, Video & Comics',
} as const;

export function getOurDreamGuideCategory(href: string): string | undefined {
  for (const topic of ourdreamHubTopics) {
    if (topic.guides.some((g) => g.href === href)) return topic.title;
  }
  return undefined;
}

export function getRelatedOurDreamGuides(currentHref: string, limit = 3) {
  const currentCat = getOurDreamGuideCategory(currentHref);
  const candidates = ourdreamHubGuides.filter(
    (g) => g.href !== currentHref && !g.href.startsWith('/reviews/'),
  );
  const same = candidates.filter((g) => getOurDreamGuideCategory(g.href) === currentCat);
  const other = candidates.filter((g) => getOurDreamGuideCategory(g.href) !== currentCat);
  return [...same, ...other].slice(0, limit).map((g) => ({
    title: g.title,
    href: g.href,
    category: getOurDreamGuideCategory(g.href) ?? '',
  }));
}

export const ourdreamHubTopics = [
  {
    id: 'prompts-characters',
    title: ourdreamHubCategoryTitles.promptsCharacters,
    description: 'Writing prompts, character setup, and prompt control in OurDream.',
    mobileDescription: 'Prompts and characters',
    icon: '/guides/hub/icon-sliders.svg',
    guides: [
      ourdreamHubGuide('ourdream-ai-prompt'),
      ourdreamHubGuide('ourdream-ai-image-prompt'),
      ourdreamHubGuide('ourdream-ai-character-prompts'),
    ],
  },
  {
    id: 'images-video-comics',
    title: ourdreamHubCategoryTitles.imagesVideoComics,
    description: 'Image generation, comics, and video inside OurDream.',
    mobileDescription: 'Images, video, and comics',
    icon: '/guides/hub/icon-images.svg',
    guides: [
      ourdreamHubGuide('how-to-use-ourdream-ai-image-generator'),
      ourdreamHubGuide('ourdream-ai-comics'),
    ],
  },
];
