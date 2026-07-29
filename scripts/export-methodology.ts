#!/usr/bin/env npx tsx
/**
 * Full methodology export for rewriting /test pages or external review.
 *
 * Combines:
 * - Live InstantDB active methodology (categories → subscores → evidence)
 * - Admin guided-testing workflow (sessions, worksheets, sample sizes)
 * - Scoring rules reference + capability gating + short tester questions
 *
 * Usage:
 *   npx tsx scripts/export-methodology.ts
 *   npx tsx scripts/export-methodology.ts --json-only
 *
 * Outputs (project root):
 *   methodology-full-export.md   — copy/paste into ChatGPT
 *   methodology-full-export.json   — structured backup
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { CALCULATION_VERSION } from '../src/lib/scoring/engine';
import { TEST_SESSIONS, COMBINED_EVIDENCE_SLUGS } from '../src/components/admin/testing/sessions';
import { SAMPLE, chatReplyTotal } from '../src/components/admin/testing/sampleSizes';
import { WORKSHEETS } from '../src/components/admin/testing/worksheets';
import { CHAT_UNDERSTANDING_SCRIPT } from '../src/components/admin/testing/chatTestScript';
import { SHORT_QUESTIONS } from '../src/components/admin/testing/shortQuestions';
import { REQUIRED_CAP, FEATURE_ITEM_CAP } from '../src/lib/testing/capabilityGating';
import { PRICING_AUTOFILL_SLUGS } from '../src/lib/testing/pricingEvidenceSlugs';
import {
  categorySeeds,
  subscoreSeeds,
  evidenceDefSeeds,
  METHODOLOGY_VERSION as SEED_VERSION,
} from './seed/methodology-data';

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

type ScoringRule =
  | { kind: 'linear'; min: number; max: number; invert?: boolean }
  | { kind: 'bands'; bands: { upTo: number; score: number }[]; invert?: boolean }
  | { kind: 'ynl'; yes: number; limited: number; no: number; unknown: number }
  | { kind: 'manual' };

interface EvidenceRow {
  id?: string;
  slug: string;
  name: string;
  active?: boolean;
  required: boolean;
  weight: number;
  displayOrder: number;
  measurementType: string;
  unit?: string;
  publicDescription?: string;
  internalInstructions?: string;
  resultFormat?: string;
  scoringRule: ScoringRule;
  questionLabel?: string;
  testInstructions?: string;
  shortDescription?: string;
  whyItMatters?: string;
  inputType?: string;
  options?: unknown;
  calculationMethod?: unknown;
  evidenceRequirements?: unknown;
  exampleAnswer?: string;
  helpText?: string;
  sampleSize?: number;
  allowUnableToVerify?: boolean;
  publicResultTemplate?: string;
}

interface SubscoreRow {
  slug: string;
  name: string;
  weight: number;
  displayOrder: number;
  description?: string;
  active?: boolean;
  evidence: EvidenceRow[];
}

interface CategoryRow {
  slug: string;
  name: string;
  weight: number;
  displayOrder: number;
  description?: string;
  active?: boolean;
  subscores: SubscoreRow[];
}

function fmtRule(rule: ScoringRule | undefined): string {
  if (!rule) return '(none)';
  switch (rule.kind) {
    case 'linear':
      return `linear: map ${rule.min}–${rule.max} → 0–10${rule.invert ? ' (inverted)' : ''}`;
    case 'bands':
      return `bands: ${[...rule.bands]
        .sort((a, b) => a.upTo - b.upTo)
        .map((b) => `≤${b.upTo} → ${b.score}/10`)
        .join('; ')}`;
    case 'ynl':
      return `yes/limited/no/unknown → ${rule.yes}/${rule.limited}/${rule.no}/${rule.unknown}`;
    case 'manual':
      return 'manual (structured answer; tester or override assigns 0–10)';
    default:
      return JSON.stringify(rule);
  }
}

function shortKey(categorySlug: string, evidenceSlug: string): string {
  return `${categorySlug}|${evidenceSlug}`;
}

function sessionForSlug(categorySlug: string, evidenceSlug: string): string | null {
  for (const session of TEST_SESSIONS[categorySlug] ?? []) {
    if (session.slugs.includes(evidenceSlug)) return session.title;
  }
  return null;
}

function isHiddenFromTesting(categorySlug: string, evidenceSlug: string): boolean {
  if (COMBINED_EVIDENCE_SLUGS.has(evidenceSlug)) return true;
  if (categorySlug === 'pricing' && PRICING_AUTOFILL_SLUGS.has(evidenceSlug)) return true;
  return false;
}

async function loadFromDb(): Promise<{ version: string; categories: CategoryRow[] } | null> {
  try {
    const { getDb } = await import('../src/lib/db/server');
    const db = getDb();
    const { methodologyVersions } = await (db.query as any)({
      methodologyVersions: {
        $: { where: { status: 'active' } },
        categories: { subscores: { evidenceDefinitions: {} } },
      },
    });
    const mv = (methodologyVersions as any[])[0];
    if (!mv) return null;

    const categories: CategoryRow[] = (mv.categories ?? [])
      .filter((c: any) => c.active !== false)
      .sort((a: any, b: any) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0))
      .map((c: any) => ({
        slug: String(c.slug),
        name: String(c.name),
        weight: Number(c.weight),
        displayOrder: Number(c.displayOrder ?? 0),
        description: c.description ? String(c.description) : undefined,
        active: c.active !== false,
        subscores: (c.subscores ?? [])
          .filter((s: any) => s.active !== false)
          .sort((a: any, b: any) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0))
          .map((s: any) => ({
            slug: String(s.slug),
            name: String(s.name),
            weight: Number(s.weight),
            displayOrder: Number(s.displayOrder ?? 0),
            description: s.description ? String(s.description) : undefined,
            active: s.active !== false,
            evidence: (s.evidenceDefinitions ?? [])
              .filter((d: any) => d.active !== false)
              .sort((a: any, b: any) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0))
              .map(
                (d: any): EvidenceRow => ({
                  id: d.id,
                  slug: String(d.slug),
                  name: String(d.name),
                  required: Boolean(d.required),
                  weight: Number(d.weight),
                  displayOrder: Number(d.displayOrder ?? 0),
                  measurementType: String(d.measurementType ?? ''),
                  unit: d.unit ? String(d.unit) : undefined,
                  publicDescription: d.publicDescription ? String(d.publicDescription) : undefined,
                  internalInstructions: d.internalInstructions ? String(d.internalInstructions) : undefined,
                  resultFormat: d.resultFormat ? String(d.resultFormat) : undefined,
                  scoringRule: d.scoringRule as ScoringRule,
                  questionLabel: d.questionLabel ? String(d.questionLabel) : undefined,
                  testInstructions: d.testInstructions ? String(d.testInstructions) : undefined,
                  shortDescription: d.shortDescription ? String(d.shortDescription) : undefined,
                  whyItMatters: d.whyItMatters ? String(d.whyItMatters) : undefined,
                  inputType: d.inputType ? String(d.inputType) : undefined,
                  options: d.options,
                  calculationMethod: d.calculationMethod,
                  evidenceRequirements: d.evidenceRequirements,
                  exampleAnswer: d.exampleAnswer ? String(d.exampleAnswer) : undefined,
                  helpText: d.helpText ? String(d.helpText) : undefined,
                  sampleSize: d.sampleSize != null ? Number(d.sampleSize) : undefined,
                  allowUnableToVerify: d.allowUnableToVerify,
                  publicResultTemplate: d.publicResultTemplate ? String(d.publicResultTemplate) : undefined,
                }),
              ),
          })),
      }));

    return { version: String(mv.version ?? 'unknown'), categories };
  } catch (e) {
    console.warn('DB unavailable — falling back to seed file:', e instanceof Error ? e.message : e);
    return null;
  }
}

function loadFromSeed(): { version: string; categories: CategoryRow[] } {
  const categories: CategoryRow[] = categorySeeds.map((c) => ({
    slug: c.slug,
    name: c.name,
    weight: c.weight,
    displayOrder: c.displayOrder,
    description: c.description,
    active: true,
    subscores: subscoreSeeds
      .filter((s) => s.category === c.slug)
      .sort((a, b) => a.displayOrder - b.displayOrder)
      .map((s) => ({
        slug: s.slug,
        name: s.name,
        weight: s.weight,
        displayOrder: s.displayOrder,
        description: s.description,
        active: true,
        evidence: evidenceDefSeeds
          .filter((e) => e.category === c.slug && e.subscore === s.slug)
          .sort((a, b) => a.displayOrder - b.displayOrder)
          .map((e) => ({
            slug: e.slug,
            name: e.name,
            required: e.required,
            weight: e.weight,
            displayOrder: e.displayOrder,
            measurementType: e.measurementType,
            unit: e.unit,
            publicDescription: e.publicDescription,
            internalInstructions: e.internalInstructions,
            resultFormat: e.resultFormat,
            scoringRule: e.scoringRule,
          })),
      })),
  }));
  return { version: SEED_VERSION, categories };
}

function scoringEngineNotes(): string {
  return `# Scoring engine reference (${CALCULATION_VERSION})

## Hierarchy
1. Each evidence answer → normalized **0–10** via \`scoringRule\`
2. Subscore = weighted average of scorable evidence in that subscore
3. Category = weighted average of subscores
4. Overall = weighted average of categories

## General rules
- **Not Applicable** evidence is removed; remaining weights in the subscore are **re-scaled proportionally**
- **Unknown** (privacy) can be excluded from score; elsewhere Unknown scores **0**, never treated as Yes
- **Manual override** (0–10 + reason) replaces calculated score when set
- Publish blocks only when required evidence has **no recorded answer**; manual-scoring items with answers may warn but not block

## Special scoring cases (engine.ts)
- **resolution / maximum-resolution**: text map — 480p=4, 720p=6, 1080p=8, 4k=10
- **mode-types**: average of mode ratings (good=10, partial=5, poor=0); N/A when ≤1 chat mode
- **chat-modes**: band scoring on mode count when status=yes
- **free-plan**: no=NA (neutral); yes=10; limited=7
- **free-trial**: no=0
- **live-cam** (bonus-only): no=NA; yes=10; limited=6
- **support-available / support-channels**: reference notes, excluded from score
- **support-reach/speed/helpfulness**: NA when support-available=no
- **edit-memories**: 0 when save-memories=no
- **Privacy unknown**: excluded from score (not counted as 0)
- Capability-gated tests: N/A when product Setup capability is explicitly false
`;
}

function buildMarkdown(data: { version: string; categories: CategoryRow[]; source: string }): string {
  const lines: string[] = [];
  const exportedAt = new Date().toISOString();
  let evidenceCount = 0;
  for (const c of data.categories) for (const s of c.subscores) evidenceCount += s.evidence.length;

  lines.push('# AI GF Expert — Complete Methodology Export');
  lines.push('');
  lines.push(`- **Exported:** ${exportedAt}`);
  lines.push(`- **Methodology version:** ${data.version}`);
  lines.push(`- **Source:** ${data.source}`);
  lines.push(`- **Calculation engine:** ${CALCULATION_VERSION}`);
  lines.push(`- **Categories:** ${data.categories.length} | **Evidence definitions:** ${evidenceCount}`);
  lines.push('');
  lines.push('> **Note:** Public `/test` pages use `src/data/methodology.ts` (stale). This export reflects the **live scoring system** and **admin guided testing** workflow.');
  lines.push('');

  lines.push('---');
  lines.push('');
  lines.push(scoringEngineNotes());
  lines.push('');
  lines.push('---');
  lines.push('');
  lines.push('# Sample sizes (admin testing)');
  lines.push('');
  lines.push('```json');
  lines.push(JSON.stringify({ ...SAMPLE, chatReplyTotal: chatReplyTotal() }, null, 2));
  lines.push('```');
  lines.push('');

  lines.push('# Guided test sessions');
  lines.push('');
  for (const [cat, sessions] of Object.entries(TEST_SESSIONS)) {
    lines.push(`## ${cat}`);
    for (const s of sessions) {
      lines.push(`### ${s.title} (\`${s.id}\`)`);
      if (s.intro) lines.push(s.intro);
      if (s.sampleSizeField) {
        lines.push(`Sample size field: ${s.sampleSizeField.label} (default ${s.sampleSizeField.default ?? 'n/a'})`);
      }
      lines.push(`Evidence slugs: ${s.slugs.join(', ')}`);
      lines.push('');
    }
  }

  lines.push('# Worksheet grids (one table → multiple scores)');
  lines.push('');
  for (const [id, ws] of Object.entries(WORKSHEETS)) {
    lines.push(`## ${ws.title} (\`${id}\`)`);
    if (ws.instruction) lines.push(ws.instruction);
    lines.push(`Rows: ${ws.rowCount} × ${ws.rowLabel}`);
    for (const col of ws.columns) {
      lines.push(`- **${col.label}** (\`${col.defSlug}\`, ${col.kind}${col.max != null ? ` max ${col.max}` : ''})${col.hint ? ` — ${col.hint}` : ''}`);
    }
    lines.push('');
  }

  lines.push('# Chat understanding test script');
  lines.push('');
  lines.push('```');
  lines.push(CHAT_UNDERSTANDING_SCRIPT);
  lines.push('```');
  lines.push('');

  lines.push('# UI & workflow notes');
  lines.push('');
  lines.push(`- **Combined controls** (no standalone row): ${[...COMBINED_EVIDENCE_SLUGS].join(', ')}`);
  lines.push(`- **Auto-filled from Pricing tab** (hidden in testing UI): ${[...PRICING_AUTOFILL_SLUGS].join(', ')}`);
  lines.push('- **Capability gating** (hidden when Setup capability = false):');
  for (const [key, cap] of Object.entries(REQUIRED_CAP)) {
    lines.push(`  - \`${key}\` → \`${cap}\``);
  }
  lines.push('- **Pricing checklist gating** (included-features options):');
  for (const [label, cap] of Object.entries(FEATURE_ITEM_CAP)) {
    lines.push(`  - "${label}" → \`${cap}\``);
  }
  lines.push('');

  lines.push('---');
  lines.push('');
  lines.push('# Full methodology tree (live definitions)');
  lines.push('');

  for (const cat of data.categories) {
    lines.push(`# ${cat.name} (\`${cat.slug}\`) — ${cat.weight}% of overall`);
    if (cat.description) lines.push(cat.description);
    lines.push('');

    for (const sub of cat.subscores) {
      lines.push(`## ${sub.name} (\`${sub.slug}\`) — ${sub.weight}% of ${cat.name}`);
      if (sub.description) lines.push(sub.description);
      lines.push('');

      for (const e of sub.evidence) {
        const sk = shortKey(cat.slug, e.slug);
        const sq = SHORT_QUESTIONS[sk];
        const session = sessionForSlug(cat.slug, e.slug);
        const hidden = isHiddenFromTesting(cat.slug, e.slug);

        lines.push(`### ${e.name} (\`${e.slug}\`)`);
        lines.push(`- **Weight:** ${e.weight}% of ${sub.name}`);
        lines.push(`- **Required:** ${e.required ? 'yes' : 'no'}`);
        lines.push(`- **Measurement:** ${e.measurementType}${e.unit ? ` (${e.unit})` : ''}`);
        lines.push(`- **Scoring rule:** ${fmtRule(e.scoringRule)}`);
        if (session) lines.push(`- **Test session:** ${session}`);
        if (hidden) lines.push(`- **Testing UI:** hidden (${COMBINED_EVIDENCE_SLUGS.has(e.slug) ? 'combined control' : 'pricing autofill'})`);
        if (sq) {
          lines.push(`- **Tester question:** ${sq.q}`);
          lines.push(`- **Tester hint:** ${sq.hint}`);
        } else if (e.questionLabel) {
          lines.push(`- **Tester question:** ${e.questionLabel}`);
        }
        if (e.publicDescription) lines.push(`- **Public description:** ${e.publicDescription}`);
        if (e.shortDescription) lines.push(`- **What we measure:** ${e.shortDescription}`);
        if (e.whyItMatters) lines.push(`- **Why it matters:** ${e.whyItMatters}`);
        if (e.internalInstructions) {
          lines.push('- **How tested:**');
          for (const line of e.internalInstructions.split('\n')) {
            const t = line.trim();
            if (t) lines.push(`  ${t}`);
          }
        }
        if (e.testInstructions) {
          lines.push('- **Tester steps:**');
          for (const line of e.testInstructions.split('\n')) {
            const t = line.replace(/^\s*(?:\d+[.)]\s*|[-*•]\s*)/, '').trim();
            if (t) lines.push(`  - ${t}`);
          }
        }
        if (e.resultFormat) lines.push(`- **Result format:** ${e.resultFormat}`);
        if (e.sampleSize != null) lines.push(`- **Sample size (DB field):** ${e.sampleSize}`);
        if (e.calculationMethod) lines.push(`- **Calculation method:** ${JSON.stringify(e.calculationMethod)}`);
        if (e.options) lines.push(`- **Options:** ${JSON.stringify(e.options)}`);
        if (e.evidenceRequirements) lines.push(`- **Proof required:** ${JSON.stringify(e.evidenceRequirements)}`);
        if (e.exampleAnswer) lines.push(`- **Example answer:** ${e.exampleAnswer}`);
        if (e.publicResultTemplate) lines.push(`- **Public result template:** ${e.publicResultTemplate}`);
        lines.push('');
      }
    }
  }

  // Seed drift report
  const dbSlugs = new Set<string>();
  const seedSlugs = new Set(evidenceDefSeeds.map((e) => `${e.category}/${e.slug}`));
  for (const c of data.categories) {
    for (const s of c.subscores) {
      for (const e of s.evidence) dbSlugs.add(`${c.slug}/${e.slug}`);
    }
  }
  const inDbNotSeed = [...dbSlugs].filter((k) => !seedSlugs.has(k)).sort();
  const inSeedNotDb = [...seedSlugs].filter((k) => !dbSlugs.has(k)).sort();

  if (inDbNotSeed.length > 0 || inSeedNotDb.length > 0) {
    lines.push('---');
    lines.push('');
    lines.push('# Seed file drift (DB vs scripts/seed/methodology-data.ts)');
    lines.push('');
    if (inDbNotSeed.length > 0) {
      lines.push('**In live DB but NOT in seed file:**');
      for (const k of inDbNotSeed) lines.push(`- ${k}`);
      lines.push('');
    }
    if (inSeedNotDb.length > 0) {
      lines.push('**In seed file but NOT in live DB:**');
      for (const k of inSeedNotDb) lines.push(`- ${k}`);
      lines.push('');
    }
  }

  return lines.join('\n');
}

function buildJson(data: { version: string; categories: CategoryRow[]; source: string }) {
  return {
    exportedAt: new Date().toISOString(),
    methodologyVersion: data.version,
    source: data.source,
    calculationVersion: CALCULATION_VERSION,
    sampleSizes: { ...SAMPLE, chatReplyTotal: chatReplyTotal() },
    testSessions: TEST_SESSIONS,
    worksheets: WORKSHEETS,
    chatUnderstandingScript: CHAT_UNDERSTANDING_SCRIPT,
    combinedEvidenceSlugs: [...COMBINED_EVIDENCE_SLUGS],
    pricingAutofillSlugs: [...PRICING_AUTOFILL_SLUGS],
    capabilityGating: REQUIRED_CAP,
    featureChecklistGating: FEATURE_ITEM_CAP,
    shortQuestions: SHORT_QUESTIONS,
    categories: data.categories,
  };
}

const jsonOnly = process.argv.includes('--json-only');
const db = await loadFromDb();
const data = db ? { ...db, source: 'InstantDB (active methodology version)' } : { ...loadFromSeed(), source: 'scripts/seed/methodology-data.ts (DB unavailable)' };

const mdPath = resolve(process.cwd(), 'methodology-full-export.md');
const jsonPath = resolve(process.cwd(), 'methodology-full-export.json');

if (!jsonOnly) {
  const md = buildMarkdown(data);
  writeFileSync(mdPath, md, 'utf8');
  console.log(`Wrote ${mdPath} (${md.length.toLocaleString()} chars)`);
}

const json = buildJson(data);
writeFileSync(jsonPath, JSON.stringify(json, null, 2), 'utf8');
console.log(`Wrote ${jsonPath}`);

let evidenceCount = 0;
for (const c of data.categories) for (const s of c.subscores) evidenceCount += s.evidence.length;
console.log(`\nSummary: ${data.categories.length} categories, ${evidenceCount} evidence defs, version ${data.version}`);
console.log(`Source: ${data.source}`);
