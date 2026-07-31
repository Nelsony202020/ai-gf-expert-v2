#!/usr/bin/env npx tsx
/** Print score tree for a test run. Usage: npx tsx scripts/verify-test-run-scores.ts <run-id> */

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

const runId = process.argv[2] ?? '61fc5a0c-cf20-4194-97f4-e3801fa510a2';

async function main() {
  const { calculateRun } = await import('../src/lib/scoring/testRuns');
  const { tree } = await calculateRun(runId);
  console.log(`Overall: ${tree.overall}`);
  for (const c of tree.categories) {
    const subs = c.subscores.map((s) => `${s.slug}=${s.score ?? 'null'}`).join(', ');
    console.log(`  ${c.slug}: ${c.score ?? 'null'} (${subs})`);
  }
  if (tree.blockingErrors.length) {
    console.log('\nBlocking errors:');
    for (const e of tree.blockingErrors) console.log(`  - ${e}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
