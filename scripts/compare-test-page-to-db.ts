#!/usr/bin/env npx tsx
/**
 * Compare public /test/ page data sources against InstantDB export (source of truth).
 */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { getTestCategories } from '../src/lib/test-framework';
import { getTestCategoryMethodology } from '../src/data/test-category-methodology';
import { getPublicEvidenceGroups } from '../src/lib/test-subscore-public-evidence';
import { toSlug } from '../src/lib/slugs';

/** DB evidence recorded during testing but not shown as a public evidence group. */
const SCORING_ONLY_EVIDENCE: Record<string, string[]> = {
  'characters/variety': ['anime-female-count', 'anime-male-count'],
};

type DbEvidence = { slug: string; name: string; weight: number; active?: boolean };
type DbSubscore = { slug: string; name: string; weight: number; active?: boolean; evidence: DbEvidence[] };
type DbCategory = { slug: string; name: string; weight: number; active?: boolean; subscores: DbSubscore[] };

const exportPath = resolve(process.cwd(), 'methodology-full-export.json');
const db = JSON.parse(readFileSync(exportPath, 'utf8')) as {
  exportedAt: string;
  methodologyVersion: string;
  source: string;
  categories: DbCategory[];
};

const pageCategories = getTestCategories();

interface Issue {
  level: 'error' | 'warn';
  area: string;
  message: string;
}

const issues: Issue[] = [];

function add(level: Issue['level'], area: string, message: string) {
  issues.push({ level, area, message });
}

function activeEvidence(evidence: DbEvidence[]) {
  return evidence.filter((e) => e.active !== false);
}

function activeSubscores(subscores: DbSubscore[]) {
  return subscores.filter((s) => s.active !== false);
}

function activeCategories(categories: DbCategory[]) {
  return categories.filter((c) => c.active !== false);
}

const dbCats = activeCategories(db.categories);

console.log(`DB export: ${db.exportedAt} (${db.methodologyVersion}, ${db.source})`);
console.log(`Page categories: ${pageCategories.length} | DB categories: ${dbCats.length}`);

