import type { MediaFilter, MediaGalleryTag, MediaItem } from '../../data/aura-ai-media';
import { isUsablePublicMediaUrl, resolveMediaUrl } from './url';

export type MediaPlacement = 'gallery' | 'proof';
export type MediaTag = 'character' | 'chat' | 'image_generator' | 'hero' | 'features';

const LEGACY_TAG_ROLES: Record<string, MediaTag> = {
  character: 'character',
  chat: 'chat',
  image_generator: 'image_generator',
  generator: 'image_generator',
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
  testCategory?: string | null;
  adult?: boolean | null;
  approved?: boolean | null;
  deletedAt?: unknown;
  sortOrder?: number | null;
  heroSortOrder?: number | null;
  file?: { url?: unknown } | null;
}

function normalizeMediaTagsInput(raw: unknown): unknown[] {
  if (Array.isArray(raw)) return raw;
  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    if (!trimmed) return [];
    try {
      const parsed = JSON.parse(trimmed);
      return Array.isArray(parsed) ? parsed : [parsed];
    } catch {
      return trimmed.split(/[,|]/).map((s) => s.trim()).filter(Boolean);
    }
  }
  return [];
}

export function parseMediaTags(raw: unknown): MediaTag[] {
  const allowed = new Set<MediaTag>(['character', 'chat', 'image_generator', 'hero', 'features']);
  const aliases: Record<string, MediaTag> = { generator: 'image_generator' };
  const out = new Set<MediaTag>();
  for (const entry of normalizeMediaTagsInput(raw)) {
    if (typeof entry !== 'string') continue;
    if (allowed.has(entry as MediaTag)) out.add(entry as MediaTag);
    else if (aliases[entry]) out.add(aliases[entry]);
  }
  return [...out];
}

/** Gallery tag fields from admin upload forms (character toggle + chat context). */
export function galleryTagsFromRoleState(state: Pick<MediaRoleState, 'character' | 'contextTag'>): MediaTag[] {
  const tags: MediaTag[] = [];
  if (state.character) tags.push('character');
  if (state.contextTag === 'chat') tags.push('chat');
  return tags;
}

export const PRICING_PROOF_CAPTION = 'Pricing proof';
export const PRICING_PROOF_TEST_CATEGORY = 'pricing';

export function isPricingProofMedia(row: MediaRowLike): boolean {
  if (row.testCategory === PRICING_PROOF_TEST_CATEGORY) return true;
  return String(row.caption ?? '').trim().toLowerCase() === PRICING_PROOF_CAPTION.toLowerCase();
}

export function getMediaPlacement(row: MediaRowLike): MediaPlacement {
  if (row.role === 'proof' || row.evidenceResult || isPricingProofMedia(row)) return 'proof';
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
  const url = resolveMediaUrl(row);
  return Boolean(url) && isUsablePublicMediaUrl(url);
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
    .filter((m) => isPublicMedia(m) && getMediaPlacement(m) !== 'proof')
    .map((m) => toMediaItem(m))
    .filter((item): item is MediaItem => Boolean(item));
}

export function mediaFrontendFilter(row: MediaRowLike): MediaGalleryTag {
  const tags = getMediaTags(row);
  if (tags.includes('character')) return 'characters';
  if (tags.includes('chat')) return 'chat';
  return 'gallery';
}

export function toMediaItem(row: MediaRowLike): MediaItem | null {
  if (getMediaPlacement(row) === 'proof') return null;
  const url = resolveMediaUrl(row);
  if (!url || !isUsablePublicMediaUrl(url) || !isPublicMedia(row) || !row.id) return null;
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
  character: boolean;
  contextTag: '' | 'chat';
  hero: boolean;
}

export function readMediaRoleState(row: MediaRowLike): MediaRoleState {
  const tags = getMediaTags(row);
  return {
    character: tags.includes('character'),
    contextTag: tags.includes('chat') ? 'chat' : '',
    hero: tags.includes('hero'),
  };
}

export function writeMediaRoleState(
  state: MediaRoleState,
  opts?: { placement?: MediaPlacement },
): { role: MediaPlacement; mediaTags: MediaTag[] } {
  const mediaTags: MediaTag[] = [];
  if (state.character) mediaTags.push('character');
  if (state.contextTag === 'chat') mediaTags.push('chat');
  if (state.hero) mediaTags.push('hero');
  return { role: opts?.placement ?? 'gallery', mediaTags };
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
    image_generator: 'Generator',
    hero: 'Hero',
    features: 'Features',
  };
  return tags.map((t) => map[t]);
}

export interface MediaLookupEntry {
  url: string;
  altText?: string;
  mediaType: 'image' | 'video';
  adult?: boolean;
}

/** Resolve all product-linked media rows to a stable id → public URL map for review rendering. */
export function buildMediaLookup(rows: MediaRowLike[]): Record<string, MediaLookupEntry> {
  const out: Record<string, MediaLookupEntry> = {};
  for (const row of rows) {
    const id = row.id ? String(row.id) : '';
    const url = resolveMediaUrl(row);
    if (!id || !url || !isUsablePublicMediaUrl(url)) continue;
    out[id] = {
      url,
      altText: row.altText ? String(row.altText) : undefined,
      mediaType: row.mediaType === 'video' ? 'video' : 'image',
      adult: Boolean(row.adult),
    };
  }
  return out;
}
