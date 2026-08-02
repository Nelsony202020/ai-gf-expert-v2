#!/usr/bin/env npx tsx
/**
 * Combined export: methodology + product testing results + all drawer copy + AI copy status.
 *
 * Usage:
 *   npx tsx scripts/export-full-review.ts
 *   npx tsx scripts/export-full-review.ts --slug candy-ai
 *
 * Output: {slug}-full-review-export.md
 */

import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { loadProductPreviewBySlug } from '../src/lib/content/store';
import { loadDraftRatingsViewModel } from '../src/lib/draft-ratings/loadDraftRatingsData';
import { resolveEvidenceDisplayValue } from '../src/lib/draft-ratings/resolveEvidenceDisplay';
import { getEvidenceMethodology, getSubscoreMethodology } from '../src/data/evidence-drawer-methodology';
import { getSubscoreDescription } from '../src/data/subscore-descriptions';
import {
  buildSubscoreCalcHeadline,
  buildSubscoreCalcScope,
  enhancedScopeDescription,
} from '../src/lib/draft-ratings/evidenceDrawerContent';
import { buildRedistributedCalcItems } from '../src/lib/scores';
import { buildSubscoreNominalWeights } from '../src/lib/ratings/evidenceGroupScoring';
import { deferPayAsYouGoScores, PRICING_BENCHMARK_PENDING_NOTE } from '../src/lib/ratings/evidenceIcons';
import { listExplanationStatuses } from '../src/lib/ai-explanations/listGroups';
import { listProductTakeawaysSlim } from '../src/lib/subscore-takeaways/listSubscores';
import { getDb, isDbConfigured } from '../src/lib/db/server';
import type { DraftEvidenceCategory } from '../src/lib/draft-ratings/types';

function loadEnv() {
  try {
    const raw = readFileSync(resolve(process.cwd(), '.env'), 'utf8');
    for (const line of raw.split('\n')) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
    }
  } catch {
    /* optional */
  }
}

function parseArgs() {
  const args = process.argv.slice(2);
  let slug = 'candy-ai';
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--slug') slug = args[++i] ?? slug;
  }
  return { slug };
}

function fmtScore(score: number | null | undefined): string {
  if (score == null || Number.isNaN(score)) return '—';
  return score.toFixed(1);
}

function section(title: string, level = 2): string {
  return `${'#'.repeat(level)} ${title}\n\n`;
}

function field(label: string, value: string | undefined | null): string {
  if (value == null || !String(value).trim()) return `**${label}:** —\n\n`;
  return `**${label}:** ${String(value).trim()}\n\n`;
}

function renderTestResults(ec: DraftEvidenceCategory): string {
  if (!ec.testResults.length) return '';
  let out = '**Test results:**\n\n';
  out += '| Measurement | Value | Score | Interpretation |\n';
  out += '| --- | --- | --- | --- |\n';
  for (const row of ec.testResults) {
    const interp = row.interpretation ? row.interpretation.replace(/\|/g, '\\|') : '—';
    out += `| ${row.label} | ${row.value} | ${fmtScore(row.normalizedScore)} | ${interp} |\n`;
  }
  out += '\n';
  return out;
}

function renderCalculation(ec: DraftEvidenceCategory): string {
  const calc = ec.calculation;
  if (!calc?.rows.length) return '';
  let out = '**Score calculation breakdown:**\n\n';
  if (calc.intro) out += `${calc.intro}\n\n`;
  out += '| Component | Measured | Internal score | Weight | Contribution |\n';
  out += '| --- | --- | --- | --- | --- |\n';
  for (const row of calc.rows) {
    out += `| ${row.label} | ${row.measuredValue} | ${fmtScore(row.internalScore)} | ${row.weight != null ? `${row.weight}%` : '—'} | ${row.contribution != null ? row.contribution.toFixed(2) : '—'} |\n`;
  }
  out += '\n';
  if (calc.formulaParts.length) {
    out += `Formula: ${calc.formulaParts.join(' + ')} = ${calc.formulaTotal?.toFixed(2) ?? '—'} → **${fmtScore(calc.finalScore ?? ec.score)}**\n\n`;
  }
  if (calc.summary) out += `${calc.summary}\n\n`;
  return out;
}

function renderEvidenceDrawer(ec: DraftEvidenceCategory): string {
  const methodology = getEvidenceMethodology(
    ec.categorySlug ?? '',
    ec.subscoreSlug ?? '',
    ec.slug,
  );
  const whatItMeasures =
    methodology?.whatItMeasures ?? ec.scopeDescription ?? enhancedScopeDescription(ec.slug);
  const howWeTested = methodology?.howWeTested ?? ec.howWeTested;

  let out = section(ec.name, 4);
  out += field('Breadcrumb', ec.breadcrumb);
  out += field('Evidence score (0–10)', fmtScore(ec.score));
  out += field('Summary', ec.summary);
  out += field('Headline conclusion', ec.headlineConclusion);
  out += field('What this measures', whatItMeasures);
  out += field('How we tested', howWeTested);
  out += field('What this means (approved AI copy or —)', ec.whatThisMeans);
  out += field('Card teaser', ec.cardTeaser);
  out += renderTestResults(ec);
  out += renderCalculation(ec);
  if (ec.limitations) out += field('Limitations', ec.limitations);
  return out;
}

