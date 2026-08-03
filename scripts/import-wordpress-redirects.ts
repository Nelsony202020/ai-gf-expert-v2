/**
 * Import WordPress → Astro URL migration redirects into InstantDB.
 *
 *   npm run import:redirects
 *   npm run import:redirects -- --dry-run
 *   npm run import:redirects -- --file docs/wordpress-url-migration-plan.md
 *
 * Requires .env with PUBLIC_INSTANT_APP_ID and INSTANT_APP_ADMIN_TOKEN.
 */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { init, id } from '@instantdb/admin';
import schema from '../instant.schema';
import { normalizePath, normalizeRedirectDestination } from '../src/lib/db/redirects';

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

/** Old WP review slugs → current product slugs on the new site. */
const REVIEW_SLUG_FIXES: Record<string, string> = {
  'kindroid-ai': 'kindroid',
  'dreamgf-ai': 'dreamgf',
};

export function mapMigrationDestination(raw: string): string {
  if (!raw || raw === '—' || raw === '-') return '';
  let path = raw.replace(/^https:\/\/aigirlfriend\.expert/i, '');
  if (!path.startsWith('/')) path = `/${path}`;

  path = path.replace(/^\/best-ai-girlfriend(\/|$)/, '/best/ai-girlfriend$1');
  path = path.replace(/^\/privacy-policy\/?$/, '/legal/privacy/');
  path = path.replace(/^\/terms-of-service\/privacy-policy\/?$/, '/legal/privacy/');
  path = path.replace(/^\/terms-of-service\/accessibility\/?$/, '/legal/accessibility/');
  path = path.replace(/^\/terms-of-service\/affiliate-disclosure\/?$/, '/legal/affiliate-disclosure/');
  path = path.replace(/^\/terms-of-service\/?$/, '/legal/terms/');
  path = path.replace(/^\/accessibility\/?$/, '/legal/accessibility/');
  path = path.replace(/^\/affiliate-disclosure\/?$/, '/legal/affiliate-disclosure/');
  path = path.replace(/^\/editorial-process\/?$/, '/editorial-guidelines/');

  path = path.replace('#photos-and-videos', '#photos');
  path = path.replace('#privacy', '#ratings--privacy');

  path = path.replace(/^(\/reviews\/)([a-z0-9-]+)(\/|#|$)/, (match, prefix, slug, suffix) => {
    const fixed = REVIEW_SLUG_FIXES[slug] ?? slug;
    return `${prefix}${fixed}${suffix}`;
  });

  return normalizeRedirectDestination(path);
}

export function mapMigrationSource(raw: string): string {
  const path = raw.replace(/^https:\/\/aigirlfriend\.expert/i, '');
  return normalizePath(path);
}

export type MigrationRow = {
  source: string;
  action: '301' | '410' | 'KEEP';
  destination: string;
  reason: string;
};

export function parseMigrationPlan(markdown: string): MigrationRow[] {
  const rows: MigrationRow[] = [];
  for (const line of markdown.split('\n')) {
    if (!line.startsWith('| `https://')) continue;
    const match = line.match(
      /^\|\s*`(https:\/\/aigirlfriend\.expert[^`]+)`\s*\|\s*\*\*(301|410|KEEP)\*\*\s*\|\s*`([^`]*)`\s*\|\s*(.+?)\s*\|$/,
    );
    if (!match) continue;
    rows.push({
      source: match[1],
      action: match[2] as MigrationRow['action'],
      destination: match[3],
      reason: match[4].trim(),
    });
  }

  // Hub path changed on the new site — same roundup content, new canonical URL.
  if (!rows.some((r) => r.source.endsWith('/best-ai-girlfriend/'))) {
    rows.push({
      source: 'https://aigirlfriend.expert/best-ai-girlfriend/',
      action: '301',
      destination: 'https://aigirlfriend.expert/best/ai-girlfriend/',
      reason: 'Roundup hub moved to /best/ai-girlfriend/ on the new site (same content).',
    });
  } else {
    const hub = rows.find((r) => r.source.endsWith('/best-ai-girlfriend/') && r.action === 'KEEP');
    if (hub) {
      hub.action = '301';
      hub.destination = 'https://aigirlfriend.expert/best/ai-girlfriend/';
      hub.reason = `${hub.reason} → routed to /best/ai-girlfriend/ on new site.`;
    }
  }

  return rows;
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const fileArg = args.find((a) => a.startsWith('--file='))?.slice('--file='.length);
  const filePath = resolve(process.cwd(), fileArg ?? 'docs/wordpress-url-migration-plan.md');

  const markdown = readFileSync(filePath, 'utf8');
  const parsed = parseMigrationPlan(markdown);
  const actionable = parsed.filter((r) => r.action === '301' || r.action === '410');

  console.log(`Parsed ${parsed.length} URLs from ${filePath}`);
  console.log(`  KEEP: ${parsed.filter((r) => r.action === 'KEEP').length}`);
  console.log(`  301:  ${parsed.filter((r) => r.action === '301').length}`);
  console.log(`  410:  ${parsed.filter((r) => r.action === '410').length}`);

  const appId = process.env.PUBLIC_INSTANT_APP_ID;
  const adminToken = process.env.INSTANT_APP_ADMIN_TOKEN;
  if (!appId || !adminToken) {
    console.error('Missing PUBLIC_INSTANT_APP_ID / INSTANT_APP_ADMIN_TOKEN in .env');
    process.exit(1);
  }

  const db = init({ appId, adminToken, schema });
  const { redirects: existingRows } = await db.query({ redirects: {} });
  const bySource = new Map(
    (existingRows as any[]).map((r) => [normalizePath(r.sourcePath), r]),
  );

  let created = 0;
  let updated = 0;
  let skipped = 0;
  const now = Date.now();
  const txs: any[] = [];

  for (const row of actionable) {
    const sourcePath = mapMigrationSource(row.source);
    const redirectType = row.action === '410' ? 410 : 301;
    const destinationPath =
      row.action === '410' ? '' : mapMigrationDestination(row.destination);
    const notes = `WordPress migration — ${row.reason.slice(0, 180)}`;

    const existing = bySource.get(sourcePath);
    if (
      existing &&
      existing.redirectType === redirectType &&
      (existing.destinationPath ?? '') === destinationPath &&
      existing.active !== false
    ) {
      skipped += 1;
      continue;
    }

    if (dryRun) {
      console.log(
        `[dry-run] ${redirectType} ${sourcePath} → ${destinationPath || '(gone)'}`,
      );
      continue;
    }

    const redirectId = existing?.id ?? id();
    txs.push(
      db.tx.redirects[redirectId].update({
        sourcePath,
        destinationPath,
        redirectType,
        active: true,
        createdBy: 'wordpress-migration-import',
        notes,
        hitCount: existing?.hitCount ?? 0,
        createdAt: existing?.createdAt ?? now,
      }),
    );
    if (existing) updated += 1;
    else created += 1;
  }

  if (dryRun) {
    console.log(`Dry run complete — would upsert ${actionable.length - skipped} redirects.`);
    return;
  }

  const chunkSize = 50;
  for (let i = 0; i < txs.length; i += chunkSize) {
    await db.transact(txs.slice(i, i + chunkSize));
  }

  console.log(`Done — created ${created}, updated ${updated}, skipped ${skipped} (unchanged).`);
  console.log('View in admin → Redirects. Redeploy production for catch-all route changes.');
}

if (process.argv[1]?.includes('import-wordpress-redirects')) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
