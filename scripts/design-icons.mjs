#!/usr/bin/env node
// Open-licence drawings for a site's figurative subjects, from the Iconify catalogue (api.iconify.design).
//
//   npm run design:icons -- search owl [--sets game-icons] [--limit 60]
//   npm run design:icons -- get game-icons:owl,game-icons:turtle --out src/assets/drawn
//
// Code draws geometry, diagrams, maps and lettering well and animals, food, plants and people badly: an
// agent writes every curve as coordinates without seeing them. A site's figurative subjects come from one
// open-licence set instead, recoloured and treated as the world's material (a stencil, a stamp, a burn,
// a stitch). `search` lists the sets that have a subject with their licence; `get` writes each SVG into
// the site (no runtime dependency), refuses sets whose licence is not open or asks for share-alike, and
// records the credit in CREDITS.md beside the files, warning when a second set joins the first.
import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const API = 'https://api.iconify.design';
/** Licences a site may ship with a credit line: permissive, no share-alike, no non-commercial clause. */
export const OPEN_LICENCES = Object.freeze(['MIT', 'ISC', 'Apache-2.0', 'BSD-2-Clause', 'BSD-3-Clause', 'CC0-1.0', 'CC-BY-3.0', 'CC-BY-4.0', 'OFL-1.1', 'Unlicense']);
export const licenceAllowed = (spdx) => OPEN_LICENCES.includes(String(spdx ?? ''));
/** Licences whose credit must be shown to visitors, not only kept in the files. */
export const needsVisibleCredit = (spdx) => /^CC-BY-/.test(String(spdx ?? ''));

export function parseArgs(argv) {
  const [command, subject, ...rest] = argv;
  const out = { command, subject, limit: 60, out: null, sets: null };
  for (let i = 0; i < rest.length; i++) {
    const flag = rest[i];
    const value = () => { const v = rest[++i]; if (v === undefined || v.startsWith('--')) throw Error('Missing value for ' + flag); return v; };
    if (flag === '--limit') out.limit = Number(value());
    else if (flag === '--out') out.out = value();
    else if (flag === '--sets') out.sets = value().split(',').map((x) => x.trim()).filter(Boolean);
    else throw Error('Unknown option: ' + flag);
  }
  if (command === '--help' || command === '-h' || !command) return { help: true };
  if (!['search', 'get'].includes(command)) throw Error('Command must be search or get');
  if (!subject) throw Error(command === 'search' ? 'search needs a word (in English): owl, bicycle, cheese' : 'get needs set:name ids, comma-separated');
  if (command === 'get') {
    out.ids = subject.split(',').map((s) => s.trim()).filter(Boolean);
    for (const id of out.ids) if (!/^[a-z0-9-]+:[a-z0-9-]+$/.test(id)) throw Error(`"${id}" is not a set:name id (game-icons:owl)`);
    if (!out.out) throw Error('get needs --out <folder> inside the site (src/assets/drawn)');
  }
  if (!Number.isInteger(out.limit) || out.limit < 1 || out.limit > 999) throw Error('--limit must be 1 to 999');
  return out;
}

export function creditLine(id, info) {
  const [prefix, name] = id.split(':');
  return `- \`${name}.svg\`: ${info.name} (\`${prefix}\`), ${info.author?.name ?? 'unknown author'}, ${info.license?.title ?? info.license?.spdx}${info.license?.url ? ` (${info.license.url})` : ''}${info.author?.url ? `, ${info.author.url}` : ''}`;
}

/** The set prefixes a CREDITS.md already holds. */
export function setsInCredits(text) {
  return [...new Set([...String(text).matchAll(/\(`([a-z0-9-]+)`\)/g)].map((m) => m[1]))];
}

async function json(url) {
  const res = await fetch(url);
  if (!res.ok) throw Error(`${url}: HTTP ${res.status}`);
  return res.json();
}

