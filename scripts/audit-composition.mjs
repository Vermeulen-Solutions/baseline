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
// - repeated-run: four or more sections in a row are built the same way whatever their grounds, or four
//   or more neighbouring tall items inside one section are laid out the same way (picture size and
//   placement, ground; a mirror image counts as the same): a register of twelve works as twelve blocks;
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
// - bare-page: the page is made only of type, photographs and rules. Three or more of four things
//   from a made world are missing: a surface (a textured or patterned ground, an edge), drawn objects
//   (three or more SVG or canvas drawings at least 32px), depth (a rotated or masked object) and motion
//   (an animation running after a scroll). The number of type voices was a fifth and is no longer
//   counted: on 95 public pages ranked by professional designers it did not move with their votes, and
//   four of six designer-made pages had fewer than three.
// - kicker-openings and accent-word are floor findings for a direction made with sources (a record
//   with a World › Sources line) and advisories for older sites: on the same 95 pages no designer-made
//   page had a small label above three section headings or one italic word in its headline, every one
//   of the best-ranked generated pages had the first and a third had the second.
//   A label counts in capitals or tracked small type, and also as a line of a few words under half the
//   heading's size in lower case or a handwritten face (found on a trial site: five chalk labels above
//   five headings passed the first rule). The wider rule gives the same shares on the 95 pages.
// - text-collision (floor under the same rule): one line of text lies over another, at the wide width,
//   at the narrow width or at three depths of the first pinned scene. Lines are read from the page's
//   text nodes, trimmed to their letters and cut to the frames that clip them; faint text (under 0.6),
//   text in a fixed layer, in a turned object, on a path, or printed twice in one place is left out.
//   Found on trial sites: a dial's caption printed across its number, a scene's two steps on screen at
//   once. On 43 earlier trial sites it reports five places.
// - text-cut, text-squeezed, text-tiny, text-unreadable (floor under the same rule), at the wide and the
//   narrow width: a line cut off by a frame or the edge of the screen (a tenth of its width or more; not a
//   strip made to move, an ellipsis, or a word over 72px); one run of text wrapped onto three lines or
//   more of under eight characters; text painted under 9px; a line that would stand out from the picture
//   behind it by less than 2 to 1 (large type) or 3 to 1 over 30% of its box, read from screenshots taken
//   with the text unpainted, with and without its shadows. Found on scored trial sites: date cards a few
//   letters wide on a phone, a ticket wider than the phone, a plan's labels at 5px, a caption in white
//   script over white flowers. Scored by eye, craft was the lowest of six questions in every round.
// - soft-photo: a photograph at least 40% of the screen wide is shown wider than its pixels (a phone
//   photograph stretched across a desktop). Owners' photographs are often 600 to 1,500px wide; a
//   trial home page opened on one at 1,440px and every reviewer named it as the design's ceiling;
// - world-motion (once per run): an animation the Art Direction Record names in World › Motion
//   (its @keyframes name) never ran on the audited routes while scrolling. Read from AGENTS.md in the
//   working directory, or --record <file>.
// - with --references <references.md>: each selected reference's live page is measured the same way
//   (at the wide width, consent declined) and every route is printed beside the references' median on
//   drawn objects, running animations, rotated or masked objects, surfaces, colours, type sizes and
//   elements, and the studio level (STUDIO_LEVEL), with an arrow where the page has under half of the
//   higher. Advisory: the Stage 5 comparison reads it.
// It also prints the measurements behind them: largest h1 and h2, body size, image cover and
// full-width media count. bare-page, soft-photo and world-motion are the floor: each says the
// recorded world is missing from the built page, so the command exits 1 on them. The other
// findings are advisory prompts for the site-art-direction skill's distinctive-direction steps,
// not a design verdict, and fail only with --strict.
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { DECLINE, isBotWall, msysToNative, restoreGitBashRoute } from './capture-routes.mjs';
import { motionTier, worldMotionNames, worldSources } from './check-art-direction.mjs';

/** Findings that fail the run: the recorded world is missing from the built page. */
export const FLOOR = Object.freeze(['bare-page', 'soft-photo', 'world-motion', 'impression-motion']);
/** Floor findings for a direction made with sources (its record has a World › Sources line); advisories on older sites. */
export const SOURCED_FLOOR = Object.freeze(['kicker-openings', 'accent-word', 'text-collision', 'text-cut', 'text-squeezed', 'text-tiny', 'text-unreadable']);
export const floorCodes = (sourced) => (sourced ? [...FLOOR, ...SOURCED_FLOOR] : [...FLOOR]);

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
    else if (flag === '--references') out.references = msysToNative(value());
    else if (flag === '--refresh-references') out.refreshReferences = true;
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
  if (!(craft.rotated >= 1 || craft.masked >= 1)) missing.push('depth');
  if (!(craft.motion >= 1)) missing.push('motion');
  return missing;
}

/**
 * How a tall item is laid out, for comparing neighbours: its component, its picture's share of its width
 * (in fifths), picture beside or above the text, one, two or more pictures, and its ground. A mirror image
 * (picture left, then right) is the same layout. A trial's register of works in five arrangements on three
 * grounds was reported as "7 tall items the same way" when items were compared by tag and class only.
 */
export function itemLayoutKey(item) {
  if (!item) return null;
  return [item.tag, item.cls, Math.round(item.share * 5), Math.min(item.pictures, 3), item.beside ? 'beside' : 'stacked', item.ground].join('|');
}

/** The longest run of neighbouring items laid out the same way, over a section's rows of items. */
export function longestItemRun(rows = []) {
  let longest = 0;
  for (const row of rows ?? []) {
    let n = 0, last = null;
    for (const item of row) { const k = itemLayoutKey(item); n = k && k === last ? n + 1 : (k ? 1 : 0); last = k; longest = Math.max(longest, n); }
  }
  return longest;
}

