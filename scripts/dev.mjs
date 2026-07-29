#!/usr/bin/env node
// Start a single Astro dev server. Kills stale processes on common dev ports first
// so zombie servers don't serve broken InstantDB SSR (instant "fetch failed" 503s).

import { execSync, spawn } from 'node:child_process';

const DEV_PORT = 4321;
const PORTS_TO_CLEAR = [4321, 4322, 4323, 4324, 4325, 4326, 4327];

function run(cmd, opts = {}) {
  execSync(cmd, { stdio: 'ignore', ...opts });
}

try {
  run('npx astro dev stop');
} catch {
  /* no tracked server */
}

for (const port of PORTS_TO_CLEAR) {
  try {
    run(`lsof -ti:${port} | xargs kill -9`);
  } catch {
    /* port free */
  }
}

const child = spawn('npx', ['astro', 'dev', '--force', `--port=${DEV_PORT}`], {
  stdio: 'inherit',
  shell: false,
});

child.on('exit', (code) => process.exit(code ?? 0));
