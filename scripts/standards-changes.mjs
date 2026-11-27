// Change notes for standards releases.
//
// Every change that sites receive gets a short note in standards/changes/<slug>.md, written in the
// same pull request by whoever made the change. A release gathers the notes into its release notes
// (scripts/standards-release.mjs) and deletes them. The front matter is what update tooling reads:
// which platforms a change touches, how a site takes it, whether it changes how pages look and
// whether it needs a database step. The body says what a site has to do.
//
//   npm run standards:change -- --slug <name> [--bump minor] [--title "..."]   write a note template
//   npm run standards:check [-- --base <git ref>]                              validate notes; with
//       --base, also require a note when the diff since <ref> touches files sites receive
//   npm run standards:check -- --list [--json]                                 show pending notes
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { argumentsOf, isMain } from './infrastructure-io.mjs';
import { parseSveltiaPin, SVELTIA_ADMIN_HTML } from './sveltia-pin.mjs';
import { CHANGES_DIR, isShipped } from './standards-paths.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
export { CHANGES_DIR };

export const FIELDS = Object.freeze({
  bump: ['major', 'minor', 'patch', 'none'],
  platforms: ['emdash', 'static'],
  areas: ['dependencies', 'skills', 'tooling', 'components', 'styles', 'content-model', 'delivery', 'docs'],
  adoption: ['sync', 'copy', 'manual', 'none'],
});
export const BUMP_ORDER = ['none', 'patch', 'minor', 'major'];
export const ADOPTION_TEXT = Object.freeze({
  sync: 'Arrives with the site\'s skill or source sync',
  copy: 'Copy the named files into the site',
  manual: 'Review and merge by hand; a decision per site',
  none: 'Nothing for sites to do',
});

// Which paths reach sites lives in standards-paths.mjs, so Renovate's dependency-note task can use it.
export { isShipped };

const SLUG = /^[a-z0-9][a-z0-9-]{1,79}$/;

// A deliberately small front-matter reader: `key: value` and `key: [a, b]`, nothing nested.
export function parseNote(text, name = 'note') {
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/.exec(text);
  if (!match) throw new Error(`${name}: missing front matter between --- lines`);
  const meta = {};
  for (const line of match[1].split(/\r?\n/)) {
    if (!line.trim() || line.trim().startsWith('#')) continue;
    const pair = /^([a-z]+):\s*(.*)$/.exec(line);
    if (!pair) throw new Error(`${name}: cannot read front matter line ${JSON.stringify(line)}`);
    const [, key, raw] = pair;
    if (Object.hasOwn(meta, key)) throw new Error(`${name}: ${key} appears twice`);
    const value = raw.trim();
    meta[key] = value.startsWith('[') ? value.replace(/^\[|\]$/g, '').split(',').map(item => item.trim()).filter(Boolean)
      : value === 'yes' || value === 'true' ? true : value === 'no' || value === 'false' ? false : value;
  }
  const body = match[2].replace(/\r\n/g, '\n').trim();
  const title = /^# (.+)$/m.exec(body)?.[1]?.trim();
  return { meta, title, body: body.replace(/^# .+\n*/, '').trim() };
}

export function validateNote(note, name = 'note') {
  const problems = [];
  const { meta } = note;
  const known = ['bump', 'platforms', 'areas', 'adoption', 'visible', 'database', 'files'];
  for (const key of Object.keys(meta)) if (!known.includes(key)) problems.push(`unknown field ${key}`);
  if (!FIELDS.bump.includes(meta.bump)) problems.push(`bump must be one of ${FIELDS.bump.join(', ')}`);
  if (!note.title) problems.push('needs a "# Title" line');
  if (meta.bump !== 'none') {
    for (const key of ['platforms', 'areas']) {
      if (!Array.isArray(meta[key]) || !meta[key].length) problems.push(`${key} must be a non-empty list`);
      else for (const value of meta[key]) if (!FIELDS[key].includes(value)) problems.push(`${key}: unknown value ${value} (use ${FIELDS[key].join(', ')})`);
    }
    if (!FIELDS.adoption.includes(meta.adoption)) problems.push(`adoption must be one of ${FIELDS.adoption.join(', ')}`);
    for (const key of ['visible', 'database']) if (typeof meta[key] !== 'boolean') problems.push(`${key} must be yes or no`);
    if (meta.adoption === 'copy' && (!Array.isArray(meta.files) || !meta.files.length)) problems.push('adoption: copy needs a files list');
    if (!note.body) problems.push('needs a body saying what changed and what a site does');
  }
  if (meta.files !== undefined && (!Array.isArray(meta.files) || meta.files.some(file => /\\|^\/|(^|\/)\.\.(\/|$)/.test(file)))) problems.push('files must be a list of repository-relative paths');
  return problems.map(problem => `${name}: ${problem}`);
}

export function readNotes(dir = path.join(root, CHANGES_DIR)) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter(file => file.endsWith('.md') && file !== 'README.md').sort().map(file => {
    const slug = file.slice(0, -3);
    const note = parseNote(fs.readFileSync(path.join(dir, file), 'utf8'), file);
    return { slug, file: `${CHANGES_DIR}/${file}`, ...note, problems: [...(SLUG.test(slug) ? [] : [`${file}: name must be lowercase letters, digits and hyphens`]), ...validateNote(note, file)] };
  });
}

export function largestBump(notes) {
  return notes.reduce((largest, note) => BUMP_ORDER.indexOf(note.meta.bump) > BUMP_ORDER.indexOf(largest) ? note.meta.bump : largest, 'none');
}

export function nextVersion(current, bump) {
  const [major, minor, patch] = current.split('.').map(Number);
  // Below 1.0, a breaking change raises the minor number, as npm and Cargo treat 0.x.
  if (bump === 'major') return major === 0 ? `0.${minor + 1}.0` : `${major + 1}.0.0`;
  if (bump === 'minor') return `${major}.${minor + 1}.0`;
  if (bump === 'patch') return `${major}.${minor}.${patch + 1}`;
  return current;
}

// Files changed since `base` (committed and uncommitted), as repository-relative paths.
export function changedFiles(base, cwd = root) {
  const run = args => execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).split('\n').filter(Boolean);
  return [...new Set([...run(['diff', '--name-only', `${base}`]), ...run(['ls-files', '--others', '--exclude-standard'])])].sort();
}