export function assessComposition(model) {
  const findings = [];
  const sections = model.sections ?? [];
  const add = (code, message, detail = {}) => findings.push({ code, message, ...detail });
  const kickers = sections.filter((s) => s.kicker).length;
  if (kickers >= 3) add('kicker-openings', `${kickers} sections open with a small label above the heading. Remove the labels: a heading says what its section is. Keep a small line above a heading only where it is a fact the visitor needs (a date, a price, a count), on at most two sections.`, { count: kickers });
  if (model.accentWord) add('accent-word', `The page heading sets one word or phrase in italics for emphasis ("${model.accentWord}"). Set the heading in one style, and let its words carry the emphasis.`);
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
  // A run of four or more sections built the same way reads as one template repeated, even when the
  // grounds alternate (a register of twelve works as twelve identical sections).
  let run = 1;
  for (let i = 1; i <= sections.length; i++) {
    const same = i < sections.length && sectionSignature(sections[i]).split('|').slice(0, 2).join('|') === sectionSignature(sections[i - 1]).split('|').slice(0, 2).join('|');
    if (same) { run++; continue; }
    if (run >= 4) add('repeated-run', `Sections ${i - run + 1} to ${i} are ${run} in a row built the same way (${sectionSignature(sections[i - 1]).split('|').slice(0, 2).join(', ')}), whatever their grounds. Set a run of like items as one object (a register, a woodpile, a wall of plates, an index) with one or two shown large, not as a section each.`, { count: run });
    run = 1;
  }
  for (const [i, section] of sections.entries()) if (section.itemRun >= 4) add('repeated-run', `Section ${i + 1} sets ${section.itemRun} tall items one after another the same way (the same picture size and placement on the same ground). Set the run as one object (a register, a woodpile, a wall of plates, an index) with one or two shown large, and vary scale, arrangement or ground between neighbours; mirroring the picture alone does not count.`, { count: section.itemRun, at: i + 1 });
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
  const places = [
    ...(model.collisions ?? []).map((p) => ({ ...p, where: `at ${model.width ?? 'the wide'}${model.width ? 'px' : ' width'}` })),
    ...(model.narrow?.collisions ?? []).map((p) => ({ ...p, where: `at ${model.narrow.width}px` })),
    ...(model.impression?.sceneCollisions ?? []).filter((p) => !(model.collisions ?? []).some((q) => q.over === p.over && q.under === p.under)).map((p) => ({ ...p, where: 'in the pinned scene' })),
  ];
  if (places.length) add('text-collision', `${places.length} place${places.length === 1 ? '' : 's'} where one line of text lies over another: ${places.slice(0, 4).map((p) => `"${p.over}" over "${p.under}" ${p.where}`).join('; ')}${places.length > 4 ? '; and more' : ''}. Give each line its own space: make the object larger, shorten the words or move one line. In a pinned scene, one step's words are gone before the next step's arrive.`, { count: places.length, places: places.slice(0, 12) });
  for (const [code, key, say] of LEGIBILITY) {
    const at = [[model.legibility?.[key], model.width], [model.narrow?.legibility?.[key], model.narrow?.width]].filter(([list]) => list?.length);
    const count = at.reduce((sum, [list]) => sum + list.length, 0);
    if (count) add(code, say(count, at.map(([list, width]) => `at ${width}px ${list.slice(0, 3).map(LEGIBILITY_EXAMPLE[key]).join(', ')}${list.length > 3 ? ' and more' : ''}`).join('; ')), { count, places: at.flatMap(([list, width]) => list.slice(0, 8).map((p) => ({ ...p, width }))) });
  }
  if (model.narrow && model.narrow.h1Bottom !== null && model.narrow.h1Bottom > model.narrow.viewportHeight) add('first-screen-heading', `At ${model.narrow.width}px the page heading starts below the first screen. Shorten the picture above it or move the heading onto it.`);
  return findings;
}

const LEGIBILITY_EXAMPLE = {
  cut: (p) => `"${p.text}" (${Math.round(p.lost * 100)}% cut off)`,
  squeezed: (p) => `"${p.text}" (${p.lines} lines of ${p.perLine} characters)`,
  tiny: (p) => `"${p.text}" (${p.size}px)`,
  unreadable: (p) => `"${p.text}"`,
};
const plural = (count, one, many) => `${count} ${count === 1 ? one : many}`;
const LEGIBILITY = [
  ['text-cut', 'cut', (count, where) => `${plural(count, 'line of text is', 'lines of text are')} cut off by a frame or the edge of the screen: ${where}. Make the words fit: a smaller size, fewer words, a wider frame, or let the line wrap.`],
  ['text-squeezed', 'squeezed', (count, where) => `${plural(count, 'run of text stands', 'runs of text stand')} in a column a few letters wide: ${where}. Give the text the width: stack the objects one under another at this size instead of side by side, or set the label above its value.`],
  ['text-tiny', 'tiny', (count, where) => `${plural(count, 'line of text is', 'lines of text are')} painted under 9px: ${where}. Set no text under 11px. Where a drawing is scaled down for this width its labels shrink with it: set the labels in HTML over the drawing, make the drawing larger, or show fewer labels.`],
  ['text-unreadable', 'unreadable', (count, where) => `${plural(count, 'line of text cannot', 'lines of text cannot')} be told from the picture behind: ${where}. Put a ground under the words (a plate, a band, a darkened part of the picture), move them to a calm part of the picture, or change their colour.`],
];

/**
 * In the page: every painted line of text as a box in page coordinates, with how solid it is painted.
 * A line is one line of a text node (or one SVG text element), trimmed to about where its letters are,
 * cut to the frames that clip it. Text in a fixed layer (a header that rides over the page) is left out;
 * text in a turned object is marked `turned` (its boxes are wider and taller than its letters).
 * `viewportOnly` keeps the lines on screen, for a look at one scroll position, and leaves out a sticky bar.
 */
