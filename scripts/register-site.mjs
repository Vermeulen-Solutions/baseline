import * as fs from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import { execFileSync } from 'node:child_process';
export function validateSite(site) {
  const keys = ['siteId', 'repository', 'starterCommit', 'starterRelease', 'runtimeProfile', 'ownerTeam', 'status', 'lastAudit', 'standardsVersion', 'previousRepositories'];
  if (!site || Object.keys(site).some(k => !keys.includes(k))) throw Error('Only registry contract fields are accepted; exclude domains, contacts and secrets');
  for (const key of ['siteId', 'ownerTeam']) if (!/^[a-z0-9][a-z0-9-]{1,63}$/.test(site[key] ?? '')) throw Error('Invalid stable identifier: ' + key);
  const repo = /^https:\/\/github\.com\/[\w.-]+\/[\w.-]+$/;
  if (!repo.test(site.repository ?? '') || (site.previousRepositories ?? []).some(r => !repo.test(r))) throw Error('Use authorized repository references without credentials or query strings');
  if (!/^[a-f0-9]{40}$/.test(site.starterCommit ?? '')) throw Error('Exact starter commit required');
  if (!['node-sqlite', 'cloudflare-d1-r2'].includes(site.runtimeProfile) || !['active', 'paused', 'archived'].includes(site.status)) throw Error('Invalid runtime/lifecycle status');
  for (const key of ['starterRelease', 'standardsVersion']) if (site[key] != null && !/^[\w.-]{1,80}$/.test(site[key])) throw Error('Invalid version identifier');
  if (site.lastAudit != null && !/^\d{4}-\d{2}-\d{2}$/.test(site.lastAudit)) throw Error('Audit date must be YYYY-MM-DD or null');
  return site;
}
export async function registerSite(root, site, registry, { reactivate = false } = {}) {
  validateSite(site);
  // Registry writes are local proposals; no client lookup, contact or GitHub publishing occurs.
  const destination = registry ? path.resolve(registry) : path.join(root, '.emdash', 'pending-registration', site.siteId + '.json');
  const privateRoot = path.resolve(root, '.emdash');
  if (registry && (destination === path.resolve(root) || destination.startsWith(path.resolve(root) + path.sep)) && destination !== path.join(privateRoot, 'site-registry.private.json')) throw Error('Registry inside this public checkout must use ignored .emdash/site-registry.private.json');
  if (destination.startsWith(path.resolve(root) + path.sep)) {
    try { execFileSync('git', ['check-ignore', '--quiet', '--no-index', destination], { cwd: root, stdio: 'ignore' }); }
    catch { throw Error('Private registry/pending artifact must be ignored by Git before writing'); }
    let tracked = false;
    try { execFileSync('git', ['ls-files', '--error-unmatch', '--', destination], { cwd: root, stdio: 'ignore' }); tracked = true; } catch {}
    if (tracked) throw Error('Private registry/pending artifact is already tracked by Git; refusing private metadata');
  }
  await fs.mkdir(path.dirname(destination), { recursive: true });
  const lock = await fs.open(destination + '.lock', 'wx');
  try {
  let previous = { formatVersion: 1, sites: [] };
  try { previous = JSON.parse(await fs.readFile(destination, 'utf8')); } catch (e) { if (e.code !== 'ENOENT') throw e; }
  if (!registry) previous = { formatVersion: 1, sites: previous.site ? [previous.site] : [] };
  const old = previous.sites.find(s => s.siteId === site.siteId);
  if (old?.status === 'archived' && site.status !== 'archived' && !reactivate) throw Error('Archived site requires explicit --reactivate');
  if (old?.repository !== site.repository && old) site = { ...site, previousRepositories: [...new Set([...(old.previousRepositories ?? []), ...(site.previousRepositories ?? []), old.repository])] };
  const sites = [...previous.sites.filter(s => s.siteId !== site.siteId), site].sort((a, b) => a.siteId.localeCompare(b.siteId));
  const result = registry ? { formatVersion: 1, sites } : { formatVersion: 1, status: 'pending-reviewed-registration', reason: 'No authorized central private registry configured', site };
  const body = JSON.stringify(result, null, 2) + '\n';
  if (body !== await fs.readFile(destination, 'utf8').catch(e => { if (e.code === 'ENOENT') return ''; throw e; })) {
    const temporary = destination + '.' + randomUUID() + '.tmp';
    await fs.writeFile(temporary, body, { flag: 'wx', mode: 0o600 }); await fs.rename(temporary, destination);
  }
  return { status: registry ? 'local-registry-proposal' : 'pending-reviewed-registration', destination, remoteMutation: false };
  } finally { await lock.close(); await fs.unlink(destination + '.lock'); }
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const option = key => process.argv[process.argv.indexOf(key) + 1];
  try {
    if (!process.argv.includes('--input')) throw Error('Use --input <private JSON> [--registry <private path>] [--reactivate]');
    const result = await registerSite(process.cwd(), JSON.parse(await fs.readFile(option('--input'), 'utf8')), process.argv.includes('--registry') ? option('--registry') : null, { reactivate: process.argv.includes('--reactivate') });
    console.log(JSON.stringify(result, null, 2));
    if (result.status === 'pending-reviewed-registration') {
      console.log('\n✔ Pending registration recorded: ' + result.destination);
      console.log('👉 Next Step: Review and submit private registry PR, or proceed to Stage 7 (Production Cutover).');
    } else {
      console.log('\n✔ Site registration proposal updated: ' + result.destination);
    }
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
