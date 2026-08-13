/**
 * In-place InstantDB updates for character quality + Ass size rename + retire paywalls/originality.
 * Does NOT delete evidenceResults — only updates definitions and migrates rawValue shapes.
 *
 *   npx tsx scripts/update-character-quality-evidence.ts
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { init } from '@instantdb/admin';
import { QUALITY_LIKERT_OPTIONS } from '../src/components/admin/testing/rubricOptions';

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
loadEnv();

function nearestLikert(pct: number): number {
  let best = Number(QUALITY_LIKERT_OPTIONS[0].value);
  let bestDist = Math.abs(best - pct);
  for (const opt of QUALITY_LIKERT_OPTIONS) {
    const v = Number(opt.value);
    const dist = Math.abs(v - pct);
    if (dist < bestDist) {
      best = v;
      bestDist = dist;
    }
  }
  return best;
}

function rubricLabel(value: number): string {
  return QUALITY_LIKERT_OPTIONS.find((o) => Number(o.value) === value)?.label ?? String(value);
}

async function main() {
  const appId = process.env.PUBLIC_INSTANT_APP_ID;
  const adminToken = process.env.INSTANT_APP_ADMIN_TOKEN;
  if (!appId || !adminToken) {
    console.error('Missing PUBLIC_INSTANT_APP_ID / INSTANT_APP_ADMIN_TOKEN');
    process.exit(1);
  }

  const db = init({ appId, adminToken });
  const { evidenceDefinitions } = await db.query({
    evidenceDefinitions: { subscore: { category: {} } },
  });

  // Prefer the active row when duplicate slugs exist across methodology versions.
  const bySlug = new Map<string, any>();
  for (const def of evidenceDefinitions as any[]) {
    const slug = String(def.slug ?? '');
    const prev = bySlug.get(slug);
    if (!prev || (def.active !== false && prev.active === false)) {
      bySlug.set(slug, def);
    }
  }

  const txs: any[] = [];
  const touch = (slug: string, fields: Record<string, unknown>) => {
    const def = bySlug.get(slug);
    if (!def) {
      console.warn(`Missing definition ${slug}`);
      return null;
    }
    txs.push(db.tx.evidenceDefinitions[def.id].update(fields));
    console.log(`Updating ${slug} (${def.id}) active=${def.active}`);
    return def;
  };

  const duplicates = touch('duplicates', {
    name: 'Duplicate profiles found',
    publicDescription: 'how many near-duplicate profiles appear in the sample',
    questionLabel: 'Duplicate profiles found?',
    helpText:
      'In your sample above (e.g. 25), enter how many near-copy profiles you found. 0 is best, up to the sample size is worst.',
    internalInstructions:
      'Review 25 characters.\nCount how many are near-copies.\nEnter the count from 0 (none — best) to 25 (all duplicates — worst).',
    testInstructions:
      'Count near-copy profiles in your sample. Enter a whole number from 0 to 25 (or your sample size).',
    resultFormat: 'Number of duplicate profiles found (0–25).',
    measurementType: 'count',
    unit: 'profiles',
    inputType: 'number',
    calculationMethod: undefined,
    sampleSize: 25,
    weight: 50,
    required: true,
    active: true,
    displayOrder: 1,
    scoringRule: { kind: 'linear', min: 0, max: 25, invert: true },
    options: [],
  });

  touch('originality', {
    active: false,
    required: false,
    questionLabel: 'Originality (retired — use duplicate profiles found)',
  });

  for (const slug of ['profile-quality', 'visual-quality'] as const) {
    const label = slug === 'profile-quality' ? 'good profiles' : 'good photos';
    touch(slug, {
      name: slug === 'profile-quality' ? 'Profile Quality' : 'Visual Quality',
      publicDescription:
        slug === 'profile-quality'
          ? 'overall quality of character profiles'
          : 'overall quality of character photos',
      questionLabel: `Characters: ${label}?`,
      helpText: `Rate overall ${label.replace('good ', '')} quality for your sample: very bad → very good.`,
      internalInstructions: `Review the same 25 characters.\nRate overall ${label}: Very bad, Bad, Neutral, Good, or Very good.`,
      testInstructions: `Choose Very bad, Bad, Neutral, Good, or Very good.`,
      resultFormat: 'Likert rating (Very bad → Very good).',
      measurementType: 'percentage',
      unit: '%',
      inputType: 'rubric',
      calculationMethod: undefined,
      weight: 25,
      required: true,
      active: true,
      displayOrder: slug === 'profile-quality' ? 2 : 3,
      scoringRule: { kind: 'linear', min: 0, max: 100 },
      options: QUALITY_LIKERT_OPTIONS,
    });
  }

  touch('ss-size', {
    name: 'Ass size options',
    publicDescription: 'ass size options',
    questionLabel: 'Creator: Ass size options?',
    helpText: 'Count ass size choices if offered.',
    internalInstructions: 'Count ass size options.',
    testInstructions: 'Count ass size choices in the creator.',
    resultFormat: 'Number of ass size options.',
  });

  touch('paywalls', {
    active: false,
    required: false,
    questionLabel: 'Which features are paywalled? (retired)',
  });

  if (txs.length) {
    await db.transact(txs);
    console.log(`Updated ${txs.length} evidence definition(s).`);
  }

  // Migrate existing results — keep rows, reshape values only.
  const { evidenceResults } = await db.query({
    evidenceResults: { evidenceDefinition: { subscore: { category: {} } } },
  });

  const resultTxs: any[] = [];
  let migratedDup = 0;
  let migratedLikert = 0;

  for (const row of evidenceResults as any[]) {
    const def = row.evidenceDefinition;
    if (!def) continue;
    const slug = String(def.slug ?? '');
    const raw = row.rawValue;
    if (!raw || typeof raw !== 'object') continue;

    if (slug === 'duplicates' && 'value' in raw) {
      const detail = (raw as { detail?: Record<string, unknown> }).detail ?? {};
      let count: number | null = null;
      if (typeof detail.numerator === 'number') count = detail.numerator;
      else if (typeof detail.count === 'number') count = detail.count;
      else if (typeof (raw as { value: number }).value === 'number') {
        const v = (raw as { value: number }).value;
        // Old answers stored percentage (0–100). Prefer numerator when present;
        // otherwise if value > 25 treat as % of 25 sample → round count.
        count = v > 25 ? Math.round((v / 100) * 25) : Math.round(v);
      }
      if (count === null || !Number.isFinite(count)) continue;
      count = Math.max(0, Math.min(25, count));
      const prev = (raw as { value: number }).value;
      if (prev === count && detail.count === count) continue;
      resultTxs.push(
        db.tx.evidenceResults[row.id].update({
          rawValue: { value: count, detail: { count, max: 25, migratedFrom: raw } },
          updatedAt: Date.now(),
        }),
      );
      migratedDup += 1;
    }

    if (
      (slug === 'profile-quality' || slug === 'visual-quality') &&
      'value' in raw &&
      typeof (raw as { value: number }).value === 'number'
    ) {
      const v = (raw as { value: number }).value;
      const detail = (raw as { detail?: Record<string, unknown> }).detail ?? {};
      if (typeof detail.rubric === 'string' && QUALITY_LIKERT_OPTIONS.some((o) => o.label === detail.rubric)) {
        continue;
      }
      const next = nearestLikert(v);
      if (next === v && detail.rubric) continue;
      resultTxs.push(
        db.tx.evidenceResults[row.id].update({
          rawValue: {
            value: next,
            detail: { rubric: rubricLabel(next), migratedFrom: raw },
          },
          updatedAt: Date.now(),
        }),
      );
      migratedLikert += 1;
    }
  }

  const chunk = 40;
  for (let i = 0; i < resultTxs.length; i += chunk) {
    await db.transact(resultTxs.slice(i, i + chunk));
  }

  console.log(
    JSON.stringify(
      {
        duplicatesDef: Boolean(duplicates),
        migratedDuplicateResults: migratedDup,
        migratedLikertResults: migratedLikert,
        note: 'Existing evidenceResults kept; originality + paywalls deactivated (not deleted).',
      },
      null,
      2,
    ),
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
