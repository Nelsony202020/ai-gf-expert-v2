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
};

export const ourdreamHubGuides: HubGuide[] = [
  {
    title: 'OurDream AI Review',
    href: '/reviews/ourdream-ai/',
    description: 'Our full testing, scores, pricing and verdict.',
    tags: ['review', 'scores', 'pricing'],
  },
  {
    title: 'OurDream AI Prompt Guide',
    href: '/guides/ourdream-ai-prompt/',
    description: 'How to write better prompts for characters, images, videos, and roleplay.',
    tags: ['prompts', 'characters', 'video'],
  },
  {
    title: 'How to Use OurDream AI Image Generator',
    href: '/guides/how-to-use-ourdream-ai-image-generator/',
    description: 'Dreamy vs Vivid, Free Play, presets, Remix, editing, and in-chat images.',
    tags: ['images', 'generator'],
  },
  {
    title: 'OurDream AI Image Prompt Guide',
    href: '/guides/ourdream-ai-image-prompt/',
    description: 'Tags, weights, camera terms, negative prompts, and tested examples.',
    tags: ['prompts', 'images'],
  },
  {
    title: 'OurDream AI Comics',
    href: '/guides/ourdream-ai-comics/',
    description: 'Comic Studio characters, layouts, prompting, editing, video, and cost.',
    tags: ['comics', 'images', 'video'],
  },
];

export const ourdreamHubStartHere = [
  ourdreamHubGuides[0],
  ourdreamHubGuides[1],
  ourdreamHubGuides[2],
];

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
  return ourdreamHubGuides
    .filter((g) => g.href !== currentHref && !g.href.startsWith('/reviews/'))
    .slice(0, limit)
    .map((g) => ({
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
    guides: [ourdreamHubGuides[1], ourdreamHubGuides[3]],
  },
  {
    id: 'images-video-comics',
    title: ourdreamHubCategoryTitles.imagesVideoComics,
    description: 'Image generation, comics, and video inside OurDream.',
    mobileDescription: 'Images, video, and comics',
    icon: '/guides/hub/icon-images.svg',
    guides: [ourdreamHubGuides[2], ourdreamHubGuides[4]],
  },
];
