// Writes the standards change note for one Renovate branch.
//
// Every change that sites receive needs a note in standards/changes/ (scripts/standards-changes.mjs),
// and CI refuses a pull request without one. Renovate runs this script as a post-upgrade task
// (.github/renovate.json5) after it has edited the package files and before it commits, with the
// branch's updates in the JSON file named by RENOVATE_POST_UPGRADE_COMMAND_DATA_FILE. It runs inside
// Renovate's own clone, where node_modules is not installed, so it uses Node built-ins only.
//
//   node scripts/dependency-note.mjs [--data <file>]
//
// The data file, as the dataFileTemplate in .github/renovate.json5 writes it:
//   { "branch": "renovate/astro-monorepo", "groupName": "astro monorepo",
//     "upgrades": [{ "depName", "manager", "depType", "packageFile", "currentValue", "newValue", "updateType" }] }
// One note per branch, named after the branch, so a rebased branch rewrites its own note and two
// open branches never touch the same file. Updates to files sites do not receive (CI workflows) get
// no note, because CI asks for none.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { CHANGES_DIR, isShipped } from './standards-paths.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const INVENTORY = 'profiles/dependency-inventory.json';
const isEmDash = name => name === 'emdash' || name.startsWith('@emdash-cms/');

export function noteSlug(branch, upgrades = []) {
  const base = (branch || upgrades.map(upgrade => upgrade.depName).join('-')).replace(/^renovate\//, '');
  return `deps-${base.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')}`.slice(0, 80).replace(/-+$/, '');
}

// npm packages take their platforms from the profile inventory; anything not listed there belongs to
// the root EmDash starter. Workflow files under profiles/static* belong to the static profiles.
function platformsOf(upgrade, inventory) {
  if (upgrade.manager === 'npm') return (inventory.packages?.[upgrade.depName]?.profiles ?? ['emdash']).map(profile => profile === 'emdash' ? 'emdash' : 'static');
  return /^profiles\/static/.test(upgrade.packageFile) ? ['static'] : ['emdash'];
}

const describe = upgrade => `${upgrade.depName} ${upgrade.currentValue || '(unknown)'} to ${upgrade.newValue}`;

export function dependencyNote(data, inventory = {}) {
  const upgrades = (Array.isArray(data?.upgrades) ? data.upgrades : []).filter(upgrade => upgrade?.depName && upgrade.newValue && isShipped(upgrade.packageFile ?? ''));
  if (!upgrades.length) return null;
  const npm = upgrades.filter(upgrade => upgrade.manager === 'npm');
  const workflows = upgrades.filter(upgrade => upgrade.manager !== 'npm');
  const names = [...new Set(upgrades.map(upgrade => upgrade.depName))];
  const platforms = ['emdash', 'static'].filter(platform => upgrades.some(upgrade => platformsOf(upgrade, inventory).includes(platform)));
  const areas = [...(npm.length ? ['dependencies'] : []), ...(workflows.length ? ['tooling'] : [])];
  // Below 1.0 a breaking change raises Baseline's minor number; a major dependency update may be one.
  const bump = upgrades.some(upgrade => upgrade.updateType === 'major') ? 'minor' : 'patch';
  const database = npm.some(upgrade => isEmDash(upgrade.depName));
  const title = upgrades.length === 1 ? `Dependency update: ${describe(upgrades[0])}` : `Dependency update: ${data.groupName || names.slice(0, 3).join(', ')} (${names.length} packages)`;

  // The commands a site runs to match Baseline, per platform, since a static site lacks EmDash-only packages.
  const install = (list, flags) => list.length ? [`\`npm install ${flags} ${list.map(upgrade => `${upgrade.depName}@${upgrade.newValue}`).join(' ')}\``] : [];
  const commandsFor = list => [
    ...install(list.filter(upgrade => upgrade.depType !== 'devDependencies'), '--save-exact'),
    ...install(list.filter(upgrade => upgrade.depType === 'devDependencies'), '--save-dev --save-exact'),
  ].join(' and ');
  const rootPackages = npm.filter(upgrade => upgrade.packageFile === 'package.json');
  const byPlatform = platforms.map(platform => [platform, commandsFor(rootPackages.filter(upgrade => platformsOf(upgrade, inventory).includes(platform)))]).filter(([, commands]) => commands);
  const PLATFORM_SITES = { emdash: 'EmDash sites', static: 'static sites' };
  const follow = byPlatform.length === 1 || new Set(byPlatform.map(([, commands]) => commands)).size === 1
    ? `run ${byPlatform[0][1]} in the site`
    : `run ${byPlatform.map(([platform, commands]) => `${commands} in ${PLATFORM_SITES[platform]}`).join(', and ')}`;
  const forSites = [
    ...(byPlatform.length ? [`Each site keeps its own lockfile and decides when to follow. To match Baseline, ${follow}, then \`npm run verify\` and \`npm run build\`.`] : []),
    ...(database ? ['This moves EmDash, which runs database migrations on the first request after an upgrade. Read Baseline\'s upgrade guide for this version, rehearse on a local copy (`npm run db:export-d1`, then `npm run db:rehearse`), never on a preview version bound to the production database, and run `npm run check:live` after the deploy. See the framework upgrade checks in `docs/baseline-updates.md`.'] : []),
    ...(workflows.length ? [`Generated sites own their copy of the workflow. If the site's copy still matches the profile, copy the changed lines from ${[...new Set(workflows.map(upgrade => `\`${upgrade.packageFile}\``))].join(', ')}; otherwise nothing.`] : []),
  ];

  return `---
bump: ${bump}
platforms: [${platforms.join(', ')}]
areas: [${areas.join(', ')}]
adoption: manual
visible: no
database: ${database ? 'yes' : 'no'}
---

# ${title}

Renovate moved ${upgrades.length === 1 ? 'this version' : 'these versions'} in Baseline on branch \`${data.branch || 'unknown'}\`; its pull request links each release's notes.

${upgrades.map(upgrade => `- \`${upgrade.depName}\` ${upgrade.currentValue || '(unknown)'} to ${upgrade.newValue} (${upgrade.updateType || 'update'}, \`${upgrade.packageFile}\`)`).join('\n')}

## For sites

${forSites.join('\n\n')}
`;
}

export function writeDependencyNote({ dataFile, dir = path.join(root, CHANGES_DIR), inventoryFile = path.join(root, INVENTORY) }) {
  if (!dataFile) throw new Error('No update data: pass --data <file>, or run from Renovate, which sets RENOVATE_POST_UPGRADE_COMMAND_DATA_FILE.');
  const data = JSON.parse(fs.readFileSync(dataFile, 'utf8'));
  const inventory = fs.existsSync(inventoryFile) ? JSON.parse(fs.readFileSync(inventoryFile, 'utf8')) : {};
  const text = dependencyNote(data, inventory);
  if (!text) return null;
  const slug = noteSlug(data.branch, data.upgrades);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, `${slug}.md`), text);
  return `${CHANGES_DIR}/${slug}.md`;
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  try {
    const flag = process.argv.indexOf('--data');
    const written = writeDependencyNote({ dataFile: flag > -1 ? process.argv[flag + 1] : process.env.RENOVATE_POST_UPGRADE_COMMAND_DATA_FILE });
    console.log(written ? `Wrote ${written}` : 'No update reaches sites; no note written.');
  } catch (error) {
    console.error(`[dependency-note] ${error.message}`);
    process.exitCode = 1;
  }
}