export function requireNote(files) {
  const shipped = files.filter(isShipped);
  const notes = files.filter(file => file.startsWith(`${CHANGES_DIR}/`) && file.endsWith('.md') && !file.endsWith('/README.md'));
  // A release consumes the notes; its release file stands in for them.
  const release = files.some(file => /^standards\/releases\/\d+\.\d+\.\d+\.md$/.test(file));
  return { shipped, notes, missing: shipped.length > 0 && notes.length === 0 && !release };
}

export function noteTemplate({ title = 'What changed, in one line', bump = 'minor' } = {}) {
  return `---
bump: ${bump}
platforms: [emdash, static]
areas: [tooling]
adoption: manual
visible: no
database: no
---

# ${title}

What changed and why, in two or three sentences.

## For sites

What a site does to take this change, or "Nothing" when it arrives by itself.
`;
}

// The note the weekly upstream job writes for its own proposal (one fixed name, rewritten each run).
export function upstreamNote({ dependencies = false, skills = [], impeccable = null, sveltia = null }) {
  if (!dependencies && !skills.length && !sveltia) return null;
  const areas = [...(dependencies || sveltia ? ['dependencies'] : []), ...(skills.length ? ['skills'] : [])];
  const platforms = dependencies || skills.length ? ['emdash', 'static'] : ['static'];
  const lines = [];
  if (skills.length) lines.push(`Third-party skills refreshed from upstream: ${skills.join(', ')}.${impeccable ? ` Impeccable moves from ${impeccable.from} to ${impeccable.to}.` : ''}`);
  if (dependencies) lines.push('Baseline\'s lockfile takes in-range dependency updates; certified top-level versions are unchanged unless the release notes say otherwise.');
  if (sveltia) lines.push(`Sveltia CMS, which the static-sveltia profile loads from a CDN, moves from ${sveltia.from} to ${sveltia.to}. Its SRI value was recomputed from the published file, and both generated static profiles were rebuilt and served against it.`);
  const forSites = [
    ...(skills.length ? ['Run the site\'s skill sync (`npm run sync:site-skills -- --stage`, review, `--apply`; static sites use `sync:baseline`) to receive the refreshed skills.'] : []),
    ...(dependencies ? ['Nothing is required for dependencies: each site keeps its own lockfile and updates it in its own maintenance.'] : []),
    ...(sveltia ? ['Static Sveltia sites own `public/admin/index.html`, so the sync does not touch it. Copy the Sveltia `<script>` tag from Baseline\'s `profiles/static-sveltia/project/public/admin/index.html`, keeping its version and `integrity` together. If the site\'s `audit/design-gate-exceptions.json` lists that page and the page is otherwise unchanged, copy the new `sha256` from Baseline\'s entry for it. Run `npm run verify` and `npm run build`, then test sign-in, save and publish on the deployed editor. Other sites: nothing.'] : []),
  ];
  const named = [...skills, ...(sveltia ? [`Sveltia CMS ${sveltia.to}`] : [])];
  return `---
bump: patch
platforms: [${platforms.join(', ')}]
areas: [${areas.join(', ')}]
adoption: ${sveltia ? 'manual' : skills.length ? 'sync' : 'none'}
visible: no
database: no
---

# Weekly upstream refresh${named.length ? ` (${named.join(', ')})` : ''}

${lines.join('\n\n')}

## For sites

${forSites.join('\n\n')}
`;
}

