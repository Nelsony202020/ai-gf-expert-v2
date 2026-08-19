/**
 * Re-read pricing proof screenshots and fill blank feature-cost rows.
 *
 * Fills (when missing / unknown):
 * - Price per image generation
 * - Price per voice message
 * - Price per phone call
 * - Custom character cost (character_creation)
 * - Video generation variants when visible
 *
 * Known overrides (applied when blank even if OCR misses them):
 * - Candy AI custom character = 10 tokens
 *
 * Usage:
 *   npx tsx scripts/backfill-feature-costs-from-screenshots.ts
 *   npx tsx scripts/backfill-feature-costs-from-screenshots.ts --dry-run
 *   npx tsx scripts/backfill-feature-costs-from-screenshots.ts --slug=candy-ai
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function loadEnv() {
  try {
    const raw = readFileSync(resolve(process.cwd(), '.env'), 'utf8');
    for (const line of raw.split('\n')) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m && !(m[1] in process.env)) {
        process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
      }
    }
  } catch {
    /* optional */
  }
}

loadEnv();

const dryRun = process.argv.includes('--dry-run');
const slugArg = process.argv.find((a) => a.startsWith('--slug='))?.slice('--slug='.length);

const { getDb, id, tx, isDbConfigured } = await import('../src/lib/db/server');
const { extractPricingFromScreenshots } = await import('../src/lib/ai-pricing/extract');
const {
  FEATURE_COST_FAMILIES,
  flattenExtractedFeatureCosts,
  matchExistingVariant,
  variantFieldsToFeatureCost,
  costsInFamily,
} = await import('../src/lib/pricing/featureCostGroups');
const { featureCostAvailability, featureCostRange } = await import('../src/lib/pricing/calc');

/** Manual fills when screenshots are known but OCR may miss. */
const KNOWN_OVERRIDES: Record<
  string,
  Array<{ featureType: string; creditCost: number; unit: string; customLabel?: string }>
> = {
  'candy-ai': [{ featureType: 'character_creation', creditCost: 10, unit: 'per_character' }],
};

type AnyRow = Record<string, any>;

function productIdOf(row: AnyRow): string | null {
  const p = row.product;
  if (!p) return null;
  if (typeof p === 'string') return p;
  return p.id ?? null;
}

function mediaIdList(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((x) => String(x)).filter(Boolean);
}

function isBlankCost(cost: AnyRow | null | undefined): boolean {
  if (!cost) return true;
  if (cost.active === false) return true;
  const availability = featureCostAvailability(cost as any);
  if (availability === 'priced') {
    const range = featureCostRange(cost as any);
    return !range || range.min <= 0;
  }
  // unknown / not_available / unlimited placeholders count as fillable when we have a real price
  return availability === 'unknown' || availability === 'pay_as_you_go';
}

function pickActiveSnapshot(snaps: AnyRow[]): AnyRow | null {
  const active = snaps.find((s) => s.status === 'active');
  if (active) return active;
  return snaps[0] ?? null;
}

