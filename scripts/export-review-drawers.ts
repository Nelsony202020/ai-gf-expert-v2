#!/usr/bin/env npx tsx
/**
 * Export all Ratings & Specs drawer content for a product review.
 *
 * Usage:
 *   npx tsx scripts/export-review-drawers.ts
 *   npx tsx scripts/export-review-drawers.ts --slug candy-ai
 *   npx tsx scripts/export-review-drawers.ts --slug candy-ai --preview
 *
 * Output: review-drawers-export-{slug}.md
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { loadProductPreviewBySlug } from '../src/lib/content/store';
import { loadDraftRatingsViewModel } from '../src/lib/draft-ratings/loadDraftRatingsData';
import {
  buildSubscoreCalcHeadline,
  buildSubscoreCalcScope,
  enhancedScopeDescription,
} from '../src/lib/draft-ratings/evidenceDrawerContent';
import { getSubscoreDescription } from '../src/data/subscore-descriptions';
import {
  getEvidenceMethodology,
  getSubscoreMethodology,
} from '../src/data/evidence-drawer-methodology';
import { buildRedistributedCalcItems } from '../src/lib/scores';
import { buildSubscoreNominalWeights } from '../src/lib/ratings/evidenceGroupScoring';
import { deferPayAsYouGoScores, PRICING_BENCHMARK_PENDING_NOTE } from '../src/lib/ratings/evidenceIcons';
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
  let preview = false;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--slug') slug = args[++i] ?? slug;
    if (args[i] === '--preview') preview = true;
  }
  return { slug, preview };
}

function fmtScore(score: number | null | undefined): string {
  if (score == null || Number.isNaN(score)) return '—';
  return score.toFixed(1);
}

function section(title: string, level = 2): string {
  return `${'#'.repeat(level)} ${title}\n\n`;
}

function field(label: string, value: string | undefined | null): string {
  if (!value?.trim()) return '';
  return `**${label}:** ${value.trim()}\n\n`;
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
  out += field('What this means', ec.whatThisMeans);
  out += field('Card teaser', ec.cardTeaser);
  out += field('Proof files', ec.proofLabel || (ec.proofCount ? `${ec.proofCount} file(s)` : undefined));

  out += renderTestResults(ec);
  out += renderCalculation(ec);

  if (ec.bonusExtras?.length) {
    out += '**Bonus extras:**\n\n';
    for (const extra of ec.bonusExtras) {
      out += `- **${extra.name}**${extra.note ? `: ${extra.note}` : ''}${extra.proof?.length ? ` (${extra.proof.length} proof file(s))` : ''}\n`;
    }
    out += '\n';
  }

  if (ec.liveCamProof?.length) {
    out += `**Live cam proof:** ${ec.liveCamProof.length} file(s)\n\n`;
  }

  if (ec.limitations) out += field('Limitations', ec.limitations);

  return out;
}

async function main() {
  loadEnv();
  const { slug, preview } = parseArgs();

  const product = await loadProductPreviewBySlug(slug);
  if (!product) {
    console.error(`Product not found: ${slug}`);
    process.exit(1);
  }

  const ratingsModel = await loadDraftRatingsViewModel(product, { preview });
  const approvedTakeaways = ratingsModel.approvedSubscoreTakeaways ?? new Map<string, string>();

  let md = `# ${product.name} — Ratings & Specs drawer export\n\n`;
  md += `Generated for ChatGPT copy review. Product slug: \`${slug}\`.\n\n`;
  md += field('Overall score', fmtScore(product.overallScore));
  md += field('Methodology version', ratingsModel.overview.methodologyVersion);
  md += field('Last tested', ratingsModel.overview.lastTested);
  md += field('Test run status', ratingsModel.overview.testRunStatus);
  md += field('Test run ID', ratingsModel.overview.testRunId);
  md += field(
    'Evidence completed',
    `${ratingsModel.overview.completedEvidence}/${ratingsModel.overview.totalRequiredEvidence}`,
  );
  md += field('Proof attachments', String(ratingsModel.overview.proofAttachments));
  md += '---\n\n';

  md += section('Ratings tab overview (scores on page)', 2);

  for (const cat of ratingsModel.categories) {
    md += section(`${cat.name} — ${fmtScore(cat.score)}/10`, 3);
    md += field('Category weight', `${cat.weight}%`);
    md += field('Category verdict', cat.categoryVerdict);
    md += field('Primary strength', cat.primaryStrength);
    md += field('Primary limitation', cat.primaryLimitation);

    if (cat.keyFindings.length) {
      md += '**Key findings:**\n\n';
      for (const f of cat.keyFindings) {
        md += `- **${f.label}:** ${f.value}\n`;
      }
      md += '\n';
    }

    for (const sub of cat.subscores) {
      md += section(`${sub.name} — ${fmtScore(sub.score)}/10`, 4);
      md += field('Finding', sub.finding ?? sub.explanation);
      md += field('Scope', sub.scopeDescription);
      md += field('Proof', sub.proofLabel);

      if (sub.evidenceCategories.length) {
        md += '| Evidence category | Score |\n| --- | --- |\n';
        for (const ec of sub.evidenceCategories) {
          md += `| ${ec.name} | ${fmtScore(ec.score)} |\n`;
        }
        md += '\n';
      }
    }
  }

  md += '---\n\n';
  md += section('Evidence category drawers', 2);

  for (const cat of ratingsModel.categories) {
    md += section(cat.name, 3);
    for (const sub of cat.subscores) {
      md += section(sub.name, 4);
      for (const ec of sub.evidenceCategories) {
        md += renderEvidenceDrawer(ec);
      }
    }
  }

  md += '---\n\n';
  md += section('Subscore calculation drawers ("View score calculation")', 2);

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
      const scoreCalculation = subscoreMethodology?.scoreCalculation;
      const scopeSource =
        sub.scopeDescription || productSub?.description || getSubscoreDescription(cat.slug, sub.name);
      const keyTakeaways = approvedTakeaways.get(`${cat.slug}/${sub.slug}`) ?? '—';
      const headlineConclusion = buildSubscoreCalcHeadline(sub.name, items);
      const excludedNote =
        deferScores && excludedNames.length === 0 ? PRICING_BENCHMARK_PENDING_NOTE : undefined;

      md += section(`How the ${sub.name} score was calculated`, 3);
      md += field('Category', cat.name);
      md += field('Subscore', sub.name);
      md += field('Final score', fmtScore(sub.score));
      md += field('Headline conclusion', headlineConclusion);
      md += field('What this measures', calcWhatItMeasures);
      md += field('Key takeaways', keyTakeaways);
      if (excludedNote) md += field('Note', excludedNote);

      md += '**Breakdown:**\n\n';
      md += '| Evidence category | Score (0–10) | Weight | Contribution | Excluded |\n';
      md += '| --- | --- | --- | --- | --- |\n';
      for (const item of items) {
        md += `| ${item.name} | ${fmtScore(item.score)} | ${item.weight}% | ${item.contribution != null ? item.contribution.toFixed(2) : '—'} | ${item.excluded ? 'Yes' : 'No'} |\n`;
      }
      md += '\n';

      const parts = items
        .filter((i) => i.contribution != null)
        .map((i) => i.contribution!.toFixed(2));
      const rawTotal = items
        .filter((i) => i.contribution != null)
        .reduce((sum, i) => sum + i.contribution!, 0);
      if (parts.length) {
        md += `Total: ${parts.join(' + ')} = ${rawTotal.toFixed(2)} → **${fmtScore(sub.score)}**\n\n`;
      }

      md += field(
        'How the score is calculated',
        scoreCalculation ??
          `Each evidence category is scored on a 0–10 scale, weighted, and combined for the final ${sub.name} score.`,
      );
      md += field('Scope description (legacy)', buildSubscoreCalcScope(product.name, sub.name, scopeSource));
    }
  }

  const outPath = resolve(process.cwd(), `review-drawers-export-${slug}.md`);
  writeFileSync(outPath, md, 'utf8');
  console.log(`Wrote ${outPath}`);
  console.log(
    `Categories: ${ratingsModel.categories.length}, evidence drawers: ${ratingsModel.categories.reduce((n, c) => n + c.subscores.reduce((m, s) => m + s.evidenceCategories.length, 0), 0)}, subscore calc drawers: ${ratingsModel.categories.reduce((n, c) => n + c.subscores.length, 0)}`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
