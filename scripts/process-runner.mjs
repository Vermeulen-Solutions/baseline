import { existsSync, realpathSync, statSync } from 'node:fs';
import path from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';

// Execute npm's JS entry point with the current Node, avoiding .ps1/.cmd shells.
// Covers npm lifecycle environments, official Node installs, nvm and Unix prefixes.
export function npmInvocation(args, { env = process.env, execPath = process.execPath } = {}) {
  const dirs = [...new Set([path.dirname(execPath), path.dirname(realpathSync(execPath)), ...(env.PATH ?? env.Path ?? '').split(path.delimiter).filter(Boolean)])];
  const candidates = [env.npm_execpath, ...dirs.flatMap(dir => [
    path.join(dir, 'node_modules/npm/bin/npm-cli.js'),
    path.resolve(dir, '../lib/node_modules/npm/bin/npm-cli.js'),
    ...['npm', 'npm.cmd'].map(name => path.join(dir, name)).filter(file => existsSync(file)).map(file => realpathSync(file)),
  ])];
  const cli = candidates.find(file => file && /npm-cli\.(?:js|mjs)$/.test(file) && existsSync(file) && statSync(file).isFile());
  if (!cli) throw new Error('npm CLI unavailable. Install Node with npm, then run this command via npm.cmd on Windows or npm on Unix.');
  return { command: execPath, args: [cli, ...args] };
}

export function execNpmSync(args, options = {}) {
  const command = npmInvocation(args, options);
  return execFileSync(command.command, command.args, { ...options, shell: false });
}

export function spawnNpmSync(args, options = {}) {
  const command = npmInvocation(args, options);
  return spawnSync(command.command, command.args, { ...options, shell: false });
}
