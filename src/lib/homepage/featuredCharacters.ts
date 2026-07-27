// Keeps character.featured ↔ homepageSlots (featured_character) ↔ public homepage in sync.

import type { HomeFeaturedCharacter } from '../../data/homepage';
import { DEFAULT_AFFILIATE_REL } from '../affiliate/rel';
import { appendReferralSuffix } from '../characters/destinationUrl';
import { getDb, id as newId, isDbConfigured } from '../db/server';
import { HttpError } from '../db/auth';

export const MAX_HOMEPAGE_FEATURED_CHARACTERS = 12;

const CHARACTER_QUERY = {
  product: { affiliateLinks: {} },
  image: {},
  storySlides: { media: {} },
  affiliateLink: {},
  homepageSlots: {},
} as const;

export function mapCharacterToHomeFeatured(character: any): HomeFeaturedCharacter | null {
  if (!character || character.deletedAt || character.active === false) return null;

  const product = character.product;
  const tags = Array.isArray(character.personalityTags)
    ? character.personalityTags.filter(Boolean)
    : [];

  const storySlides: string[] = (character.storySlides ?? [])
    .filter((s: any) => s.active !== false && !s.deletedAt && s.media?.url)
    .sort((a: any, b: any) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
    .map((s: any) => String(s.media.url));

  const activeProductLink = (product?.affiliateLinks ?? []).find((l: any) => l.active);
  const destinationWithSuffix = character.destinationUrl
    ? appendReferralSuffix(String(character.destinationUrl), product?.referralSuffix)
    : '';
  const profileUrl =
    destinationWithSuffix ||
    (character.affiliateLink?.active ? `/go/${character.affiliateLink.cloakedSlug}` : '') ||
    (activeProductLink ? `/go/${activeProductLink.cloakedSlug}` : undefined);

  const bio =
    String(character.shortDescription ?? '').trim() ||
    `${character.name} on ${product?.name ?? 'this platform'}.`;

  return {
    name: String(character.name ?? ''),
    archetype: tags[0] ?? character.characterStyle ?? 'Featured',
    platform: product?.name ? String(product.name) : undefined,
    avatar: character.image?.url ? String(character.image.url) : '',
    storySlides,
    profileUrl,
    profileRel: DEFAULT_AFFILIATE_REL,
    bio,
    quote: tags.length > 1 ? tags.slice(1, 4).join(' · ') : bio.split('.')[0] ?? bio,
    tags: tags.length > 0 ? tags.slice(0, 4) : [character.characterStyle ?? 'Featured'].filter(Boolean),
  };
}

function slotInWindow(slot: any, nowMs: number): boolean {
  return (
    slot.active !== false &&
    (!slot.startAt || Number(slot.startAt) <= nowMs) &&
    (!slot.endAt || Number(slot.endAt) >= nowMs)
  );
}

async function nextFeaturedPosition(): Promise<number> {
  const db = getDb();
  const { homepageSlots } = await (db.query as any)({
    homepageSlots: { $: { where: { kind: 'featured_character' } } },
  });
  const max = (homepageSlots as any[]).reduce((m, s) => Math.max(m, s.position ?? 0), 0);
  return max + 1;
}

async function activeFeaturedSlotCount(excludeSlotId?: string): Promise<number> {
  const db = getDb();
  const { homepageSlots } = await (db.query as any)({
    homepageSlots: { $: { where: { kind: 'featured_character', active: true } } },
  });
  return (homepageSlots as any[]).filter((s) => s.id !== excludeSlotId).length;
}

/** Create, reactivate, or deactivate the homepage slot for a character. */
export async function syncCharacterHomepageSlot(
  characterId: string,
  featured: boolean,
  homepageOrder?: number | null,
): Promise<void> {
  if (!isDbConfigured()) return;

  const db = getDb();
  const { characters } = await (db.query as any)({
    characters: { $: { where: { id: characterId } }, homepageSlots: {} },
  });
  const character = (characters as any[])?.[0];
  if (!character || character.deletedAt) return;

  const existingSlot = (character.homepageSlots ?? []).find(
    (s: any) => s.kind === 'featured_character',
  );

  if (!featured) {
    if (existingSlot && existingSlot.active !== false) {
      await db.transact([
        (db.tx as any).homepageSlots[existingSlot.id].update({
          active: false,
          updatedAt: Date.now(),
        }),
      ]);
    }
    return;
  }

  const position =
    typeof homepageOrder === 'number' && homepageOrder > 0
      ? homepageOrder
      : existingSlot?.position ?? (await nextFeaturedPosition());

  if (existingSlot) {
    await db.transact([
      (db.tx as any).homepageSlots[existingSlot.id]
        .update({ active: true, position, updatedAt: Date.now() })
        .link({ character: characterId }),
    ]);
    return;
  }

  if ((await activeFeaturedSlotCount()) >= MAX_HOMEPAGE_FEATURED_CHARACTERS) {
    throw new HttpError(
      409,
      `Homepage already has ${MAX_HOMEPAGE_FEATURED_CHARACTERS} featured characters. Remove one from Homepage → Featured characters first.`,
    );
  }

  const slotId = newId();
  await db.transact([
    (db.tx as any).homepageSlots[slotId]
      .update({
        kind: 'featured_character',
        position,
        active: true,
        updatedAt: Date.now(),
      })
      .link({ character: characterId }),
  ]);
}

/** Ensure every featured character has a homepage slot (backfill). */
export async function reconcileFeaturedCharacterSlots(): Promise<number> {
  if (!isDbConfigured()) return 0;

  const db = getDb();
  const { characters } = await (db.query as any)({
    characters: { $: { where: { featured: true, active: true } }, homepageSlots: {} },
  });

  let synced = 0;
  for (const character of characters as any[]) {
    if (character.deletedAt) continue;
    const hasLiveSlot = (character.homepageSlots ?? []).some(
      (s: any) => s.kind === 'featured_character' && s.active !== false,
    );
    if (!hasLiveSlot) {
      await syncCharacterHomepageSlot(character.id, true, character.homepageOrder ?? null);
      synced++;
    }
  }
  return synced;
}

export async function setCharacterFeaturedFlag(
  characterId: string,
  featured: boolean,
): Promise<void> {
  if (!isDbConfigured()) return;
  const db = getDb();
  await db.transact([
    (db.tx as any).characters[characterId].update({ featured, updatedAt: Date.now() }),
  ]);
}

/** Load featured homepage carousel from admin slots (falls back to file list). */
export async function loadFeaturedCharactersFromDb(): Promise<HomeFeaturedCharacter[] | null> {
  if (!isDbConfigured()) return null;

  try {
    const db = getDb();
    const nowMs = Date.now();
    const { homepageSlots } = await (db.query as any)({
      homepageSlots: {
        character: CHARACTER_QUERY,
      },
    });

    const live = (homepageSlots as any[])
      .filter(
        (slot) =>
          slot.kind === 'featured_character' &&
          slotInWindow(slot, nowMs),
      )
      .sort((a, b) => (a.position ?? 0) - (b.position ?? 0));

    const out: HomeFeaturedCharacter[] = [];
    const seen = new Set<string>();

    for (const slot of live) {
      const character = slot.character;
      if (!character?.id || seen.has(character.id)) continue;
      const mapped = mapCharacterToHomeFeatured(character);
      if (!mapped) continue;
      seen.add(character.id);
      out.push(mapped);
    }

    return out.length > 0 ? out.slice(0, MAX_HOMEPAGE_FEATURED_CHARACTERS) : null;
  } catch (error) {
    console.error('[content] featured characters load failed', error);
    return null;
  }
}

/** After homepage slot changes — keep character.featured aligned. */
export async function syncHomepageSlotToCharacter(
  slotId: string,
  kind: string,
  active: boolean,
  characterId: string | null | undefined,
): Promise<void> {
  if (kind !== 'featured_character' || !characterId || !isDbConfigured()) return;

  if (active) {
    await setCharacterFeaturedFlag(characterId, true);
    return;
  }

  const db = getDb();
  const { homepageSlots } = await (db.query as any)({
    homepageSlots: {
      $: { where: { kind: 'featured_character', active: true } },
      character: {},
    },
  });
  const stillFeatured = (homepageSlots as any[]).some(
    (s) => s.id !== slotId && s.character?.id === characterId,
  );
  if (!stillFeatured) {
    await setCharacterFeaturedFlag(characterId, false);
  }
}

export async function onHomepageSlotRemoved(slot: any): Promise<void> {
  if (slot?.kind !== 'featured_character' || !slot.character?.id) return;
  await setCharacterFeaturedFlag(slot.character.id, false);
}