export function textBoxes({ viewportOnly = false } = {}) {
  const alphaOf = (color) => {
    const slash = /\/\s*([\d.]+%?)\s*\)/.exec(color);
    if (slash) return slash[1].endsWith('%') ? parseFloat(slash[1]) / 100 : parseFloat(slash[1]);
    const legacy = /^rgba\((?:[^,]+,){3}\s*([\d.]+)\s*\)/.exec(color);
    return legacy ? parseFloat(legacy[1]) : 1;
  };
  const cut = (a, b) => ({ left: Math.max(a.left, b.left), top: Math.max(a.top, b.top), right: Math.min(a.right, b.right), bottom: Math.min(a.bottom, b.bottom) });
  const open = { left: -Infinity, top: -Infinity, right: Infinity, bottom: Infinity };
  const known = new Map();
  // What an element inherits from its frames: opacity, the clipping box, a fixed layer, an unknown clip.
  const frame = (el) => {
    if (!el || el.nodeType !== 1) return { opacity: 1, clip: open, fixed: false, bar: false, turned: false, unknown: false, scale: 1, strip: false, trimmed: false, blend: false };
    if (known.has(el)) return known.get(el);
    const up = frame(el.parentElement);
    const s = getComputedStyle(el);
    let clip = up.clip;
    let unknown = up.unknown;
    if (s.overflowX !== 'visible' || s.overflowY !== 'visible') clip = cut(clip, el.getBoundingClientRect());
    // Letters mixed into what is behind them (mix-blend-mode) are not painted in their own colour: no colour to hold against the ground.
    // A strip made to move sideways (a scroller, a slider, a ticker) cuts its text on purpose; so does an ellipsis.
    const strip = up.strip || s.overflowX === 'auto' || s.overflowX === 'scroll' || (s.overflowX !== 'visible' && el.scrollWidth > el.clientWidth * 1.5);
    const trimmed = up.trimmed || s.textOverflow === 'ellipsis' || (s.webkitLineClamp && s.webkitLineClamp !== 'none');
    if (s.clipPath !== 'none') {
      const inset = /^inset\(([^)]*)\)/.exec(s.clipPath);
      const parts = inset ? inset[1].split(/\s+round\s+/)[0].trim().split(/\s+/) : null;
      if (parts && parts.every((p) => /^-?[\d.]+(px|%)$/.test(p))) {
        const r = el.getBoundingClientRect();
        const [t, rt = t, b = t, l = rt] = parts;
        const len = (v, size) => (v.endsWith('%') ? (parseFloat(v) / 100) * size : parseFloat(v));
        clip = cut(clip, { left: r.left + len(l, r.width), top: r.top + len(t, r.height), right: r.right - len(rt, r.width), bottom: r.bottom - len(b, r.height) });
      } else unknown = true;
    }
    // A sticky bar (a header that stays at the top) rides over the page once it is scrolled; a sticky stage is a scene.
    const bar = up.bar || (s.position === 'sticky' && el.getBoundingClientRect().height < innerHeight * 0.4);
    // A turned object (a stamp, a card set at an angle) has boxes wider and taller than its letters: its text is left out.
    const matrix = /^matrix(?:3d)?\(([^)]+)\)/.exec(s.transform)?.[1].split(',').map(Number);
    const angle = matrix ? Math.abs(Math.atan2(matrix[1], matrix[0]) * 180 / Math.PI) : 0;
    const turned = up.turned || angle > 0.5 || (s.rotate && s.rotate !== 'none' && parseFloat(s.rotate) !== 0);
    const scale = up.scale * (matrix ? Math.hypot(matrix[0], matrix[1]) : 1);
    const out = { opacity: up.opacity * parseFloat(s.opacity), clip, fixed: up.fixed || s.position === 'fixed', bar, turned, unknown, scale, strip, trimmed, blend: up.blend || (s.mixBlendMode && s.mixBlendMode !== 'normal') };
    known.set(el, out);
    return out;
  };
  // A colour in whatever notation the page uses (rgb, oklch, color-mix), as the three numbers it is painted with.
  const swatch = document.createElement('canvas').getContext('2d', { willReadFrequently: true });
  const painted = new Map();
  const rgbOf = (color) => {
    if (!painted.has(color)) {
      let rgb = null;
      if (swatch) {
        swatch.clearRect(0, 0, 1, 1);
        swatch.fillStyle = '#000';
        swatch.fillStyle = color;
        swatch.fillRect(0, 0, 1, 1);
        const [r, g, b, a] = swatch.getImageData(0, 0, 1, 1).data;
        // Read back unmultiplied; a colour painted fully see-through has no numbers to give.
        rgb = a ? [r, g, b] : null;
      }
      painted.set(color, rgb);
    }
    return painted.get(color);
  };
  const elements = [];
  const boxes = [];
  let nodes = 0;
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const range = document.createRange();
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const text = node.textContent.replace(/\s+/g, ' ').trim();
    const el = node.parentElement;
    // Text set on a path (a round stamp) has a box as large as the whole path, with room inside for other words.
    if (!text || !el || el.closest('script, style, noscript, template, option, textPath')) continue;
    const s = getComputedStyle(el);
    // A closed <details> keeps its content laid out but unpainted (content-visibility), which checkVisibility knows.
    if (s.visibility !== 'visible' || el.checkVisibility?.({ visibilityProperty: true }) === false) continue;
    const f = frame(el);
    if (f.fixed || f.unknown || (viewportOnly && f.bar)) continue;
    const fill = s.fill && el.namespaceURI === 'http://www.w3.org/2000/svg' ? s.fill : s.color;
    const alpha = f.opacity * alphaOf(fill);
    let index = elements.indexOf(el);
    if (index === -1) index = elements.push(el) - 1;
    const svg = el.namespaceURI === 'http://www.w3.org/2000/svg';
    range.selectNodeContents(node);
    const rects = svg ? [el.getBoundingClientRect()] : [...range.getClientRects()];
    // The size the letters are painted at: a drawing scaled down takes its labels with it.
    const ctm = svg ? el.getScreenCTM?.() : null;
    const size = Math.round(parseFloat(s.fontSize) * (ctm ? Math.hypot(ctm.a, ctm.b) : f.scale) * 10) / 10;
    const upright = svg || s.writingMode === 'horizontal-tb';
    const id = nodes++;
    for (const r of rects) {
      // The letters sit in the middle of a line's box: leave out the space above capitals and below the baseline.
      const lettered = svg ? { left: r.left, top: r.top + r.height * 0.15, right: r.right, bottom: r.bottom - r.height * 0.15 } : { left: r.left, top: r.top + r.height * 0.2, right: r.right, bottom: r.bottom - r.height * 0.18 };
      const shown = cut(lettered, f.clip);
      const w = shown.right - shown.left;
      const h = shown.bottom - shown.top;
      if (w < 4 || h < 4) continue;
      if (viewportOnly && (shown.bottom < 0 || shown.top > innerHeight || shown.right < 0 || shown.left > innerWidth)) continue;
      // How much of the line's width a frame or the edge of the screen cuts away (not a strip made to move, not an ellipsis).
      const seen = Math.min(shown.right, innerWidth) - Math.max(shown.left, 0);
      const lost = f.strip || f.trimmed || f.turned || !upright || r.width < 1 ? 0 : Math.round(100 * Math.max(0, 1 - seen / r.width)) / 100;
      boxes.push({ el: index, node: id, chars: text.length, text: text.slice(0, 40), x: Math.round(shown.left + scrollX), y: Math.round(shown.top + scrollY), w: Math.round(w), h: Math.round(h), alpha: Math.round(alpha * 100) / 100, size, lost, upright, turned: f.turned, rgb: f.blend ? null : rgbOf(fill) });
    }
  }
  // Which lines belong to an element inside another element that also has lines (a link in a paragraph).
  const inside = elements.map((el) => elements.map((other, i) => (other !== el && other.contains(el) ? i : -1)).filter((i) => i >= 0));
  return boxes.map((box) => ({ ...box, inside: inside[box.el] }));
}

/**
 * Pairs of text lines that lie over one another: both painted solid (alpha 0.6 or more; a ghost word
 * behind a heading is not), from different elements neither of which is inside the other, sharing at
 * least 8px of width and 40% of the lower line's letter height. One pair per two elements.
 */
export function collidingText(boxes = [], { minAlpha = 0.6 } = {}) {
  const solid = boxes.filter((b) => b.alpha >= minAlpha && !b.turned).sort((a, b) => a.y - b.y);
  const pairs = [];
  const seen = new Set();
  for (let i = 0; i < solid.length; i++) {
    const a = solid[i];
    for (let j = i + 1; j < solid.length; j++) {
      const b = solid[j];
      if (b.y >= a.y + a.h) break;
      // The same words printed twice in one place are one line with a second impression (an offset shadow, an outline).
      if (a.el === b.el || a.text === b.text || a.inside?.includes(b.el) || b.inside?.includes(a.el)) continue;
      const w = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
      const h = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
      if (w < 8 || h < Math.min(a.h, b.h) * 0.4) continue;
      const key = a.el < b.el ? `${a.el}:${b.el}` : `${b.el}:${a.el}`;
      if (seen.has(key)) continue;
      seen.add(key);
      pairs.push({ over: a.text, under: b.text, y: Math.max(a.y, b.y) });
    }
  }
  return pairs;
}

const solidLines = (boxes, minAlpha) => boxes.filter((b) => b.alpha >= minAlpha && b.upright !== false);
const oncePerNode = (boxes) => { const seen = new Set(); return boxes.filter((b) => !seen.has(b.node) && seen.add(b.node)); };