async function main() {
  if (!isDbConfigured()) {
    console.error('InstantDB is not configured.');
    process.exit(1);
  }

  const db = getDb();
  const data = await (db.query as any)({
    products: {},
    pricingSnapshots: {},
    featureCosts: {},
    media: {},
  });

  const products = (data.products ?? []) as AnyRow[];
  const snapshots = (data.pricingSnapshots ?? []) as AnyRow[];
  const featureCosts = (data.featureCosts ?? []) as AnyRow[];
  const media = (data.media ?? []) as AnyRow[];

  const mediaById = new Map(media.map((m) => [String(m.id), m]));

  const targets = products.filter((p) => {
    if (slugArg && p.slug !== slugArg) return false;
    return true;
  });

  console.log(
    `Scanning ${targets.length} product(s)${dryRun ? ' (dry-run)' : ''}${slugArg ? ` [slug=${slugArg}]` : ''}…`,
  );

  let updated = 0;
  let created = 0;
  let skipped = 0;

  for (const product of targets) {
    const productId = String(product.id);
    const slug = String(product.slug ?? productId);
    const snaps = snapshots.filter((s) => productIdOf(s) === productId);
    const snapshot = pickActiveSnapshot(snaps);
    if (!snapshot) {
      skipped += 1;
      continue;
    }

    const evidenceIds = mediaIdList(snapshot.evidenceMediaIds).filter((mid) => mediaById.has(mid));
    // Also pull media tagged as pricing proof for this product
    const tagged = media
      .filter((m) => productIdOf(m) === productId)
      .filter((m) => {
        const caption = String(m.caption ?? m.alt ?? '').toLowerCase();
        const tags = Array.isArray(m.tags) ? m.tags.map(String) : [];
        return (
          caption.includes('pricing') ||
          tags.some((t) => /pricing/i.test(t)) ||
          String(m.testCategory ?? '') === 'pricing'
        );
      })
      .map((m) => String(m.id));

    const mediaIds = [...new Set([...evidenceIds, ...tagged])].slice(0, 12);
    const existingCosts = featureCosts.filter((c) => productIdOf(c) === productId);

    console.log(`\n▸ ${slug}  evidence=${mediaIds.length}  existingCosts=${existingCosts.length}`);

    let flat: Array<{
      category?: string | null;
      featureType: string;
      customLabel?: string | null;
      model?: string | null;
      durationSeconds?: number | null;
      tokenCost: number;
      unit: string;
    }> = [];

    if (mediaIds.length > 0) {
      try {
        const draft = await extractPricingFromScreenshots(
          { productId, mediaIds },
          {
            adminUserId: 'script',
            email: `backfill-pricing+${slug}@local`,
            name: 'Pricing backfill',
            role: 'owner',
          },
        );
        flat = flattenExtractedFeatureCosts({
          featureCosts: draft.featureCosts as any,
          featureCostVariants: draft.featureCostVariants as any,
        });
        console.log(
          `  extract: plans=${draft.plans.length} packages=${draft.packages.length} costs=${flat.length}`,
        );
      } catch (err) {
        console.warn(`  extract failed: ${err instanceof Error ? err.message : String(err)}`);
      }
    } else {
      console.log('  no screenshots — applying known overrides only');
    }

    // Merge known overrides for blank families
    const overrides = KNOWN_OVERRIDES[slug] ?? [];
    for (const ov of overrides) {
      const family =
        FEATURE_COST_FAMILIES.find((f) => f.featureTypes.includes(ov.featureType)) ??
        FEATURE_COST_FAMILIES.find((f) => f.defaultFeatureType === ov.featureType);
      if (!family) continue;
      const variants = costsInFamily(existingCosts, family);
      const blank = variants.length === 0 || variants.every(isBlankCost);
      if (!blank) continue;
      if (flat.some((r) => r.featureType === ov.featureType && r.tokenCost > 0)) continue;
      flat.push({
        category: family.key,
        featureType: ov.featureType,
        tokenCost: ov.creditCost,
        unit: ov.unit,
        customLabel: ov.customLabel ?? null,
        model: null,
        durationSeconds: null,
      });
      console.log(`  override: ${ov.featureType}=${ov.creditCost} ${ov.unit}`);
    }

    if (flat.length === 0) {
      skipped += 1;
      continue;
    }

    for (const [i, row] of flat.entries()) {
      const family =
        FEATURE_COST_FAMILIES.find((f) => f.key === row.category) ??
        FEATURE_COST_FAMILIES.find((f) => f.featureTypes.includes(row.featureType));
      if (!family) continue;

      const candidate = {
        featureType: row.featureType,
        customLabel: row.customLabel,
        qualityTier: row.model,
        durationProduced: row.durationSeconds,
        creditCost: row.tokenCost,
        unit: row.unit,
        active: true,
      };

      const familyVariants = costsInFamily(existingCosts, family);
      const existing =
        matchExistingVariant(existingCosts, candidate as any) ??
        (familyVariants.length === 1 && isBlankCost(familyVariants[0])
          ? familyVariants[0]
          : undefined) ??
        familyVariants.find((v) => isBlankCost(v));

      const shouldFill = !existing || isBlankCost(existing);
      if (!shouldFill) continue;

      const mapped = variantFieldsToFeatureCost(family, {
        model: row.model ?? null,
        durationSeconds: row.durationSeconds ?? null,
        label: row.customLabel ?? null,
        creditCost: row.tokenCost,
        unit: row.unit,
      });

      const now = Date.now();
      const fields = {
        ...mapped,
        costType: 'fixed',
        creditCost: row.tokenCost,
        minCost: undefined,
        maxCost: undefined,
        active: true,
        sortOrder: existing?.sortOrder ?? existingCosts.length + i,
        lastVerifiedAt: now,
        updatedAt: now,
        evidenceMediaIds: mediaIds.length
          ? [...new Set([...(Array.isArray(existing?.evidenceMediaIds) ? existing.evidenceMediaIds : []), ...mediaIds])]
          : existing?.evidenceMediaIds,
      };

      console.log(
        `  ${existing ? 'update' : 'create'} ${family.label}: ${row.tokenCost} ${row.unit}` +
          (row.model ? ` (${row.model})` : '') +
          (row.customLabel ? ` [${row.customLabel}]` : ''),
      );

      if (dryRun) continue;

      if (existing?.id) {
        await db.transact([tx.featureCosts[existing.id].update(fields)]);
        // keep local cache in sync for subsequent matchExistingVariant
        Object.assign(existing, fields);
        updated += 1;
      } else {
        const entryId = id();
        await db.transact([
          tx.featureCosts[entryId]
            .update({
              ...fields,
              createdAt: now,
              updatedAt: now,
            })
            .link({ product: productId, snapshot: snapshot.id }),
        ]);
        existingCosts.push({ id: entryId, ...fields, product: productId });
        created += 1;
      }
    }

    // Brief pause between products to stay under AI rate limits
    await new Promise((r) => setTimeout(r, 800));
  }

  console.log(`\nDone. created=${created} updated=${updated} skippedProducts=${skipped}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