async function loadRawEvidenceResults(slug: string) {
  if (!isDbConfigured()) return [];
  const db = getDb();
  const { products } = await (db.query as any)({
    products: {
      $: { where: { slug } },
      evidenceResults: {
        testRun: {},
        evidenceDefinition: { subscore: { category: {} } },
        attachments: { file: {} },
      },
    },
  });
  const product = (products as any[])?.find((p) => !p.deletedAt);
  if (!product) return [];
  return (product.evidenceResults ?? []).filter((r: any) => !r.deletedAt);
}

async function renderRawTestingSection(slug: string): Promise<string> {
  const rows = await loadRawEvidenceResults(slug);
  if (!rows.length) return section('Raw testing results', 2) + '_No evidence rows found._\n\n';

  let out = section('Raw testing results (InstantDB evidenceResults)', 2);
  out += `Total rows: ${rows.length}\n\n`;

  const grouped = new Map<string, any[]>();
  for (const row of rows) {
    const def = row.evidenceDefinition ?? {};
    const sub = def.subscore ?? {};
    const cat = sub.category ?? {};
    const key = `${cat.slug ?? '?'}/${sub.slug ?? '?'}/${def.slug ?? '?'}`;
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(row);
  }

  for (const [key, groupRows] of [...grouped.entries()].sort()) {
    out += section(key, 3);
    const latest = groupRows.sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0))[0];
    const def = latest.evidenceDefinition ?? {};
    out += field('Evidence name', def.name ?? def.slug);
    out += field('Test run status', latest.testRun?.status);
    out += field('Published', latest.testRun?.isCurrentPublished ? 'yes' : 'no');

    const display = resolveEvidenceDisplayValue(def, {
      publicResult: latest.publicResult,
      rawValue: latest.rawValue,
      notApplicable: latest.notApplicable,
      isUnknown: latest.isUnknown,
      unableToVerify: latest.unableToVerify,
    });
    out += field('Display value', display);
    out += field('Normalized score', fmtScore(latest.normalizedScore));
    out += field('Raw value', latest.rawValue != null ? String(latest.rawValue) : undefined);
    out += field('Notes', latest.notes);
    out += field('Proof attachments', String((latest.attachments ?? []).filter((a: any) => !a.deletedAt).length));
  }

  return out;
}

async function renderAiCopyInventory(productId: string): Promise<string> {
  let out = section('AI copy inventory (all statuses — for admin cross-check)', 2);

  const [explanations, takeaways] = await Promise.all([
    listExplanationStatuses(productId),
    listProductTakeawaysSlim(productId),
  ]);

  out += section('Evidence group explanations ("What this means")', 3);
  out += '| Group | Status | Approved text |\n| --- | --- | --- |\n';
  for (const row of explanations.sort((a, b) => a.groupKey.localeCompare(b.groupKey))) {
    const text = row.whatThisMeans?.trim() || '—';
    out += `| ${row.groupKey} | ${row.explanationStatus} | ${text.replace(/\|/g, '\\|').replace(/\n/g, ' ')} |\n`;
  }
  out += '\n';

  out += section('Subscore key takeaways', 3);
  out += '| Subscore | Status | Text |\n| --- | --- | --- |\n';
  for (const row of takeaways.rows.sort((a, b) => a.subscoreKey.localeCompare(b.subscoreKey))) {
    const text = row.keyTakeaway?.trim() || '—';
    out += `| ${row.subscoreKey} | ${row.takeawayStatus} | ${text.replace(/\|/g, '\\|').replace(/\n/g, ' ')} |\n`;
  }
  out += '\n';

  return out;
}