if (isMain(import.meta.url)) {
  const [command = 'check', ...rest] = process.argv.slice(2);
  try {
    if (command === 'new') {
      const args = argumentsOf(rest, ['--slug', '--bump', '--title']);
      if (!args.slug || !SLUG.test(args.slug)) throw new Error('Usage: npm run standards:change -- --slug <lowercase-name> [--bump major|minor|patch|none] [--title "..."]');
      if (args.bump && !FIELDS.bump.includes(args.bump)) throw new Error(`--bump must be one of ${FIELDS.bump.join(', ')}`);
      const file = path.join(root, CHANGES_DIR, `${args.slug}.md`);
      if (fs.existsSync(file)) throw new Error(`${CHANGES_DIR}/${args.slug}.md already exists`);
      fs.mkdirSync(path.dirname(file), { recursive: true });
      fs.writeFileSync(file, noteTemplate(args));
      console.log(`Wrote ${CHANGES_DIR}/${args.slug}.md; fill in the front matter and the body.`);
    } else if (command === 'check') {
      const args = argumentsOf(rest, ['--base'], ['--list', '--json']);
      const notes = readNotes();
      const problems = notes.flatMap(note => note.problems);
      if (args.list || args.json) {
        const summary = { pending: notes.length, largestBump: largestBump(notes), notes: notes.map(({ slug, title, meta }) => ({ slug, title, ...meta })) };
        if (args.json) console.log(JSON.stringify(summary, null, 2));
        else for (const note of summary.notes) console.log(`${note.bump.padEnd(5)} ${note.slug}: ${note.title}`);
      }
      if (args.base) {
        const result = requireNote(changedFiles(args.base));
        if (result.missing) problems.push(`Changes since ${args.base} touch files sites receive (${result.shipped.slice(0, 5).join(', ')}${result.shipped.length > 5 ? ', …' : ''}) but add no note in ${CHANGES_DIR}/. Add one with npm run standards:change -- --slug <name>; use "bump: none" when sites are not affected.`);
      }
      if (problems.length) { for (const problem of problems) console.error(`[standards] ${problem}`); process.exitCode = 1; }
      else if (!args.list && !args.json) console.log(`Standards notes: PASS (${notes.length} pending${notes.length ? `, largest bump ${largestBump(notes)}` : ''}).`);
    } else if (command === 'upstream-note') {
      // Reads the uncommitted upstream proposal in this checkout and writes its note.
      const changed = execFileSync('git', ['diff', '--name-only', 'HEAD'], { cwd: root, encoding: 'utf8' }).split('\n').filter(Boolean);
      const skills = [...new Set(changed.filter(file => file.startsWith('.agents/skills/')).map(file => file.split('/')[2]))].sort();
      let impeccable = null;
      if (changed.includes('.emdash/impeccable-source.json')) {
        const before = JSON.parse(execFileSync('git', ['show', 'HEAD:.emdash/impeccable-source.json'], { cwd: root, encoding: 'utf8' }));
        const after = JSON.parse(fs.readFileSync(path.join(root, '.emdash/impeccable-source.json'), 'utf8'));
        if (before.declaredSkillVersion !== after.declaredSkillVersion) impeccable = { from: before.declaredSkillVersion, to: after.declaredSkillVersion };
      }
      let sveltia = null;
      if (changed.includes(SVELTIA_ADMIN_HTML)) {
        const before = parseSveltiaPin(execFileSync('git', ['show', `HEAD:${SVELTIA_ADMIN_HTML}`], { cwd: root, encoding: 'utf8' })).version;
        const after = parseSveltiaPin(fs.readFileSync(path.join(root, SVELTIA_ADMIN_HTML), 'utf8')).version;
        if (before !== after) sveltia = { from: before, to: after };
      }
      const text = upstreamNote({ dependencies: changed.some(file => /^package(-lock)?\.json$/.test(file)), skills, impeccable, sveltia });
      const file = path.join(root, CHANGES_DIR, 'upstream-update.md');
      if (text) { fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, text); console.log(`Wrote ${CHANGES_DIR}/upstream-update.md`); }
      else console.log('No upstream changes; no note written.');
    } else throw new Error(`Unknown command ${command}; use new, check or upstream-note`);
  } catch (error) {
    console.error(`[standards] ${error.message}`);
    process.exitCode = 1;
  }
}