// --- Category-level ---
for (const pageCat of pageCategories) {
  const dbCat = dbCats.find((c) => c.slug === pageCat.key);
  if (!dbCat) {
    add('error', 'category', `Missing in DB: ${pageCat.key} (${pageCat.name})`);
    continue;
  }
  if (dbCat.weight !== pageCat.weight) {
    add('error', 'category-weight', `${pageCat.key}: page=${pageCat.weight}% db=${dbCat.weight}%`);
  }
  if (dbCat.name !== pageCat.name) {
    add('warn', 'category-name', `${pageCat.key}: page="${pageCat.name}" db="${dbCat.name}"`);
  }

  const content = getTestCategoryMethodology(pageCat.key);
  const dbSubs = activeSubscores(dbCat.subscores);

  if (pageCat.subscores.length !== dbSubs.length) {
    add(
      'error',
      'subscore-count',
      `${pageCat.key}: page has ${pageCat.subscores.length} subscores, DB has ${dbSubs.length}`,
    );
  }

  for (const pageSub of pageCat.subscores) {
    const dbSub = dbSubs.find((s) => s.slug === pageSub.slug);
    if (!dbSub) {
      add('error', 'subscore', `${pageCat.key}/${pageSub.slug}: missing in DB`);
      continue;
    }
    if (dbSub.name !== pageSub.name) {
      add('warn', 'subscore-name', `${pageCat.key}/${pageSub.slug}: page="${pageSub.name}" db="${dbSub.name}"`);
    }

    const pageMeasures = pageSub.contributors.map((c) => c.label);
    const publicGroups = getPublicEvidenceGroups(pageCat.key, pageSub.slug);
    const pageWeight =
      content?.scoreCalculation.weights.find((w) => w.name === pageSub.name)?.weight ?? pageSub.contributors.length;

    const methodologyWeight = content?.scoreCalculation.weights.find((w) => w.name === pageSub.name)?.weight;
    if (methodologyWeight != null && methodologyWeight !== dbSub.weight) {
      add(
        'error',
        'subscore-weight',
        `${pageCat.key}/${pageSub.slug}: methodology=${methodologyWeight}% db=${dbSub.weight}%`,
      );
    }

    const dbEvidence = activeEvidence(dbSub.evidence);
    const dbEvidenceNames = dbEvidence.map((e) => e.name);
    const dbEvidenceSlugs = dbEvidence.map((e) => e.slug);

    // Page contributor labels (aura-ai-categories)
    const contributorLabels = pageSub.contributors.map((c) => c.label);
    const contributorSlugs = pageSub.contributors.map((c) => c.slug);

    // Compare measures shown on /test/ (what accordion renders)
    for (const measure of pageMeasures) {
      const measureSlug = toSlug(measure);
      const inContributors = contributorLabels.includes(measure);
      const inDbByName = dbEvidenceNames.some((n) => n.toLowerCase() === measure.toLowerCase());
      const inDbBySlug = dbEvidenceSlugs.includes(measureSlug);
      if (!inContributors && !inDbByName && !inDbBySlug) {
        add(
          'warn',
          'measure-not-in-db',
          `${pageCat.key}/${pageSub.slug}: measure "${measure}" not found in DB evidence (names/slugs) or contributors`,
        );
      }
    }

    const scoringOnly = SCORING_ONLY_EVIDENCE[`${pageCat.key}/${pageSub.slug}`] ?? [];

    // DB evidence not represented on page at all
    for (const ev of dbEvidence) {
      if (scoringOnly.includes(ev.slug)) continue;
      const evSlug = ev.slug;
      const evNameSlug = toSlug(ev.name);
      const inPublicGroup = publicGroups?.some((group) => group.memberSlugs.includes(evSlug));
      const onPage =
        inPublicGroup ||
        contributorLabels.some((l) => toSlug(l) === evSlug || l.toLowerCase() === ev.name.toLowerCase()) ||
        pageMeasures.some((m) => toSlug(m) === evSlug || m.toLowerCase() === ev.name.toLowerCase()) ||
        contributorSlugs.includes(evSlug) ||
        pageMeasures.some((m) => toSlug(m) === evNameSlug);

      if (!onPage) {
        add(
          'warn',
          'db-evidence-missing-on-page',
          `${pageCat.key}/${pageSub.slug}: DB evidence "${ev.name}" (${ev.slug}) not on /test/ page`,
        );
      }
    }

    const expectedPageCount = publicGroups?.length ?? dbEvidence.length;
    if (pageMeasures.length !== expectedPageCount) {
      add(
        'warn',
        'evidence-count',
        `${pageCat.key}/${pageSub.slug}: page shows ${pageMeasures.length} measures, expected ${expectedPageCount}`,
      );
    }

    // Evidence weights within subscore should sum to ~100
    const dbEvidenceWeightSum = dbEvidence.reduce((s, e) => s + e.weight, 0);
    if (Math.abs(dbEvidenceWeightSum - 100) > 0.01) {
      add(
        'error',
        'db-evidence-weights',
        `${pageCat.key}/${pageSub.slug}: DB evidence weights sum to ${dbEvidenceWeightSum}% (expected 100)`,
      );
    }
  }

  // Subscore weights should sum to 100
  const dbSubWeightSum = dbSubs.reduce((s, sub) => s + sub.weight, 0);
  if (Math.abs(dbSubWeightSum - 100) > 0.01) {
    add('error', 'db-subscore-weights', `${pageCat.key}: DB subscore weights sum to ${dbSubWeightSum}%`);
  }

  const pageMethodologyWeights = content?.scoreCalculation.weights ?? [];
  const pageMethodologyWeightSum = pageMethodologyWeights.reduce((s, w) => s + w.weight, 0);
  if (pageMethodologyWeights.length && Math.abs(pageMethodologyWeightSum - 100) > 0.01) {
    add(
      'error',
      'page-subscore-weights',
      `${pageCat.key}: page methodology subscore weights sum to ${pageMethodologyWeightSum}%`,
    );
  }
}

// DB categories missing from page
for (const dbCat of dbCats) {
  if (!pageCategories.find((c) => c.key === dbCat.slug)) {
    add('error', 'category', `In DB but missing on page: ${dbCat.slug} (${dbCat.name})`);
  }
}

const dbCatWeightSum = dbCats.reduce((s, c) => s + c.weight, 0);
if (Math.abs(dbCatWeightSum - 100) > 0.01) {
  add('error', 'db-category-weights', `DB category weights sum to ${dbCatWeightSum}%`);
}

const pageCatWeightSum = pageCategories.reduce((s, c) => s + c.weight, 0);
if (Math.abs(pageCatWeightSum - 100) > 0.01) {
  add('error', 'page-category-weights', `Page category weights sum to ${pageCatWeightSum}%`);
}

// Totals
const dbEvidenceTotal = dbCats.reduce(
  (s, c) => s + activeSubscores(c.subscores).reduce((ss, sub) => ss + activeEvidence(sub.evidence).length, 0),
  0,
);
const pageEvidenceTotal = pageCategories.reduce(
  (s, c) => s + c.subscores.reduce((ss, sub) => ss + sub.contributors.length, 0),
  0,
);

console.log(`\nTotals — page measures: ${pageEvidenceTotal} | DB evidence: ${dbEvidenceTotal}`);

const errors = issues.filter((i) => i.level === 'error');
const warns = issues.filter((i) => i.level === 'warn');

console.log(`\n=== ERRORS (${errors.length}) ===`);
for (const i of errors) console.log(`  [${i.area}] ${i.message}`);

console.log(`\n=== WARNINGS (${warns.length}) ===`);
for (const i of warns) console.log(`  [${i.area}] ${i.message}`);

if (!errors.length && !warns.length) {
  console.log('\nAll checks passed.');
}

process.exit(errors.length ? 1 : 0);
