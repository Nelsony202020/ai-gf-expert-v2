import type { MediaFilter, MediaItem } from '../../data/aura-ai-media';
import { resolveMediaUrl } from './url';

export type MediaPlacement = 'gallery' | 'proof';
export type MediaTag = 'character' | 'chat' | 'image_generator' | 'hero' | 'features';

const LEGACY_TAG_ROLES: Record<string, MediaTag> = {
  character: 'character',
  chat: 'chat',
  image_generator: 'image_generator',
  hero: 'hero',
};

const ASSET_ROLES = new Set(['logo', 'featured']);

export interface MediaRowLike {
  id?: string;
  role?: string | null;
  mediaTags?: unknown;
  evidenceResult?: unknown;
  mediaType?: string | null;
  url?: string | null;
  altText?: string | null;
  caption?: string | null;
  adult?: boolean | null;
  approved?: boolean | null;
  deletedAt?: unknown;
  sortOrder?: number | null;
  heroSortOrder?: number | null;
  file?: { url?: unknown } | null;
}

export function parseMediaTags(raw: unknown): MediaTag[] {
  if (!Array.isArray(raw)) return [];
  const allowed = new Set<MediaTag>(['character', 'chat', 'image_generator', 'hero', 'features']);
  return raw.filter((t): t is MediaTag => typeof t === 'string' && allowed.has(t as MediaTag));
}

export function getMediaPlacement(row: MediaRowLike): MediaPlacement {
  if (row.role === 'proof' || row.evidenceResult) return 'proof';
  return 'gallery';
}

export function getMediaTags(row: MediaRowLike): MediaTag[] {
  const tags = new Set(parseMediaTags(row.mediaTags));
  const legacy = row.role ? LEGACY_TAG_ROLES[row.role] : undefined;
  if (legacy) tags.add(legacy);
  return [...tags];
}

export function isAssetMedia(row: MediaRowLike): boolean {
  return ASSET_ROLES.has(row.role ?? '');
}

export function isFeaturesMedia(row: MediaRowLike): boolean {
  return getMediaTags(row).includes('features');
}

export function isHeroMedia(row: MediaRowLike): boolean {
  return getMediaTags(row).includes('hero');
}

export function isPublicMedia(row: MediaRowLike): boolean {
  if (row.deletedAt) return false;
  if (isAssetMedia(row)) return false;
  return Boolean(resolveMediaUrl(row));
}

/** All product-linked media rows (library + evidence attachments), deduped by id. */
export function collectProductMediaRows(dbProduct: {
  media?: MediaRowLike[];
  evidenceResults?: Array<{ attachments?: MediaRowLike[] }>;
}): MediaRowLike[] {
  const seen = new Set<string>();
  const out: MediaRowLike[] = [];
  const add = (row: MediaRowLike | null | undefined) => {
    const id = row?.id ? String(row.id) : '';
    if (!id || seen.has(id)) return;
    seen.add(id);
    out.push(row);
  };
  for (const m of dbProduct.media ?? []) add(m);
  for (const er of dbProduct.evidenceResults ?? []) {
    for (const att of er.attachments ?? []) add(att);
  }
  return out;
}

export function productMediaItems(
  dbProduct: {
    media?: MediaRowLike[];
    evidenceResults?: Array<{ attachments?: MediaRowLike[] }>;
  },
): MediaItem[] {
  return collectProductMediaRows(dbProduct)
    .filter((m) => isPublicMedia(m))
    .map((m) => toMediaItem(m))
    .filter((item): item is MediaItem => Boolean(item));
}

export function mediaFrontendFilter(row: MediaRowLike): Exclude<MediaFilter, 'all' | 'videos'> {
  const tags = getMediaTags(row);
  if (getMediaPlacement(row) === 'proof') return 'proof';
  if (tags.includes('character')) return 'characters';
  if (tags.includes('chat')) return 'chat';
  if (tags.includes('image_generator')) return 'image-generator';
  return 'gallery';
}