/**
 * Lines of text that a frame or the edge of the screen cuts off: solid, up to 72px (a word set larger may
 * bleed off the page on purpose), losing a tenth of their width and 6px or more while part of them shows.
 */
export function cutText(boxes = [], { minAlpha = 0.6, maxSize = 72 } = {}) {
  return oncePerNode(solidLines(boxes, minAlpha).filter((b) => b.size <= maxSize && b.lost >= 0.1 && b.lost < 0.9 && (b.w * b.lost) / (1 - b.lost) >= 6))
    .map((b) => ({ text: b.text, lost: b.lost, y: b.y }));
}

/**
 * Text squeezed into a column a few letters wide: one run of text, up to 32px, that wraps onto three lines
 * or more with under eight characters a line. Lines broken on purpose are separate runs and do not count.
 */
export function squeezedText(boxes = [], { minAlpha = 0.6, maxSize = 32 } = {}) {
  const runs = new Map();
  for (const b of solidLines(boxes, minAlpha)) {
    if (b.size > maxSize) continue;
    const run = runs.get(b.node) ?? { text: b.text, chars: b.chars, y: b.y, tops: new Set() };
    run.tops.add(b.y);
    runs.set(b.node, run);
  }
  return [...runs.values()].filter((run) => run.tops.size >= 3 && run.chars / run.tops.size < 8)
    .map((run) => ({ text: run.text, lines: run.tops.size, perLine: Math.round(10 * run.chars / run.tops.size) / 10, y: run.y }));
}

/** Text painted under 9px: three letters or more, solid. A drawing scaled down for a phone takes its labels with it. */
export function tinyText(boxes = [], { minAlpha = 0.6, minSize = 9 } = {}) {
  return oncePerNode(solidLines(boxes, minAlpha).filter((b) => b.size > 0 && Math.round(b.size) < minSize && b.chars >= 3))
    .map((b) => ({ text: b.text, size: b.size, y: b.y }));
}

/** The lines worth holding against what is behind them: solid, with a known colour, wide enough to sample. */
export function linesToSample(boxes = [], { minAlpha = 0.6, limit = 500 } = {}) {
  return oncePerNode(solidLines(boxes, minAlpha).filter((b) => b.rgb && !b.turned && b.chars >= 3 && b.w >= 20 && b.h >= 6)).slice(0, limit)
    .map((b) => ({ text: b.text, x: b.x, y: b.y, w: b.w, h: b.h, rgb: b.rgb, alpha: Math.min(1, b.alpha), need: b.size >= 24 ? 2 : 3 }));
}

/**
 * In a blank page: what lies behind each line in a screenshot of the page taken with its text unpainted.
 * `plain` is the same page photographed with its text painted. `low` is the share of the line's box where the letters would stand out by less than `need` to 1 (the
 * contrast ratio of WCAG, held to 2 for large type and 3 for small: well under its own limits, so only
 * text that cannot be told from its ground counts); `spread` says whether the ground is a picture
 * (a flat ground is the contrast check's business, in audit:ui); `painted` is the share of the box the
 * letters change, and a line that changes nothing is covered by something else and is not on show.
 */
export async function groundsBehind([src, lines, plain = null]) {
  const load = (from) => new Promise((resolve) => { const i = new Image(); i.onload = () => resolve(i); i.src = from; });
  const draw = (image) => { const context = new OffscreenCanvas(image.width, image.height).getContext('2d', { willReadFrequently: true }); context.drawImage(image, 0, 0); return context; };
  const img = await load(src);
  const context = draw(img);
  // The same page with its text painted: where a line's box is the same in both, the line is not on show there (something covers it).
  const shown = plain ? draw(await load(plain)) : null;
  const linear = (v) => { const c = v / 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
  const luminance = (r, g, b) => 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b);
  return lines.map((line) => {
    if (line.x < 0 || line.y < 0 || line.x + line.w > img.width || line.y + line.h > img.height) return null;
    const data = context.getImageData(line.x, line.y, line.w, line.h).data;
    const lettered = shown ? shown.getImageData(line.x, line.y, line.w, line.h).data : null;
    const step = Math.max(1, Math.floor(Math.sqrt((line.w * line.h) / 1500)));
    let count = 0, low = 0, sum = 0, squares = 0, painted = 0;
    for (let y = 0; y < line.h; y += step) {
      for (let x = 0; x < line.w; x += step) {
        const i = (y * line.w + x) * 4;
        const [r, g, b] = [data[i], data[i + 1], data[i + 2]];
        // Letters painted partly see-through take some of the ground's colour.
        const ink = luminance(...line.rgb.map((v, k) => line.alpha * v + (1 - line.alpha) * [r, g, b][k]));
        const ground = luminance(r, g, b);
        if ((Math.max(ink, ground) + 0.05) / (Math.min(ink, ground) + 0.05) < line.need) low += 1;
        const grey = 0.299 * r + 0.587 * g + 0.114 * b;
        sum += grey; squares += grey * grey; count += 1;
        if (lettered && Math.max(Math.abs(lettered[i] - r), Math.abs(lettered[i + 1] - g), Math.abs(lettered[i + 2] - b)) > 24) painted += 1;
      }
    }
    const mean = sum / count;
    return { low: Math.round(100 * low / count) / 100, spread: Math.round(Math.sqrt(Math.max(0, squares / count - mean * mean))), ...(lettered ? { painted: Math.round(100 * painted / count) / 100 } : {}) };
  });
}

/** Lines that cannot be told from the picture behind them: `grounds` is what groundsBehind returned for `lines`. */
export function unreadableText(lines = [], grounds = [], { minLow = 0.3, minSpread = 8 } = {}) {
  return lines.map((line, i) => ({ line, ground: grounds[i] })).filter(({ ground }) => ground && ground.low >= minLow && ground.spread >= minSpread && (ground.painted === undefined || ground.painted >= 0.02))
    .map(({ line, ground }) => ({ text: line.text, low: ground.low, y: line.y }));
}

/** Wide photographs shown at more than their pixels: `natural` is the file's own width, `dpr` the device pixel ratio. */
export function softPhotos(images, dpr = 1) {
  return images
    .filter((p) => p.natural > 0 && p.natural < p.shown * dpr * 0.9)
    .map((p) => ({ shown: p.shown, natural: p.natural, src: p.url.split('?')[0].split('/').pop() }));
}

/**
 * An impression site (Motion Tier: impression in the record) carries three things a visitor feels on
 * every visit: a smoothed scroll, page changes that move, and at least one pinned scene. `routes` are
 * the facts measured per audited route with motion allowed. Null when the tier is not impression or
 * nothing is missing.
 */
// Through a scene that tells something, the screen changes: three trial scenes measured 0.2% (one clock hand
// turning beside three lines of text), 35% (photographs changing in a band) and 58% (five full-screen photographs).
export const SCENE_CHANGE = 0.25;

