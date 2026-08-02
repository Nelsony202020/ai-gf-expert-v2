/**
 * Seed the Candy AI Amount explanation as the first approved example.
 * Run: npx tsx scripts/seed-candy-amount-explanation.ts
 */
import { getDb, isDbConfigured } from '../src/lib/db/server';
import { assembleExplanationContext } from '../src/lib/ai-explanations/assembleContext';
import { findExplanationRow, upsertExplanationRow } from '../src/lib/ai-explanations/generate';

const GROUP_KEY = 'characters/variety/amount';
const APPROVED_TEXT =
  'Candy AI has a large character library, but the choice is heavily focused on female characters. We counted 146 female characters, only 12 male characters, and no transgender, non-binary, or other identity groups. It offers plenty of options for some users, but very little variety outside its main audience.';

async function main() {
  if (!isDbConfigured()) {
    console.error('InstantDB is not configured.');
    process.exit(1);
  }

  const db = getDb();
  const { products } = await (db.query as any)({
    products: { $: { where: { slug: 'candy-ai' } } },
  });
  const product = (products as any[])?.find((p) => !p.deletedAt);
  if (!product) {
    console.error('Candy AI product not found.');
    process.exit(1);
  }

  const context = await assembleExplanationContext(product.id, GROUP_KEY);
  const existing = await findExplanationRow(product.id, GROUP_KEY);

  await upsertExplanationRow(product.id, GROUP_KEY, {
    groupName: 'Amount',
    whatThisMeans: APPROVED_TEXT,
    explanationStatus: 'approved',
    inputHash: context.inputHash,
    generatedFromMethodologyVersion: context.methodologyVersion ?? undefined,
    promptVersion: 'seed-v1',
    model: 'manual',
    generatedAt: Date.now(),
    generatedBy: 'seed-script',
    approvedAt: Date.now(),
    approvedBy: 'seed-script',
    generationError: undefined,
  });

  console.log(
    existing
      ? `Updated evidence explanation for ${GROUP_KEY} on ${product.name}`
      : `Created evidence explanation for ${GROUP_KEY} on ${product.name}`,
  );
  console.log('Status: approved');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
