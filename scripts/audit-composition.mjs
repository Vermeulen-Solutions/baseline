#!/usr/bin/env node
// Composition audit: does a rendered page read as a template, and is the recorded world built?
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
// - split-hero: the page opens with its heading beside a photograph narrower than 60% of the screen;
// - uniform-gallery: six or more pictures in equal frames in one grid, none larger than the rest;
// - no-signature: nothing on the page is larger or different in kind (no stage, fitted line or
//   index with previews, and no heading markedly larger than the page's other headings, such as
//   an opening line at least twice their size);
// - first-screen-heading (narrowest width): the page's h1 is not on the first screen;
// - bare-page: the page is made only of type, photographs and rules. Three or more of five things
//   from a made world are missing: a surface (a textured or patterned ground, an edge), drawn objects
//   (three or more SVG or canvas drawings at least 32px), three type voices, depth (a rotated or
//   masked object) and motion (an animation running after a scroll). Measured on studio-built sites
//   for comparable trades, all five are present; on bare trial builds, four were missing.
// - soft-photo: a photograph at least 40% of the screen wide is shown wider than its pixels (a phone
//   photograph stretched across a desktop). Owners' photographs are often 600 to 1,500px wide; a
//   trial home page opened on one at 1,440px and every reviewer named it as the design's ceiling;
// - world-motion (once per run): an animation the Art Direction Record names in World › Motion
//   (`stamp-lands`) never ran on the audited routes while scrolling. Read from AGENTS.md in the
//   working directory, or --record <file>.
// It also prints the measurements behind them: largest h1 and h2, body size, image cover and
// full-width media count. bare-page, soft-photo and world-motion are the floor: each says the
// recorded world is missing from the built page, so the command exits 1 on them. The other
// findings are advisory prompts for the site-art-direction skill's distinctive-direction steps,
// not a design verdict, and fail only with --strict.
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { msysToNative, restoreGitBashRoute } from './capture-routes.mjs';
import { worldMotionNames } from './check-art-direction.mjs';

/** Findings that fail the run: the recorded world is missing from the built page. */
export const FLOOR = Object.freeze(['bare-page', 'soft-photo', 'world-motion']);