export function assessImpression(tier, routes) {
  if (tier !== 'impression' || !routes.length) return null;
  const missing = [];
  if (!routes.some((r) => r.smoothScroll)) missing.push('a smoothed scroll (astro-site-design/references/smooth-scroll.md: no page has the lenis class on <html>)');
  if (!routes.some((r) => r.pageTransitions)) missing.push('page changes that move (astro-site-design/references/impression-motion.md, "Page transitions": no page has the transition layer, [data-interlude])');
  if (!routes.some((r) => r.pinnedScenes > 0)) missing.push('a pinned scene (impression-motion.md, "A pinned scene": no page has a stage that stays on screen while a taller section scrolls past)');
  else {
    const changes = routes.map((r) => r.sceneChange).filter((value) => typeof value === 'number');
    const best = changes.length ? Math.max(...changes) : null;
    if (best !== null && best < SCENE_CHANGE) missing.push(`a pinned scene that carries the subject (impression-motion.md, "A pinned scene": through the scene only ${Math.round(best * 100)}% of the screen changes; show the site's photographs or content at stage size, so that at least ${Math.round(SCENE_CHANGE * 100)}% changes)`);
  }
  if (!missing.length) return null;
  return { code: 'impression-motion', missing, message: `The record says Motion Tier: impression, and the built pages lack ${missing.join('; ')}. Build them, or correct the tier in the record with the client's words that decide it.` };
}

