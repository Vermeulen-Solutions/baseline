#!/usr/bin/env node
// Composition audit: does a rendered page read as a template? Advisory.
//
//   npm run audit:composition -- --base http://127.0.0.1:4321 --routes /,/about
//   npm run audit:composition -- --base https://preview.example.workers.dev --routes / --json --out ../evidence/composition.json
//
// Sites built from shared primitives pass every functional check and still look alike: a kicker
// label above every heading, the heading on the left and a lead on the right, a grid of equal
// cards, a band of another colour, the same again, a centred closing call to action. Found across
// a fleet of six sites that were accessible, fast and forgettable. For each route (at 1440px, and
// the narrowest width for the first-screen checks) this reads the page's top-level sections and
// reports:
// - kicker-openings: three or more sections open with a small uppercase label above the heading;
// - split-openings: three or more sections open with the heading on one side and a lead beside it;
// - card-grids: two or more sections are grids of three or more equal boxed items;
// - repeated-neighbours: two adjacent sections share the same opening, content kind and ground,
//   when that repeat is structural (cards, media, or a kicker or split opening);
// - no-full-width-media: photographs cover at least a tenth of the page but none spans the viewport;
// - closing-band: the page ends on a centred heading and button on a ground of its own;
// - no-signature: nothing on the page is larger or different in kind (no stage, fitted line,
//   index with previews, shaped frames, or a heading at least 2.5 times the body size beyond h1);
// - first-screen-heading (narrowest width): the page's h1 is not on the first screen.
// It also prints the measurements behind them: largest h1 and h2, body size, image cover and
// full-width media count. None of this fails a build unless --strict is given; the findings are
// prompts for the site-art-direction skill's distinctive-direction steps, not a design verdict.
import { writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { msysToNative, restoreGitBashRoute } from './capture-routes.mjs';

export function parseArgs(argv) {
  const out = { routes: [], widths: [1440, 390], json: false, strict: false, out: null, base: null };
  for (let i = 0; i < argv.length; i++) {
    const flag = argv[i];
    const value = () => { const v = argv[++i]; if (v === undefined || v.startsWith('--')) throw Error('Missing value for ' + flag); return v; };
    if (flag === '--base') out.base = value().replace(/\/+$/, '');
    else if (flag === '--routes') out.routes = value().split(',').map((r) => restoreGitBashRoute(r.trim())).filter(Boolean);
    else if (flag === '--widths') out.widths = value().split(',').map(Number);
    else if (flag === '--json') out.json = true;
    else if (flag === '--strict') out.strict = true;
    else if (flag === '--out') out.out = msysToNative(value());
    else if (flag === '--help' || flag === '-h') out.help = true;
    else throw Error('Unknown flag ' + flag);
  }
  if (out.help) return out;
  if (!out.base || !/^https?:\/\//.test(out.base)) throw Error('--base must be an http(s) origin');
  if (!out.routes.length) throw Error('--routes needs a comma-separated list such as /,/about');
  for (const route of out.routes) if (!route.startsWith('/')) throw Error(`Route "${route}" must start with "/" (in Git Bash set MSYS_NO_PATHCONV=1 if it was rewritten to a Windows path)`);
  if (out.widths.some((w) => !Number.isInteger(w) || w < 280 || w > 3840)) throw Error('--widths must be integers between 280 and 3840');
  return out;
}

/** Signature of a section for neighbour comparison: how it opens, what it holds, what it stands on. */
export function sectionSignature(section) {
  const opening = section.kicker ? 'kicker' : section.split ? 'split' : section.centered ? 'centred' : section.heading ? 'heading' : 'none';
  const kind = section.fullBleedMedia ? 'stage' : section.cardGrid ? 'cards' : section.list ? 'list' : section.mediaCount > 0 ? 'media' : 'text';
  return `${opening}|${kind}|${section.ground ? 'ground' : 'page'}`;
}

/** Findings for one page model, measured in the browser by measurePage(). Pure, so it is unit tested. */
export function assessComposition(model) {
  const findings = [];
  const sections = model.sections ?? [];
  const add = (code, message, detail = {}) => findings.push({ code, message, ...detail });
  const kickers = sections.filter((s) => s.kicker).length;
  if (kickers >= 3) add('kicker-openings', `${kickers} sections open with a small label above the heading. Keep labels for real metadata (a date, a count); let most headings stand alone.`, { count: kickers });
  const splits = sections.filter((s) => s.split).length;
  if (splits >= 3) add('split-openings', `${splits} sections open with the heading on one side and a lead beside it. Vary how sections open: a heading alone, a heading in the picture, or a list that explains itself.`, { count: splits });
  const grids = sections.filter((s) => s.cardGrid).length;
  if (grids >= 2) add('card-grids', `${grids} sections are grids of equal boxed items. Set lists as the objects they are (a ruled index, a programme, a register) and keep at most one card grid per page.`, { count: grids });
  for (let i = 1; i < sections.length; i++) {
    const a = sectionSignature(sections[i - 1]);
    const [opening, kind] = a.split('|');
    const structural = ['cards', 'media'].includes(kind) || ['kicker', 'split'].includes(opening);
    if (a === sectionSignature(sections[i]) && structural) add('repeated-neighbours', `Sections ${i} and ${i + 1} open, hold and stand the same way (${a.replaceAll('|', ', ')}). Change the width, the ground or the kind of content between neighbours.`, { at: i });
  }
  const photographic = sections.some((s) => s.mediaCount > 0) && model.imageCover >= 0.1;
  if (photographic && !sections.some((s) => s.fullBleedMedia)) add('no-full-width-media', 'The page has photographs but none spans the viewport. One photograph at full width (MediaStage) usually says more than many small ones.');
  const last = sections.at(-1);
  if (last && last.centered && last.action && last.ground && sections.length >= 4) add('closing-band', 'The page ends on a centred heading and button on a band of its own: the most common template ending. End on something that belongs to the subject, or a quieter, specific next step.');
  const statement = model.h2Max >= 2.5 * model.bodySize;
  if (!model.signature && !statement && !sections.some((s) => s.fullBleedMedia)) add('no-signature', 'Nothing on the page is larger or different in kind. Give the page one signature moment (a stage, a fitted line, an index with previews, a dated programme).');
  if (model.narrow && model.narrow.h1Bottom !== null && model.narrow.h1Bottom > model.narrow.viewportHeight) add('first-screen-heading', `At ${model.narrow.width}px the page heading starts below the first screen. Shorten the picture above it or move the heading onto it.`);
  return findings;
}

/** Runs in the page: reads the top-level sections of <main>. */
export function measurePage() {
  const vw = document.documentElement.clientWidth;
  const px = (el, prop) => parseFloat(getComputedStyle(el)[prop]) || 0;
  const visible = (el) => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0 && getComputedStyle(el).visibility !== 'hidden'; };
  const main = document.querySelector('main') ?? document.body;
  let sections = [...main.children].filter(visible);
  while (sections.length === 1 && sections[0].children.length > 1) sections = [...sections[0].children].filter(visible);
  const paragraphs = [...main.querySelectorAll('p')].filter(visible).map((p) => px(p, 'fontSize')).sort((a, b) => a - b);
  const bodySize = paragraphs[Math.floor(paragraphs.length / 2)] || 16;
  const boxed = (el) => {
    const s = getComputedStyle(el);
    const ground = s.backgroundColor !== 'rgba(0, 0, 0, 0)' && s.backgroundColor !== 'transparent';
    return ground || s.boxShadow !== 'none' || parseFloat(s.borderTopWidth) > 0 || el.querySelector('img');
  };
  const cardGridIn = (root) => [...root.querySelectorAll('*')].some((el) => {
    const kids = [...el.children].filter(visible);
    if (kids.length < 3) return false;
    const rects = kids.map((k) => k.getBoundingClientRect());
    const row = rects.filter((r) => Math.abs(r.top - rects[0].top) < 4);
    if (row.length < 3) return false;
    const w = row.map((r) => r.width);
    if (Math.max(...w) - Math.min(...w) > Math.max(...w) * 0.1 || Math.min(...w) > vw * 0.45) return false;
    return kids.slice(0, row.length).every((k) => k.getBoundingClientRect().height > 120 && boxed(k));
  });
  const records = sections.map((section) => {
    const heading = section.querySelector('h1, h2');
    const s = getComputedStyle(section);
    const ground = (s.backgroundColor !== 'rgba(0, 0, 0, 0)' && s.backgroundColor !== 'transparent') || s.backgroundImage !== 'none' || Boolean(section.querySelector(':scope > .is-bg'));
    let kicker = false;
    let split = false;
    let centered = false;
    if (heading && visible(heading)) {
      const before = heading.previousElementSibling ?? heading.parentElement?.previousElementSibling ?? null;
      if (before && visible(before)) {
        const b = getComputedStyle(before);
        const short = before.textContent.trim().length <= 48;
        const small = px(before, 'fontSize') <= bodySize * 0.95;
        const label = b.textTransform === 'uppercase' || parseFloat(b.letterSpacing) / px(before, 'fontSize') >= 0.05;
        kicker = short && small && label && !before.querySelector('a, button, img');
      }
      const hr = heading.getBoundingClientRect();
      const lead = [...section.querySelectorAll('p')].filter(visible).find((p) => !heading.contains(p) && p !== before);
      if (lead) {
        const lr = lead.getBoundingClientRect();
        split = lr.left >= hr.left + hr.width * 0.6 && lr.top < hr.bottom + 8 && lr.bottom > hr.top - 8;
      }
      centered = getComputedStyle(heading).textAlign === 'center';
    }
    const media = [...section.querySelectorAll('img, video, picture')].filter(visible).filter((m) => m.getBoundingClientRect().width >= 80);
    const sr = section.getBoundingClientRect();
    const fullBleedMedia = media.some((m) => m.getBoundingClientRect().width >= vw * 0.95) || (sr.width >= vw * 0.95 && s.backgroundImage !== 'none' && /url\(/.test(s.backgroundImage));
    const list = Boolean(section.querySelector('.index-list, ol[role="list"], table')) || [...section.querySelectorAll('ul, ol')].some((l) => l.children.length >= 4 && [...l.children].every((li) => li.getBoundingClientRect().width > sr.width * 0.6));
    return {
      tag: section.tagName.toLowerCase(),
      heading: heading ? heading.textContent.trim().slice(0, 60) : null,
      kicker, split, centered, ground,
      action: Boolean(section.querySelector('a.btn, button, [class*="button"], [class*="btn"]')),
      cardGrid: cardGridIn(section),
      list,
      mediaCount: media.length,
      fullBleedMedia,
      width: Math.round(sr.width),
    };
  });
  const sizes = (sel) => [...main.querySelectorAll(sel)].filter(visible).map((el) => px(el, 'fontSize'));
  let imageArea = 0;
  let fullWidth = 0;
  for (const m of main.querySelectorAll('img, video')) {
    const r = m.getBoundingClientRect();
    if (r.width < 40 || !visible(m)) continue;
    imageArea += r.width * r.height;
    if (r.width >= vw * 0.95) fullWidth++;
  }
  const h1 = main.querySelector('h1') ?? document.querySelector('h1');
  return {
    width: vw,
    bodySize,
    h1Size: h1 ? px(h1, 'fontSize') : 0,
    h2Max: Math.max(0, ...sizes('h2')),
    imageCover: +(imageArea / (vw * document.documentElement.scrollHeight)).toFixed(2),
    fullWidthMedia: fullWidth,
    signature: Boolean(main.querySelector('.display-fit, .media-stage, .index-list[data-preview], [data-shape]')),
    sections: records,
  };
}

export function formatRoute(route, model, findings) {
  const head = `${route}: h1 ${Math.round(model.h1Size)}px, largest h2 ${Math.round(model.h2Max)}px, body ${Math.round(model.bodySize)}px, image cover ${model.imageCover}, full-width media ${model.fullWidthMedia}, ${model.sections.length} sections`;
  if (!findings.length) return `${head}\n  no template signs found`;
  return [head, ...findings.map((f) => `  [${f.code}] ${f.message}`)].join('\n');
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) { console.log('Usage: npm run audit:composition -- --base <origin> --routes /,/about [--widths 1440,390] [--json] [--out file] [--strict]'); return; }
  // The same browser lookup as audit:ui: the site's own @playwright/test first, then Baseline's.
  let chromium;
  for (const base of [path.join(process.cwd(), 'package.json'), import.meta.url]) { try { ({ chromium } = createRequire(base)('@playwright/test')); break; } catch { /* try the next location */ } }
  if (!chromium) throw Error('audit:composition needs @playwright/test and an installed Chromium (npx playwright install chromium).');
  const browser = await chromium.launch();
  const wide = Math.max(...options.widths);
  const narrow = Math.min(...options.widths);
  const results = [];
  try {
    for (const route of options.routes) {
      const page = await browser.newPage({ viewport: { width: wide, height: 900 } });
      await page.goto(options.base + route, { waitUntil: 'networkidle' }).catch(() => page.waitForTimeout(3000));
      await page.emulateMedia({ reducedMotion: 'reduce' });
      const model = await page.evaluate(measurePage);
      await page.close();
      if (narrow !== wide) {
        const phone = await browser.newPage({ viewport: { width: narrow, height: 844 } });
        await phone.goto(options.base + route, { waitUntil: 'networkidle' }).catch(() => phone.waitForTimeout(3000));
        model.narrow = await phone.evaluate(() => { const h1 = document.querySelector('h1'); return { width: innerWidth, viewportHeight: innerHeight, h1Bottom: h1 ? Math.round(h1.getBoundingClientRect().top + Math.min(h1.getBoundingClientRect().height, 40)) : null }; });
        await phone.close();
      }
      const findings = assessComposition(model);
      results.push({ route, model, findings });
      if (!options.json) console.log(formatRoute(route, model, findings));
    }
  } finally {
    await browser.close();
  }
  const total = results.reduce((n, r) => n + r.findings.length, 0);
  if (options.json) console.log(JSON.stringify(results, null, 2));
  if (options.out) writeFileSync(options.out, JSON.stringify(results, null, 2));
  if (!options.json) console.log(`Composition audit (advisory): ${total} finding${total === 1 ? '' : 's'} on ${results.length} route${results.length === 1 ? '' : 's'}. See site-art-direction/references/distinctive-direction.md.`);
  if (options.strict && total) process.exitCode = 1;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) main().catch((error) => { console.error(error.message); process.exitCode = 1; });
