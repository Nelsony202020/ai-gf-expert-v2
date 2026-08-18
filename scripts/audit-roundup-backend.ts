#!/usr/bin/env npx tsx
/** Audit roundup pick fields vs live DB product/test data. */

import { loadRoundupForPublic } from '../src/lib/content/store';
import { buildAtGlanceStats } from '../src/lib/roundup/atGlance';
import { loadPricingTabViewModel } from '../src/lib/pricing-tab/loadPricingTab';
import { loadPublishedProductBySlug } from '../src/lib/content/store';

async function main() {
  const roundup = await loadRoundupForPublic('ai-girlfriend');
  if (!roundup) {
    console.error('Roundup not found');
    process.exit(1);
  }

  console.log(`Roundup picks: ${roundup.picks.length}\n`);

  for (const pick of roundup.picks) {
    const product = await loadPublishedProductBySlug(pick.slug);
    const vm = product ? await loadPricingTabViewModel(product) : null;
    const atGlance = product && vm ? buildAtGlanceStats(product, vm) : null;
    const styles = product?.categories
      .flatMap((c) => c.subscores)
      .flatMap((s) => s.contributors)
      .find((c) => c.label === 'Styles');

    console.log(`## ${pick.name} (${pick.slug})`);
    console.log(`  overallScore: ${pick.overallScore} ${product ? '(DB)' : '(template)'}`);
    console.log(`  intro/tagline: ${product?.tagline ? 'DB' : 'template'}`);
    console.log(`  gallery[0]: ${pick.gallery[0]?.full?.slice(0, 70) ?? 'none'}`);
    console.log(`  featuredImage: ${product?.featuredImage?.full ? 'DB' : 'missing'}`);
    console.log(`  pros: ${pick.pros.length} items (${product?.verdicts.find((v) => v.id === 'overall')?.pros?.length ? 'DB' : 'template'})`);
    console.log(`  ourTake: ${pick.ourTake ? (product?.ourTake ? 'DB' : 'template') : 'empty'}`);
    console.log(`  categoryScores: ${pick.categoryScores.length} ${product?.categories.some((c) => c.score != null) ? '(DB)' : '(template)'}`);
    console.log(`  at-a-glance character styles: ${atGlance?.features.find((f) => f.id === 'character-styles')?.value ?? 'n/a'}`);
    console.log(`  styles contributor raw: ${styles?.value ?? 'n/a'}`);
    console.log(`  pricing model: ${atGlance?.pricing.find((p) => p.id === 'pricing-model')?.value ?? 'n/a'}`);
    console.log('');
  }
}

main().catch(console.error);
