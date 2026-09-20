import { buyingGuideSlug } from './buying-guide-content';

/**
 * THE guide registry.
 *
 * Every published guide article on the site appears here exactly once, and
 * nothing else on the site may hardcode a guide title, slug or description.
 * Adding a guide is one entry in this file; the /guides/ index, the site
 * search index, the header mega menu and the brand hubs all derive from it.
 *
 * `brand: null` means cross-brand (it applies to every app, not one of them).
 */

export type GuideBrand =
  | 'ourdream-ai'
  | 'candy-ai'
  | 'nectar-ai'
  | 'girlfriendgpt'
  | 'juicychat-ai';

/**
 * A companion video for a guide article.
 *
 * Lives on the guide registry entry rather than in any template, so a guide
 * with no video renders no link, no block and no schema — the absence is the
 * default, not a flag anyone has to remember to set.
 *
 * `durationSeconds` and `uploadDate` are what VideoObject needs and what the
 * trigger copy is derived from. Both are required before any schema is
 * emitted: an incomplete VideoObject is worse than none.
 */
export interface GuideVideo {
  /** YouTube video id — the part after `watch?v=`. */
  youtubeId: string;
  /** Title shown on the block and in the lightbox. */
  title: string;
  /** One sentence for VideoObject's description. */
  description?: string;
  /** Runtime in seconds. Drives the trigger copy and the schema duration. */
  durationSeconds?: number;
  /** ISO 8601 date the video was published, e.g. 2026-09-02. */
  uploadDate?: string;
  /** Optional poster. Defaults to the YouTube thumbnail for `youtubeId`. */
  thumbnail?: string;
}

export interface Guide {
  /** Route segment under /guides/. */
  slug: string;
  title: string;
  /** Hub-index blurb. The payoff, not the contents. */
  description: string;
  /** Owning app, or null for cross-brand guides. */
  brand: GuideBrand | null;
  /**
   * Reading order within its brand group (ascending). Entries without one sort
   * after those with one, in declaration order.
   */
  order?: number;
  /**
   * Optional shorter title for the brand hub's own row, where the hub says
   * less than the index does. Lives here so adding a guide is still a
   * single-file edit.
   */
  hubTitle?: string;
  /** Same idea for the hub row's blurb. */
  hubDescription?: string;
  /** Free-text facets the brand hub search filters on. */
  tags?: string[];
  /** <title> for the article's own route, when it is longer than the H1. */
  seoTitle?: string;
  /** Breadcrumb label, when the full title is too long for the trail. */
  breadcrumbLabel?: string;
  /** Companion video. Absent means this guide has no video anywhere on it. */
  video?: GuideVideo;
}

export const GUIDES: Guide[] = [
  {
    slug: buyingGuideSlug,
    title: 'How to Choose an AI Girlfriend App',
    description:
      'Work out whether you are chat-first, media-first or balanced, then shortlist on tested results.',
    brand: null,
    order: 1,
    tags: ['buying', 'compare', 'scores'],
    seoTitle: 'How to Choose an AI Girlfriend App — Buying Guide',
  },
  {
    slug: 'ourdream-ai-prompt',
    title: 'OurDream AI Prompt Guide',
    description:
      'Prompts for characters, images, video and roleplay — with examples and the common mistakes.',
    hubDescription:
      'How to write better prompts for characters, images, videos, and roleplay.',
    brand: 'ourdream-ai',
    order: 1,
    tags: ['prompts', 'characters', 'video'],
    seoTitle: 'OurDream AI Prompt Guide: How to Write GOOD Prompts',
  },
  {
    slug: 'how-to-use-ourdream-ai-image-generator',
    title: 'How to Use OurDream AI Image Generator',
    description: 'Dreamy vs Vivid, Free Play, presets, Remix, inpainting and in-chat images.',
    hubDescription: 'Dreamy vs Vivid, Free Play, presets, Remix, editing, and in-chat images.',
    brand: 'ourdream-ai',
    order: 2,
    tags: ['images', 'generator'],
    seoTitle: 'How to Use OurDream AI Image Generator: Beginner Guide',
    breadcrumbLabel: 'OurDream AI Image Generator',
  },
  {
    slug: 'ourdream-ai-image-prompt',
    title: 'OurDream AI Image Prompt Guide',
    description: 'Tags, weights, camera terms and negative prompts, tested on Dreamy and Vivid.',
    hubDescription: 'Tags, weights, camera terms, negative prompts, and tested examples.',
    brand: 'ourdream-ai',
    order: 3,
    tags: ['prompts', 'images'],
    seoTitle: 'OurDream AI Image Prompt Guide: Tags, Weights, and Examples',
  },
  {
    slug: 'ourdream-ai-comics',
    title: 'OurDream AI Comics: How to Use the Comic Generator',
    description:
      'Characters, model sheets, layouts, editing, video — and what a comic actually costs.',
    /** The hub row says "OurDream AI Comics"; the index carries the full title. */
    hubTitle: 'OurDream AI Comics',
    hubDescription: 'Comic Studio characters, layouts, prompting, editing, video, and cost.',
    brand: 'ourdream-ai',
    order: 4,
    tags: ['comics', 'images', 'video'],
    breadcrumbLabel: 'OurDream AI Comics',
    video: {
      youtubeId: 'jt2DvEU3KZU',
      title: 'Watch: How to use OurDream AI Comics',
      description:
        'A walkthrough of the OurDream AI Comic Studio — characters, model sheets, page layouts, prompting, editing and turning a finished page into video.',
      // Read off the video itself: runtime 5:36, published 16 Sept 2026.
      durationSeconds: 336,
      uploadDate: '2026-09-16',
    },
  },
  {
    slug: 'ourdream-ai-character-prompts',
    title: 'OurDream AI Character Prompts',
    /** First sentence of the vault hero intro (Figma 252:195), verbatim. */
    description: 'Browse tested OurDream AI character prompts with real generated examples.',
    hubTitle: 'OurDream AI Character Prompts',
    brand: 'ourdream-ai',
    order: 5,
    tags: ['prompts', 'characters', 'examples'],
    /** Figma DOC 261:5243 note 01. */
    seoTitle: 'OurDream AI Character Prompts: Tested Examples & Prompt Vault',
    breadcrumbLabel: 'Character Prompts',
  },
];

