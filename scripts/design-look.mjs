#!/usr/bin/env node
// The look pass: every screen of a page, at the size a visitor sees it, with one line to write per screen.
//
//   npm run design:look -- --base http://127.0.0.1:4321 --routes /,/programme/ [--out audit/look] [--widths 390,1440]
//   npm run design:look -- --check [--out audit/look] [--src src]
//
// Why: trial sites were built by agents that opened their own screenshots fifteen to thirty-eight times
// a run and still shipped date cards a few letters wide, a ticket wider than the phone and captions lost
// in photographs. The logs showed where they looked: mostly the wide page, and on the phone the first
// screen or one full-page picture (390px by 7000px, shown so small that nothing in it can be read). None
// wrote down what it saw. This command cuts each page into the screens a visitor scrolls through, sets
// them side by side at full size on a few sheets, and writes `look.md` with one line per screen to fill:
// what is read first, and what is wrong. Its last two sections are what was fixed and the page's score on
// the six questions of site-art-direction/references/scorecard.md.
//
// A second run keeps the lines of the screens that have not changed and empties the others, so a look
// after a fix is short. `--check` passes when every screen has its line, the faults named have an answer
// under "Fixed", the six scores are written, and no file under `src/` is newer than the screens (a site
// changed after the look has not been looked at).
// Git Bash on Windows rewrites a lone "/" argument into a Windows path: set MSYS_NO_PATHCONV=1.
import { existsSync, mkdirSync, readFileSync, readdirSync, renameSync, statSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { loadPendingImages } from './audit-composition.mjs';

export const SCREENS = Object.freeze({ 390: { height: 844, step: 760, perSheet: 4 }, 1440: { height: 900, step: 810, perSheet: 2 } });
export const MAX_SCREENS = 14;
export const QUESTIONS = Object.freeze(['Object', 'Feature', 'Phone job', 'Craft', 'Made things', 'One idea']);
const EMPTY = '…';

export function parseArgs(argv) {
  const options = { base: null, routes: ['/'], out: 'audit/look', widths: [390, 1440], check: false, src: 'src', help: false };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--help' || arg === '-h') options.help = true;
    else if (arg === '--check') options.check = true;
    else if (arg === '--base') options.base = String(argv[++i] ?? '').replace(/\/+$/, '');
    else if (arg === '--routes') options.routes = String(argv[++i] ?? '').split(',').map((r) => r.trim()).filter(Boolean);
    else if (arg === '--out') options.out = argv[++i];
    else if (arg === '--src') options.src = argv[++i];
    else if (arg === '--widths') options.widths = String(argv[++i] ?? '').split(',').map(Number).filter((n) => SCREENS[n]);
    else throw Error(`Unknown argument: ${arg}`);
  }
  return options;
}

/** `/` is `home`; `/la-carte/` is `la-carte`; `/a/b` is `a-b`. */
export const slugOf = (route) => route.replace(/^\/+|\/+$/g, '').replace(/[^A-Za-z0-9]+/g, '-') || 'home';

/** The scroll positions whose screens cover a page of `pageHeight`, each overlapping the one before a little. */
export function screenTops(pageHeight, { height, step }, limit = MAX_SCREENS) {
  const tops = [0];
  while (tops.at(-1) + height < pageHeight && tops.length < limit) tops.push(Math.min(tops.at(-1) + step, Math.max(0, pageHeight - height)));
  return [...new Set(tops)];
}

/** Screens grouped onto sheets: `[[1, 2, 3, 4], [5, 6]]` for six screens, four to a sheet. */
export function sheetsOf(count, perSheet) {
  const sheets = [];
  for (let i = 0; i < count; i += perSheet) sheets.push(Array.from({ length: Math.min(perSheet, count - i) }, (_, k) => i + k + 1));
  return sheets;
}

const lineOf = (screen, read = EMPTY, faults = EMPTY, note = '') => `- Screen ${screen}. First read: ${read} Faults: ${faults}${note ? ` ${note}` : ''}`;
const SCREEN_LINE = /^- Screen (\d+)\. First read:\s*(.*?)\s*Faults:\s*(.*?)\s*(\(unchanged since the last look\))?\s*$/;
const filled = (text) => Boolean(text) && text.replace(/[….\s_-]/g, '').length >= 3;
const noFault = (text) => /^(none|no|nothing|aucun|aucune|rien)\b/i.test(text.trim());

