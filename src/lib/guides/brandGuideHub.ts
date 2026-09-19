import type { Product } from '../../data/products';
import type { HubGuide } from '../../data/ourdream-guide-hub';
import { publicAffiliateHref } from '../affiliate/publicHref';
import { resolveBrandLogo } from '../home/brandLogos';
import { publicPagePath } from '../urls';

export interface BrandGuideHubTopic {
  id: string;
  title: string;
  description: string;
  mobileDescription: string;
  icon: string;
  guides: HubGuide[];
}

export interface BrandGuideHubConfig {
  /** Canonical product slug (reviews, /go, admin). */
  productSlug: string;
  /** Public hub path segment under /guides/. */
  hubSlug: string;
  title: string;
  seoTitle: string;
  description: string;
  searchPlaceholder: string;
  searchEmpty: string;
  startHereIntro: string;
  topicsIntro: string;
  defaultNoindex: boolean;
  /** Cloaked Visit CTA when the product record has no live /go link. */
  visitGoFallback: string;
  /**
   * Hero glow hue, 0-360. Sampled from the brand's real logo, then spread
   * apart so the five hubs are actually distinguishable — four of the five
   * logos sit in the same pink/magenta band. This is the OUTER bloom only;
   * it always resolves into Expert pink at the core (see guide-hub.css), so
   * the brand colour never appears as a flat field.
   *
   * Kept in data, not CSS, so nothing global can pick it up.
   */
  glowHue: number;
}

export interface BrandGuideHubView {
  config: BrandGuideHubConfig;
  productName: string;
  logo: string;
  visitHref: string;
  visitLabel: string;
  reviewHref: string | null;
  searchItems: HubGuide[];
  startHere: HubGuide[];
  topics: BrandGuideHubTopic[];
  popular: Array<{ label: string; query: string }>;
  publishedGuideCount: number;
}

export const BRAND_GUIDE_HUBS: BrandGuideHubConfig[] = [
  {
    productSlug: 'candy-ai',
    hubSlug: 'candy-ai',
    title: 'Candy AI Guides',
    seoTitle: 'Candy AI Guides | AI Girlfriend Expert',
    description: 'Guides for prompts, characters, images, chat, features and more.',
    searchPlaceholder: 'Search Candy AI guides…',
    searchEmpty: 'No matching Candy AI guides.',
    startHereIntro: 'The fastest path into Candy AI.',
    topicsIntro: 'Jump into Candy AI guides by what you want to do.',
    defaultNoindex: true,
    visitGoFallback: '/go/candy-ai',
    /** logo 348 crimson-pink */
    glowHue: 352,
  },
  {
    productSlug: 'nectar-ai',
    hubSlug: 'nectar-ai',
    title: 'Nectar AI Guides',
    seoTitle: 'Nectar AI Guides | AI Girlfriend Expert',
    description: 'Guides for prompts, characters, images, chat, features and more.',
    searchPlaceholder: 'Search Nectar AI guides…',
    searchEmpty: 'No matching Nectar AI guides.',
    startHereIntro: 'The fastest path into Nectar AI.',
    topicsIntro: 'Jump into Nectar AI guides by what you want to do.',
    defaultNoindex: true,
    visitGoFallback: '/go/nectar-ai',
    /** logo 0 red; pushed to amber so it never reads as a low score */
    glowHue: 20,
  },
  {
    productSlug: 'girlfriendgpt',
    hubSlug: 'girlfriendgpt',
    title: 'GirlfriendGPT Guides',
    seoTitle: 'GirlfriendGPT Guides | AI Girlfriend Expert',
    description: 'Guides for prompts, characters, images, chat, features and more.',
    searchPlaceholder: 'Search GirlfriendGPT guides…',
    searchEmpty: 'No matching GirlfriendGPT guides.',
    startHereIntro: 'The fastest path into GirlfriendGPT.',
    topicsIntro: 'Jump into GirlfriendGPT guides by what you want to do.',
    defaultNoindex: true,
    visitGoFallback: '/go/girlfriendgpt',
    /** logo 240 indigo, the only naturally distinct one */
    glowHue: 250,
  },
  {
    productSlug: 'juicychat-ai',
    hubSlug: 'juicychat-ai',
    title: 'JuicyChat AI Guides',
    seoTitle: 'JuicyChat AI Guides | AI Girlfriend Expert',
    description: 'Guides for prompts, characters, images, chat, features and more.',
    searchPlaceholder: 'Search JuicyChat AI guides…',
    searchEmpty: 'No matching JuicyChat AI guides.',
    startHereIntro: 'The fastest path into JuicyChat AI.',
    topicsIntro: 'Jump into JuicyChat AI guides by what you want to do.',
    defaultNoindex: true,
    visitGoFallback: '/go/juicychat-ai',
    /** logo 318 magenta, unchanged */
    glowHue: 318,
  },
];

