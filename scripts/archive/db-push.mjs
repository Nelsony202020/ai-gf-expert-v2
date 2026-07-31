#!/usr/bin/env node
// Push InstantDB schema with automatic confirmation (Push is the default option).

import { spawn } from 'node:child_process';

const child = spawn('npx', ['instant-cli@latest', 'push'], {
  stdio: ['pipe', 'inherit', 'inherit'],
  shell: true,
  cwd: new URL('..', import.meta.url).pathname,
});

// instant-cli prompts with Push selected by default — Enter confirms.
setTimeout(() => {
  child.stdin.write('\n');
  child.stdin.end();
}, 3000);

child.on('exit', (code) => process.exit(code ?? 1));
