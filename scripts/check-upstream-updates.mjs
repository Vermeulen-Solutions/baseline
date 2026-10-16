import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { collectBaseline } from './audit-baseline.mjs';
import { sources } from './skill-sync.mjs';
import { execFileSync } from 'node:child_process';
const tuple = version => /^\d+\.\d+\.\d+$/.test(version ?? '') ? version.split('.').map(Number) : null;
const compare = (a, b) => { const x = tuple(a), y = tuple(b); for (let i = 0; i < 3; i++) if (x[i] !== y[i]) return x[i] - y[i]; return 0; };
async function get(url) { const response = await fetch(url, { headers: { 'User-Agent': 'emdash-starter-meta-review' }, signal: AbortSignal.timeout(15000) }); if (!response.ok) { if (url.startsWith('https://api.github.com/') && [401, 403, 404].includes(response.status)) return JSON.parse(execFileSync('gh', ['api', url.slice('https://api.github.com/'.length)], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] })); throw Error('Upstream HTTP ' + response.status); } return response.json(); }
export async function collectUpdates(root, lookup = {}) {
  const baseline = collectBaseline(root);
  const packageLookup = lookup.package ?? (name => get('https://registry.npmjs.org/' + encodeURIComponent(name)));
  const packages = await Promise.all(baseline.packages.map(async current => {
    try {
      const metadata = await packageLookup(current.name);
      const stable = Object.keys(metadata.versions).filter(v => tuple(v)).sort(compare);
      const latest = metadata['dist-tags']?.latest;
      if (!tuple(latest)) throw Error('Latest stable metadata unavailable');
      const locked = tuple(current.locked);
      const patch = locked ? stable.filter(v => tuple(v)[0] === locked[0] && tuple(v)[1] === locked[1]).at(-1) ?? null : null;
      return { ...current, availableStable: latest, availablePatch: patch, availableEngines: metadata.versions[latest]?.engines ?? null, availablePeers: metadata.versions[latest]?.peerDependencies ?? null, releaseDate: metadata.time?.[latest] ?? null, upstreamStatus: !locked ? 'unverified' : compare(latest, current.locked) > 0 ? 'update-available' : 'current', source: `https://www.npmjs.com/package/${current.name}` };
    } catch (error) { return { ...current, upstreamStatus: 'unverified', reason: error.message }; }
  }));
  const skills = await Promise.all(Object.entries(sources).map(async ([kind, config]) => {
    try { const ref = await (lookup.skill ?? (c => get(`https://api.github.com/repos/${c.repository}/git/ref/heads/main`)))(config); const sha = ref.object?.sha ?? ref.sha; if (!/^[a-f0-9]{40}$/.test(sha)) throw Error('Missing immutable commit'); const previous = baseline.skillSources[kind]; return { kind, repository: config.repository, availableCommit: sha, recordedCommit: previous?.commitSha ?? null, status: previous?.commitSha === sha ? 'same-source-commit-local-drift-not-checked' : 'review-required' }; }
    catch (error) { return { kind, status: 'unverified', reason: error.message }; }
  }));
  let node;
  try { const releases = await (lookup.node ?? (() => get('https://nodejs.org/dist/index.json')))(); const stable = releases.filter(r => tuple(r.version.replace(/^v/, ''))).sort((a, b) => compare(a.version.slice(1), b.version.slice(1))); node = { running: process.version, declared: baseline.node.declared, latestStable: stable.at(-1)?.version, latestLts: stable.filter(r => r.lts).at(-1)?.version, runningMajorPatch: stable.filter(r => tuple(r.version.slice(1))[0] === tuple(process.version.slice(1))[0]).at(-1)?.version, status: 'observed', source: 'https://nodejs.org/en/about/previous-releases' }; }
  catch (error) { node = { status: 'unverified', reason: error.message }; }
  return { formatVersion: 1, reviewedAt: new Date().toISOString(), mutation: false, packages, node, skills, decision: 'Review current official changelogs/migration guides; record dated adopt/defer decisions and revisit triggers. Availability and declared peers do not certify compatibility.' };
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try { console.log(JSON.stringify(await collectUpdates(process.cwd()), null, 2)); } catch (error) { console.error(error.message); process.exitCode = 1; }
}