/** Reads a look file: per section (`## <route> at <width>px`) its screen lines, then the Fixed lines and the scores. */
export function parseLook(markdown) {
  const sections = [];
  let current = null;
  let part = null;
  const fixed = [];
  const scores = {};
  let lowest = null;
  for (const raw of String(markdown).split(/\r?\n/)) {
    const line = raw.trimEnd();
    const head = /^## (\S+) at (\d+)px/.exec(line);
    if (head) { current = { route: head[1], width: Number(head[2]), screens: [] }; sections.push(current); part = 'screens'; continue; }
    if (/^## Fixed/.test(line)) { part = 'fixed'; continue; }
    if (/^## Score/.test(line)) { part = 'score'; continue; }
    if (/^## /.test(line)) { part = null; continue; }
    if (part === 'screens' && current) {
      const m = SCREEN_LINE.exec(line);
      if (m) current.screens.push({ screen: Number(m[1]), read: m[2], faults: m[3], carried: Boolean(m[4]) });
    } else if (part === 'fixed') {
      if (/^- /.test(line) && filled(line.slice(2))) fixed.push(line.slice(2).trim());
    } else if (part === 'score') {
      const row = /^\|\s*([^|]+?)\s*\|\s*([^|]*?)\s*\|\s*([^|]*?)\s*\|$/.exec(line);
      if (row && QUESTIONS.some((q) => q.toLowerCase() === row[1].toLowerCase())) scores[QUESTIONS.find((q) => q.toLowerCase() === row[1].toLowerCase())] = { score: /^[0-3]$/.test(row[2]) ? Number(row[2]) : null, shows: row[3] };
      const low = /^Lowest:\s*(.*)$/.exec(line);
      if (low) lowest = low[1].trim();
    }
  }
  return { sections, fixed, scores, lowest };
}

/** What is still to do in a look file, as messages; an empty list is a finished look. */
export function assessLook(markdown, { staleBy = null } = {}) {
  const problems = [];
  const look = parseLook(markdown);
  if (!look.sections.length) return ['The look file has no screens. Run `npm run design:look -- --base <origin> --routes <the pages>` on the served build.'];
  let faults = 0;
  for (const section of look.sections) {
    const open = section.screens.filter((s) => !filled(s.read) || !filled(s.faults)).map((s) => s.screen);
    if (open.length) problems.push(`${section.route} at ${section.width}px: screen${open.length === 1 ? '' : 's'} ${open.join(', ')} ${open.length === 1 ? 'has' : 'have'} no line yet. Open the sheet named in the section, look at each of those screens and write what is read first and what is wrong (or "none").`);
    faults += section.screens.filter((s) => filled(s.faults) && !noFault(s.faults)).length;
  }
  if (faults && !look.fixed.length) problems.push(`${faults} screen${faults === 1 ? '' : 's'} name a fault and "## Fixed" is empty. Fix each fault in the source, or write why it stays, one line each; then build, run the look again and look at the screens that changed.`);
  const unscored = QUESTIONS.filter((q) => look.scores[q]?.score === null || look.scores[q] === undefined || !filled(look.scores[q].shows));
  if (unscored.length) problems.push(`"## Score" has no score from 0 to 3 with what shows it for: ${unscored.join(', ')} (site-art-direction/references/scorecard.md).`);
  else if (!filled(look.lowest ?? '')) problems.push('"## Score" has no `Lowest:` line: name the question with the lowest score and what was improved for it.');
  if (staleBy) problems.push(`The site changed after these screens were taken (${staleBy} is newer). Build, serve and run the look again: it keeps the lines of the screens that did not change.`);
  return problems;
}

const HEADER = `# Look

Each section below is one page at one width, cut into the screens a visitor scrolls through. Open each sheet (the screens stand side by side, numbered) and write one line per screen:

- **First read:** the words or the thing the eye lands on first in that screen.
- **Faults:** anything in that screen that is cut off, lies over something else, touches an edge or another block, is too small to read, is lost in the picture behind it, is out of line with its neighbours, is an empty stretch, or is a placeholder. Name the thing ("the date card's hour", "the caption on the terrace photograph"). Write \`none\` only after looking for each of these.

Look at the phone screens as closely as the wide ones: most visitors see only those.
`;

const FOOTER = (scores = {}, fixed = [], lowest = '') => `
## Fixed

One line for each fault named above: what was changed, or why it stays.

${fixed.length ? fixed.map((f) => `- ${f}`).join('\n') : `- ${EMPTY}`}

## Score

Score the pages as a stranger would, from the screens above, on the six questions of \`site-art-direction/references/scorecard.md\`: 0 absent or broken, 1 attempted, 2 what a competent designer delivers, 3 what a studio shows to win a client.

| question | score | what on the page shows it |
|---|---|---|
${QUESTIONS.map((q) => `| ${q} | ${scores[q]?.score ?? ''} | ${scores[q]?.shows ?? ''} |`).join('\n')}

Lowest: ${lowest || EMPTY}
`;

/** The look file for these sections; `previous` (a parsed look) gives the lines of screens that did not change. */
export function renderLook(sections, previous = null, stamp = new Date().toISOString()) {
  const before = (route, width, screen) => previous?.sections.find((s) => s.route === route && s.width === width)?.screens.find((s) => s.screen === screen);
  const body = sections.map((section) => {
    const lines = [];
    for (const [index, screens] of section.sheets.entries()) {
      lines.push(`Sheet \`${section.files[index]}\` (screen${screens.length === 1 ? '' : 's'} ${screens.join(', ')}):`, '');
      for (const screen of screens) {
        const old = before(section.route, section.width, screen);
        const keep = old && section.unchanged?.includes(screen) && filled(old.read) && filled(old.faults);
        lines.push(keep ? lineOf(screen, old.read, old.faults, '(unchanged since the last look)') : lineOf(screen));
      }
      lines.push('');
    }
    return `## ${section.route} at ${section.width}px\n\n${lines.join('\n')}`;
  }).join('\n');
  return `${HEADER}\n<!-- screens taken ${stamp} -->\n\n${body}${FOOTER(previous?.scores, previous?.fixed, previous?.lowest)}`;
}

/** The newest file under a folder, as `{ file, time }`, or null. */
export function newestUnder(dir) {
  if (!existsSync(dir)) return null;
  let newest = null;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    const found = entry.isDirectory() ? newestUnder(full) : { file: full, time: statSync(full).mtimeMs };
    if (found && (!newest || found.time > newest.time)) newest = found;
  }
  return newest;
}

async function capture(options) {
  let chromium;
  for (const base of [path.join(process.cwd(), 'package.json'), import.meta.url]) { try { ({ chromium } = createRequire(base)('@playwright/test')); break; } catch { /* try the next location */ } }
  if (!chromium) throw Error('design:look needs @playwright/test and an installed Chromium (npx playwright install chromium).');
  const { default: sharp } = await import('sharp');
  mkdirSync(options.out, { recursive: true });
  const lookFile = path.join(options.out, 'look.md');
  const marksFile = path.join(options.out, 'look.json');
  const previous = existsSync(lookFile) ? parseLook(readFileSync(lookFile, 'utf8')) : null;
  let oldMarks = {};
  if (existsSync(marksFile)) { try { oldMarks = JSON.parse(readFileSync(marksFile, 'utf8')); } catch { oldMarks = {}; } }
  const marks = {};
  const sections = [];
  const browser = await chromium.launch();
  try {
    for (const route of options.routes) {
      for (const width of options.widths) {
        const shape = SCREENS[width];
        const page = await browser.newPage({ viewport: { width, height: shape.height } });
        try {
          await page.goto(options.base + route, { waitUntil: 'networkidle', timeout: 60000 }).catch(() => page.waitForTimeout(3000));
          await page.emulateMedia({ reducedMotion: 'reduce' });
          await page.evaluate(loadPendingImages);
          const pageHeight = await page.evaluate(() => document.documentElement.scrollHeight);
          const tops = screenTops(pageHeight, shape);
          const shots = [];
          for (const top of tops) {
            await page.evaluate((y) => scrollTo(0, y), top);
            await page.waitForTimeout(250);
            shots.push(await page.screenshot({ animations: 'disabled' }));
          }
          // A small grey picture of each screen: two looks at the same screen give the same marks.
          const key = `${route} ${width}`;
          marks[key] = await Promise.all(shots.map(async (shot) => [...await sharp(shot).resize(24, 24, { fit: 'fill' }).greyscale().raw().toBuffer()]));
          const unchanged = marks[key].map((mark, i) => { const old = oldMarks[key]?.[i]; return old && old.length === mark.length && mark.reduce((sum, v, k) => sum + Math.abs(v - old[k]), 0) / mark.length < 1.5 ? i + 1 : null; }).filter(Boolean);
          const sheets = sheetsOf(shots.length, shape.perSheet);
          const files = [];
          const gap = 16, band = 40;
          for (const [index, screens] of sheets.entries()) {
            const across = width === 390;
            const sheetWidth = across ? screens.length * width + (screens.length - 1) * gap : width;
            const sheetHeight = across ? shape.height + band : screens.length * (shape.height + band) + (screens.length - 1) * gap;
            const parts = [];
            for (const [k, screen] of screens.entries()) {
              const left = across ? k * (width + gap) : 0;
              const top = across ? 0 : k * (shape.height + band + gap);
              const label = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${band}"><rect width="100%" height="100%" fill="#111"/><text x="12" y="27" font-family="Arial, Helvetica, sans-serif" font-size="20" font-weight="700" fill="#fff">Screen ${screen}${tops[screen - 1] ? ` · ${tops[screen - 1]}px down` : ' · top of the page'}</text></svg>`);
              parts.push({ input: label, left, top }, { input: shots[screen - 1], left, top: top + band });
            }
            const file = path.join(options.out, `${slugOf(route)}-${width}-${index + 1}.jpg`).replace(/\\/g, '/');
            await sharp({ create: { width: sheetWidth, height: sheetHeight, channels: 3, background: '#666666' } }).composite(parts).jpeg({ quality: 82 }).toFile(file);
            files.push(file);
          }
          sections.push({ route, width, sheets, files, unchanged });
          console.log(`${route} at ${width}px: ${shots.length} screen${shots.length === 1 ? '' : 's'} on ${files.length} sheet${files.length === 1 ? '' : 's'}${previous ? `, ${unchanged.length} unchanged since the last look` : ''}${tops.length === MAX_SCREENS && tops.at(-1) + shape.height < pageHeight ? ` (the page goes on below screen ${MAX_SCREENS})` : ''}`);
        } finally { await page.close(); }
      }
    }
  } finally { await browser.close(); }
  if (existsSync(lookFile)) renameSync(lookFile, path.join(options.out, 'look-previous.md'));
  writeFileSync(lookFile, renderLook(sections, previous));
  writeFileSync(marksFile, JSON.stringify(marks));
  console.log(`Wrote ${lookFile.replace(/\\/g, '/')}: open each sheet, write a line for each screen, fix what the lines name, then score the pages. \`npm run design:look -- --check\` says what is still open.`);
}

function check(options) {
  const lookFile = path.join(options.out, 'look.md');
  if (!existsSync(lookFile)) { console.error(`No ${lookFile.replace(/\\/g, '/')}. Run \`npm run design:look -- --base <origin> --routes <the pages>\` on the served build first.`); process.exitCode = 1; return; }
  const markdown = readFileSync(lookFile, 'utf8');
  const taken = Date.parse(/<!-- screens taken (\S+) -->/.exec(markdown)?.[1] ?? '');
  const newest = newestUnder(options.src);
  const staleBy = Number.isFinite(taken) && newest && newest.time > taken + 1000 ? newest.file.replace(/\\/g, '/') : null;
  const problems = assessLook(markdown, { staleBy });
  if (!problems.length) { console.log('Look: every screen has its line, the faults have their answers and the pages are scored.'); return; }
  console.error(`Look: ${problems.length} thing${problems.length === 1 ? '' : 's'} open.`);
  for (const problem of problems) console.error(`  ${problem}`);
  process.exitCode = 1;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) { console.log('Usage: npm run design:look -- --base <origin> --routes /,/about [--out audit/look] [--widths 390,1440]\n       npm run design:look -- --check [--out audit/look] [--src src]'); return; }
  if (options.check) return check(options);
  if (!options.base) throw Error('design:look needs --base <origin of the served build> (or --check).');
  await capture(options);
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) main().catch((error) => { console.error(error.message); process.exitCode = 1; });
