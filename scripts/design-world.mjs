#!/usr/bin/env node
// Material for a site's world, taken from outside Baseline: pictures of the subject's own things from an
// open archive (Wikimedia Commons), and the colours of the client's own photographs.
//
//   npm run design:world -- search "enamel sign" [--limit 12]
//   npm run design:world -- get 12345,67890 [--out audit/world] [--width 1280]
//   npm run design:world -- palette src/assets/photos [--colours 6]
//   npm run design:world -- faces stencil --text "<the site's display line>" [--count 8] [--include "<family>"]
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
  if (!['search', 'get', 'palette', 'faces'].includes(command)) throw Error('Command must be search, get, palette or faces');
  const out = { command, subject, limit: 12, out: 'audit/world', width: 1280, colours: 6, count: 8, line: null, include: [] };
  for (let i = 0; i < rest.length; i++) {
    const flag = rest[i];
    const value = () => { const v = rest[++i]; if (v === undefined || v.startsWith('--')) throw Error('Missing value for ' + flag); return v; };
    if (flag === '--limit') out.limit = Number(value());
    else if (flag === '--out') out.out = value();
    else if (flag === '--width') out.width = Number(value());
    else if (flag === '--colours' || flag === '--colors') out.colours = Number(value());
    else if (flag === '--count') out.count = Number(value());
    else if (flag === '--text') out.line = value();
    else if (flag === '--include') out.include = value().split(',').map((s) => s.trim()).filter(Boolean);
    else throw Error('Unknown option: ' + flag);
  }
  if (!subject || subject.startsWith('--')) {
    throw Error(command === 'search' ? 'search needs the words to look for, in quotes: "enamel sign"'
      : command === 'get' ? 'get needs the numbers search printed, comma-separated: 12345,67890'
        : command === 'faces' ? `faces needs the kind of lettering: ${FACE_CATEGORIES.join(', ')}`
          : 'palette needs a folder of photographs or photograph files, comma-separated');
  }
  if (command === 'faces') {
    if (!FACE_CATEGORIES.includes(subject)) throw Error(`faces needs the kind of lettering, one of: ${FACE_CATEGORIES.map((name) => `${name} (${FACE_POOL[name].matches})`).join('; ')}`);
    if (!out.line) throw Error('faces needs --text "<the display line the site will show>"');
    if (!Number.isInteger(out.count) || out.count < 4 || out.count > 16) throw Error('--count must be 4 to 16');
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

/** How long to wait before asking again after a busy answer: what the archive says, or 5, 15 and 30 seconds. */
export function retryDelay(attempt, retryAfter) {
  const asked = Number(retryAfter);
  return Number.isFinite(asked) && asked > 0 ? Math.min(asked, 60) * 1000 : [5000, 15000, 30000][attempt] ?? null;
}

const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** A request that waits and asks again when the archive is busy (HTTP 429 or 503), up to three times. */
async function patient(url, headers) {
  for (let attempt = 0; ; attempt++) {
    const res = await fetch(url, { headers });
    if (res.ok || ![429, 503].includes(res.status)) return res;
    const wait = retryDelay(attempt, res.headers.get('retry-after'));
    if (wait === null) return res;
    console.error(`Wikimedia Commons is busy (HTTP ${res.status}); waiting ${Math.round(wait / 1000)} seconds and asking again.`);
    await pause(wait);
  }
}

/** Shorter searches to try when one finds nothing: the first two words, then the first. */
export function broaderSearches(words) {
  const parts = String(words).trim().split(/\s+/).filter(Boolean);
  return [...new Set([parts.slice(0, 2).join(' '), parts[0]])].filter((entry) => entry && entry !== parts.join(' '));
}

async function query(params) {
  const url = `${API}?${new URLSearchParams({ action: 'query', format: 'json', prop: 'imageinfo', iiprop: 'url|size|extmetadata', iiextmetadatafilter: FIELDS, ...params })}`;
  const res = await patient(url, HEADERS);
  if (!res.ok) throw Error(`Wikimedia Commons answered HTTP ${res.status} after three tries. Go on with the pictures you have and run this search again later.`);
  const data = await res.json();
  return Object.values(data.query?.pages ?? {}).filter((page) => page.imageinfo?.length).map(pictureFrom);
}

async function search(asked, limit) {
  const find = async (words) => (await query({ generator: 'search', gsrsearch: `${words} filetype:bitmap`, gsrnamespace: '6', gsrlimit: String(limit), iiurlwidth: '640' }))
    .sort((a, b) => a.index - b.index);
  let words = asked;
  let pictures = await find(words);
  // The archive wants every word in a picture's title or description, so three words often find nothing.
  for (const shorter of pictures.length ? [] : broaderSearches(asked)) {
    console.log(`No picture for "${words}"; looking for "${shorter}".`);
    words = shorter;
    pictures = await find(words);
    if (pictures.length) break;
  }
  if (!pictures.length) { console.log(`No picture for "${asked}". Use one or two words, in English or in the client's language: the thing itself, not an adjective.`); return; }
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
    const res = await patient(picture.file, { 'user-agent': HEADERS['user-agent'] });
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

// --- faces -------------------------------------------------------------------------------------

const FONTS_API = 'https://api.fontsource.org/v1/fonts?subsets=latin';
/**
 * Open typefaces sorted by how their letters are built, so a face is asked for by the lettering seen in the
 * site's pictures (a stencil on a crate, chalk on a slate, bulbs on a sign) and not by a name remembered.
 * Every id is a family in the Fontsource catalogue. The pool is wide on purpose: a shortlist is a sample of
 * one group, different for every site.
 */
export const FACE_POOL = Object.freeze({
  didone: { matches: 'thick and hairline strokes, flat serifs: engraved dials, fashion mastheads, printed menus', ids: 'playfair abril-fatface gloock libre-bodoni gfs-didot prata rozha-one dm-serif-text yeseva-one oranienbaum old-standard-tt chonburi antic-didone bellefair italiana' },
  'old-style': { matches: 'bracketed serifs and a pen-drawn slope: books, old shop fronts, stone inscriptions', ids: 'eb-garamond crimson-pro libre-caslon-text libre-caslon-display sorts-mill-goudy im-fell-english cardo gilda-display spectral lora source-serif-4 literata alegreya vollkorn libre-baskerville baskervville petrona young-serif brygada-1918 fanwood-text' },
  slab: { matches: 'heavy square serifs: enamel signs, crates, railway and workshop lettering', ids: 'zilla-slab roboto-slab arvo bitter rokkitt josefin-slab crete-round aleo bree-serif sanchez glegoo ultra graduate bevan patua-one suez-one' },
  grotesque: { matches: 'plain sans with even strokes: van liveries, machine plates, modern shop signs', ids: 'work-sans hanken-grotesk schibsted-grotesk familjen-grotesk darker-grotesque host-grotesk public-sans onest geologica instrument-sans figtree manrope plus-jakarta-sans be-vietnam-pro red-hat-display sora epilogue syne unbounded outfit golos-text albert-sans funnel-display anybody rethink-sans' },
  geometric: { matches: 'circles and straight lines: 1930s signs, neon tubes, tiles, modern packaging', ids: 'jost poppins montserrat raleway josefin-sans league-spartan urbanist lexend kumbh-sans questrial comfortaa tenor-sans poiret-one michroma syncopate gruppo' },
  humanist: { matches: 'a sans with the proportions of handwriting: wayfinding, public notices, friendly print', ids: 'source-sans-3 fira-sans ibm-plex-sans cabin alegreya-sans mukta open-sans lato merriweather-sans pt-sans atkinson-hyperlegible karla rubik asap overpass' },
  condensed: { matches: 'tall narrow capitals: posters, lockers, timetables, marker lettering on boards', ids: 'sofia-sans-extra-condensed sofia-sans-condensed saira-extra-condensed saira-condensed fjalla-one pathway-gothic-one roboto-condensed encode-sans-condensed fira-sans-extra-condensed ibm-plex-sans-condensed antonio teko khand pragati-narrow yanone-kaffeesatz smooch-sans alumni-sans mohave six-caps staatliches squada-one' },
  stencil: { matches: 'letters cut through a plate or built for machines: crates, pipes, instrument panels', ids: 'stardos-stencil allerta-stencil black-ops-one saira-stencil-one sirin-stencil emblema-one keania-one chakra-petch rajdhani orbitron share-tech quantico aldrich oxanium tomorrow tektur wallpoet electrolize' },
  brush: { matches: 'painted with a brush or a marker: sign painting, market stalls, van doors', ids: 'kaushan-script yellowtail lobster damion satisfy sacramento caveat-brush permanent-marker rock-salt covered-by-your-grace knewave sriracha pacifico' },
  script: { matches: 'joined formal handwriting: invitations, wine labels, old shop glass', ids: 'great-vibes allura parisienne dancing-script pinyon-script petit-formal-script mrs-saint-delafield la-belle-aurore homemade-apple nothing-you-could-do' },
  hand: { matches: 'chalk, pencil and felt pen: slates, price tags, notes pinned to a board', ids: 'cabin-sketch fredericka-the-great londrina-sketch londrina-solid gloria-hallelujah indie-flower schoolbell just-another-hand amatic-sc walter-turncoat coming-soon handlee kalam architects-daughter gochi-hand patrick-hand shadows-into-light reenie-beanie caveat' },
  inscribed: { matches: 'capitals cut in stone or metal: plaques, monuments, institutions', ids: 'cinzel cinzel-decorative marcellus marcellus-sc forum cormorant-sc julius-sans-one federo' },
  lights: { matches: 'letters made of light or bulbs: marquees, neon, club and cinema signs', ids: 'limelight monoton tilt-neon tilt-prism tilt-warp neonderthaw codystar bungee bungee-shade rampart-one megrim' },
  poster: { matches: 'very heavy display letters: wood type, fairground, concert bills', ids: 'abril-fatface ultra chango titan-one bowlby-one bowlby-one-sc passion-one paytone-one archivo-black dela-gothic-one rubik-mono-one climate-crisis sigmar-one lilita-one rammetto-one shrikhand calistoga fugaz-one racing-sans-one erica-one poller-one diplomata sancreek ewert rye' },
  typewriter: { matches: 'typed or machine-printed: forms, receipts, labels, logbooks', ids: 'courier-prime special-elite cutive-mono anonymous-pro overpass-mono red-hat-mono fira-mono inconsolata source-code-pro roboto-mono azeret-mono martian-mono sometype-mono spline-sans-mono xanh-mono syne-mono nova-mono vt323 cousine b612-mono kode-mono geist-mono reddit-mono victor-mono fragment-mono chivo-mono lekton' },
  blackletter: { matches: 'broken pen strokes: breweries, old newspapers, guild and church lettering', ids: 'unifrakturcook unifrakturmaguntia pirata-one new-rocker grenze-gotisch metamorphous almendra uncial-antiqua macondo medievalsharp germania-one texturina' },
  rounded: { matches: 'soft ends and round bowls: toys, bakeries, swimming pools, plastic signs', ids: 'varela-round m-plus-rounded-1c nunito quicksand fredoka baloo-2 dosis chewy bagel-fat-one' },
});
export const FACE_CATEGORIES = Object.freeze(Object.keys(FACE_POOL));

/**
 * Faces the trial sites chose from memory, again and again, whatever the client: three club sites took the
 * same Didone, three restaurants the same soft serif, most of the rest one of four condensed faces. A
 * shortlist leaves them out so the choice starts somewhere else; --include puts one back on the sheet,
 * where it is compared with the others.
 */
export const FROM_MEMORY = Object.freeze(['barlow-condensed', 'big-shoulders-display', 'big-shoulders-stencil', 'big-shoulders', 'oswald', 'anton', 'bebas-neue', 'league-gothic', 'fraunces', 'bodoni-moda', 'cormorant', 'cormorant-garamond', 'instrument-serif', 'playfair-display', 'dm-serif-display', 'newsreader', 'besley', 'alfa-slab-one', 'bricolage-grotesque', 'archivo', 'archivo-narrow', 'inter', 'space-grotesk', 'space-mono', 'jetbrains-mono', 'ibm-plex-mono', 'dm-mono']);

/** A repeatable random order from a text seed, so one site gets the same shortlist twice and two sites differ. */
export function seededOrder(items, seed) {
  let state = 2166136261;
  for (const char of String(seed)) state = Math.imul(state ^ char.codePointAt(0), 16777619) >>> 0;
  const next = () => { state = (state + 0x6d2b79f5) >>> 0; let t = state; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const list = [...items];
  for (let i = list.length - 1; i > 0; i--) { const j = Math.floor(next() * (i + 1)); [list[i], list[j]] = [list[j], list[i]]; }
  return list;
}

/** A sample of one group of the pool, as the catalogue describes each face; faces chosen from memory are left out. */
export function shortlist(fonts, { category, count, seed }) {
  const ids = (FACE_POOL[category]?.ids ?? '').split(' ').filter((id) => id && !FROM_MEMORY.includes(id));
  const usable = ids.map((id) => fonts.find((font) => font.id === id)).filter((font) => font?.styles?.includes('normal') && font.subsets?.includes('latin'));
  return seededOrder(usable, seed).slice(0, count);
}

/** The weight a display line is shown in: the family's weight nearest to bold. */
export const displayWeight = (font) => [...(font.weights ?? [400])].sort((a, b) => Math.abs(a - 700) - Math.abs(b - 700) || b - a)[0];

const escapeHtml = (value) => String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export function specimenHtml(faces, line) {
  const rules = faces.map((font) => `@font-face { font-family: "f-${font.id}"; src: url("https://cdn.jsdelivr.net/fontsource/fonts/${font.id}@latest/latin-${displayWeight(font)}-normal.woff2") format("woff2"); font-weight: ${displayWeight(font)}; font-display: block; }`).join('\n');
  const rows = faces.map((font, index) => `<section><p class="name">${index + 1}. ${escapeHtml(font.family)} · ${displayWeight(font)} · ${escapeHtml(font.category)}</p><p class="line" style="font-family: 'f-${font.id}'; font-weight: ${displayWeight(font)}">${escapeHtml(line)}</p><p class="line small" style="font-family: 'f-${font.id}'; font-weight: ${displayWeight(font)}">${escapeHtml(line)} 0123456789</p></section>`).join('\n');
  return `<!doctype html>\n<html lang="en"><head><meta charset="utf-8"><title>Faces</title><style>\n${rules}\nbody { margin: 0; font-family: system-ui, sans-serif; background: #fff; color: #111; }\nmain { display: grid; grid-template-columns: 1fr 1fr; }\nsection { padding: 28px 36px; border-bottom: 1px solid #ccc; }\nsection:nth-child(4n+3), section:nth-child(4n+4) { background: #151515; color: #f2f2f2; border-color: #444; }\n.name { margin: 0 0 10px; font-size: 14px; opacity: 0.7; }\n.line { margin: 0; font-size: 64px; line-height: 1.05; overflow-wrap: anywhere; }\n.small { font-size: 24px; margin-top: 12px; }\n</style></head><body><main>\n${rows}\n</main></body></html>\n`;
}

export const faceLine = (font) => `- ${font.family} (\`${font.id}\`): ${font.category}, ${font.license}, weights ${(font.weights ?? []).join(' ')}${font.variable ? ', variable' : ''}; install with \`npm install @fontsource${font.variable ? '-variable' : ''}/${font.id}\``;

/** The families a faces record holds, lower case. */
export function facesInRecord(recordText) {
  return [...String(recordText).matchAll(/^- (.+?) \(`[a-z0-9-]+`\):/gm)].map((match) => match[1].toLowerCase());
}

async function faces(category, { line, count, include, out }) {
  const res = await fetch(FONTS_API, { headers: HEADERS });
  if (!res.ok) throw Error(`The type catalogue answered HTTP ${res.status}. Run the command again in a minute.`);
  const fonts = await res.json();
  mkdirSync(out, { recursive: true });
  const record = path.join(out, 'faces.md');
  const before = existsSync(record) ? readFileSync(record, 'utf8') : '# Faces looked at\n\nShortlists from the open type catalogue (Fontsource), each shown with the site\'s own display line on a specimen sheet. The site\'s display face is one of the faces below.\n';
  const round = (before.match(/^## Sheet /gm) ?? []).length + 1;
  const cwd = process.cwd();
  const picked = shortlist(fonts, { category, count, seed: `${path.basename(path.dirname(cwd))}/${path.basename(cwd)}/${category}/${round}` });
  const asked = include.map((name) => fonts.find((font) => font.family.toLowerCase() === name.toLowerCase() || font.id === name.toLowerCase().replace(/\s+/g, '-')) ?? name);
  const unknown = asked.filter((entry) => typeof entry === 'string');
  if (unknown.length) throw Error(`Not in the catalogue: ${unknown.join(', ')}. Write the family name as the catalogue has it.`);
  const sheet = [...asked, ...picked.filter((font) => !asked.includes(font))];
  if (!sheet.length) throw Error(`No face in the category ${category}.`);
  const html = path.join(out, `faces-${round}.html`);
  const png = path.join(out, `faces-${round}.png`);
  writeFileSync(html, specimenHtml(sheet, line));
  let pictured = false;
  try {
    const { createRequire } = await import('node:module');
    let chromium;
    for (const base of [path.join(cwd, 'package.json'), import.meta.url]) { try { ({ chromium } = createRequire(base)('@playwright/test')); break; } catch { /* try the next location */ } }
    if (chromium) {
      const browser = await chromium.launch();
      try {
        const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
        await page.goto(pathToFileURL(path.resolve(html)).href);
        await page.evaluate(() => document.fonts.ready);
        await page.waitForTimeout(400);
        await page.screenshot({ path: png, fullPage: true });
        pictured = true;
      } finally { await browser.close(); }
    }
  } catch (error) { console.error(`The sheet could not be pictured (${error.message.split('\n')[0]}); open ${html} in a browser.`); }
  writeFileSync(record, `${before}\n## Sheet ${round}: ${category}, "${line}"\n\n${sheet.map(faceLine).join('\n')}\n`);
  const shown = (file) => file.split(path.sep).join('/');
  console.log(`${sheet.length} ${category} faces with the line "${line}": ${pictured ? shown(png) : shown(html)}`);
  for (const [index, font] of sheet.entries()) console.log(`  ${String(index + 1).padStart(2)}. ${font.family}${asked.includes(font) ? ' (asked for)' : ''}`);
  console.log(`Open ${pictured ? shown(png) : shown(html)} and look. Choose the face whose letters are built like the lettering in your pictures (audit/world/notes.md), not the one you already knew. If none fits, run the command again for a new sheet, or with another kind of lettering (${FACE_CATEGORIES.join(', ')}). The faces are recorded in ${shown(record)}; check:art-direction checks that the display face in the record is one of them.`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  try {
    const options = parseArgs(process.argv.slice(2));
    if (options.help) console.log('Usage: npm run design:world -- search "<the thing>" [--limit 12]\n       npm run design:world -- get <number>[,<number>] [--out audit/world] [--width 1280]\n       npm run design:world -- palette <folder or photographs> [--colours 6]\n       npm run design:world -- faces <kind of lettering> --text "<display line>" [--count 8] [--include "<family>"]   kinds: ' + FACE_CATEGORIES.join(', ') + '\nFinds pictures of the subject\'s own things on Wikimedia Commons, saves the chosen ones with their source and licence, reads the colours of the client\'s photographs, and shows a shortlist of open typefaces with the site\'s own display line.');
    else if (options.command === 'search') await search(options.subject, options.limit);
    else if (options.command === 'get') await get(options.ids, options.out, options.width);
    else if (options.command === 'faces') await faces(options.subject, options);
    else await palette(options.subject, options.colours);
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
