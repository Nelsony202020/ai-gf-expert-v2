#!/usr/bin/env npx tsx
// Migration checklist for the guided testing UX: reports every active
// evidence definition that is missing tester-facing fields (question,
// instructions, calculation method, options, proof requirements…).
//
// Old definitions keep working — the tester UI falls back to the internal
// name and instructions — but this report shows what methodology editors
// still need to fill in.
//
// Usage: npx tsx scripts/methodology-tester-checklist.ts

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

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

const { getDb } = await import('../src/lib/db/server');
const db = getDb();

const data = await db.query({
  evidenceDefinitions: { subscore: { category: {} } },
});

interface DefRow {
  id: string;
  slug: string;
  name: string;
  active: boolean;
  required: boolean;
  measurementType: string;
  unit?: string;
  questionLabel?: string;
  testInstructions?: string;
  internalInstructions?: string;
  options?: unknown;
  calculationMethod?: { kind?: string } | null;
  evidenceRequirements?: unknown;
  subscore?: { name?: string; category?: { name?: string } };
}

function gapsFor(def: DefRow): string[] {
  const gaps: string[] = [];
  if (!def.questionLabel?.trim()) gaps.push('question');
  if (!def.testInstructions?.trim() && !def.internalInstructions?.trim()) gaps.push('instructions');
  if (['count', 'seconds', 'currency', 'scale'].includes(def.measurementType) && !def.unit?.trim()) {
    gaps.push('unit');
  }
  if (def.measurementType === 'percentage') {
    const kind = def.calculationMethod?.kind;
    if (kind !== 'ratio' && kind !== 'checklist') gaps.push('calculation method (manual % entry)');
  }
  if (def.measurementType === 'enum' && !(Array.isArray(def.options) && def.options.length > 0)) {
    gaps.push('options');
  }
  if (def.required && !(Array.isArray(def.evidenceRequirements) && def.evidenceRequirements.length > 0)) {
    gaps.push('proof requirements');
  }
  return gaps;
}

const defs = (data.evidenceDefinitions as unknown as DefRow[]).filter((d) => d.active);
const byCategory = new Map<string, { def: DefRow; gaps: string[] }[]>();
let readyCount = 0;

for (const def of defs) {
  const gaps = gapsFor(def);
  if (gaps.length === 0) {
    readyCount++;
    continue;
  }
  const cat = def.subscore?.category?.name ?? '(no category)';
  if (!byCategory.has(cat)) byCategory.set(cat, []);
  byCategory.get(cat)!.push({ def, gaps });
}

console.log(`Active evidence definitions: ${defs.length}`);
console.log(`Tester-ready: ${readyCount}`);
console.log(`Need attention: ${defs.length - readyCount}\n`);

for (const [cat, items] of [...byCategory.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
  console.log(`## ${cat} (${items.length})`);
  for (const { def, gaps } of items) {
    const sub = def.subscore?.name ?? '?';
    console.log(`  - [${sub}] ${def.name} (${def.slug}): missing ${gaps.join(', ')}`);
  }
  console.log('');
}