export function parseArgs(argv) {
  const out = { routes: [], widths: [1440, 390], json: false, strict: false, out: null, base: null, record: null };
  for (let i = 0; i < argv.length; i++) {
    const flag = argv[i];
    const value = () => { const v = argv[++i]; if (v === undefined || v.startsWith('--')) throw Error('Missing value for ' + flag); return v; };
    if (flag === '--base') out.base = value().replace(/\/+$/, '');
    else if (flag === '--routes') out.routes = value().split(',').map((r) => restoreGitBashRoute(r.trim())).filter(Boolean);
    else if (flag === '--widths') out.widths = value().split(',').map(Number);
    else if (flag === '--json') out.json = true;
    else if (flag === '--strict') out.strict = true;
    else if (flag === '--out') out.out = msysToNative(value());
    else if (flag === '--record') out.record = msysToNative(value());
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
/** Which of the five ingredients of a made world a page lacks (see the bare-page note above). */
export function bareIngredients(craft) {
  const missing = [];
  if (!(craft.surfaces >= 1)) missing.push('surface');
  if (!(craft.drawn >= 3)) missing.push('drawn objects');
  if (!(craft.voices >= 3)) missing.push('three type voices');
  if (!(craft.rotated >= 1 || craft.masked >= 1)) missing.push('depth');
  if (!(craft.motion >= 1)) missing.push('motion');
  return missing;
}

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
  if (model.splitHero) add('split-hero', 'The page opens with its heading beside a photograph: the opening of the template, however good the photograph. Put the words on the picture (MediaStage), let one line carry the first screen, or open with the content itself.');
  if (model.uniformGallery) add('uniform-gallery', `${model.uniformGallery} photographs sit in a grid of equal frames with none larger: a card grid without the borders. Show a few large and the rest as an index (IndexList preview), or vary the sizes by importance.`, { count: model.uniformGallery });
  // A statement is a heading markedly larger than the page's other headings, not one of many large ones.
  const statement = (model.h2Max >= 2.5 * model.bodySize && model.h2Max >= 1.6 * (model.h2Median || model.h2Max))
    || (model.h1Size >= 5 * model.bodySize && model.h1Size >= 2 * (model.h2Median || model.h1Size));
  if (!model.signature && !statement && !sections.some((s) => s.fullBleedMedia)) add('no-signature', 'Nothing on the page is larger or different in kind from the rest. Give the page one signature moment: a stage, a fitted line, an index that previews what it lists, a programme with dates set very large.');
  if (model.craft) {
    const missing = bareIngredients(model.craft);
    if (missing.length >= 3) add('bare-page', `The page is made only of type, photographs and rules: no ${missing.join(', no ')}. Build each section as an object from the site's world, on a surface from its materials, with its type treatment and named motions (site-art-direction/references/world-building.md).`, { missing });
  }
  for (const photo of model.softPhotos ?? []) add('soft-photo', `A photograph is shown ${photo.shown}px wide from ${photo.natural}px (${photo.src}). Show it at its own size or smaller in an object from the world (a plate, a frame, a detail crop), and let the world carry the width (site-art-direction/references/world-building.md).`, photo);
  if (model.narrow && model.narrow.h1Bottom !== null && model.narrow.h1Bottom > model.narrow.viewportHeight) add('first-screen-heading', `At ${model.narrow.width}px the page heading starts below the first screen. Shorten the picture above it or move the heading onto it.`);
  return findings;
}

/** Wide photographs shown at more than their pixels: `natural` is the file's own width, `dpr` the device pixel ratio. */
export function softPhotos(images, dpr = 1) {
  return images
    .filter((p) => p.natural > 0 && p.natural < p.shown * dpr * 0.9)
    .map((p) => ({ shown: p.shown, natural: p.natural, src: p.url.split('?')[0].split('/').pop() }));
}

/** The record's named motions that never ran on any audited route (null when all ran or none are named). */
export function assessWorldMotion(named, ran) {
  const seen = new Set(ran);
  const missing = named.filter((name) => !seen.has(name));
  if (!missing.length) return null;
  return { code: 'world-motion', missing, message: `The Art Direction Record names ${missing.map((n) => `\`${n}\``).join(', ')} in World › Motion, and ${missing.length === 1 ? 'it never ran' : 'none of them ran'} on these routes while scrolling. Build each on the object it belongs to as a CSS animation of that name (with prefers-reduced-motion: no-preference), or correct the record.` };
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
  // Split hero: the first section holds the h1 and its largest picture beside it, narrower than 60%.
  let splitHero = false;
  const first = sections[0];
  if (first && h1 && first.contains(h1)) {
    const hr = h1.getBoundingClientRect();
    const pictures = [...first.querySelectorAll('img, video')].filter(visible).map((m) => m.getBoundingClientRect()).sort((a, b) => b.width * b.height - a.width * a.height);
    const pic = pictures[0];
    if (pic && pic.width < vw * 0.6 && pic.width > vw * 0.2) splitHero = (pic.left >= hr.right - 8 || pic.right <= hr.left + 8) && pic.top < hr.bottom + 200 && pic.bottom > hr.top;
  }
  // Uniform gallery: six or more pictures in equal frames in one grid, none at least 1.5 times larger.
  let uniformGallery = 0;
  for (const el of main.querySelectorAll('*')) {
    const kids = [...el.children].filter(visible).filter((k) => k.querySelector('img'));
    if (kids.length < 6) continue;
    const boxes = kids.map((k) => k.querySelector('img').getBoundingClientRect()).filter((r) => r.width >= 80);
    if (boxes.length < 6) continue;
    const areas = boxes.map((r) => r.width * r.height);
    const widths = boxes.map((r) => r.width);
    if (Math.max(...widths) - Math.min(...widths) <= Math.max(...widths) * 0.06 && Math.max(...areas) < 1.5 * Math.min(...areas)) uniformGallery = Math.max(uniformGallery, boxes.length);
  }
  // Wide photographs; main() loads each chosen file on its own to read its real pixel width
  // (with a srcset, naturalWidth is scaled by the candidate's density and hides the stretch).
  const wideImages = [...main.querySelectorAll('img')].filter(visible)
    .map((img) => ({ shown: Math.round(img.getBoundingClientRect().width), url: img.currentSrc || img.src || '' }))
    .filter((p) => p.url && !/\.svg(\?|$)/i.test(p.url) && p.shown >= vw * 0.4);
  const h2Sizes = sizes('h2').sort((a, b) => a - b);
  return {
    wideImages,
    splitHero,
    uniformGallery,
    h2Median: h2Sizes.length ? h2Sizes[Math.floor(h2Sizes.length / 2)] : 0,
    width: vw,
    bodySize,
    h1Size: h1 ? px(h1, 'fontSize') : 0,
    h2Max: Math.max(0, ...sizes('h2')),
    imageCover: +(imageArea / (vw * document.documentElement.scrollHeight)).toFixed(2),
    fullWidthMedia: fullWidth,
    signature: Boolean(main.querySelector('.display-fit, .media-stage, .index-list[data-preview]')),
    craft: (() => {
      const all = [...document.body.querySelectorAll('*')].filter(visible);
      const size = (el, w, h) => { const r = el.getBoundingClientRect(); return r.width >= w && r.height >= h; };
      const families = {};
      for (const el of all) {
        if (![...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())) continue;
        const family = getComputedStyle(el).fontFamily.split(',')[0].replace(/["']/g, '').trim();
        families[family] = (families[family] || 0) + 1;
      }
      let surfaces = 0;
      let drawn = 0;
      let rotated = 0;
      let masked = 0;
      for (const el of all) {
        const s = getComputedStyle(el);
        const pseudo = ['::before', '::after'].some((p) => getComputedStyle(el, p).backgroundImage !== 'none');
        if (size(el, 120, 40) && (s.backgroundImage !== 'none' || pseudo)) surfaces++;
        if ((el.tagName.toLowerCase() === 'svg' || el.tagName === 'CANVAS') && size(el, 32, 32)) drawn++;
        const matrix = s.transform.match(/^matrix\(([^,]+),\s*([^,]+)/);
        if (matrix && Math.abs(parseFloat(matrix[2])) > 0.005 && size(el, 16, 16)) rotated++;
        const mask = (s.maskImage && s.maskImage !== 'none') || (s.webkitMaskImage && s.webkitMaskImage !== 'none') || s.clipPath !== 'none';
        if (mask && size(el, 40, 40)) masked++;
      }
      const voices = Object.values(families).filter((n) => n >= 3).length;
      return { elements: all.length, voices, surfaces, drawn, rotated, masked, motion: 0 };
    })(),
    sections: records,
  };
}

export function formatRoute(route, model, findings) {
  const head = `${route}: h1 ${Math.round(model.h1Size)}px, largest h2 ${Math.round(model.h2Max)}px, body ${Math.round(model.bodySize)}px, image cover ${model.imageCover}, full-width media ${model.fullWidthMedia}, ${model.sections.length} sections`
    + (model.craft ? `; ${model.craft.elements} elements, ${model.craft.voices} type voices, ${model.craft.surfaces} surfaces, ${model.craft.drawn} drawings, ${model.craft.rotated + model.craft.masked} rotated or masked, ${model.craft.motion} animations` : '');
  if (!findings.length) return `${head}\n  no template signs found`;
  return [head, ...findings.map((f) => `  [${f.code}] ${f.message}`)].join('\n');
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) { console.log('Usage: npm run audit:composition -- --base <origin> --routes /,/about [--widths 1440,390] [--record AGENTS.md] [--json] [--out file] [--strict]'); return; }
  const recordFile = options.record ?? (existsSync('AGENTS.md') ? 'AGENTS.md' : null);
  if (options.record && !existsSync(options.record)) throw Error(`--record file not found: ${options.record}`);
  const named = recordFile ? worldMotionNames(readFileSync(recordFile, 'utf8')) : [];
  const ran = new Set();
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
      // Motion first, with motion allowed: the most animations running while the visitor scrolls through.
      const motion = await page.evaluate(async () => {
        const height = document.documentElement.scrollHeight;
        let most = 0;
        const names = new Set();
        for (let y = 0; y < height; y += 600) {
          scrollTo(0, y);
          await new Promise((resolve) => setTimeout(resolve, 100));
          const running = document.getAnimations();
          most = Math.max(most, running.length);
          for (const animation of running) if (animation.animationName || animation.id) names.add(animation.animationName || animation.id);
        }
        scrollTo(0, 0);
        return { most, names: [...names] };
      });
      for (const name of motion.names) ran.add(name);
      await page.emulateMedia({ reducedMotion: 'reduce' });
      const model = await page.evaluate(measurePage);
      model.craft.motion = motion.most;
      model.craft.motionNames = motion.names;
      const measured = await page.evaluate(async (images) => Promise.all(images.map((p) => new Promise((resolve) => {
        const probe = new Image();
        probe.onload = () => resolve({ ...p, natural: probe.naturalWidth });
        probe.onerror = () => resolve({ ...p, natural: 0 });
        probe.src = p.url;
      }))), model.wideImages);
      model.softPhotos = softPhotos(measured, await page.evaluate(() => devicePixelRatio));
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
  const worldMotion = assessWorldMotion(named, ran);
  const all = results.flatMap((r) => r.findings).concat(worldMotion ? [worldMotion] : []);
  const floor = all.filter((f) => FLOOR.includes(f.code)).length;
  const advisory = all.length - floor;
  const report = { routes: results, site: worldMotion ? [worldMotion] : [], named };
  if (options.json) console.log(JSON.stringify(report, null, 2));
  if (options.out) writeFileSync(options.out, JSON.stringify(report, null, 2));
  if (!options.json) {
    if (worldMotion) console.log(`[world-motion] ${worldMotion.message}`);
    else if (named.length) console.log(`World › Motion: ${named.map((n) => `\`${n}\``).join(', ')} ran.`);
    console.log(`Composition audit: ${floor} floor finding${floor === 1 ? '' : 's'} (bare-page, soft-photo, world-motion: fix them), ${advisory} advisory, on ${results.length} route${results.length === 1 ? '' : 's'}. See site-art-direction/references/world-building.md and distinctive-direction.md.`);
  }
  if (floor || (options.strict && advisory)) process.exitCode = 1;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) main().catch((error) => { console.error(error.message); process.exitCode = 1; });
