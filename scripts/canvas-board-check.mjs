#!/usr/bin/env node
// Local check of Claude Design canvas boards (.dc.html) before they are uploaded. A private
// canvas cannot be rendered headlessly, so everything upstream of the upload is checked here
// (found in a real-site overhaul: a text-heavy review board was 170px taller than the frame
// declared for it, which the canvas would have clipped).
//
//   npm run design:canvas-check -- --assets <folder> --map <blob-map.json> [--canvas <canvas.json>] [--out <dir>] <board.dc.html> [more boards]
//
// blob-map.json maps every uploaded asset id to its local file name, for example
// { "17a3ff16d8ccdcb73f78eb95b25a167d": "home-1440.jpg" }; --assets is the folder holding those files.
// For every board it reports:
// - clipped: the natural height of the content is taller than the frame the board declares
//   ($preview) or than the root element's own fixed height;
// - frame-mismatch (with --canvas): the frame in canvas.json differs from the board's $preview;
// - unmapped-asset / missing-file: a /_blob/ id absent from the map, or whose file is not there;
// - size-mismatch: an image declared at a pixel size that differs from the file's real size
//   (a board of full-page renders must show them 1:1);
// - broken-image: an image that did not load in the local render.
// With --out it also saves a JPEG of each board for a look. Exit 0 = clean, 2 = findings, 1 = error.
import { readFileSync, writeFileSync, existsSync, mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import os from 'node:os';
import { createRequire } from 'node:module';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { msysToNative } from './capture-routes.mjs';

export function parseArgs(argv) {
  const out = { boards: [] };
  for (let i = 0; i < argv.length; i++) {
    const flag = argv[i], value = () => { const v = argv[++i]; if (v === undefined || v.startsWith('--')) throw Error('Missing value for ' + flag); return msysToNative(v); };
    if (flag === '--help' || flag === '-h') out.help = true;
    else if (flag === '--assets') out.assets = value();
    else if (flag === '--map') out.map = value();
    else if (flag === '--canvas') out.canvas = value();
    else if (flag === '--out') out.out = value();
    else if (flag.startsWith('--')) throw Error('Unknown option: ' + flag);
    else out.boards.push(msysToNative(flag));
  }
  if (out.help) return out;
  if (!out.boards.length) throw Error('Name at least one board file (.dc.html)');
  for (const board of out.boards) if (!board.endsWith('.dc.html')) throw Error(`"${board}" is not a .dc.html board`);
  if (Boolean(out.assets) !== Boolean(out.map)) throw Error('--assets and --map go together: the folder of uploaded files and the id-to-file map');
  return out;
}

// The parts of a board file that matter for a local render and for the frame comparison.
export function parseBoard(source) {
  const src = String(source).replace(/\r\n/g, '\n');
  const start = src.indexOf('<x-dc>'), end = src.indexOf('</x-dc>');
  if (start < 0 || end < 0) throw Error('No <x-dc> root: not a Design Component board');
  const inner = src.slice(start + 6, end);
  const helmetStart = inner.indexOf('<helmet>'), helmetEnd = inner.indexOf('</helmet>');
  const helmet = helmetStart >= 0 && helmetEnd > helmetStart ? inner.slice(helmetStart + 8, helmetEnd) : '';
  const body = helmetEnd >= 0 ? inner.slice(helmetEnd + 9) : inner;
  const preview = src.match(/"\$preview"\s*:\s*\{\s*"width"\s*:\s*(\d+)\s*,\s*"height"\s*:\s*(\d+)\s*\}/);
  const blobs = [...new Set([...body.matchAll(/\/_blob\/([0-9a-f]{32})/g)].map(m => m[1]))];
  const images = [...body.matchAll(/<img\b[^>]*\bsrc="\/_blob\/([0-9a-f]{32})"[^>]*>/g)].map(m => {
    const width = m[0].match(/style="[^"]*\bwidth:\s*(\d+(?:\.\d+)?)px/), height = m[0].match(/style="[^"]*\bheight:\s*(\d+(?:\.\d+)?)px/);
    return { id: m[1], width: width ? Number(width[1]) : null, height: height ? Number(height[1]) : null };
  });
  return { helmet, body, preview: preview ? { width: Number(preview[1]), height: Number(preview[2]) } : null, blobs, images };
}

// Replaces uploaded asset addresses by local file URLs; ids without a mapped file are listed.
export function localizeBoard(body, map, toUrl) {
  const unmapped = [];
  const html = body.replace(/\/_blob\/([0-9a-f]{32})/g, (match, id) => {
    const url = map[id] ? toUrl(map[id]) : null;
    if (!url) { if (!unmapped.includes(id)) unmapped.push(id); return match; }
    return url;
  });
  return { html, unmapped };
}

// The frame canvas.json gives a board, compared with the board's own $preview.
export function frameMismatch(canvas, name, preview) {
  const frame = canvas?.boards?.[name];
  if (!frame) return `no frame for ${name} in canvas.json`;
  if (!preview) return null;
  return frame.w === preview.width && frame.h === preview.height ? null : `canvas.json frame ${frame.w}x${frame.h}, board $preview ${preview.width}x${preview.height}`;
}

