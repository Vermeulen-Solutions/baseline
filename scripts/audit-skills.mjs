import fs from 'node:fs';
import path from 'node:path';
import { readJSON, readTarget, safeRelative, normalizedHash } from './audit-evidence.mjs';
import { sources } from './skill-sync.mjs';

/** Complete managed inventory versus a supplied hash manifest; no upstream/network claims. */
export function skillFinding(root, group) {
  const config = sources[group], manifest = readJSON(root, `.emdash/${config.manifest}`).data;
  const expected = manifest?.files;
  const syncCommand = group === 'emdash' ? 'npm run sync:emdash-skills' : 'npm run sync:site-skills';
  const missingSkillNames = [];
  const manifestFormatVersion = typeof manifest?.formatVersion === 'number' ? manifest.formatVersion : null;
  const result = { presentSkills: 0, missingSkills: 0, missingSkillNames, measuredFiles: 0, missingFiles: 0, extraFiles: 0, changedFiles: 0, refusedEntries: 0, manifestFormatVersion, manifestMembership: 'unverified', sourceCurrency: 'unverified' };
  const local = new Map(); let visited = 0;
  function walk(relative) {
    if (++visited > 10000) throw Error('Inventory bound');
    const absolute = path.join(root, '.agents/skills', relative), stat = fs.lstatSync(absolute);
    if (stat.isSymbolicLink()) { result.refusedEntries++; return; }
    if (stat.isDirectory()) { for (const name of fs.readdirSync(absolute).sort()) { if (!safeRelative(name)) { result.refusedEntries++; continue; } walk(relative + '/' + name); } }
    else { const read = readTarget(root, '.agents/skills/' + relative); if (read.bytes) { local.set(relative, normalizedHash(read.bytes)); result.measuredFiles++; } else result.refusedEntries++; }
  }
  // Reject linked parents before any directory traversal.
  try { for (const relative of ['.agents', '.agents/skills']) if (fs.lstatSync(path.join(root, relative)).isSymbolicLink()) throw Error('Linked root');
    for (const skill of config.skills) {
      if (readTarget(root, `.agents/skills/${skill}/SKILL.md`).bytes) result.presentSkills++;
      else { result.missingSkills++; missingSkillNames.push(skill); }
      if (fs.existsSync(path.join(root, '.agents/skills', skill))) walk(skill);
    }
  } catch { result.refusedEntries++; }
  const validManifest = manifest?.formatVersion === 2 && /^[a-f0-9]{40}$/.test(manifest.commitSha ?? '') && expected && typeof expected === 'object' && !Array.isArray(expected);
  if (!validManifest) {
    const reason = !manifest ? `Missing .emdash/${config.manifest}` : manifestFormatVersion !== 2 ? `Legacy manifest formatVersion ${manifestFormatVersion ?? 'unknown'} (expected 2)` : `Incomplete or invalid .emdash/${config.manifest}`;
    return { status: 'unverified', observed: { ...result, remediationHint: `${reason}; run ${syncCommand}` } };
  }
  result.manifestMembership = Array.isArray(manifest.skills) && JSON.stringify([...manifest.skills].sort()) === JSON.stringify([...config.skills].sort()) ? 'match' : 'mismatch';
  let invalid = false;
  const overrides = (manifest?.overrides && typeof manifest.overrides === 'object' && !Array.isArray(manifest.overrides)) ? manifest.overrides : (readJSON(root, '.emdash/skill-overrides.json').data?.overrides ?? {});
  result.declaredOverrides = 0;
  for (const [file, hash] of Object.entries(expected)) {
    if (!safeRelative(file) || !config.skills.includes(file.split('/')[0]) || !/^[a-f0-9]{64}$/.test(hash)) { invalid = true; continue; }
    if (!local.has(file)) result.missingFiles++;
    else if (local.get(file) !== hash) {
      if (Object.hasOwn(overrides, file)) result.declaredOverrides++;
      else result.changedFiles++;
    }
  }
  for (const file of local.keys()) {
    if (!Object.hasOwn(expected, file)) {
      if (Object.hasOwn(overrides, file)) result.declaredOverrides++;
      else result.extraFiles++;
    }
  }
  const complete = config.skills.every(skill => Object.hasOwn(expected, skill + '/SKILL.md'));
  const drift = result.manifestMembership === 'mismatch' || result.missingSkills || result.missingFiles || result.extraFiles || result.changedFiles;
  return { status: invalid || !complete || result.refusedEntries ? 'unverified' : drift ? 'fail' : 'pass', observed: { ...result, ...(drift ? { remediationHint: `Run ${syncCommand} to synchronize managed skills` } : {}), localOverrides: result.declaredOverrides > 0 ? `${result.declaredOverrides} declared local override(s) documented` : drift ? 'observed drift; preserve for review' : 'none versus recorded inventory' } };
}