export function toMediaItem(row: MediaRowLike): MediaItem | null {
  const url = resolveMediaUrl(row);
  if (!isPublicMedia(row) || !url || !row.id) return null;
  const type = row.mediaType === 'video' ? 'video' : 'image';
  const label = String(row.altText ?? '').trim() || (type === 'video' ? 'Video' : 'Screenshot');
  const caption = String(row.caption ?? '').trim();
  return {
    id: row.id,
    type,
    src: url,
    thumb: url,
    alt: label,
    caption,
    filter: mediaFrontendFilter(row),
    nsfw: Boolean(row.adult),
  };
}

export function sortHeroMedia<T extends MediaRowLike>(rows: T[]): T[] {
  return [...rows].sort((a, b) => {
    const ha = a.heroSortOrder ?? 9999;
    const hb = b.heroSortOrder ?? 9999;
    if (ha !== hb) return ha - hb;
    return (a.sortOrder ?? 9999) - (b.sortOrder ?? 9999);
  });
}

export function sortGalleryMedia<T extends MediaRowLike>(rows: T[]): T[] {
  return [...rows].sort((a, b) => (a.sortOrder ?? 9999) - (b.sortOrder ?? 9999));
}

export interface MediaRoleState {
  placement: MediaPlacement;
  character: boolean;
  contextTag: '' | 'chat' | 'image_generator';
  hero: boolean;
}

export function readMediaRoleState(row: MediaRowLike): MediaRoleState {
  const tags = getMediaTags(row);
  const contextTag = tags.includes('chat') ? 'chat' : tags.includes('image_generator') ? 'image_generator' : '';
  return {
    placement: getMediaPlacement(row),
    character: tags.includes('character'),
    contextTag,
    hero: tags.includes('hero'),
  };
}

export function writeMediaRoleState(state: MediaRoleState): { role: MediaPlacement; mediaTags: MediaTag[] } {
  const mediaTags: MediaTag[] = [];
  if (state.character) mediaTags.push('character');
  if (state.contextTag === 'chat') mediaTags.push('chat');
  if (state.contextTag === 'image_generator') mediaTags.push('image_generator');
  if (state.hero) mediaTags.push('hero');
  return { role: state.placement, mediaTags };
}

/** Re-order hero slots so `newHeroId` is first; existing heroes shift down. */
export function heroSortOrderUpdates<T extends MediaRowLike>(
  productMedia: T[],
  newHeroId: string,
): Array<{ id: string; heroSortOrder: number }> {
  const heroes = sortHeroMedia(productMedia.filter((m) => isHeroMedia(m) && m.id && m.id !== newHeroId));
  return [
    { id: newHeroId, heroSortOrder: 0 },
    ...heroes.map((m, index) => ({ id: String(m.id), heroSortOrder: index + 1 })),
  ];
}

export const PRICING_PROOF_CAPTION = 'Pricing proof';
export const PRICING_PROOF_TEST_CATEGORY = 'pricing';

export function isPricingProofMedia(row: MediaRowLike): boolean {
  if (row.testCategory === PRICING_PROOF_TEST_CATEGORY) return true;
  return String(row.caption ?? '').trim().toLowerCase() === PRICING_PROOF_CAPTION.toLowerCase();
}

/** Fields applied to media linked from the Pricing tab or AI pricing import. */
export function pricingProofMediaPatch(altText?: string): {
  role: 'proof';
  testCategory: string;
  caption: string;
  altText?: string;
} {
  return {
    role: 'proof',
    testCategory: PRICING_PROOF_TEST_CATEGORY,
    caption: PRICING_PROOF_CAPTION,
    ...(altText?.trim() ? { altText: altText.trim() } : {}),
  };
}

export function pricingProofPlacementLabel(): string {
  return 'Pricing proof';
}

export function tagLabels(tags: MediaTag[]): string[] {
  const map: Record<MediaTag, string> = {
    character: 'Character',
    chat: 'Chat',
    image_generator: 'Image generator',
    hero: 'Hero',
    features: 'Features',
  };
  return tags.map((t) => map[t]);
}
