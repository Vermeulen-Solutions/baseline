// Prepare a standards release from the pending change notes.
//
//   npm run standards:release -- --version <x.y.z> --source-commit <certified 40-hex SHA>
//       [--date YYYY-MM-DD] [--title "Short release title"] [--dry-run]
//
// Run it after certification, once standards/manifest.json holds the evidence fields for the new
// release (runtime profile, checks, pending, certification scope and receipts). It then:
// - checks the notes and that the version is at least the bump they ask for;
// - checks the certified commit still matches the working tree for every distributed skill and
//   pinned helper, and pins them (distribution) together with the release's note digest (changes);
// - sets the release fields in standards/manifest.json and copies it to standards/baselines/<v>.json;
// - pins that file's digest in STANDARD (scripts/audit-site.mjs) and admits the release in the
//   site audit report schemas;
// - writes the "Changes for sites" section of standards/releases/<v>.md from the notes, keeping any
//   hand-written text around it, and deletes the notes.
// Tagging stays a separate, reviewed step: commit, then `git tag -a standards-v<v> <commit>`.
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { argumentsOf, isMain } from './infrastructure-io.mjs';
import { ADOPTION_TEXT, CHANGES_DIR, largestBump, nextVersion, readNotes } from './standards-changes.mjs';
import { PINNED_TOOLS, distributionOf } from './standards-distribution.mjs';

const defaultRoot = fileURLToPath(new URL('../', import.meta.url));
const VERSION = /^\d+\.\d+\.\d+$/;
const START = '<!-- standards-changes:start -->';
const END = '<!-- standards-changes:end -->';
const PLATFORM_NAMES = { emdash: 'EmDash', static: 'static' };

export function compareVersions(a, b) {
  const [x, y] = [a, b].map(value => value.split('.').map(Number));
  for (let i = 0; i < 3; i++) if (x[i] !== y[i]) return x[i] - y[i];
  return 0;
}

// The group a note is listed under: the most demanding thing it asks of a site.
export function groupOf(note) {
  if (note.meta.bump === 'none' || note.meta.adoption === 'none') return 'none';
  if (note.meta.database) return 'database';
  if (note.meta.visible) return 'visible';
  return note.meta.adoption;
}
const GROUPS = [
  ['database', 'Needs a database step'],
  ['visible', 'Changes how pages look: decide per site'],
  ['manual', 'Review and merge by hand'],
  ['copy', 'Copy into the site'],
  ['sync', 'Arrives with the site\'s sync'],
  ['none', 'No site action'],
];

export function changesSection(notes, version) {
  const counted = notes.filter(note => note.meta.bump !== 'none');
  const lines = [START, '## Changes for sites', '', `${notes.length} change notes; the largest is a ${largestBump(notes)} change. Each entry says which platforms it affects and how a site takes it.`];
  for (const [group, heading] of GROUPS) {
    const members = notes.filter(note => groupOf(note) === group);
    if (!members.length) continue;
    lines.push('', `### ${heading}`, '');
    if (group === 'none') { for (const note of members) lines.push(`- ${note.title}`); continue; }
    for (const note of members) {
      const facts = [
        note.meta.platforms.map(platform => PLATFORM_NAMES[platform]).join(' and '),
        note.meta.areas.join(', '),
        ADOPTION_TEXT[note.meta.adoption],
      ];
      if (note.meta.files?.length) facts.push(`files: ${note.meta.files.map(file => `\`${file}\``).join(', ')}`);
      lines.push(`#### ${note.title}`, '', `_${facts.join(' · ')}_`, '', note.body.replace(/^## /gm, '##### '), '');
    }
    lines.pop();
  }
  if (!counted.length) lines.push('', 'No change in this release reaches sites.');
  lines.push('', `Selecting this release: resolve the tag \`standards-v${version}\` to its full commit and read \`standards/baselines/${version}.json\` at that commit.`, END);
  return lines.join('\n');
}

export function releaseNotesText(existing, section, { version, title, date }) {
  if (existing?.includes(START) && existing.includes(END)) {
    return existing.slice(0, existing.indexOf(START)) + section + existing.slice(existing.indexOf(END) + END.length);
  }
  if (existing) return `${existing.trimEnd()}\n\n${section}\n`;
  return `# Standards ${version}${title ? ` — ${title}` : ''}\n\nReviewed ${date}. Standards tag: \`standards-v${version}\`.\n\n${section}\n`;
}

const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const git = (cwd, args) => execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();

