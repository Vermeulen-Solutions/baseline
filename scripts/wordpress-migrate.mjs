import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { captureExporter, captureWXR, probeWordPress } from './wordpress-source.mjs';
import { planStatic, applyStatic } from './wordpress-static.mjs';
import { fact, readBundle, readBytes, jsonBytes, privateDirectory, writeBundle, WordPressMigrationError } from './wordpress-io.mjs';

const xml = value => String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const cdata = value => '<![CDATA[' + String(value ?? '').replace(/\]\]>/g, ']]]]><![CDATA[>') + ']]>';
const element = (name, value) => '<' + name + '>' + xml(value) + '</' + name + '>';
/** The native CMS remains the EmDash writer; the snapshot can supply a standard WXR input. */
export function planEmdash({ capture, out, root = process.cwd() }) {
  const bundle = readBundle(capture, 'baseline-wordpress-capture'), snapshot = JSON.parse(bundle.files.get('snapshot.json'));
  fact(snapshot.complete, 'Complete capture required for an EmDash handoff');
  const items = [], catalog = new Map();
  for (const record of snapshot.records) {
    const meta = Object.entries(record.meta ?? {}).map(([key, value]) => '<wp:postmeta>' + element('wp:meta_key', key) + '<wp:meta_value>' + cdata(typeof value === 'string' ? value : JSON.stringify(value)) + '</wp:meta_value></wp:postmeta>');
    if (record.featuredMedia && !Object.hasOwn(record.meta ?? {}, '_thumbnail_id')) meta.push('<wp:postmeta>' + element('wp:meta_key', '_thumbnail_id') + element('wp:meta_value', record.featuredMedia) + '</wp:postmeta>');
    const terms = Object.entries(record.taxonomies ?? {}).flatMap(([domain, values]) => values.map(term => {
      catalog.set(domain + ':' + term.slug, { ...term, domain });
      return '<category domain="' + xml(domain) + '" nicename="' + xml(term.slug) + '">' + cdata(term.name) + '</category>';
    })).join('');
    items.push('<item>' + element('title', record.title) + element('link', record.permalink) + element('wp:post_id', record.id) + element('wp:post_type', record.type) + element('wp:status', record.status) + element('wp:post_name', record.slug) + element('wp:post_parent', record.parent ?? 0) + element('wp:menu_order', record.menuOrder ?? 0) + element('wp:post_date_gmt', record.date) + element('wp:post_modified_gmt', record.modified) + element('dc:creator', record.author) + '<content:encoded>' + cdata(record.html) + '</content:encoded><excerpt:encoded>' + cdata(record.excerpt) + '</excerpt:encoded>' + meta.join('') + terms + '</item>');
  }
  for (const media of snapshot.media) items.push('<item>' + element('title', media.title) + element('wp:post_id', media.id) + element('wp:post_type', 'attachment') + element('wp:status', 'inherit') + element('wp:attachment_url', media.url) + '<excerpt:encoded>' + cdata(media.caption) + '</excerpt:encoded><wp:postmeta>' + element('wp:meta_key', '_wp_attachment_image_alt') + '<wp:meta_value>' + cdata(media.alt) + '</wp:meta_value></wp:postmeta></item>');
  const terms = [...catalog.values()].map((term, index) => {
    const id = element('wp:term_id', term.id ?? index + 1);
    if (term.domain === 'category') return '<wp:category>' + id + element('wp:category_nicename', term.slug) + element('wp:cat_name', term.name) + '</wp:category>';
    if (term.domain === 'post_tag') return '<wp:tag>' + id + element('wp:tag_slug', term.slug) + element('wp:tag_name', term.name) + '</wp:tag>';
    return '<wp:term>' + id + element('wp:term_taxonomy', term.domain) + element('wp:term_slug', term.slug) + element('wp:term_name', term.name) + '</wp:term>';
  }).join('');
  const wxr = '<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0" xmlns:wp="http://wordpress.org/export/1.2/" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:excerpt="http://wordpress.org/export/1.2/excerpt/" xmlns:dc="http://purl.org/dc/elements/1.1/"><channel>' + element('title', snapshot.analysis?.site?.title ?? snapshot.analysis?.title ?? '') + element('link', snapshot.source.url) + element('wp:wxr_version', '1.2') + terms + items.join('\n') + '</channel></rss>\n';
  const handoff = {
    version: 1, captureSHA256: bundle.sha256, sourceURL: snapshot.source.url, importPath: '/_emdash/admin/import/wordpress',
    preferred: 'Use the native EmDash import wizard with the same exporter connection to retain supported menus, settings, custom fields and SEO. Supply credentials privately in the wizard.',
    snapshotFallback: 'Upload native-import.xml in the native wizard. This WXR handoff retains standard records, statuses, original HTML, terms, attachment URLs and raw postmeta. It does not provide full exporter parity for custom fields, locales, menus, settings or SEO.',
    media: 'The native importer downloads original source URLs again; the source must remain reachable. Captured local media is a recovery archive, not an automatic CMS upload.',
    sourceReview: 'Review actual mappings and source-specific unsupported behavior. No seed, SQL writes, production imports or publication is performed by this command.',
  };
  const directory = privateDirectory(out, root);
  if (snapshot.source.kind === 'wxr' && bundle.files.has('source.xml')) handoff.snapshotFallback = 'Upload native-import.xml, which retains the original captured WXR bytes, in the native wizard. Source metadata fidelity remains subject to the native WXR importer contract.';
  const receipt = writeBundle(directory, new Map([['native-import.xml', bundle.files.get('source.xml') ?? wxr], ['handoff.json', jsonBytes(handoff)]]), 'baseline-wordpress-emdash-handoff');
  return { directory, sha256: receipt.sha256, records: snapshot.records.length, media: snapshot.media.length, next: handoff.importPath, exitCode: 0 };
}