export function getBrandGuideHubConfig(hubSlug: string): BrandGuideHubConfig | undefined {
  return BRAND_GUIDE_HUBS.find((hub) => hub.hubSlug === hubSlug);
}

export function brandGuideHubPath(hubSlug: string): string {
  return publicPagePath(`/guides/${hubSlug}/`);
}

export function defaultNoindexBrandHubPaths(): string[] {
  return BRAND_GUIDE_HUBS.filter((hub) => hub.defaultNoindex).map((hub) => brandGuideHubPath(hub.hubSlug));
}

function uniqueGuides(items: HubGuide[]): HubGuide[] {
  const seen = new Set<string>();
  const out: HubGuide[] = [];
  for (const item of items) {
    if (seen.has(item.href)) continue;
    seen.add(item.href);
    out.push(item);
  }
  return out;
}

export function collectBrandHubGuides(product: Product | null, config: BrandGuideHubConfig): HubGuide[] {
  const name = product?.name || config.title.replace(/ Guides$/, '');
  const items: HubGuide[] = [
    {
      title: `${name} Review`,
      href: publicPagePath(`/reviews/${config.productSlug}/`),
      description: product?.tagline || product?.overallSummary || 'Our full testing, scores, pricing and verdict.',
      tags: ['review', 'scores', 'pricing'],
    },
  ];

  return uniqueGuides(items);
}

export function buildBrandGuideHubView(product: Product | null, config: BrandGuideHubConfig): BrandGuideHubView {
  const productName = product?.name || config.title.replace(/ Guides$/, '');
  const searchItems = collectBrandHubGuides(product, config);
  const reviewItem = searchItems.find((item) => item.href.startsWith('/reviews/')) ?? null;
  const articleGuides = searchItems.filter((item) => !item.href.startsWith('/reviews/'));
  const startHere = (reviewItem ? [reviewItem, ...articleGuides] : articleGuides).slice(0, 3);

  const topics: BrandGuideHubTopic[] = [];
  if (articleGuides.length > 0) {
    topics.push({
      id: 'guides',
      title: 'Guides',
      description: `Published ${productName} how-tos and walkthroughs.`,
      mobileDescription: 'Guides',
      icon: '/guides/hub/icon-sliders.svg',
      guides: articleGuides,
    });
  }

  // Popular chips are OurDream-specific taxonomy. Hide them until a brand has
  // enough published guides with a real topic set — do not invent chips.
  const popular: BrandGuideHubView['popular'] = [];

  const visitHref =
    publicAffiliateHref(config.productSlug, product?.affiliateUrl) ?? config.visitGoFallback;

  return {
    config,
    productName,
    logo: resolveBrandLogo(config.productSlug, product?.logo),
    visitHref,
    visitLabel: `Visit ${productName}`,
    reviewHref: reviewItem?.href ?? null,
    searchItems,
    startHere,
    topics,
    popular,
    publishedGuideCount: articleGuides.length,
  };
}
