// What a standards release distributes to sites, pinned by content hash, and how a site compares.
//
// Certification covers the tested runtime. Skills and the helper scripts sites run are not
// certified by a test run, but a release still names exact versions of them, so update tooling can
// tell a site whose skills or helpers lag the release from one that is current. Hashes are SHA-256
// of LF-normalized text (binary files as stored), so CRLF checkouts compare equal.
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';

const sha256 = value => createHash('sha256').update(value).digest('hex');

// Helpers a site keeps as exact copies; a site-owned variant shows as "differs".
export const PINNED_TOOLS = Object.freeze([
  'scripts/skill-sync.mjs',
  'scripts/sync-site-skills.mjs',
  'scripts/sync-emdash-skills.mjs',
  'scripts/sync-impeccable-skill.mjs',
  'scripts/sync-baseline.mjs',
  'scripts/audit-ui.mjs',
  'scripts/check-quality.mjs',
  'scripts/capture-routes.mjs',
]);
// Installed only when a site chooses the design surface they serve.
export const OPTIONAL_SKILLS = Object.freeze(['penpot-site-design', 'openpencil-site-design', 'opendesign-site-design', 'brilliant-site-design']);
export const EMDASH_ONLY_SKILLS = Object.freeze(['building-emdash-site', 'creating-plugins', 'emdash-cli', 'upgrading-emdash', 'emdash-site-setup', 'emdash-content-modeling', 'wordpress-to-emdash-content', 'emdash-production-cutover']);
// Local caches inside a skill folder that are never distributed (Impeccable's downloaded engine).
const IGNORED = [/^impeccable\/scripts\/bin\//, /(^|\/)node_modules\//, /(^|\/)\.DS_Store$/];

export function fileHash(file) {
  const bytes = fs.readFileSync(file);
  if (bytes.includes(0)) return sha256(bytes);
  try { return sha256(new TextDecoder('utf-8', { fatal: true, ignoreBOM: true }).decode(bytes).replaceAll('\r\n', '\n')); }
  catch { return sha256(bytes); }
}

// One hash per skill folder: the sorted list of "<path> <file hash>" lines.
export function skillTreeHash(skillsRoot, name) {
  const lines = [];
  const walk = relative => {
    const full = path.join(skillsRoot, relative);
    const stat = fs.lstatSync(full);
    if (stat.isSymbolicLink()) throw new Error(`symlink in skill: ${relative}`);
    if (stat.isDirectory()) { for (const entry of fs.readdirSync(full).sort()) walk(`${relative}/${entry}`); return; }
    if (IGNORED.some(rule => rule.test(relative))) return;
    lines.push(`${relative} ${fileHash(full)}`);
  };
  walk(name);
  lines.sort();
  return { files: lines.length, sha256: sha256(lines.join('\n') + '\n') };
}

export function distributionOf(baselineRoot) {
  const skillsRoot = path.join(baselineRoot, '.agents/skills');
  const skills = {};
  for (const name of fs.readdirSync(skillsRoot).sort()) {
    if (fs.statSync(path.join(skillsRoot, name)).isDirectory()) skills[name] = skillTreeHash(skillsRoot, name);
  }
  const tools = {};
  for (const tool of PINNED_TOOLS) if (fs.existsSync(path.join(baselineRoot, tool))) tools[tool] = fileHash(path.join(baselineRoot, tool));
  const impeccable = JSON.parse(fs.readFileSync(path.join(baselineRoot, '.emdash/impeccable-source.json'), 'utf8'));
  return {
    skills,
    optionalSkills: [...OPTIONAL_SKILLS],
    emdashOnlySkills: [...EMDASH_ONLY_SKILLS],
    tools,
    impeccable: { skillVersion: impeccable.declaredSkillVersion, launcherVersion: impeccable.launcherVersion, upstreamCommit: impeccable.upstreamCommitSha },
  };
}

// Compare a site checkout with a release's distribution. `platform` is 'emdash' or 'static'.
export function compareDistribution(siteDir, distribution, platform) {
  const skillsRoot = path.join(siteDir, '.agents/skills');
  const result = { skills: { current: [], differs: [], missing: [], optionalAbsent: [] }, tools: { current: [], differs: [] }, impeccable: null };
  for (const [name, pin] of Object.entries(distribution.skills)) {
    const optional = distribution.optionalSkills.includes(name);
    if (platform !== 'emdash' && distribution.emdashOnlySkills.includes(name)) continue;
    if (!fs.existsSync(path.join(skillsRoot, name))) { (optional ? result.skills.optionalAbsent : result.skills.missing).push(name); continue; }
    (skillTreeHash(skillsRoot, name).sha256 === pin.sha256 ? result.skills.current : result.skills.differs).push(name);
  }
  for (const [tool, pin] of Object.entries(distribution.tools)) {
    const file = path.join(siteDir, tool);
    if (fs.existsSync(file)) (fileHash(file) === pin ? result.tools.current : result.tools.differs).push(tool);
  }
  try {
    const source = JSON.parse(fs.readFileSync(path.join(siteDir, '.emdash/impeccable-source.json'), 'utf8'));
    result.impeccable = { installed: source.declaredSkillVersion ?? null, release: distribution.impeccable?.skillVersion ?? null };
  } catch { /* the site does not record Impeccable */ }
  return result;
}

export function distributionLags(comparison) {
  const lags = [];
  const { skills, tools, impeccable } = comparison;
  if (skills.missing.length) lags.push(`skills not installed: ${skills.missing.join(', ')}`);
  if (skills.differs.length) lags.push(`skills differ from the release: ${skills.differs.join(', ')}`);
  if (tools.differs.length) lags.push(`helpers differ from the release: ${tools.differs.map(tool => path.posix.basename(tool)).join(', ')}`);
  if (impeccable?.installed && impeccable.release && impeccable.installed !== impeccable.release) lags.push(`Impeccable ${impeccable.installed} (release has ${impeccable.release})`);
  return lags;
}