const help = [
  'WordPress migration: first-party exporter capture shared by every Baseline profile.',
  'npm run migration:wordpress -- probe --url https://wordpress.example',
  'npm run migration:wordpress -- capture --url https://wordpress.example --out <private-backup-dir>',
  '  Supply WORDPRESS_MIGRATION_KEY, or WORDPRESS_USER + WORDPRESS_APP_PASSWORD, in the environment.',
  '  --url may be omitted with a migration key. Repeated --media-origin https://cdn.example allows a media CDN.',
  'npm run migration:wordpress -- capture --wxr <export.xml> --out <private-backup-dir>',
  'npm run migration:wordpress -- plan --capture <capture-dir> --out <new-plan-dir> [--mapping <mapping.json>]',
  '  The installed target profile selects static conversion or the native EmDash handoff.',
  'npm run migration:wordpress -- apply --stage <static-plan-dir> [--review <review.json>]',
  '  Plan and capture directories must be new directories under .baseline/backups or .emdash/backups.',
  'See docs/wordpress-migration.md. All steps are local tooling; apply never publishes or deploys.',
].join('\n');
function argumentsOf(argv) {
  const [command, ...rest] = argv;
  fact(['probe', 'capture', 'plan', 'apply'].includes(command), 'Choose probe, capture, plan or apply; use --help for usage');
  const options = { command, mediaOrigins: [] };
  for (let index = 0; index < rest.length; index += 2) {
    const flag = rest[index], value = rest[index + 1];
    fact(['--url', '--wxr', '--out', '--capture', '--mapping', '--stage', '--review', '--media-origin'].includes(flag) && value && !value.startsWith('--'), 'Unknown or missing WordPress migration argument');
    if (flag === '--media-origin') options.mediaOrigins.push(value);
    else { const key = flag.slice(2); fact(!Object.hasOwn(options, key), 'Duplicate WordPress migration argument'); options[key] = value; }
  }
  const allowed = { probe: ['url'], capture: ['url', 'wxr', 'out', 'mediaOrigins'], plan: ['capture', 'out', 'mapping'], apply: ['stage', 'review'] }[command];
  for (const key of Object.keys(options)) fact(key === 'command' || key === 'mediaOrigins' && !options.mediaOrigins.length || allowed.includes(key), 'Argument does not apply to the selected operation');
  return options;
}
export async function runWordPress(argv, { root = process.cwd(), env = process.env, request } = {}) {
  if (argv.length === 1 && argv[0] === '--help') return { help, exitCode: 0 };
  const options = argumentsOf(argv);
  if (options.command === 'probe') { fact(options.url, 'Probe needs --url'); return { ...await probeWordPress(options.url, { request }), exitCode: 0 }; }
  if (options.command === 'capture') {
    fact(options.out && !(options.wxr && options.url), 'Capture needs --out and exactly one source');
    const result = options.wxr ? await captureWXR({ ...options, root }, { request }) : await captureExporter({ ...options, root, env }, { request });
    return { directory: result.directory, sha256: result.sha256, records: result.records, media: result.media, failures: result.failures, exitCode: result.exitCode };
  }
  if (options.command === 'plan') {
    fact(options.capture && options.out, 'Plan needs --capture and --out');
    const profileFile = path.join(root, 'baseline.config.json');
    const profile = fs.existsSync(profileFile) ? JSON.parse(readBytes(profileFile)).platformProfile : 'emdash';
    if (profile === 'emdash') { fact(!options.mapping, 'Native EmDash mappings belong in the import wizard'); return planEmdash({ ...options, root }); }
    return planStatic({ ...options, root, mapping: options.mapping ? JSON.parse(readBytes(options.mapping)) : {} });
  }
  fact(options.stage, 'Apply needs --stage');
  return applyStatic({ ...options, root, review: options.review ? JSON.parse(readBytes(options.review)) : undefined });
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const result = await runWordPress(process.argv.slice(2));
    console.log(result.help ?? JSON.stringify(result, null, 2)); process.exitCode = result.exitCode;
  } catch (error) {
    // Never echo raw source responses, keys, application passwords or private content into terminal logs.
    console.error(JSON.stringify({ status: 'refused', message: error instanceof WordPressMigrationError ? error.message : 'WordPress migration could not complete. Check source access, profile, input bytes and documented limits. Private details withheld.', guidance: 'docs/wordpress-migration.md' }));
    process.exitCode = 2;
  }
}