async function renderDrawerExport(product: Awaited<ReturnType<typeof loadProductPreviewBySlug>>) {
  if (!product) return '';
  const slug = product.slug;
  const ratingsModel = await loadDraftRatingsViewModel(product, { preview: true });
  const approvedTakeaways = ratingsModel.approvedSubscoreTakeaways ?? new Map<string, string>();

  let md = section('Public drawer content (as shown on review page)', 2);
  md += field('Overall score', fmtScore(product.overallScore));
  md += field('Methodology version', ratingsModel.overview.methodologyVersion);
  md += field('Last tested', ratingsModel.overview.lastTested);
  md += field('Test run status', ratingsModel.overview.testRunStatus);
  md += '---\n\n';

  md += section('Evidence category drawers', 3);
  for (const cat of ratingsModel.categories) {
    md += section(cat.name, 4);
    for (const sub of cat.subscores) {
      md += section(sub.name, 5);
      for (const ec of sub.evidenceCategories) {
        md += renderEvidenceDrawer(ec);
      }
    }
  }

  md += section('Subscore calculation drawers', 3);
  for (const cat of ratingsModel.categories) {
    for (const sub of cat.subscores) {
      const productCat = product.categories.find((c) => c.key === cat.slug);
      const productSub = productCat?.subscores.find((s) => s.name === sub.name);
      const deferScores = deferPayAsYouGoScores(product.slug, sub.slug);
      const nominalWeights = buildSubscoreNominalWeights(
        cat.slug,
        sub.slug,
        sub.evidenceCategories.map((ec) => ec.name),
      );
      const { rows, excludedNames } = buildRedistributedCalcItems(
        sub.evidenceCategories.map((ec, i) => ({
          name: ec.name,
          score: deferScores ? null : ec.score,
          nominalWeight: nominalWeights[i] ?? 0,
        })),
      );
      const items = rows.map((row, i) => ({
        name: row.name,
        score: row.score,
        weight: row.weight,
        contribution: row.contribution,
        excluded: row.excluded,
        icon: sub.evidenceCategories[i]?.slug ?? '',
      }));

      const subscoreMethodology = getSubscoreMethodology(cat.slug, sub.slug);
      const calcWhatItMeasures =
        subscoreMethodology?.whatItMeasures ??
        sub.scopeDescription ??
        getSubscoreDescription(cat.slug, sub.name);
      const scopeSource =
        sub.scopeDescription || productSub?.description || getSubscoreDescription(cat.slug, sub.name);
      const keyTakeaways = approvedTakeaways.get(`${cat.slug}/${sub.slug}`) ?? '—';
      const excludedNote =
        deferScores && excludedNames.length === 0 ? PRICING_BENCHMARK_PENDING_NOTE : undefined;

      md += section(`How the ${sub.name} score was calculated`, 4);
      md += field('Final score', fmtScore(sub.score));
      md += field('Headline conclusion', buildSubscoreCalcHeadline(sub.name, items));
      md += field('What this measures', calcWhatItMeasures);
      md += field('Key takeaways (approved or —)', keyTakeaways);
      md += field('Score calculation copy', subscoreMethodology?.scoreCalculation);
      if (excludedNote) md += field('Note', excludedNote);

      md += '| Evidence category | Score | Weight | Contribution | Excluded |\n';
      md += '| --- | --- | --- | --- | --- |\n';
      for (const item of items) {
        md += `| ${item.name} | ${fmtScore(item.score)} | ${item.weight}% | ${item.contribution != null ? item.contribution.toFixed(2) : '—'} | ${item.excluded ? 'Yes' : 'No'} |\n`;
      }
      md += '\n';
      md += field('Scope description', buildSubscoreCalcScope(product.name, sub.name, scopeSource));
    }
  }

  return md;
}

async function main() {
  loadEnv();
  const { slug } = parseArgs();

  console.log('Exporting methodology…');
  try {
    execSync('npx tsx scripts/export-methodology.ts', { stdio: 'inherit', cwd: process.cwd() });
  } catch (e) {
    console.warn('Methodology export failed — continuing without it.', e);
  }

  const methodologyPath = resolve(process.cwd(), 'methodology-full-export.md');
  const methodologyMd = existsSync(methodologyPath)
    ? readFileSync(methodologyPath, 'utf8')
    : '_Methodology export unavailable._\n';

  const product = await loadProductPreviewBySlug(slug);
  if (!product) {
    console.error(`Product not found: ${slug}`);
    process.exit(1);
  }

  let productId = product.id;
  if (isDbConfigured()) {
    const db = getDb();
    const { products } = await (db.query as any)({
      products: { $: { where: { slug } } },
    });
    const row = (products as any[])?.find((p) => !p.deletedAt);
    if (row?.id) productId = row.id;
  }

  let md = `# ${product.name} — full review export for cross-check\n\n`;
  md += `Generated: ${new Date().toISOString()}\n`;
  md += `Product slug: \`${slug}\`\n\n`;
  md += 'Use this file with ChatGPT to compare methodology, raw testing data, public drawer copy, and AI copy status.\n\n';
  md += '---\n\n';

  md += section('Part 1 — Full methodology', 1);
  md += methodologyMd;
  md += '\n---\n\n';

  md += section('Part 2 — Raw Candy AI testing results', 1);
  md += await renderRawTestingSection(slug);

  md += section('Part 3 — Public drawer content', 1);
  md += await renderDrawerExport(product);

  if (isDbConfigured() && productId) {
    md += section('Part 4 — AI copy inventory', 1);
    md += await renderAiCopyInventory(productId);
  }

  const outPath = resolve(process.cwd(), `${slug}-full-review-export.md`);
  writeFileSync(outPath, md, 'utf8');
  console.log(`\nWrote ${outPath}`);
  console.log(`Size: ${(md.length / 1024).toFixed(1)} KB`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
