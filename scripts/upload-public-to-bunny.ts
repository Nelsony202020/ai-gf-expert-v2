/**
 * Upload /public static assets to Bunny Storage so cdnAsset() URLs resolve.
 *
 * Requires .env: BUNNY_STORAGE_ZONE, BUNNY_STORAGE_API_KEY, BUNNY_CDN_HOSTNAME
 *
 * Usage:
 *   npx tsx scripts/upload-public-to-bunny.ts
 *   npx tsx scripts/upload-public-to-bunny.ts --dry-run
 */

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { isBunnyConfigured, uploadToBunny } from '../src/lib/media/cdn';

const dryRun = process.argv.includes('--dry-run');
const publicDir = join(process.cwd(), 'public');
const skip = new Set(['robots.txt']);

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) {
      out.push(...walk(full));
    } else {
      out.push(full);
    }
  }
  return out;
}

function contentType(filePath: string): string {
  const ext = filePath.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'png':
      return 'image/png';
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'webp':
      return 'image/webp';
    case 'gif':
      return 'image/gif';
    case 'svg':
      return 'image/svg+xml';
    case 'txt':
      return 'text/plain';
    default:
      return 'application/octet-stream';
  }
}

async function main() {
  if (!isBunnyConfigured()) {
    console.error('Bunny CDN is not configured. Set BUNNY_STORAGE_ZONE, BUNNY_STORAGE_API_KEY, BUNNY_CDN_HOSTNAME in .env');
    process.exit(1);
  }

  const files = walk(publicDir).filter((f) => !skip.has(f.split('/').pop() ?? ''));
  let uploaded = 0;
  let failed = 0;

  for (const filePath of files) {
    const storagePath = relative(publicDir, filePath).replace(/\\/g, '/');
    console.log(`${dryRun ? '[dry-run] ' : ''}Uploading ${storagePath}`);

    if (dryRun) {
      uploaded += 1;
      continue;
    }

    try {
      const buffer = readFileSync(filePath);
      await uploadToBunny(storagePath, buffer, contentType(filePath));
      uploaded += 1;
    } catch (error) {
      failed += 1;
      console.error(`  failed ${storagePath}:`, error instanceof Error ? error.message : error);
    }
  }

  console.log(`Done. uploaded=${uploaded} failed=${failed}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