async function search(word, limit, onlySets) {
  // --sets keeps a site to the set it has chosen: one hand for every drawing.
  const found = await json(`${API}/search?query=${encodeURIComponent(word)}&limit=${limit}${onlySets ? `&prefixes=${onlySets.join(',')}` : ''}`);
  const bySet = new Map();
  for (const id of found.icons ?? []) { const [p, n] = id.split(':'); (bySet.get(p) ?? bySet.set(p, []).get(p)).push(n); }
  if (!bySet.size) { console.log(`No icon for "${word}". Try a broader English word, or show the subject in a photograph.`); return; }
  const sets = await json(`${API}/collections?prefixes=${[...bySet.keys()].join(',')}`);
  console.log(`"${word}": ${found.total} icons in ${bySet.size} sets (open licences marked ✓; preview at https://icon-sets.iconify.design/<set>/)`);
  for (const [prefix, names] of bySet) {
    const info = sets[prefix] ?? {};
    const spdx = info.license?.spdx ?? '?';
    console.log(`${licenceAllowed(spdx) ? '✓' : '✗'} ${prefix.padEnd(26)} ${String(spdx).padEnd(12)} ${(info.palette ? 'colour' : 'one colour').padEnd(10)} ${names.slice(0, 6).join(', ')}`);
  }
}

async function get(ids, outDir) {
  const prefixes = [...new Set(ids.map((id) => id.split(':')[0]))];
  const sets = await json(`${API}/collections?prefixes=${prefixes.join(',')}`);
  const refused = prefixes.filter((p) => !licenceAllowed(sets[p]?.license?.spdx));
  if (refused.length) throw Error(`Not an open licence for a site: ${refused.map((p) => `${p} (${sets[p]?.license?.spdx ?? 'unknown'})`).join(', ')}. Choose a set marked ✓ by search.`);
  mkdirSync(outDir, { recursive: true });
  const creditsFile = path.join(outDir, 'CREDITS.md');
  const before = existsSync(creditsFile) ? readFileSync(creditsFile, 'utf8') : '# Drawing credits\n\nOpen-licence drawings from the Iconify catalogue, recoloured for this site.\n\n';
  if (!existsSync(creditsFile)) writeFileSync(creditsFile, before);
  const existingSets = setsInCredits(before);
  for (const id of ids) {
    const [prefix, name] = id.split(':');
    const res = await fetch(`${API}/${prefix}/${name}.svg`);
    if (!res.ok) throw Error(`${id}: HTTP ${res.status} (check the name with search)`);
    const svg = await res.text();
    const info = sets[prefix];
    writeFileSync(path.join(outDir, `${name}.svg`), `<!-- ${id}: ${info.name}, ${info.license.title}, ${info.author?.name ?? ''} -->\n${svg}\n`);
    if (!before.includes(`\`${name}.svg\``)) appendFileSync(creditsFile, creditLine(id, info) + '\n');
    console.log(`Wrote ${path.join(outDir, `${name}.svg`)} (${info.license.spdx}${info.palette ? ', in colour' : ', fill currentColor'})`);
  }
  const mixed = [...new Set([...existingSets, ...prefixes])];
  if (mixed.length > 1) console.log(`Warning: ${mixed.join(', ')} are different sets; one set per site keeps the drawings one hand.`);
  const visible = prefixes.filter((p) => needsVisibleCredit(sets[p].license.spdx));
  if (visible.length) console.log(`${visible.join(', ')}: ${sets[visible[0]].license.title} asks for a credit visitors can see (a credits line in the footer or a credits page), not only CREDITS.md.`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  try {
    const options = parseArgs(process.argv.slice(2));
    if (options.help) console.log('Usage: npm run design:icons -- search <word> [--sets game-icons] [--limit 60]\n       npm run design:icons -- get <set:name>[,<set:name>] --out src/assets/drawn\nSearches and fetches open-licence drawings from api.iconify.design; see site-art-direction/references/world-building.md (Drawings).');
    else if (options.command === 'search') await search(options.subject, options.limit, options.sets);
    else await get(options.ids, options.out);
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