export function prepareRelease({ root = defaultRoot, version, sourceCommit, date = new Date().toISOString().slice(0, 10), title = null, dryRun = false, checkSource = true }) {
  if (!VERSION.test(version ?? '')) throw new Error('--version must look like 1.2.3');
  if (!/^[0-9a-f]{40}$/.test(sourceCommit ?? '')) throw new Error('--source-commit must be the full 40-character certified commit');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error('--date must be YYYY-MM-DD');
  const manifestFile = path.join(root, 'standards/manifest.json');
  const manifest = JSON.parse(fs.readFileSync(manifestFile, 'utf8'));
  const notes = readNotes(path.join(root, CHANGES_DIR));
  const problems = notes.flatMap(note => note.problems);
  if (problems.length) throw new Error(`fix the change notes first:\n${problems.join('\n')}`);
  if (!notes.length) throw new Error(`no change notes in ${CHANGES_DIR}/; nothing to release`);
  if (compareVersions(version, manifest.standardsVersion) <= 0) throw new Error(`${version} is not newer than ${manifest.standardsVersion}`);
  const bump = largestBump(notes), minimum = nextVersion(manifest.standardsVersion, bump);
  if (compareVersions(version, minimum) < 0) throw new Error(`the notes ask for a ${bump} change, so the release is at least ${minimum}`);
  if (fs.existsSync(path.join(root, `standards/baselines/${version}.json`))) throw new Error(`standards/baselines/${version}.json already exists`);

  const sourceTree = git(root, ['rev-parse', `${sourceCommit}^{tree}`]);
  if (checkSource) {
    const drift = git(root, ['diff', '--name-only', sourceCommit, '--', '.agents/skills', ...PINNED_TOOLS.filter(tool => fs.existsSync(path.join(root, tool))), '.emdash/impeccable-source.json']);
    if (drift) throw new Error(`the working tree differs from ${sourceCommit.slice(0, 12)} in distributed files; release what was certified:\n${drift}`);
  }

  const releaseNotes = `standards/releases/${version}.md`;
  manifest.standardsVersion = version;
  manifest.reviewedAt = date;
  manifest.stableReleaseRef = `refs/tags/standards-v${version}`;
  manifest.certification = { ...manifest.certification, sourceCommit, sourceTree, releaseNotes };
  manifest.distribution = distributionOf(root);
  manifest.changes = notes.map(({ slug, title: noteTitle, meta }) => ({ slug, title: noteTitle, bump: meta.bump, platforms: meta.platforms ?? [], areas: meta.areas ?? [], adoption: meta.adoption ?? 'none', visible: meta.visible ?? false, database: meta.database ?? false, files: meta.files ?? [] }));
  const manifestText = JSON.stringify(manifest, null, 2) + '\n';
  const digest = sha256(Buffer.from(manifestText));

  const auditFile = path.join(root, 'scripts/audit-site.mjs');
  const audit = fs.readFileSync(auditFile, 'utf8');
  const standardLine = /export const STANDARD = Object\.freeze\(\{[^\n]*\}\);/;
  if (!standardLine.test(audit)) throw new Error('STANDARD not found in scripts/audit-site.mjs');
  const nextAudit = audit.replace(standardLine, `export const STANDARD = Object.freeze({ version: '${version}', commit: '${sourceCommit}', sha256: '${digest}' });`);

  const schemaUpdates = ['standards/site-audit-report.schema.json', 'standards/site-audit-report.v2.schema.json'].filter(file => fs.existsSync(path.join(root, file))).map(file => {
    const schema = JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'));
    const standards = schema.properties?.standards?.properties;
    if (!standards) throw new Error(`${file}: no standards properties`);
    for (const [key, value] of [['version', version], ['commit', sourceCommit], ['sha256', digest]]) if (!standards[key].enum.includes(value)) standards[key].enum.push(value);
    return [file, schema];
  });

  const notesFile = path.join(root, releaseNotes);
  const existing = fs.existsSync(notesFile) ? fs.readFileSync(notesFile, 'utf8') : null;
  const notesText = releaseNotesText(existing, changesSection(notes, version), { version, title, date });

  const summary = { version, bump, minimum, notes: notes.length, digest, sourceCommit, releaseNotes, skills: Object.keys(manifest.distribution.skills).length, tools: Object.keys(manifest.distribution.tools).length };
  if (dryRun) return { ...summary, dryRun: true, releaseNotesText: notesText };

  fs.writeFileSync(manifestFile, manifestText);
  fs.mkdirSync(path.join(root, 'standards/baselines'), { recursive: true });
  fs.writeFileSync(path.join(root, `standards/baselines/${version}.json`), manifestText);
  fs.writeFileSync(auditFile, nextAudit);
  for (const [file, schema] of schemaUpdates) writeSchema(path.join(root, file), schema);
  fs.mkdirSync(path.dirname(notesFile), { recursive: true });
  fs.writeFileSync(notesFile, notesText);
  for (const note of notes) fs.rmSync(path.join(root, note.file));
  return summary;
}

// The schemas keep the standards enums on one line; preserve that layout instead of reflowing the file.
function writeSchema(file, schema) {
  const text = fs.readFileSync(file, 'utf8');
  const standards = schema.properties.standards.properties;
  let next = text;
  for (const key of ['version', 'commit', 'sha256']) {
    const pattern = new RegExp(`("${key}": \\{ "enum": )\\[[^\\]]*\\]`);
    if (!pattern.test(next)) throw new Error(`${path.basename(file)}: cannot find the ${key} enum`);
    next = next.replace(pattern, `$1${JSON.stringify(standards[key].enum).replaceAll('","', '", "')}`);
  }
  JSON.parse(next);
  fs.writeFileSync(file, next);
}

if (isMain(import.meta.url)) {
  try {
    const args = argumentsOf(process.argv.slice(2), ['--version', '--source-commit', '--date', '--title'], ['--dry-run']);
    const result = prepareRelease({ version: args.version, sourceCommit: args['source-commit'], date: args.date, title: args.title, dryRun: Boolean(args['dry-run']) });
    if (result.dryRun) { process.stdout.write(result.releaseNotesText); delete result.releaseNotesText; }
    console.log(JSON.stringify(result, null, 2));
    if (!result.dryRun) console.log(`Next: review the diff, run npm run verify, commit, then tag the release commit: git tag -a standards-v${result.version} -m "Standards ${result.version}". Push both, then publish the GitHub release (docs/standards-releases.md, step 4).`);
  } catch (error) {
    console.error(`[standards-release] ${error.message}`);
    process.exitCode = 1;
  }
}