/** Display name per brand, for group sub-headings and hub cards. */
export const GUIDE_BRAND_NAMES: Record<GuideBrand, string> = {
  'ourdream-ai': 'OurDream AI',
  'candy-ai': 'Candy AI',
  'nectar-ai': 'Nectar AI',
  girlfriendgpt: 'GirlfriendGPT',
  'juicychat-ai': 'JuicyChat AI',
};

/** Order the brand groups and the hub cards appear in. */
export const GUIDE_BRAND_ORDER: GuideBrand[] = [
  'ourdream-ai',
  'candy-ai',
  'nectar-ai',
  'girlfriendgpt',
  'juicychat-ai',
];

export function guideHref(slug: string): string {
  return `/guides/${slug}/`;
}

/** Throws rather than returning undefined: a missing slug is a build-time bug. */
export function guideBySlug(slug: string): Guide {
  const found = GUIDES.find((g) => g.slug === slug);
  if (!found) throw new Error(`[guides] no entry in GUIDES for slug "${slug}"`);
  return found;
}

/** The <title> for a guide's own route. */
export function guideSeoTitle(slug: string): string {
  const g = guideBySlug(slug);
  return g.seoTitle ?? g.title;
}

/** The breadcrumb label for a guide's own route. */
export function guideBreadcrumbLabel(slug: string): string {
  const g = guideBySlug(slug);
  return g.breadcrumbLabel ?? g.hubTitle ?? g.title;
}

function byOrder(a: Guide, b: Guide): number {
  const ao = a.order ?? Number.MAX_SAFE_INTEGER;
  const bo = b.order ?? Number.MAX_SAFE_INTEGER;
  return ao - bo;
}

/** Guides owned by one brand, in reading order. */
export function guidesForBrand(brand: GuideBrand): Guide[] {
  return GUIDES.filter((g) => g.brand === brand).sort(byOrder);
}

/** Cross-brand guides, in reading order. */
export function crossBrandGuides(): Guide[] {
  return GUIDES.filter((g) => g.brand === null).sort(byOrder);
}

/** The count shown on a brand hub card. Never a separate hardcoded number. */
export function guideCountForBrand(brand: GuideBrand): number {
  return GUIDES.filter((g) => g.brand === brand).length;
}

export interface GuideGroup {
  /** null for the cross-brand "General" group. */
  brand: GuideBrand | null;
  label: string;
  guides: Guide[];
}

/**
 * Every guide, grouped for the /guides/ "All guides" list: General first, then
 * each brand in GUIDE_BRAND_ORDER. Empty groups are dropped, so a brand with no
 * guides yet never renders a bare heading.
 */
export function guideGroups(): GuideGroup[] {
  const groups: GuideGroup[] = [];
  const general = crossBrandGuides();
  if (general.length) groups.push({ brand: null, label: 'General', guides: general });
  for (const brand of GUIDE_BRAND_ORDER) {
    const guides = guidesForBrand(brand);
    if (guides.length) groups.push({ brand, label: GUIDE_BRAND_NAMES[brand], guides });
  }
  return groups;
}

/** Reading order for "Start here": General first, then brand order. */
export function guidesInReadingOrder(): Guide[] {
  return guideGroups().flatMap((group) => group.guides);
}
