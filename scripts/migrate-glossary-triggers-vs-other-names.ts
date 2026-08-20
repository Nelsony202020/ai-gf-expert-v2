/**
 * Split glossary match triggers from tooltip “Other names”.
 * Run: npx tsx scripts/migrate-glossary-triggers-vs-other-names.ts
 *
 * - Clears mirrored displayAliases that were just trigger spelling variants
 * - Keeps true synonyms on displayAliases (Futa, NSFW Roleplay, T2V, etc.)
 * - Sets Tokens other names to coins / gems / credits
 */
import { getDb, isDbConfigured, tx } from '../src/lib/db/server';
import { parseAliases } from '../src/lib/glossary/types';

type Patch = {
  anchor: string;
  /** Match triggers (plus the term itself). */
  aliases?: string[];
  /** Tooltip “Other names” only. */
  displayAliases: string[];
};

/**
 * Explicit desired state for entries that need a fix.
 * Morphological / hyphen variants stay in aliases; abbreviations & true synonyms in displayAliases.
 */
const PATCHES: Patch[] = [
  {
    anchor: 'anime-style',
    aliases: ['anime style', 'anime-style characters'],
    displayAliases: [],
  },
  {
    anchor: 'realistic-style',
    aliases: ['realistic style', 'realistic-style characters'],
    displayAliases: [],
  },
  {
    anchor: 'in-chat-image-generator',
    aliases: ['in-chat image', 'in-chat images'],
    displayAliases: [],
  },
  {
    anchor: 'text-to-video',
    aliases: ['text to video', 'text2video', 'T2V'],
    displayAliases: ['text2video', 'T2V'],
  },
  {
    anchor: 'image-to-video',
    aliases: ['image to video', 'img2video', 'I2V'],
    displayAliases: ['img2video', 'I2V'],
  },
  {
    anchor: 'text-to-image',
    aliases: ['text to image', 'txt2img', 'T2I'],
    displayAliases: ['txt2img', 'T2I'],
  },
  {
    anchor: 'image-to-image',
    aliases: ['image to image', 'img2img', 'I2I'],
    displayAliases: ['img2img', 'I2I'],
  },
  {
    anchor: 'tokens',
    aliases: ['coins', 'gems', 'credits'],
    displayAliases: ['coins', 'gems', 'credits'],
  },
  // True synonyms — keep as both triggers and other names
  {
    anchor: 'unfiltered-roleplay',
    aliases: ['NSFW Roleplay', 'Adult Roleplay'],
    displayAliases: ['NSFW Roleplay', 'Adult Roleplay'],
  },
  {
    anchor: 'futanari',
    aliases: ['Futa'],
    displayAliases: ['Futa'],
  },
  {
    anchor: 'gfe',
    aliases: ['Girlfriend Experience'],
    displayAliases: ['Girlfriend Experience'],
  },
  {
    anchor: 'rpg',
    aliases: ['Open-world RPG'],
    displayAliases: ['Open-world RPG'],
  },
];

function sameList(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  return a.every((v, i) => v === b[i]);
}

async function main() {
  if (!isDbConfigured()) {
    console.error('InstantDB is not configured. Set PUBLIC_INSTANT_APP_ID and INSTANT_APP_ADMIN_TOKEN.');
    process.exit(1);
  }

  const db = getDb();
  const { glossaryEntries } = await (db.query as any)({ glossaryEntries: {} });
  const rows = ((glossaryEntries as any[]) ?? []) as Array<{
    id: string;
    term?: string;
    anchor?: string;
    aliases?: unknown;
    displayAliases?: unknown;
  }>;

  const byAnchor = new Map(rows.map((r) => [String(r.anchor ?? ''), r]));
  let updated = 0;
  let skipped = 0;

  for (const patch of PATCHES) {
    const row = byAnchor.get(patch.anchor);
    if (!row?.id) {
      console.warn(`skip missing: ${patch.anchor}`);
      skipped += 1;
      continue;
    }

    const nextAliases = patch.aliases !== undefined ? parseAliases(patch.aliases) : undefined;
    const nextDisplay = parseAliases(patch.displayAliases);
    const curAliases = parseAliases(row.aliases);
    const curDisplay = parseAliases(row.displayAliases);

    const aliasesUnchanged =
      nextAliases === undefined || sameList(curAliases, nextAliases);
    const displayUnchanged = sameList(curDisplay, nextDisplay);
    if (aliasesUnchanged && displayUnchanged) {
      console.log(`ok  ${patch.anchor}`);
      skipped += 1;
      continue;
    }

    const fields: Record<string, unknown> = {
      displayAliases: nextDisplay,
      updatedAt: Date.now(),
    };
    if (nextAliases !== undefined) fields.aliases = nextAliases;

    await db.transact([tx.glossaryEntries[row.id].update(fields)]);
    console.log(
      `upd ${patch.anchor}: aliases=${JSON.stringify(fields.aliases ?? curAliases)} displayAliases=${JSON.stringify(nextDisplay)}`,
    );
    updated += 1;
  }

  console.log(`\nDone. updated=${updated} skipped=${skipped}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
