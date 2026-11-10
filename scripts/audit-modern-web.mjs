#!/usr/bin/env node
/**
 * Advisory legacy-pattern scan using Google Chrome's modern-web-guidance.
 *
 *   npm run audit:modern-web -- [path]
 *
 * Runs a pinned version on demand with telemetry off. Never a gate: findings
 * need human review against each rule's keepWhen/dropWhen rubric, and correct
 * feature-detected fallbacks can keep being reported.
 */
import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

export const MODERN_WEB_GUIDANCE_VERSION = '1.0.0';
const SAFE_TARGET = /^[A-Za-z0-9_./\\:-]+$/;

export function scanInvocation(target = 'src', platform = process.platform, env = process.env) {
  if (!SAFE_TARGET.test(target) || target.startsWith('-')) throw new Error(`Unsupported scan target: ${target}`);
  const windows = platform === 'win32';
  return {
    command: windows ? 'npm.cmd' : 'npm',
    args: ['exec', '--yes', `--package=modern-web-guidance@${MODERN_WEB_GUIDANCE_VERSION}`, '--', 'modern-web-guidance', 'legacy-scan', target, '--json'],
    options: { stdio: 'inherit', shell: windows, env: { ...env, DISABLE_TELEMETRY: '1' } },
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const { command, args, options } = scanInvocation(process.argv[2]);
    console.error('Advisory only. Check each finding against its keepWhen/dropWhen rubric and the browser policy in astro-site-design/references/native-platform.md.');
    const run = spawnSync(command, args, options);
    if (run.error) throw run.error;
    process.exitCode = run.status ?? 1;
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
