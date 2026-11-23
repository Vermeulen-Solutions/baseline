#!/usr/bin/env node
// Material for a site's world, taken from outside Baseline: pictures of the subject's own things from an
// open archive (Wikimedia Commons), and the colours of the client's own photographs.
//
//   npm run design:world -- search "enamel sign" [--limit 12]
//   npm run design:world -- get 12345,67890 [--out audit/world] [--width 1280]
//   npm run design:world -- palette src/assets/photos [--colours 6]
//
// Twenty-one trial sites for unrelated trades shared one look, because each took its devices from the same
// written recipes. A world built from pictures of this subject's real things, and from the colours of this
// client's photographs, differs from site to site without anyone trying. `search` lists archive pictures with
// their licence; `get` saves the chosen ones into the site's audit folder and records the source, the author
// and whether the picture may be shown on the site; `palette` reads photographs and prints their colours.
import { appendFileSync, existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const API = 'https://commons.wikimedia.org/w/api.php';
const HEADERS = Object.freeze({ 'user-agent': 'baseline-design-world/1 (site design research tool)', accept: 'application/json' });
const FIELDS = 'LicenseShortName|Artist|DateTimeOriginal|ImageDescription';
const PHOTO = /\.(jpe?g|png|webp|avif)$/i;

export function parseArgs(argv) {
  const [command, subject, ...rest] = argv;
  if (command === '--help' || command === '-h' || !command) return { help: true };
  if (!['search', 'get', 'palette'].includes(command)) throw Error('Command must be search, get or palette');
  const out = { command, subject, limit: 12, out: 'audit/world', width: 1280, colours: 6 };
  for (let i = 0; i < rest.length; i++) {
    const flag = rest[i];
    const value = () => { const v = rest[++i]; if (v === undefined || v.startsWith('--')) throw Error('Missing value for ' + flag); return v; };
    if (flag === '--limit') out.limit = Number(value());
    else if (flag === '--out') out.out = value();
    else if (flag === '--width') out.width = Number(value());
    else if (flag === '--colours' || flag === '--colors') out.colours = Number(value());
    else throw Error('Unknown option: ' + flag);
  }
  if (!subject || subject.startsWith('--')) {
    throw Error(command === 'search' ? 'search needs the words to look for, in quotes: "enamel sign"'
      : command === 'get' ? 'get needs the numbers search printed, comma-separated: 12345,67890'
        : 'palette needs a folder of photographs or photograph files, comma-separated');
  }
  if (command === 'get') {
    out.ids = subject.split(',').map((s) => s.trim()).filter(Boolean);
    for (const id of out.ids) if (!/^\d+$/.test(id)) throw Error(`"${id}" is not a number from search`);
    if (out.ids.length > 12) throw Error('get takes at most 12 pictures at a time');
  }
  if (!Number.isInteger(out.limit) || out.limit < 1 || out.limit > 50) throw Error('--limit must be 1 to 50');
  if (!Number.isInteger(out.width) || out.width < 320 || out.width > 2880) throw Error('--width must be 320 to 2880');
  if (!Number.isInteger(out.colours) || out.colours < 3 || out.colours > 10) throw Error('--colours must be 3 to 10');
  return out;
}

/**
 * What a site may do with a picture, from the archive's short licence name. Every picture may be looked at
 * and learned from; only public-domain and attribution licences may be shown on the site. Share-alike and
 * unknown licences stay in the audit folder.
 */
export function licenceUse(shortName) {
  const name = String(shortName ?? '').trim();
  if (/^(public domain|pd\b|pd-|cc0|cc-zero|no restrictions)/i.test(name)) return { use: 'site', credit: false, label: name || 'Public domain' };
  if (/^cc[ -]by[ -]\d/i.test(name) && !/sa|nc|nd/i.test(name)) return { use: 'site', credit: true, label: name };
  return { use: 'look', credit: false, label: name || 'unknown licence' };
}

export const plain = (html) => String(html ?? '').replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#0?39;/g, "'").replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();

export function slug(title) {
  return String(title ?? '').replace(/^File:/i, '').replace(/\.[a-z0-9]{2,5}$/i, '').normalize('NFKD').replace(/[̀-ͯ]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 48) || 'picture';
}

/** One picture of a search or get answer, reduced to what the listing and the record need. */
export function pictureFrom(page) {
  const info = page.imageinfo?.[0] ?? {};
  const meta = info.extmetadata ?? {};
  const licence = licenceUse(meta.LicenseShortName?.value);
  return {
    id: String(page.pageid),
    title: String(page.title ?? '').replace(/^File:/i, ''),
    width: info.width ?? 0,
    height: info.height ?? 0,
    author: plain(meta.Artist?.value).slice(0, 80) || 'unknown author',
    date: plain(meta.DateTimeOriginal?.value).slice(0, 24),
    page: info.descriptionurl ?? '',
    file: info.thumburl ?? info.url ?? '',
    licence,
    index: page.index ?? 0,
  };
}

export function sourceLine(fileName, picture) {
  const use = picture.licence.use === 'look' ? 'look only, never shown on the site'
    : picture.licence.credit ? 'may be shown on the site with a credit visitors can see' : 'may be shown on the site';
  return `- \`${fileName}\`: ${picture.title} — ${picture.author}${picture.date ? `, ${picture.date}` : ''}; ${picture.licence.label}; ${use}; ${picture.page}`;
}

async function query(params) {
  const url = `${API}?${new URLSearchParams({ action: 'query', format: 'json', prop: 'imageinfo', iiprop: 'url|size|extmetadata', iiextmetadatafilter: FIELDS, ...params })}`;
  const res = await fetch(url, { headers: HEADERS });
  if (!res.ok) throw Error(`Wikimedia Commons answered HTTP ${res.status}. Wait a minute and run the command again.`);
  const data = await res.json();
  return Object.values(data.query?.pages ?? {}).filter((page) => page.imageinfo?.length).map(pictureFrom);
}

async function search(words, limit) {
  const pictures = (await query({ generator: 'search', gsrsearch: `${words} filetype:bitmap`, gsrnamespace: '6', gsrlimit: String(limit), iiurlwidth: '640' }))
    .sort((a, b) => a.index - b.index);
  if (!pictures.length) { console.log(`No picture for "${words}". Use fewer or broader words, in English or in the client's language: the thing itself, not an adjective.`); return; }
  console.log(`"${words}": ${pictures.length} pictures from Wikimedia Commons (✓ may be shown on the site, · look only)`);
  for (const picture of pictures) {
    console.log(`${picture.licence.use === 'site' ? '✓' : '·'} ${picture.id.padEnd(10)} ${`${picture.width}x${picture.height}`.padEnd(11)} ${picture.licence.label.slice(0, 16).padEnd(16)} ${picture.date.slice(0, 10).padEnd(10)} ${picture.title.slice(0, 80)}`);
  }
  console.log(`Save the ones worth looking at: npm run design:world -- get ${pictures.slice(0, 3).map((p) => p.id).join(',')}\nThen open the saved files and look at them: a title does not show what a picture holds.`);
}

async function get(ids, outDir, width) {
  const pictures = await query({ pageids: ids.join('|'), iiurlwidth: String(width) });
  const missing = ids.filter((id) => !pictures.some((picture) => picture.id === id));
  if (missing.length) throw Error(`No picture with number ${missing.join(', ')}: copy the numbers from search.`);
  mkdirSync(outDir, { recursive: true });
  const record = path.join(outDir, 'sources.md');
  if (!existsSync(record)) writeFileSync(record, '# World sources\n\nPictures of the subject\'s own things, from Wikimedia Commons. They are looked at to build the world; one is shown on the site only when its line says it may be.\n\n');
  const before = readFileSync(record, 'utf8');
  for (const picture of pictures) {
    const res = await fetch(picture.file, { headers: { 'user-agent': HEADERS['user-agent'] } });
    if (!res.ok) throw Error(`${picture.title}: HTTP ${res.status} while saving. Run the command again.`);
    const extension = (picture.file.match(/\.(jpe?g|png|webp|gif)(?:$|\?)/i)?.[1] ?? 'jpg').toLowerCase().replace('jpeg', 'jpg');
    const fileName = `${picture.id}-${slug(picture.title)}.${extension}`;
    writeFileSync(path.join(outDir, fileName), Buffer.from(await res.arrayBuffer()));
    if (!before.includes(`\`${fileName}\``)) appendFileSync(record, sourceLine(fileName, picture) + '\n');
    console.log(`Saved ${path.join(outDir, fileName).split(path.sep).join('/')} (${picture.licence.label}; ${picture.licence.use === 'site' ? 'may be shown on the site' : 'look only'})`);
  }
  console.log(`Recorded in ${record.split(path.sep).join('/')}. Open each picture and write down what is in it (its material, its lettering, its colours, how it is made) before deciding what the site takes from it.`);
}

// --- palette -----------------------------------------------------------------------------------

const toLinear = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const fromLinear = (c) => (c <= 0.0031308 ? c * 12.92 : 1.055 * c ** (1 / 2.4) - 0.055);

/** sRGB bytes to OKLab. */
export function rgbToOklab(r, g, b) {
  const [lr, lg, lb] = [toLinear(r / 255), toLinear(g / 255), toLinear(b / 255)];
  const l = Math.cbrt(0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb);
  const m = Math.cbrt(0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb);
  const s = Math.cbrt(0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb);
  return [0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s, 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s, 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s];
}

export function oklabToRgb(L, a, b) {
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  const channel = (value) => Math.round(Math.min(1, Math.max(0, fromLinear(value))) * 255);
  return [channel(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s), channel(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s), channel(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s)];
}

export const hex = ([r, g, b]) => '#' + [r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('');

export function oklchText([L, a, b]) {
  const chroma = Math.hypot(a, b);
  const hue = chroma < 0.004 ? 0 : (Math.atan2(b, a) * 180 / Math.PI + 360) % 360;
  return `oklch(${(L * 100).toFixed(0)}% ${chroma.toFixed(3)} ${hue.toFixed(0)})`;
}

/**
 * Groups OKLab points into `count` colours (k-means, started from points spread along lightness so the
 * same photographs always give the same answer), then joins groups too close to tell apart.
 */
export function clusterColours(points, count) {
  if (!points.length) return [];
  const sorted = [...points].sort((p, q) => p[0] - q[0]);
  let centres = Array.from({ length: count }, (_, i) => [...sorted[Math.min(sorted.length - 1, Math.floor(((i + 0.5) / count) * sorted.length))]]);
  let sizes = [];
  for (let round = 0; round < 14; round++) {
    const sums = centres.map(() => [0, 0, 0, 0]);
    for (const point of points) {
      let best = 0; let bestDistance = Infinity;
      for (let i = 0; i < centres.length; i++) {
        const d = (point[0] - centres[i][0]) ** 2 + (point[1] - centres[i][1]) ** 2 + (point[2] - centres[i][2]) ** 2;
        if (d < bestDistance) { bestDistance = d; best = i; }
      }
      const sum = sums[best]; sum[0] += point[0]; sum[1] += point[1]; sum[2] += point[2]; sum[3] += 1;
    }
    centres = centres.map((centre, i) => (sums[i][3] ? [sums[i][0] / sums[i][3], sums[i][1] / sums[i][3], sums[i][2] / sums[i][3]] : centre));
    sizes = sums.map((sum) => sum[3]);
  }
  const groups = centres.map((centre, i) => ({ lab: centre, share: sizes[i] / points.length })).filter((group) => group.share > 0);
  const joined = [];
  for (const group of groups.sort((p, q) => q.share - p.share)) {
    const near = joined.find((other) => Math.hypot(other.lab[0] - group.lab[0], other.lab[1] - group.lab[1], other.lab[2] - group.lab[2]) < 0.05);
    if (near) near.share += group.share; else joined.push({ ...group });
  }
  return joined;
}

/** The vivid part of a set of points (OKLab chroma over 0.09), as up to three colours with their share of all points. */
export function vividColours(points, count = 3) {
  const vivid = points.filter((point) => Math.hypot(point[1], point[2]) > 0.09);
  if (vivid.length < points.length * 0.005) return [];
  return clusterColours(vivid, count).map((group) => ({ ...group, share: group.share * vivid.length / points.length }))
    .sort((p, q) => q.share - p.share);
}

export function photoFiles(subject) {
  const files = [];
  for (const entry of subject.split(',').map((s) => s.trim()).filter(Boolean)) {
    if (!existsSync(entry)) throw Error(`${entry} does not exist`);
    if (statSync(entry).isDirectory()) {
      for (const name of readdirSync(entry, { recursive: true })) if (PHOTO.test(String(name))) files.push(path.join(entry, String(name)));
    } else if (PHOTO.test(entry)) files.push(entry);
  }
  if (!files.length) throw Error(`No photograph (jpg, png, webp, avif) in ${subject}`);
  return files.sort();
}

async function palette(subject, colours) {
  const { default: sharp } = await import('sharp');
  const files = photoFiles(subject);
  const points = [];
  for (const file of files) {
    const { data, info } = await sharp(file).rotate().resize(48, 48, { fit: 'inside' }).removeAlpha().raw().toBuffer({ resolveWithObject: true });
    for (let i = 0; i < data.length; i += info.channels) points.push(rgbToOklab(data[i], data[i + 1], data[i + 2]));
  }
  const groups = clusterColours(points, colours);
  console.log(`Colours of ${files.length} photograph${files.length === 1 ? '' : 's'} in ${subject} (largest share first):`);
  for (const group of groups) {
    console.log(`  ${hex(oklabToRgb(...group.lab))}  ${oklchText(group.lab).padEnd(24)} ${String(Math.round(group.share * 100)).padStart(3)}%`);
  }
  // Averaged over a whole set, the large areas come out muted; the colours a visitor remembers (a copper
  // pipe, a red light, a blue overall) are small and vivid, so they are grouped on their own.
  const accents = vividColours(points);
  if (accents.length) {
    console.log('Vivid colours, small in area and the ones a visitor remembers:');
    for (const group of accents) console.log(`  ${hex(oklabToRgb(...group.lab))}  ${oklchText(group.lab).padEnd(24)} ${(group.share * 100).toFixed(1).padStart(5)}%`);
  } else console.log('No vivid colour in these photographs: the palette is tonal, and the action colour is chosen from the subject\'s own things (design:world search).');
  const byLight = [...groups].sort((p, q) => p.lab[0] - q.lab[0]);
  console.log(`Darkest ${hex(oklabToRgb(...byLight[0].lab))}, lightest ${hex(oklabToRgb(...byLight.at(-1).lab))}.`);
  console.log('These are the client\'s own colours. Build the palette from them and name these values in the record: the ground is the large colour the photographs sit in most naturally (the darkest, the lightest or a mid tone; never a cream chosen by habit), the ink is the one that reads on it, and the action colour is one of the vivid ones. Push lightness or chroma until `npm run design:tokens` passes its contrast pairs; keep the hue.');
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  try {
    const options = parseArgs(process.argv.slice(2));
    if (options.help) console.log('Usage: npm run design:world -- search "<the thing>" [--limit 12]\n       npm run design:world -- get <number>[,<number>] [--out audit/world] [--width 1280]\n       npm run design:world -- palette <folder or photographs> [--colours 6]\nFinds pictures of the subject\'s own things on Wikimedia Commons, saves the chosen ones with their source and licence, and reads the colours of the client\'s photographs.');
    else if (options.command === 'search') await search(options.subject, options.limit);
    else if (options.command === 'get') await get(options.ids, options.out, options.width);
    else await palette(options.subject, options.colours);
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
