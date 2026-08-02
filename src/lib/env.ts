// Env access that works in Astro server routes, Vercel functions, and
// plain Node/tsx scripts. Loads .env manually so secrets work even when
// import.meta.env doesn't expose non-PUBLIC vars (Astro 7 + Vercel adapter).

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

let dotenvLoaded = false;

function loadDotenvOnce(): void {
  if (dotenvLoaded || typeof process === 'undefined') return;
  dotenvLoaded = true;
  try {
    const raw = readFileSync(resolve(process.cwd(), '.env'), 'utf8');
    for (const line of raw.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eq = trimmed.indexOf('=');
      if (eq <= 0) continue;
      const key = trimmed.slice(0, eq).trim();
      let val = trimmed.slice(eq + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      if (!process.env[key]) process.env[key] = val;
    }
  } catch {
    /* no .env file */
  }
}

export function env(name: string): string | undefined {
  loadDotenvOnce();

  // process.env first — reliable at runtime in dev + SSR (after .env load)
  if (typeof process !== 'undefined' && process.env[name]) {
    return process.env[name];
  }

  const metaEnv = (import.meta as any).env;
  if (metaEnv?.[name]) return String(metaEnv[name]);

  // Vercel exposes server secrets on process.env; some Astro builds only inline
  // PUBLIC_* into import.meta.env. Mirror common secret names from globalThis.
  if (typeof globalThis !== 'undefined') {
    const vercelEnv = (globalThis as any).process?.env;
    if (vercelEnv?.[name]) return String(vercelEnv[name]);
  }

  return undefined;
}
