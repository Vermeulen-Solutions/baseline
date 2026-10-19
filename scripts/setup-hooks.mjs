import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

export const preCommitHook = `#!/bin/sh
# Baseline native pre-commit: installed by npm run setup:hooks
set -eu
cd "$(git rev-parse --show-toplevel)"
npm run doctor
npm run verify:fast
`;

export function setupHooks(cwd = process.cwd()) {
  const git = args => execFileSync('git', args, { cwd, encoding: 'utf8', windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] }).trim();
  if (git(['rev-parse', '--is-inside-work-tree']) !== 'true') throw Error('Hook setup requires a Git worktree');
  // Respect centrally managed hooks rather than replacing their entrypoint.
  let custom = false;
  try { git(['config', '--get', 'core.hooksPath']); custom = true; }
  catch (error) { if (error.status !== 1) throw error; }
  if (custom) throw Error('core.hooksPath is configured; integrate doctor and verify:fast in that hook manager');
  const directory = git(['rev-parse', '--path-format=absolute', '--git-path', 'hooks']);
  const target = path.join(directory, 'pre-commit');
  fs.mkdirSync(directory, { recursive: true });
  try {
    const stat = fs.lstatSync(target);
    if (!stat.isFile() || stat.isSymbolicLink() || fs.readFileSync(target, 'utf8') !== preCommitHook) throw Error('Existing pre-commit hook preserved; integrate doctor and verify:fast manually');
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
    fs.writeFileSync(target, preCommitHook, { flag: 'wx', mode: 0o755 });
  }
  fs.chmodSync(target, 0o755);
  return target;
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  try {
    if (process.argv.length !== 2) throw Error('Usage: npm run setup:hooks');
    console.log(`Installed ${setupHooks()}`);
  } catch (error) { console.error(`Hook setup: ${error.message}`); process.exitCode = 1; }
}
