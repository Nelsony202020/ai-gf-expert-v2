// Shared mapping for public-facing character highlights (reviews, homepage).

import { resolveCharacterDestination } from './destinationUrl';
import { DEFAULT_AFFILIATE_REL } from '../affiliate/rel';
import { inferMediaTypeFromUrl, resolveMediaUrl, isUsablePublicMediaUrl } from '../media/url';
import type { StoryHighlightCharacter } from '../../data/products';

type MediaLike = {
  id?: string;
  url?: unknown;
  mediaType?: string | null;
  file?: { url?: unknown };
} | null | undefined;

type StorySlideEntry = { url: string; mediaType: 'image' | 'video' };

function mediaByIdFromList(media: MediaLike[] | undefined): Map<string, MediaLike> {
  const map = new Map<string, MediaLike>();
  for (const row of media ?? []) {
    if (row?.id) map.set(String(row.id), row);
  }
  return map;
}

function resolveSlideMediaType(media: MediaLike, byId: Map<string, MediaLike>): 'image' | 'video' {
  if (media?.mediaType === 'video') return 'video';
  const id = media?.id ? String(media.id) : '';
  const linked = id ? byId.get(id) : undefined;
  if (linked?.mediaType === 'video') return 'video';
  const url = resolveMediaUrl(media) || (linked ? resolveMediaUrl(linked) : '');
  return url ? inferMediaTypeFromUrl(url) : 'image';
}

function storySlideEntries(
  slides: any[] | undefined,
  productMedia?: MediaLike[],
): StorySlideEntry[] {
  const byId = mediaByIdFromList(productMedia);
  return (slides ?? [])
    .filter((s) => s.active !== false && !s.deletedAt)
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
    .map((s) => {
      const fromSlide = resolveMediaUrl(s.media);
      const url =
        fromSlide ||
        (s.media?.id ? resolveMediaUrl(byId.get(String(s.media.id))) : '');
      if (!url || !isUsablePublicMediaUrl(url)) return null;
      const mediaType = resolveSlideMediaType(s.media, byId);
      return { url, mediaType };
    })
    .filter((entry): entry is StorySlideEntry => entry !== null);
}

/** Pick a still-image URL for `<img>` tags — never returns video URLs. */
export function pickCharacterDisplayImage(
  avatar: string,
  storySlides: string[],
  mode: 'avatar-first' | 'last-story-image' | 'first-story-image' = 'avatar-first',
  storyImageSlides?: string[],
): string {
  const imageSlides =
    storyImageSlides ??
    storySlides.filter(
      (url) => url && isUsablePublicMediaUrl(url) && inferMediaTypeFromUrl(url) === 'image',
    );
  const avatarOk = avatar && isUsablePublicMediaUrl(avatar);

  if (mode === 'last-story-image') {
    return imageSlides[imageSlides.length - 1] ?? (avatarOk ? avatar : '') ?? imageSlides[0] ?? '';
  }
  if (mode === 'first-story-image') {
    return imageSlides[0] ?? (avatarOk ? avatar : '') ?? '';
  }
  if (avatarOk) return avatar;
  return imageSlides[0] ?? imageSlides[imageSlides.length - 1] ?? '';
}

/** Resolve a character image URL — matches admin fallback via product media library. */
export function resolveCharacterImageUrl(
  image: MediaLike,
  productMedia?: MediaLike[] | undefined,
): string {
  const direct = resolveMediaUrl(image);
  if (direct) return direct;
  const id = image?.id ? String(image.id) : '';
  if (!id || !productMedia?.length) return '';
  return resolveMediaUrl(mediaByIdFromList(productMedia).get(id));
}

export function mapCharacterForPublic(
  character: any,
  product?: any,
): StoryHighlightCharacter | null {
  if (!character || character.deletedAt || character.active === false) return null;

  const productMedia = [
    ...(product?.media ?? []),
    ...(character.product?.media ?? []),
  ] as MediaLike[];

  const tags = Array.isArray(character.personalityTags)
    ? character.personalityTags.filter(Boolean)
    : [];

  const slideEntries = storySlideEntries(character.storySlides, productMedia);
  const storySlides = slideEntries.map((entry) => entry.url);
  const storyImageSlides = slideEntries
    .filter((entry) => entry.mediaType === 'image')
    .map((entry) => entry.url);
  const avatar =
    resolveCharacterImageUrl(character.image, productMedia) || storyImageSlides[0] || storySlides[0] || '';
  const safeAvatar = avatar && isUsablePublicMediaUrl(avatar) ? avatar : '';

  const affiliateLinks = product?.affiliateLinks ?? character.product?.affiliateLinks ?? [];
  const activeProductLink =
    affiliateLinks.find((l: any) => l.active && (l.linkType === 'product' || !l.linkType)) ??
    affiliateLinks.find((l: any) => l.active);
  const referralSuffix = product?.referralSuffix ?? character.product?.referralSuffix;
  const skipSuffix = Boolean(character.skipReferralSuffix);
  const destinationWithSuffix = character.destinationUrl
    ? resolveCharacterDestination(String(character.destinationUrl), referralSuffix, skipSuffix)
    : '';
  // Prefer a dedicated cloaked affiliate link when linked; otherwise raw/override URL; else product CTA.
  const profileUrl =
    (character.affiliateLink?.active ? `/go/${character.affiliateLink.cloakedSlug}` : '') ||
    destinationWithSuffix ||
    (activeProductLink ? `/go/${activeProductLink.cloakedSlug}` : undefined);

  return {
    name: String(character.name ?? ''),
    archetype: tags[0] ?? character.characterStyle ?? 'Featured',
    platform: (product?.name ?? character.product?.name) ? String(product?.name ?? character.product?.name) : undefined,
    avatar: safeAvatar,
    storySlides,
    storyImageSlides,
    profileUrl,
    profileRel: DEFAULT_AFFILIATE_REL,
  };
}

/** Featured characters first (homepage order), then remaining active characters. */
export function selectPublicHighlightCharacters(characters: any[], limit = 6): any[] {
  const active = (characters ?? []).filter((c) => c.active && !c.deletedAt);
  const featured = active
    .filter((c) => c.featured)
    .sort((a, b) => (a.homepageOrder ?? 999) - (b.homepageOrder ?? 999));
  const pool = featured.length > 0 ? featured : active;
  return pool.slice(0, limit);
}