/** The record's named motions that never ran on any audited route (null when all ran or none are named). */
export function assessWorldMotion(named, ran) {
  const seen = new Set(ran);
  const missing = named.filter((name) => !seen.has(name));
  if (!missing.length) return null;
  return { code: 'world-motion', missing, message: `The Art Direction Record names ${missing.map((n) => `\`${n}\``).join(', ')} in World › Motion, and ${missing.length === 1 ? 'it never ran' : 'none of them ran'} on these routes while scrolling. Build each on the object it belongs to as a CSS animation of that name (with prefers-reduced-motion: no-preference), or correct the record.` };
}

/** What a made page has in quantity, measured the same way on the page and on its references. */
export const GAP_MEASURES = Object.freeze([
  ['drawn', 'drawn objects (SVG or canvas, 32px or more)'],
  ['motion', 'animations running while scrolling'],
  ['layers', 'rotated or masked objects'],
  ['surfaces', 'surfaces (textured or patterned grounds)'],
  ['colours', 'colours'],
  ['typeSizes', 'type sizes'],
  ['elements', 'visible elements'],
]);

const median = (values) => { const v = [...values].sort((a, b) => a - b); return v.length ? (v.length % 2 ? v[(v.length - 1) / 2] : (v[v.length / 2 - 1] + v[v.length / 2]) / 2) : 0; };
const measureOf = (craft, key) => key === 'layers' ? (craft.rotated ?? 0) + (craft.masked ?? 0) : craft[key] ?? 0;

/**
 * The level of a made world: the median of three home pages that small independent studios built for
 * small clients (a race, an embroidery shop, a school), measured with this audit. Trial builds that
 * passed every other check had 2 to 20 drawings, 19 to 156 running animations and 8 to 18 colours.
 * The selected references can be quiet, well-set sites (one trial's measured 1 drawing, 5.5 animations
 * and 12.5 colours), so the page is marked against whichever level is higher.
 */
export const STUDIO_LEVEL = Object.freeze({ drawn: 10, motion: 136, layers: 26, surfaces: 8, colours: 41, typeSizes: 24, elements: 654 });

/**
 * The page against its selected references and the studio level, measure by measure: the references'
 * median, the studio level and the page's count, with `short` set where the page has under half of the
 * higher of the two.
 */
export function assessAgainst(craft, references, { studio: useStudio = true } = {}) {
  if (!references.length) return [];
  return GAP_MEASURES.map(([key, label]) => {
    const ref = median(references.map((r) => measureOf(r, key)));
    // The studio level is measured on home pages: inner pages are held to the references only.
    const studio = useStudio ? STUDIO_LEVEL[key] : null;
    const target = Math.max(ref, studio ?? 0);
    const value = measureOf(craft, key);
    return { key, label, page: value, references: ref, studio, short: target >= 3 && value < target / 2 };
  });
}

/** The selected references' live sources in a references file (owner references aside). */
export function selectedSources(markdown) {
  const out = [];
  for (const line of markdown.split('\n')) {
    const cells = line.split('|').map((c) => c.trim());
    if (cells.length < 6 || !/^https?:\/\//.test(cells[2] ?? '')) continue;
    const verdict = cells.at(-2) ?? '';
    // The first URL in the cell: a source may carry a note after it (the studio a case study comes from).
    if (/^selected\b/i.test(verdict) && cells[3] !== 'owner') out.push({ id: cells[1], url: cells[2].match(/^https?:\/\/\S+/)[0].replace(/[),.;]+$/, ''), kind: cells[3] });
  }
  return out;
}

export function formatAgainst(gap, count) {
  const short = gap.filter((g) => g.short);
  const rows = gap.map((g) => `    ${g.short ? '→' : ' '} ${g.label}: ${g.page} here, ${g.references} on the references${g.studio === null ? '' : `, ${g.studio} at the studio level`}`);
  const head = `  Against the ${count} selected reference${count === 1 ? '' : 's'} (median)${gap.some((g) => g.studio !== null) ? ' and the studio level (studio-built home pages)' : ''}: ${short.length ? `under half on ${short.map((g) => g.key).join(', ')}` : 'at least half of both on every measure'}`;
  return [head, ...rows].join('\n');
}

/** Runs in the page: reads the top-level sections of <main>. */
export function measurePage() {
  const vw = document.documentElement.clientWidth;
  const px = (el, prop) => parseFloat(getComputedStyle(el)[prop]) || 0;
  const visible = (el) => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0 && getComputedStyle(el).visibility !== 'hidden'; };
  const main = document.querySelector('main') ?? document.body;
  let sections = [...main.children].filter(visible);
  // Descend through wrappers: a single child, or one child holding most of the page beside thin decoration
  // (a pipe or a rule drawn behind every section), is not the page's section list.
  const mainHeight = main.getBoundingClientRect().height;
  for (;;) {
    if (sections.length === 1 && sections[0].children.length > 1) { sections = [...sections[0].children].filter(visible); continue; }
    const holders = sections.length <= 3 ? sections.filter((s) => s.getBoundingClientRect().height >= mainHeight * 0.8 && [...s.children].filter(visible).length >= 3) : [];
    if (holders.length === 1) { const width = main.getBoundingClientRect().width; sections = [...holders[0].children].filter(visible).filter((c) => c.getBoundingClientRect().width >= width * 0.25); continue; }
    break;
  }
  // The body size is the size most of the reading text is set in: weighted by characters, so a page of short
  // labels (a frieze, tickets) does not report its label size as the body.
  const paragraphs = [...main.querySelectorAll('p')].filter(visible).map((p) => ({ size: px(p, 'fontSize'), chars: p.textContent.trim().length })).filter((p) => p.chars > 0).sort((a, b) => a.size - b.size);
  const totalChars = paragraphs.reduce((sum, p) => sum + p.chars, 0);
  let seen = 0;
  const bodySize = paragraphs.find((p) => (seen += p.chars) >= totalChars / 2)?.size || 16;
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
        const chars = before.textContent.trim().length;
        const size = px(before, 'fontSize');
        const short = chars > 0 && chars <= 48;
        const small = size <= bodySize * 0.95;
        const label = b.textTransform === 'uppercase' || parseFloat(b.letterSpacing) / size >= 0.05;
        // The same label in another dress: a line of a few words under half the heading's size, in lower case
        // or in a handwritten face. A sentence that leads into the heading is longer than this.
        const underline = chars > 0 && chars <= 32 && size <= px(heading, 'fontSize') * 0.5;
        kicker = short && ((small && label) || underline) && !before.querySelector('a, button, img');
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
    // Runs of tall items inside the section (each at least 40% of a screen, holding a picture): a register
    // laid out as one block per entry. Each item is measured by how it is laid out (its picture's share of
    // its width, picture beside or above the text, how many pictures, its ground); longestItemRun compares
    // neighbours outside the page.
    const itemRows = [];
    for (const container of [section, ...section.querySelectorAll('*')]) {
      if (container.children.length < 4) continue;
      const row = [...container.children].map((kid) => {
        if (!visible(kid)) return null;
        const r = kid.getBoundingClientRect();
        if (r.height < innerHeight * 0.4) return null;
        const pictures = [...kid.querySelectorAll('img, video')].filter(visible).map((m) => m.getBoundingClientRect());
        if (!pictures.length) return null;
        const big = pictures.reduce((a, b) => (b.width * b.height > a.width * a.height ? b : a));
        const text = [...kid.querySelectorAll('h2, h3, h4, p, figcaption')].filter(visible).find((t) => t.textContent.trim() && !t.querySelector('img, video'));
        const t = text?.getBoundingClientRect();
        const ks = getComputedStyle(kid);
        return {
          tag: kid.tagName.toLowerCase(),
          cls: kid.classList[0] ?? '',
          share: Math.round((big.width / r.width) * 100) / 100,
          pictures: pictures.length,
          beside: Boolean(t && (t.left >= big.right - 4 || t.right <= big.left + 4)),
          ground: `${ks.backgroundColor}${ks.backgroundImage !== 'none' ? ' image' : ''}`,
        };
      });
      if (row.filter(Boolean).length >= 4) itemRows.push(row);
    }
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
      itemRows,
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
  // One word or phrase of the page heading in italics while the rest is upright.
  const accent = h1 && getComputedStyle(h1).fontStyle !== 'italic'
    ? [...h1.querySelectorAll('*')].find((el) => getComputedStyle(el).fontStyle === 'italic' && (el.textContent || '').trim() && (el.textContent || '').trim().length < (h1.textContent || '').trim().length)
    : null;
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
  // Only the file the browser chose counts: a picture with a srcset that still has not loaded is
  // left out, because its src attribute is a fallback no visitor's browser shows.
  const wideImages = [...main.querySelectorAll('img')].filter(visible)
    .map((img) => ({ shown: Math.round(img.getBoundingClientRect().width), url: img.currentSrc || (img.srcset ? '' : img.src) || '' }))
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
    accentWord: accent ? (accent.textContent || '').trim().slice(0, 40) : null,
    h2Max: Math.max(0, ...sizes('h2')),
    imageCover: +(imageArea / (vw * document.documentElement.scrollHeight)).toFixed(2),
    fullWidthMedia: fullWidth,
    // A signature is also a drawn object at stage size: an SVG or canvas spanning most of the width or a screen tall.
    signature: Boolean(main.querySelector('.display-fit, .media-stage, .index-list[data-preview]'))
      || [...main.querySelectorAll('svg, canvas')].some((d) => { const r = d.getBoundingClientRect(); return r.width >= vw * 0.6 || r.height >= Math.min(innerHeight, 900) * 0.45; }),
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
      const typeSizes = new Set();
      const colours = new Set();
      for (const el of all) {
        const s = getComputedStyle(el);
        if ([...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())) { typeSizes.add(Math.round(parseFloat(s.fontSize))); colours.add(s.color); }
        if (s.backgroundColor !== 'rgba(0, 0, 0, 0)' && s.backgroundColor !== 'transparent') colours.add(s.backgroundColor);
        // Drawn objects carry colour too: SVG fills, strokes and gradient stops.
        if (el instanceof SVGElement) {
          for (const paint of [s.fill, s.stroke]) if (paint && /^rgb/.test(paint) && paint !== 'rgba(0, 0, 0, 0)') colours.add(paint);
          if (el.tagName.toLowerCase() === 'stop' && s.stopColor) colours.add(s.stopColor);
        }
        const pseudo = ['::before', '::after'].some((p) => getComputedStyle(el, p).backgroundImage !== 'none');
        if (size(el, 120, 40) && (s.backgroundImage !== 'none' || pseudo)) surfaces++;
        if ((el.tagName.toLowerCase() === 'svg' || el.tagName === 'CANVAS') && size(el, 32, 32)) drawn++;
        const matrix = s.transform.match(/^matrix\(([^,]+),\s*([^,]+)/);
        // Turned by transform, or by the independent rotate property ("3deg", "z 3deg", "0 0 1 3deg").
        const angle = parseFloat(String(s.rotate ?? 'none').match(/-?[\d.]+(?=deg|rad|turn|grad)/)?.[0] ?? '0');
        if (((matrix && Math.abs(parseFloat(matrix[2])) > 0.005) || Math.abs(angle) > 0.05) && size(el, 16, 16)) rotated++;
        const mask = (s.maskImage && s.maskImage !== 'none') || (s.webkitMaskImage && s.webkitMaskImage !== 'none') || s.clipPath !== 'none';
        if (mask && size(el, 40, 40)) masked++;
      }
      const voices = Object.values(families).filter((n) => n >= 3).length;
      return { elements: all.length, voices, surfaces, drawn, rotated, masked, typeSizes: typeSizes.size, colours: colours.size, motion: 0 };
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

/**
 * In the page: brings each lazy picture the scroll did not load into view and waits for it. A lazy
 * image that has not loaded has no chosen file yet; read from its `src` attribute (the small
 * fallback beside the srcset) it looked like a photograph stretched to its frame, and design trials
 * got `soft-photo` for a full-width picture the browser shows from a 2000px file.
 */
export async function loadPendingImages() {
  const pending = [...document.querySelectorAll('img')].filter((img) => !img.complete || !img.currentSrc);
  for (const img of pending.slice(0, 60)) {
    if (!img.getClientRects().length) continue;
    img.scrollIntoView({ block: 'center' });
    await Promise.race([
      new Promise((resolve) => { img.addEventListener('load', resolve, { once: true }); img.addEventListener('error', resolve, { once: true }); }),
      new Promise((resolve) => setTimeout(resolve, 4000)),
    ]);
  }
  if (pending.length) scrollTo(0, 0);
  return pending.length;
}

/** In a blank page: the share of the picture that differs between two screenshots (data URLs of the same size). */
export async function changedFraction([first, second]) {
  const load = (src) => new Promise((resolve) => { const img = new Image(); img.onload = () => resolve(img); img.src = src; });
  const [a, b] = await Promise.all([load(first), load(second)]);
  const width = 360, height = Math.round(360 * a.height / a.width);
  const pixels = (img) => { const canvas = new OffscreenCanvas(width, height); const context = canvas.getContext('2d'); context.drawImage(img, 0, 0, width, height); return context.getImageData(0, 0, width, height).data; };
  const one = pixels(a), two = pixels(b);
  let changed = 0;
  for (let i = 0; i < one.length; i += 4) if (Math.max(Math.abs(one[i] - two[i]), Math.abs(one[i + 1] - two[i + 1]), Math.abs(one[i + 2] - two[i + 2])) > 32) changed += 1;
  return Math.round(1000 * changed / (width * height)) / 1000;
}

const UNPAINT_TEXT = '*, *::before, *::after { color: transparent !important; -webkit-text-fill-color: transparent !important; -webkit-text-stroke-color: transparent !important; text-decoration-color: transparent !important; } svg text, svg tspan { fill: transparent !important; stroke: transparent !important; }';

/**
 * What stands in the way of reading the page as it is now laid out: lines over lines, lines cut off,
 * runs squeezed into a few letters' width, text painted too small, and (from a screenshot taken with the
 * text unpainted) lines that cannot be told from the picture behind them.
 */
export async function readLegibility(browser, page) {
  const boxes = await page.evaluate(textBoxes);
  const lines = linesToSample(boxes);
  let unreadable = [];
  if (lines.length) {
    // Twice: with the letters' shadows and without. A dark shadow under light letters is ground that helps;
    // a glow in the letters' own colour is not ground at all. A line counts when neither picture clears it.
    const grounds = [];
    const plain = await page.screenshot({ fullPage: true, type: 'jpeg', quality: 85, animations: 'disabled' }).then((shot) => 'data:image/jpeg;base64,' + shot.toString('base64')).catch(() => null);
    const sampler = await browser.newPage();
    try {
      for (const extra of ['', ' *, *::before, *::after { text-shadow: none !important; }']) {
        const style = await page.addStyleTag({ content: UNPAINT_TEXT + extra });
        const shot = await page.screenshot({ fullPage: true, type: 'jpeg', quality: 85, animations: 'disabled' }).catch(() => null);
        await style.evaluate((node) => node.remove());
        if (shot) grounds.push(await sampler.evaluate(groundsBehind, ['data:image/jpeg;base64,' + shot.toString('base64'), lines, plain]));
      }
    } finally { await sampler.close(); }
    if (grounds.length === 2) unreadable = unreadableText(lines, lines.map((_, i) => (grounds[0][i] && grounds[1][i] ? (grounds[0][i].low <= grounds[1][i].low ? grounds[0][i] : grounds[1][i]) : null)));
  }
  return { collisions: collidingText(boxes), legibility: { cut: cutText(boxes), squeezed: squeezedText(boxes), tiny: tinyText(boxes), unreadable } };
}

/** Loads a page at the wide width, scrolls it with motion allowed, then measures it with motion reduced. */
async function measureWide(browser, url, width, { declineConsent = false, scene = false, legibility = false } = {}) {
  const page = await browser.newPage({ viewport: { width, height: 900 } });
  try {
    // Every animation that starts, from the first paint on: an arrival that plays once at load is over before
    // the scroll below begins, and sprint sites that recorded one were told it never ran.
    await page.addInitScript(() => { window.__animationsStarted = []; document.addEventListener('animationstart', (event) => { if (event.animationName) window.__animationsStarted.push(event.animationName); }, true); });
    await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 }).catch(() => page.waitForTimeout(3000));
    if (declineConsent) {
      if (isBotWall(await page.title(), await page.evaluate(() => document.body?.innerText ?? ''))) throw Error('a bot wall answered instead of the site');
      for (const frame of page.frames()) {
        const button = frame.locator('button, [role="button"], a, input[type="button"], input[type="submit"]').filter({ hasText: DECLINE }).first();
        if (await button.count().catch(() => 0) && await button.isVisible().catch(() => false)) { await button.click({ timeout: 3000 }).catch(() => {}); await page.waitForTimeout(600); break; }
      }
    }
    // Motion first, with motion allowed: the most animations running while the visitor scrolls through.
    const motion = await page.evaluate(async () => {
      const height = document.documentElement.scrollHeight;
      let most = 0;
      const names = new Set(window.__animationsStarted ?? []);
      for (let y = 0; y < height; y += 600) {
        scrollTo(0, y);
        await new Promise((resolve) => setTimeout(resolve, 100));
        const running = document.getAnimations();
        most = Math.max(most, running.length);
        for (const animation of running) if (animation.animationName || animation.id) names.add(animation.animationName || animation.id);
      }
      scrollTo(0, 0);
      // What an impression site must carry, read while motion is allowed (a pinned scene is an ordinary block under reduced motion).
      const vh = innerHeight;
      const pinnedScenes = [...document.querySelectorAll('body *')].filter((el) => {
        if (getComputedStyle(el).position !== 'sticky') return false;
        const stage = el.getBoundingClientRect();
        const track = el.parentElement?.getBoundingClientRect();
        return stage.height >= vh * 0.8 && track && track.height >= vh * 1.8;
      }).length + document.querySelectorAll('.pin-spacer').length;
      const firstStage = [...document.querySelectorAll('body *')].find((el) => {
        if (getComputedStyle(el).position !== 'sticky') return false;
        const stage = el.getBoundingClientRect();
        const track = el.parentElement?.getBoundingClientRect();
        return stage.height >= vh * 0.8 && track && track.height >= vh * 1.8;
      });
      const trackBox = firstStage?.parentElement.getBoundingClientRect();
      const impression = {
        sceneTrack: trackBox ? { top: Math.round(trackBox.top + scrollY), height: Math.round(trackBox.height) } : null,
        smoothScroll: document.documentElement.classList.contains('lenis'),
        pageTransitions: Boolean(document.querySelector("[data-interlude]")),
        pinnedScenes,
      };
      return { most, names: [...names], impression };
    });
    // How much of the screen changes through the first pinned scene: frames near its start, middle and end.
    if (scene && motion.impression.sceneTrack) {
      const { top, height: trackHeight } = motion.impression.sceneTrack;
      const frames = [];
      const over = new Map();
      for (const at of [0.08, 0.5, 0.92]) {
        await page.evaluate((y) => scrollTo(0, y), Math.round(top + (trackHeight - 900) * at));
        await page.waitForTimeout(700);
        frames.push('data:image/png;base64,' + (await page.screenshot()).toString('base64'));
        for (const pair of collidingText(await page.evaluate(textBoxes, { viewportOnly: true }))) over.set(`${pair.over}|${pair.under}`, pair);
      }
      motion.impression.sceneCollisions = [...over.values()];
      await page.evaluate(() => scrollTo(0, 0));
      const differ = await browser.newPage();
      try { motion.impression.sceneChange = Math.max(await differ.evaluate(changedFraction, [frames[0], frames[1]]), await differ.evaluate(changedFraction, [frames[1], frames[2]]), await differ.evaluate(changedFraction, [frames[0], frames[2]])); }
      finally { await differ.close(); }
    }
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.evaluate(loadPendingImages);
    const model = await page.evaluate(measurePage);
    model.width = width;
    await page.evaluate(() => scrollTo(0, 0));
    await page.waitForTimeout(150);
    Object.assign(model, legibility ? await readLegibility(browser, page) : { collisions: collidingText(await page.evaluate(textBoxes)) });
    for (const section of model.sections) { section.itemRun = longestItemRun(section.itemRows); delete section.itemRows; }
    model.craft.motion = motion.most;
    model.craft.motionNames = motion.names;
    model.impression = motion.impression;
    const measured = await page.evaluate(async (images) => Promise.all(images.map((p) => new Promise((resolve) => {
      const probe = new Image();
      probe.onload = () => resolve({ ...p, natural: probe.naturalWidth });
      probe.onerror = () => resolve({ ...p, natural: 0 });
      probe.src = p.url;
    }))), model.wideImages);
    model.softPhotos = softPhotos(measured, await page.evaluate(() => devicePixelRatio));
    return model;
  } finally {
    await page.close();
  }
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) { console.log('Usage: npm run audit:composition -- --base <origin> --routes /,/about [--widths 1440,390] [--record AGENTS.md] [--references audit/references/references.md] [--refresh-references] [--json] [--out file] [--strict]'); return; }
  const recordFile = options.record ?? (existsSync('AGENTS.md') ? 'AGENTS.md' : null);
  if (options.record && !existsSync(options.record)) throw Error(`--record file not found: ${options.record}`);
  if (options.references && !existsSync(options.references)) throw Error(`--references file not found: ${options.references}`);
  const named = recordFile ? worldMotionNames(readFileSync(recordFile, 'utf8')) : [];
  const tier = recordFile ? motionTier(readFileSync(recordFile, 'utf8')) : null;
  const sourced = recordFile ? worldSources(readFileSync(recordFile, 'utf8')) !== null : false;
  const sources = options.references ? selectedSources(readFileSync(options.references, 'utf8')) : [];
  const ran = new Set();
  // The same browser lookup as audit:ui: the site's own @playwright/test first, then Baseline's.
  let chromium;
  for (const base of [path.join(process.cwd(), 'package.json'), import.meta.url]) { try { ({ chromium } = createRequire(base)('@playwright/test')); break; } catch { /* try the next location */ } }
  if (!chromium) throw Error('audit:composition needs @playwright/test and an installed Chromium (npx playwright install chromium).');
  const browser = await chromium.launch();
  const wide = Math.max(...options.widths);
  const narrow = Math.min(...options.widths);
  const results = [];
  const references = [];
  try {
    // The selected references, measured the same way at the same width (their live pages, consent declined).
    // A reference's live page is measured once and kept beside the references file: every later run reuses the
    // numbers (each pass used to spend 20 to 30 seconds on the network). --refresh-references measures again.
    const cacheFile = options.references ? path.join(path.dirname(options.references), 'reference-measures.json') : null;
    let cache = {};
    if (cacheFile && existsSync(cacheFile) && !options.refreshReferences) { try { cache = JSON.parse(readFileSync(cacheFile, 'utf8')); } catch { cache = {}; } }
    for (const source of sources) {
      const key = `${source.url} @${wide}`;
      if (cache[key]?.craft) { references.push({ ...source, craft: cache[key].craft, measured: cache[key].measured }); continue; }
      try { const craft = (await measureWide(browser, source.url, wide, { declineConsent: true })).craft; cache[key] = { craft, measured: new Date().toISOString().slice(0, 10) }; references.push({ ...source, craft }); }
      catch (error) { references.push({ ...source, skipped: error.message.split('\n')[0] }); }
    }
    if (cacheFile && sources.length) writeFileSync(cacheFile, JSON.stringify(cache, null, 1) + '\n');
    const measuredRefs = references.filter((r) => r.craft).map((r) => r.craft);
    if (!options.json) {
      for (const r of references) {
        if (r.craft) console.log(`reference ${r.id} (${r.kind}) ${r.url}: ${GAP_MEASURES.map(([key]) => `${key} ${measureOf(r.craft, key)}`).join(', ')}${r.measured ? ` (measured ${r.measured}, reused; --refresh-references measures again)` : ''}`);
        else console.log(`reference ${r.id} ${r.url}: SKIPPED, ${r.skipped}`);
      }
    }
    for (const route of options.routes) {
      const model = await measureWide(browser, options.base + route, wide, { scene: tier === 'impression', legibility: true });
      for (const name of model.craft.motionNames) ran.add(name);
      if (narrow !== wide) {
        const phone = await browser.newPage({ viewport: { width: narrow, height: 844 } });
        await phone.goto(options.base + route, { waitUntil: 'networkidle' }).catch(() => phone.waitForTimeout(3000));
        model.narrow = await phone.evaluate(() => { const h1 = document.querySelector('h1'); return { width: innerWidth, viewportHeight: innerHeight, h1Bottom: h1 ? Math.round(h1.getBoundingClientRect().top + Math.min(h1.getBoundingClientRect().height, 40)) : null }; });
        await phone.emulateMedia({ reducedMotion: 'reduce' });
        await phone.evaluate(loadPendingImages);
        await phone.evaluate(() => scrollTo(0, 0));
        await phone.waitForTimeout(150);
        Object.assign(model.narrow, await readLegibility(browser, phone));
        await phone.close();
      }
      const findings = assessComposition(model);
      const against = assessAgainst(model.craft, measuredRefs, { studio: route === '/' });
      results.push({ route, model, findings, against });
      if (!options.json) {
        console.log(formatRoute(route, model, findings));
        if (against.length) console.log(formatAgainst(against, measuredRefs.length));
      }
    }
  } finally {
    await browser.close();
  }
  const worldMotion = assessWorldMotion(named, ran);
  const impression = assessImpression(tier, results.map((r) => r.model.impression).filter(Boolean));
  const all = results.flatMap((r) => r.findings).concat(worldMotion ? [worldMotion] : [], impression ? [impression] : []);
  const floorList = floorCodes(sourced);
  const floor = all.filter((f) => floorList.includes(f.code)).length;
  const advisory = all.length - floor;
  const report = { routes: results, site: [worldMotion, impression].filter(Boolean), named, tier, references };
  if (options.json) console.log(JSON.stringify(report, null, 2));
  if (options.out) writeFileSync(options.out, JSON.stringify(report, null, 2));
  if (!options.json) {
    if (worldMotion) console.log(`[world-motion] ${worldMotion.message}`);
    if (impression) console.log(`[impression-motion] ${impression.message}`);
    else if (tier === 'impression') console.log('Motion Tier impression: smoothed scroll, moving page changes and a pinned scene are present.');
    else if (named.length) console.log(`World › Motion: ${named.map((n) => `\`${n}\``).join(', ')} ran.`);
    console.log(`Composition audit: ${floor} floor finding${floor === 1 ? '' : 's'} (${floorList.join(', ')}: fix them), ${advisory} advisory, on ${results.length} route${results.length === 1 ? '' : 's'}. See site-art-direction/references/world-building.md and distinctive-direction.md.`);
    if (references.length) console.log('The measures against the references are what the page still has to build to reach their level; they go to the Stage 5 comparison (new-site-workflow/references/impeccable-passes.md).');
  }
  if (floor || (options.strict && advisory)) process.exitCode = 1;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) main().catch((error) => { console.error(error.message); process.exitCode = 1; });
