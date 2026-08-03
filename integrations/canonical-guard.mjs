// Post-build scan: fail if any prerendered HTML still contains localhost SEO URLs.

import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const LOCALHOST_RE = /https?:\/\/(?:localhost|127\.0\.0\.1)(?::\d+)?[^\s"'<>]*/gi;

function walkHtml(dir, files = []) {
  if (!existsSync(dir)) return files;
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) {
      walkHtml(path, files);
    } else if (path.endsWith('.html')) {
      files.push(path);
    }
  }
  return files;
}

function findLocalhostSeoUrls(html) {
  const hits = [];
  for (const pattern of [
    /<link rel="canonical" href="([^"]+)"/i,
    /property="og:url" content="([^"]+)"/i,
    /<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi,
  ]) {
    if (pattern.global) {
      let match;
      while ((match = pattern.exec(html)) !== null) {
        const value = match[1];
        LOCALHOST_RE.lastIndex = 0;
        if (LOCALHOST_RE.test(value)) hits.push(value.slice(0, 120));
      }
    } else {
      const match = html.match(pattern);
      LOCALHOST_RE.lastIndex = 0;
      if (match?.[1] && LOCALHOST_RE.test(match[1])) hits.push(match[1]);
    }
  }
  return hits;
}

function htmlRoots(outDir) {
  const roots = [outDir, join(outDir, 'client')];
  return roots.filter((dir) => existsSync(dir));
}

export function canonicalGuard() {
  return {
    name: 'canonical-guard',
    hooks: {
      'astro:build:done': async ({ dir, logger }) => {
        const outDir = fileURLToPath(dir);
        const violations = [];

        for (const root of htmlRoots(outDir)) {
          for (const file of walkHtml(root)) {
            const html = readFileSync(file, 'utf8');
            const hits = findLocalhostSeoUrls(html);
            for (const hit of hits) {
              violations.push(`${file}: ${hit}`);
            }
          }
        }

        if (violations.length > 0) {
          logger.error(
            '[canonical-guard] Production HTML contains localhost SEO URLs:\n' +
              violations.map((v) => `  - ${v}`).join('\n'),
          );
          throw new Error('[canonical-guard] Fix canonical / og:url / JSON-LD before deploying.');
        }

        logger.info('[canonical-guard] OK — no localhost URLs in built HTML metadata.');
      },
    },
  };
}