async function check(options) {
  let chromium, sharp;
  for (const base of [path.join(process.cwd(), 'package.json'), import.meta.url]) { try { ({ chromium } = createRequire(base)('@playwright/test')); break; } catch {} }
  if (!chromium) throw Error('design:canvas-check needs @playwright/test and an installed Chromium (npx playwright install chromium).');
  for (const base of [path.join(process.cwd(), 'package.json'), import.meta.url]) { try { sharp = createRequire(base)('sharp'); break; } catch {} }
  const map = options.map ? JSON.parse(readFileSync(options.map, 'utf8')) : {};
  const canvas = options.canvas ? JSON.parse(readFileSync(options.canvas, 'utf8')) : null;
  if (options.out) mkdirSync(options.out, { recursive: true });
  const browser = await chromium.launch(), findings = [];
  try {
    for (const file of options.boards) {
      const name = path.basename(file), note = (kind, detail) => findings.push({ board: name, kind, detail });
      const board = parseBoard(readFileSync(file, 'utf8'));
      if (!board.preview) note('frame-mismatch', 'the board declares no $preview size');
      if (canvas) { const mismatch = frameMismatch(canvas, name, board.preview); if (mismatch) note('frame-mismatch', mismatch); }
      const missing = [];
      const { html, unmapped } = localizeBoard(board.body, map, fileName => { const full = path.resolve(options.assets, fileName); if (!existsSync(full)) { missing.push(fileName); return null; } return pathToFileURL(full).href; });
      for (const id of unmapped) note(missing.length && map[id] ? 'missing-file' : 'unmapped-asset', map[id] ? `${map[id]} (asset ${id})` : `asset ${id} is not in the map`);
      if (sharp && options.assets) for (const image of board.images) {
        const full = map[image.id] && path.resolve(options.assets, map[image.id]);
        if (!full || !existsSync(full) || image.width === null || image.height === null) continue;
        const meta = await sharp(full).metadata();
        if (Math.abs(meta.width - image.width) > 1 || Math.abs(meta.height - image.height) > 1) note('size-mismatch', `${map[image.id]} is ${meta.width}x${meta.height}, declared ${image.width}x${image.height}`);
      }
      const page = await browser.newPage({ viewport: { width: board.preview?.width ?? 1440, height: 900 } });
      // A file page may load the local asset files; a blank page (setContent) may not.
      const scratch = mkdtempSync(path.join(os.tmpdir(), 'canvas-check-')), local = path.join(scratch, 'board.html');
      writeFileSync(local, `<!doctype html><meta charset="utf-8">${board.helmet}<body>${html}</body>`);
      await page.goto(pathToFileURL(local).href, { waitUntil: 'networkidle' });
      rmSync(scratch, { recursive: true, force: true });
      await page.evaluate(() => document.fonts.ready);
      const measured = await page.evaluate(() => {
        const root = document.body.firstElementChild; if (!root) return null;
        const fixed = root.getBoundingClientRect().height; root.style.height = 'auto'; root.style.overflow = 'visible';
        return { fixed: Math.round(fixed), natural: Math.ceil(root.getBoundingClientRect().height), broken: [...document.images].filter(i => !i.naturalWidth).length, images: document.images.length };
      });
      if (!measured) note('clipped', 'the board has no root element');
      else {
        const frame = Math.min(board.preview?.height ?? Infinity, measured.fixed || Infinity);
        if (measured.natural > frame) note('clipped', `content is ${measured.natural}px tall, the frame is ${frame}px`);
        if (measured.broken) note('broken-image', `${measured.broken} of ${measured.images} images did not load`);
        if (options.out) writeFileSync(path.join(options.out, name.replace(/\.dc\.html$/, '.jpg')), await page.screenshot({ type: 'jpeg', quality: 72, fullPage: true }));
        console.log(`${name}: frame ${board.preview ? `${board.preview.width}x${board.preview.height}` : 'undeclared'}, root ${measured.fixed}px, content ${measured.natural}px, ${measured.images} images`);
      }
      await page.close();
    }
  } finally { await browser.close(); }
  return findings;
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  try {
    const options = parseArgs(process.argv.slice(2));
    if (options.help) console.log('Usage: design:canvas-check -- [--assets <folder> --map <blob-map.json>] [--canvas <canvas.json>] [--out <dir>] <board.dc.html> [more boards]\nChecks Claude Design boards locally before upload: clipped frames, frame mismatches, unmapped or missing assets, image size mismatches and broken images. The canvas page itself is still accepted through the owner\'s view.');
    else {
      const findings = await check(options);
      for (const f of findings) console.log(`  ${f.kind}: ${f.board}: ${f.detail}`);
      console.log(findings.length ? `${findings.length} finding(s)` : 'All boards fit their frames and reference existing assets.');
      if (findings.length) process.exitCode = 2;
    }
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
