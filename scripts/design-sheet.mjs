#!/usr/bin/env node
// Comparison sheet: the page beside its selected references, at the same width, on one image.
//
//   npm run design:sheet -- --images audit/compare/home-1440-full.png,audit/references/a/home-1440-full.png,audit/references/b/home-1440-full.png --labels "This page,a,b" --out audit/compare/home-1440.jpg
//
// A page reviewed on its own is judged against the reviewer's idea of "good"; beside the references
// it was meant to reach, the reviewer can name what they do that it does not. Each image is scaled to
// one column width and cut at the same height (two and a half screens by default, where the
// difference shows first), with its label above it. Used by the Stage 5 comparison pass
// (new-site-workflow/references/impeccable-passes.md).
import { existsSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { msysToNative } from './capture-routes.mjs';

export function parseArgs(argv) {
  const out = { images: [], labels: [], column: 720, height: 2.5, out: null };
  for (let i = 0; i < argv.length; i++) {
    const flag = argv[i];
    const value = () => { const v = argv[++i]; if (v === undefined || v.startsWith('--')) throw Error('Missing value for ' + flag); return v; };
    if (flag === '--images') out.images = value().split(',').map((s) => msysToNative(s.trim())).filter(Boolean);
    else if (flag === '--labels') out.labels = value().split(',').map((s) => s.trim());
    else if (flag === '--column') out.column = Number(value());
    else if (flag === '--screens') out.height = Number(value());
    else if (flag === '--out') out.out = msysToNative(value());
    else if (flag === '--help' || flag === '-h') out.help = true;
    else throw Error('Unknown option: ' + flag);
  }
  if (out.help) return out;
  if (out.images.length < 2) throw Error('--images needs the page and at least one reference, comma-separated');
  if (!out.out) throw Error('--out <file.jpg|png> is required');
  if (!Number.isInteger(out.column) || out.column < 200 || out.column > 1440) throw Error('--column must be an integer between 200 and 1440');
  if (!(out.height > 0 && out.height <= 10)) throw Error('--screens must be a number between 0 and 10');
  for (const file of out.images) if (!existsSync(file)) throw Error('Image not found: ' + file);
  return out;
}

/** Layout of the sheet: each column's position, the cut height in source pixels and the sheet size. */
export function sheetLayout(sizes, { column = 720, screens = 2.5, label = 28, gap = 16 } = {}) {
  const columns = sizes.map(({ width, height }, index) => {
    const scale = column / width;
    // Cut at the same number of screens for every image: a screen is 0.625 of the width (1440 by 900).
    const cut = Math.min(height, Math.round(width * 0.625 * screens));
    return { index, left: index * (column + gap), cut, scaledHeight: Math.round(cut * scale) };
  });
  const height = label + Math.max(...columns.map((c) => c.scaledHeight));
  return { columns, width: sizes.length * column + (sizes.length - 1) * gap, height, label };
}

const escapeXml = (s) => String(s).replace(/[<>&"']/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' })[c]);

export async function makeSheet({ images, labels = [], column = 720, height: screens = 2.5, out }) {
  const { default: sharp } = await import('sharp');
  const sizes = await Promise.all(images.map(async (file) => { const m = await sharp(file).metadata(); return { width: m.width, height: m.height }; }));
  const layout = sheetLayout(sizes, { column, screens });
  const parts = [];
  for (const c of layout.columns) {
    const image = await sharp(images[c.index]).extract({ left: 0, top: 0, width: sizes[c.index].width, height: c.cut }).resize({ width: column }).toBuffer();
    const text = escapeXml(labels[c.index] ?? (c.index === 0 ? 'This page' : path.basename(path.dirname(images[c.index]))));
    parts.push({ input: Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${column}" height="${layout.label}"><rect width="100%" height="100%" fill="#111"/><text x="10" y="19" font-family="sans-serif" font-size="15" fill="#fff">${text}</text></svg>`), left: c.left, top: 0 });
    parts.push({ input: image, left: c.left, top: layout.label });
  }
  const sheet = sharp({ create: { width: layout.width, height: layout.height, channels: 3, background: '#ffffff' } }).composite(parts);
  await (/\.png$/i.test(out) ? sheet.png() : sheet.jpeg({ quality: 82 })).toFile(out);
  return { out, width: layout.width, height: layout.height, columns: layout.columns.length };
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  try {
    const options = parseArgs(process.argv.slice(2));
    if (options.help) console.log('Usage: npm run design:sheet -- --images <page.png>,<reference.png>[,…] --out <sheet.jpg> [--labels "This page,a,b"] [--column 720] [--screens 2.5]');
    else { const result = await makeSheet(options); console.log(`Sheet: ${result.out} (${result.columns} columns, ${result.width}x${result.height})`); }
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
