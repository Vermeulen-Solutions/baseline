#!/usr/bin/env node
// App icons from the site's favicon: what phones and browsers ask for besides favicon.svg.
//
//   npm run icons                                   # from public/favicon.svg, white ground
//   npm run icons -- --source brand/mark.svg --background "#1b2531" --padding 0.12
//
// Writes into public/ (commit them; they ship to visitors):
// - apple-touch-icon.png (180px): iOS uses it for a home-screen bookmark, and without it shows a
//   screenshot of the page. iOS draws transparency as black, so this one sits on --background;
// - icon-192.png and icon-512.png: the manifest's icons for Android and installed shortcuts,
//   transparent around the mark;
// - icon-maskable-512.png: Android crops icons to a circle or squircle, so the mark sits inside the
//   safe zone (the middle 80% circle) on --background.
// The manifest (/site.webmanifest) lists them; the Base layouts link the touch icon and manifest.
// Rerun after changing the favicon or the brand colour. Needs sharp (already a dependency).
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import { msysToNative } from './capture-routes.mjs';

export const ICONS = Object.freeze([
  { file: 'apple-touch-icon.png', size: 180, padding: null, ground: true },
  { file: 'icon-192.png', size: 192, padding: 0, ground: false },
  { file: 'icon-512.png', size: 512, padding: 0, ground: false },
  // A square inside the 80% safe circle is about 56% of the icon.
  { file: 'icon-maskable-512.png', size: 512, padding: 0.22, ground: true },
]);

export function parseArgs(argv) {
  const out = { source: 'public/favicon.svg', out: 'public', background: '#ffffff', padding: 0.1 };
  for (let i = 0; i < argv.length; i++) {
    const flag = argv[i], value = () => { const v = argv[++i]; if (v === undefined || v.startsWith('--')) throw Error('Missing value for ' + flag); return v; };
    if (flag === '--help' || flag === '-h') out.help = true;
    else if (flag === '--source') out.source = msysToNative(value());
    else if (flag === '--out') out.out = msysToNative(value());
    else if (flag === '--background') out.background = value();
    else if (flag === '--padding') out.padding = Number(value());
    else throw Error('Unknown option: ' + flag);
  }
  if (!/^#[0-9a-f]{6}$/i.test(out.background)) throw Error('--background must be a six-digit hex colour, for example #ffffff');
  if (!Number.isFinite(out.padding) || out.padding < 0 || out.padding > 0.3) throw Error('--padding must be a fraction from 0 to 0.3');
  return out;
}

function loadSharp() {
  for (const base of [path.join(process.cwd(), 'package.json'), import.meta.url]) { try { return createRequire(base)('sharp'); } catch {} }
  throw Error('npm run icons needs sharp (npm install sharp).');
}

// Every icon as PNG bytes, from SVG or raster source bytes.
export async function renderIcons(source, { background = '#ffffff', padding = 0.1 } = {}) {
  const sharp = loadSharp();
  const out = {};
  for (const icon of ICONS) {
    const pad = icon.padding ?? padding;
    const inner = Math.round(icon.size * (1 - 2 * pad));
    // Render large and scale down, so an SVG stays sharp at every size.
    const mark = await sharp(source, { density: 384 }).resize(inner, inner, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer();
    const canvas = sharp({ create: { width: icon.size, height: icon.size, channels: 4, background: icon.ground ? background : { r: 0, g: 0, b: 0, alpha: 0 } } });
    let image = canvas.composite([{ input: mark, gravity: 'center' }]);
    if (icon.ground) image = sharp(await image.png().toBuffer()).flatten({ background });
    out[icon.file] = await image.png({ compressionLevel: 9 }).toBuffer();
  }
  return out;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) { console.log('Usage: npm run icons -- [--source public/favicon.svg] [--background "#ffffff"] [--padding 0.1] [--out public]'); return; }
  const icons = await renderIcons(fs.readFileSync(options.source), options);
  fs.mkdirSync(options.out, { recursive: true });
  for (const [file, bytes] of Object.entries(icons)) {
    fs.writeFileSync(path.join(options.out, file), bytes);
    console.log(`${path.join(options.out, file)} (${Math.round(bytes.length / 1024)} KB)`);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch(error => { console.error(error.message); process.exitCode = 1; });
}
