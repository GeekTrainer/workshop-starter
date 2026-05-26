#!/usr/bin/env node
// scripts/doctor.mjs — quick diagnostic for the workshop starter.
//
// Checks: node version, gh CLI auth, Copilot SDK auth, and that the
// dev servers (if running) are reachable on the expected ports.

import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const DIM = '\x1b[2m';
const RESET = '\x1b[0m';

let failed = 0;

function pass(label, detail) {
  console.log(`${GREEN}✓${RESET} ${label}${detail ? ` ${DIM}${detail}${RESET}` : ''}`);
}
function warn(label, detail) {
  console.log(`${YELLOW}!${RESET} ${label}${detail ? ` ${DIM}${detail}${RESET}` : ''}`);
}
function fail(label, detail, hint) {
  failed++;
  console.log(`${RED}✗${RESET} ${label}${detail ? ` ${DIM}${detail}${RESET}` : ''}`);
  if (hint) console.log(`    ${DIM}→ ${hint}${RESET}`);
}

// 1. Node version
{
  const major = Number(process.versions.node.split('.')[0]);
  if (major >= 20) pass('Node.js', `v${process.versions.node}`);
  else fail('Node.js', `v${process.versions.node}`, 'install Node 20 or newer');
}

// 2. gh CLI auth
{
  const res = spawnSync('gh', ['auth', 'status'], { encoding: 'utf8' });
  if (res.error) {
    fail('gh CLI', 'not installed', 'https://cli.github.com/');
  } else if (res.status === 0) {
    const m = (res.stderr + res.stdout).match(/account ([^\s]+)/i);
    pass('gh CLI auth', m ? `signed in as ${m[1]}` : 'signed in');
  } else {
    fail('gh CLI auth', 'not signed in', 'run: gh auth login');
  }
}

// 3. Copilot SDK auth
try {
  const { CopilotClient } = require('@github/copilot-sdk');
  const client = new CopilotClient();
  await client.start();
  try {
    const status = await client.getAuthStatus();
    if (status?.isAuthenticated) {
      pass('Copilot SDK auth', `${status.login ?? 'signed in'} via ${status.authType ?? '?'}`);
    } else {
      fail('Copilot SDK auth', 'not authenticated', 'run: gh auth login (or: copilot auth login)');
    }
  } finally {
    await client.stop().catch(() => undefined);
  }
} catch (err) {
  fail('Copilot SDK', err instanceof Error ? err.message : String(err), 'run: npm install');
}

// 4. Dev servers reachable
async function probe(name, url) {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(1500) });
    if (res.ok) pass(name, `${url} → ${res.status}`);
    else warn(name, `${url} → ${res.status}`);
  } catch {
    warn(name, `${url} not reachable`, 'start it with: npm run dev');
  }
}
await probe('Web dev server', 'http://127.0.0.1:5173/');
await probe('API server', 'http://127.0.0.1:5174/api/health');

console.log();
if (failed > 0) {
  console.log(`${RED}${failed} check(s) failed.${RESET}`);
  process.exit(1);
} else {
  console.log(`${GREEN}All checks passed.${RESET}`);
}
