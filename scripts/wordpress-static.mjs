import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
import { fact, noLinks, inside, safeKey, readBytes, readBundle, privateDirectory, writeBundle, jsonBytes, digest, backupRoot, createFile } from './wordpress-io.mjs';
import { toMarkdown, plainText } from './wordpress-markdown.mjs';
import { prepareImages } from './prepare-images.mjs';
import { analyzeElementor } from './wordpress-elementor.mjs';
import { assessSnapshot, assessmentMarkdown, assessmentReference } from './wordpress-assessment.mjs';

export const collectionModule = [
  "import { defineCollection } from 'astro:content';",
  "import { glob } from 'astro/loaders';",
  "import { z } from 'astro/zod';",
  'export const wordpress = defineCollection({',
  "  loader: glob({ base: './src/content/wordpress', pattern: '**/*.md' }),",
  '  schema: ({ image }) => z.object({',
  '    title: z.string().min(1), description: z.string(), draft: z.boolean(),',
  '    sourceId: z.string(), sourceType: z.string(), sourcePath: z.string(), path: z.string(),',
  '    publishedAt: z.coerce.date().optional(), modifiedAt: z.coerce.date().optional(),',
  '    author: z.string().optional(), locale: z.string().optional(), translationGroup: z.string().optional(),',
  '    canonical: z.string().optional(), seoTitle: z.string().optional(), noindex: z.boolean().default(false), nofollow: z.boolean().default(false),',
  '    hero: image().optional(), heroAlt: z.string().optional(),',
  '  }),',
  '});', '',
].join('\n');
export const entryComponent = [
  '---',
  "import { getEntry, render } from 'astro:content';",
  "import Base from '../layouts/Base.astro';",
  "import Section from './Section.astro';",
  "import Container from './Container.astro';",
  "import RichText from './RichText.astro';",
  "import ResponsiveImage from './ResponsiveImage.astro';",
  'interface Props { id: string; }',
  "const entry = await getEntry('wordpress', Astro.props.id);",
  "if (!entry || entry.data.draft) throw new Error('Published WordPress entry unavailable');",
  'const { Content } = await render(entry);',
  'const data = entry.data;',
  "const imageTypes: Record<string, string> = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp', avif: 'image/avif', gif: 'image/gif', svg: 'image/svg+xml', tiff: 'image/tiff' };",
  'const image = data.hero ? { src: data.hero.src, alt: data.heroAlt, width: data.hero.width, height: data.hero.height, mimeType: imageTypes[data.hero.format] } : undefined;',
  '---',
  '<Base title={data.seoTitle ?? data.title} description={data.description} image={image} pageType={data.sourceType === "post" ? "article" : "website"} publishedAt={data.publishedAt} modifiedAt={data.modifiedAt} author={data.author} canonical={data.canonical} robots={data.noindex || data.nofollow ? (data.noindex ? "noindex" : "index") + "," + (data.nofollow ? "nofollow" : "follow") : undefined}>',
  '  <Section labelledBy="wordpress-title"><Container breakout class="flow">',
  '    <header><h1 id="wordpress-title">{data.title}</h1></header>',
  '    {data.hero && <figure class="content--feature"><ResponsiveImage src={data.hero} alt={data.heroAlt ?? ""} loading="eager" fetchpriority="high" /></figure>}',
  '    <RichText><Content /></RichText>',
  '  </Container></Section>',
  '</Base>', '',
].join('\n');

export function registerCollection(source) {
  const ast = ts.createSourceFile('content.config.ts', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  fact(ast.parseDiagnostics.length === 0, 'Existing collection configuration cannot be parsed');
  let object;
  for (const statement of ast.statements) {
    if (!ts.isVariableStatement(statement) || !statement.modifiers?.some(modifier => modifier.kind === ts.SyntaxKind.ExportKeyword)) continue;
    for (const declaration of statement.declarationList.declarations) if (declaration.name.getText(ast) === 'collections' && declaration.initializer && ts.isObjectLiteralExpression(declaration.initializer)) object = declaration.initializer;
  }
  fact(object && !object.properties.some(property => ts.isSpreadAssignment(property) || property.name?.getText(ast).replace(/['"]/g, '') === 'wordpress'), 'Expose collections as an object without spreads or an existing wordpress collection; merge the staged collection manually otherwise');
  const at = object.getEnd() - 1;
  return "import { wordpress } from './wordpress.collection';\n" + source.slice(0, at) + (object.properties.length && !object.properties.hasTrailingComma ? ', ' : '') + 'wordpress' + source.slice(at);
}

export const sveltiaCollection = {
  name: 'wordpress', label: 'Imported WordPress content', folder: 'src/content/wordpress', create: false, extension: 'md', format: 'yaml-frontmatter',
  media_folder: '/src/assets/wordpress', public_folder: '../../assets/wordpress',
  fields: [
    { name: 'title', label: 'Title', widget: 'string' }, { name: 'description', label: 'Description', widget: 'text', required: false },
    { name: 'draft', label: 'Draft', widget: 'boolean', default: false },
    ...['sourceId', 'sourceType', 'sourcePath', 'path'].map(name => ({ name, widget: 'hidden' })),
    ...['publishedAt', 'modifiedAt'].map(name => ({ name, label: name === 'publishedAt' ? 'Publication date' : 'Last modified', widget: 'datetime', required: false })),
    ...['author', 'locale', 'translationGroup', 'canonical', 'seoTitle', 'heroAlt'].map(name => ({ name, label: name, widget: 'string', required: false })),
    { name: 'noindex', label: 'Hide from search engines', widget: 'boolean', default: false, required: false },
    { name: 'nofollow', label: 'Do not follow page links', widget: 'boolean', default: false, required: false },
    { name: 'hero', label: 'Hero image', widget: 'image', required: false },
    { name: 'body', label: 'Body', widget: 'markdown' },
  ],
};

export function routePath(value) {
  fact(typeof value === 'string' && value.startsWith('/') && !value.startsWith('//') && !/[?#\\\u0000-\u001f]/.test(value) && !/%2f|%5c/i.test(value), 'Use an explicit pathname for query permalinks or unsafe paths');
  let decoded;
  try { decoded = decodeURIComponent(value); } catch { throw new Error('Malformed source pathname'); }
  fact(!/[\\:[\]?#%<>"{}]/.test(decoded) && !decoded.split('/').some(part => part === '.' || part === '..') && !/^\/(?:_emdash|_styleguide|admin|api)(?:\/|$)/.test(decoded), 'Reserved or unsafe source pathname');
  fact(!decoded.split('/').some(part => /^(?:CON|PRN|AUX|NUL|COM[0-9]|LPT[0-9])(?:\.|$)/i.test(part) || /[. ]$/.test(part)), 'Source pathname is not portable to supported filesystems');
  return '/' + decoded.split('/').filter(Boolean).join('/') + (value.endsWith('/') && value !== '/' ? '/' : '');
}
const routeFile = pathname => 'src/pages/' + (pathname === '/' ? 'index' : pathname.replace(/^\/|\/$/g, '')) + '.astro';
const date = raw => {
  if (!raw || /^0000/.test(raw)) return undefined;
  const parsed = new Date(/[zZ]|[+-]\d\d:\d\d$/.test(raw) ? raw : raw + 'Z');
  return Number.isFinite(parsed.getTime()) ? parsed.toISOString() : undefined;
};
const frontmatter = data => '---\n' + Object.entries(data).filter(([, value]) => value !== undefined).map(([key, value]) => key + ': ' + JSON.stringify(value)).join('\n') + '\n---\n\n';
const readJSON = file => JSON.parse(readBytes(file).toString('utf8'));
function staticProfile(root) {
  const profile = readJSON(path.join(root, 'baseline.config.json'));
  fact(profile.foundation === 'static' && ['static', 'static-sveltia'].includes(profile.platformProfile), 'Static output requires a generated static or static-sveltia target');
  return profile.platformProfile;
}
function routeConflicts(root, target, pathname) {
  const relative = target.slice('src/pages/'.length).replace(/\.astro$/, ''), directory = path.join(root, 'src/pages');
  const possibilities = [relative + '.astro', relative + '.md', relative + '.mdx', relative + '/index.astro', relative + '/index.md', relative + '/index.mdx'];
  fact(!possibilities.some(file => fs.existsSync(noLinks(path.join(directory, file)))), 'An existing route owns a source pathname; use a reviewed mapping or rebuild that route from the capture');
  const publicPaths = pathname === '/' ? ['index.html'] : [pathname.replace(/^\/|\/$/g, ''), pathname.replace(/^\/|\/$/g, '') + '.html', pathname.replace(/^\/|\/$/g, '') + '/index.html'];
  fact(!publicPaths.some(relative => { const file = noLinks(path.join(root, 'public', relative)); return fs.existsSync(file) && fs.statSync(file).isFile(); }), 'An existing public file owns a source pathname; map the route explicitly');
  // Existing catch-all routes can shadow every proposed page. Refuse instead of guessing precedence.
  const parts = relative.split('/');
  for (let index = 0; index < parts.length; index++) {
    const parent = noLinks(path.join(directory, ...parts.slice(0, index)));
    if (fs.existsSync(parent)) fact(!fs.readdirSync(parent).some(name => name.includes('[')), 'An existing dynamic route needs a reviewed route integration');
  }
}

export function planStatic({ capture, out, root = process.cwd(), mapping = {}, assessment }) {
  root = noLinks(root);
  const profile = staticProfile(root), source = readBundle(capture, 'baseline-wordpress-capture');
  const snapshot = JSON.parse(source.files.get('snapshot.json'));
  const sourceAssessment = assessmentReference(assessment, source.sha256);
  fact(snapshot.version === 1 && snapshot.complete && Array.isArray(snapshot.records) && Array.isArray(snapshot.media), 'Complete capture required before static conversion');
  fact(mapping && (!Object.keys(mapping).length || mapping.version === 1) && Object.keys(mapping).every(key => ['version', 'records', 'media'].includes(key)), 'Unsupported mapping document');
  for (const key of ['records', 'media']) fact(mapping[key] === undefined || mapping[key] && typeof mapping[key] === 'object' && !Array.isArray(mapping[key]), 'Mapping groups must be objects');
  fact(Object.keys(mapping.records ?? {}).every(key => snapshot.records.some(record => record.key === key)) && Object.keys(mapping.media ?? {}).every(key => snapshot.media.some(item => String(item.id) === key)), 'Mapping names an unknown source identity');
  const directory = privateDirectory(out, root), sourceOrigin = new URL(snapshot.source.url).origin;
  const payload = new Map(), edits = [], findings = [], routes = [], exclusions = [], used = new Set(), targets = new Set();
  const addFinding = (entity, code, message, severity = 'review') => {
    const id = digest(JSON.stringify([entity, code, message])).slice(0, 24);
    if (!findings.some(item => item.id === id)) findings.push({ id, entity, code, message, severity });
  };
  function output(target, value, replace = false) {
    fact(safeKey(target) && !targets.has(target), 'Duplicate or unsafe planned target'); targets.add(target);
    const bytes = Buffer.isBuffer(value) ? value : Buffer.from(value), targetFile = noLinks(path.join(root, target));
    const exists = fs.existsSync(targetFile);
    fact(replace || !exists, 'Migration would overwrite an existing file: ' + target);
    const key = 'payload/' + target; payload.set(key, bytes);
    const before = exists ? readBytes(targetFile) : null;
    if (before) payload.set('before/' + target, before);
    edits.push({ target, payload: key, beforeSHA256: before ? digest(before) : null, afterSHA256: digest(bytes) });
  }
  const mediaById = new Map(snapshot.media.map(item => [item.id, item]));
  const mediaByURL = new Map();
  for (const item of snapshot.media) {
    const url = new URL(item.url); url.hash = '';
    // Equal URLs can refer to distinct attachment identities. Do not silently pick metadata.
    if (!mediaByURL.has(url.href)) mediaByURL.set(url.href, item);
    else mediaByURL.set(url.href, null);
  }
  const resolveMedia = (url, id) => {
    url = new URL(url); url.hash = '';
    const item = id ? mediaById.get(id) : mediaByURL.get(url.href);
    if (item) used.add(item.id);
    return item;
  };
  const published = snapshot.records.filter(record => record.status === 'publish');
  for (const record of published) {
    const override = mapping.records?.[record.key] ?? {};
    fact(Object.keys(override).every(key => ['path', 'title', 'description', 'excludeReason'].includes(key)) && ['path', 'title', 'description', 'excludeReason'].every(key => override[key] === undefined || typeof override[key] === 'string'), 'Unsupported record mapping');
    if (override.excludeReason) { fact(Object.keys(override).length === 1 && typeof override.excludeReason === 'string' && override.excludeReason.trim().length >= 5, 'Exclusion needs a concrete reason and cannot also remap content'); exclusions.push({ key: record.key, reason: override.excludeReason }); continue; }
    if (record.type === 'elementor_library') { fact(!Object.keys(override).length, 'Elementor templates are reference-only; rebuild their usage through native site components'); exclusions.push({ key: record.key, reason: 'Elementor template/settings retained privately for reconstruction; not an ordinary public page.' }); continue; }
    const permalink = record.permalink ? new URL(record.permalink) : null;
    fact(override.path || permalink && !permalink.search, 'Record needs an explicit mapping path: ' + record.key);
    const pathname = routePath(override.path ?? permalink.pathname), target = routeFile(pathname);
    fact(!/\.[a-z0-9]{1,8}\/?$/i.test(pathname), 'Map file-style permalinks to a directory pathname and preserve the original through an explicit redirect');
    routeConflicts(root, target, pathname);
    fact(!routes.some(route => route.path.replace(/\/$/, '') === pathname.replace(/\/$/, '')), 'Two WordPress records map to the same public route');
    const id = 'wp-' + record.type + '-' + record.id;
    routes.push({ key: record.key, id, sourcePath: permalink ? permalink.pathname + permalink.search : null, path: pathname });
  }
  fact(routes.length > 0, 'No published records selected for static output');
  const recordRoutes = new Map(routes.map(route => [route.key, route]));
  const byPermalink = new Map(snapshot.records.filter(record => record.permalink && recordRoutes.has(record.key)).map(record => { const url = new URL(record.permalink); return [url.pathname.replace(/\/$/, '') + url.search, recordRoutes.get(record.key).path]; }));
  const convert = (record, destinations = null) => toMarkdown(record.html, {
    base: record.permalink ?? snapshot.source.url,
    media: (url, id) => { const item = resolveMedia(url, id); return item ? destinations?.get(item.id) ?? '/verified-media/' + item.id : null; },
    link: url => {
      const identity = new URL(url); identity.hash = '';
      const attachment = mediaByURL.get(identity.href);
      if (attachment) { used.add(attachment.id); return destinations?.get(attachment.id) ?? '/verified-media/' + attachment.id; }
      if (mediaByURL.has(identity.href)) addFinding(record.key, 'ambiguous-media', 'A media URL names several attachment identities; resolve its mapping', 'blocked');
      if (url.origin !== sourceOrigin) return url.href;
      if (url.pathname.includes('/wp-content/uploads/')) addFinding(record.key, 'unmapped-media-link', 'A source upload link has no verified attachment mapping', 'blocked');
      return (byPermalink.get(url.pathname.replace(/\/$/, '') + url.search) ?? url.pathname + url.search) + url.hash;
    },
    finding: (code, message) => addFinding(record.key, code, message, code === 'missing-image' ? 'blocked' : 'review'),
  });
  for (const record of published.filter(record => recordRoutes.has(record.key))) {
    convert(record);
    if (record.featuredMedia) { fact(mediaById.has(record.featuredMedia), 'Featured attachment was not captured'); used.add(record.featuredMedia); }
  }
  const destinations = new Map(), assetOutputs = new Map();
  for (const id of used) {
    const item = mediaById.get(id); fact(item.file && source.files.has(item.file), 'Referenced media bytes are unavailable');
    const original = source.files.get(item.file);
    fact(digest(original) === item.sha256, 'Captured media identity differs from its bytes');
    let bytes = original, target;
    if (/^image\//.test(item.mime_type ?? '')) {
      const policy = mapping.media?.[String(id)] ?? {};
      fact(Object.keys(policy).every(key => ['preset', 'maxEdge', 'quality', 'maxBytes', 'reason'].includes(key)), 'Media mappings may only adjust preparation policy');
      const prepared = prepareImages({ source: path.join(source.directory, item.file), out: path.join(directory, 'preparation', String(id)), ...policy }, { projectRoot: root });
      fact(prepared.status === 'ready', 'Image needs a reviewed preparation policy before import: ' + id);
      const manifest = readJSON(prepared.manifest), entry = manifest.entries[0];
      bytes = readBytes(path.join(path.dirname(prepared.manifest), entry.output.path), 32 * 1024 * 1024);
      target = 'src/assets/wordpress/' + id + '-' + digest(bytes).slice(0, 16) + '.' + entry.output.extension;
      destinations.set(id, '../../assets/wordpress/' + path.posix.basename(target));
    } else {
      fact(['application/pdf', 'video/mp4', 'audio/mpeg'].includes(item.mime_type), 'Document/media MIME needs an explicit supported export: ' + id);
      target = 'public/wordpress-downloads/' + id + '-' + digest(bytes).slice(0, 16) + path.posix.extname(item.file);
      destinations.set(id, '/wordpress-downloads/' + path.posix.basename(target));
    }
    output(target, bytes); assetOutputs.set(id, { target, sha256: digest(bytes) });
  }
  for (const record of published.filter(record => recordRoutes.has(record.key))) {
    const route = recordRoutes.get(record.key), override = mapping.records?.[record.key] ?? {};
    const builder = analyzeElementor(record);
    if (builder?.requiresRecovery) addFinding(record.key, 'elementor-content', 'Elementor content is missing from saved HTML or its layout data is unavailable. Recover/rebuild it from assessment.json and source evidence, or explicitly exclude this record from generic conversion.', 'blocked');
    else if (builder) addFinding(record.key, 'elementor-layout', 'Elementor layout, responsive settings, dynamic widgets and interactions need a native rebuild and rendered review');
    if (!plainText(record.html) && !builder && !/<(?:img|video|audio|picture)\b/i.test(record.html)) addFinding(record.key, 'empty-body', 'Saved source HTML contains no visible body; inspect templates and intentional empty pages before acceptance');
    if (Object.values(record.taxonomies ?? {}).some(values => Array.isArray(values) && values.length)) addFinding(record.key, 'taxonomy-model', 'Taxonomy assignments remain in the private capture; model required categories/tags and their routes before acceptance');
    if (!['post', 'page'].includes(record.type)) addFinding(record.key, 'content-model', 'A custom post type is preserved as generic Markdown; confirm its content model');
    if (Object.keys(record.meta ?? {}).length || record.acf) addFinding(record.key, 'custom-fields', 'Raw custom fields remain in the private capture; map required values before migration acceptance');
    if (record.locale) addFinding(record.key, 'locale-routing', 'Source locale and translation group are retained; verify site language configuration and translated navigation');
    const pick = key => [record.yoast?.[key], record.rankmath?.[key]].find(value => typeof value === 'string' && value.trim());
    const seo = record.yoast ?? record.rankmath ?? {};
    let seoTitle = pick('title');
    if (seoTitle && /%%|%[a-z_]+%/.test(seoTitle)) { seoTitle = undefined; addFinding(record.key, 'seo-template', 'An SEO template needs rendered source values'); }
    const title = override.title ?? plainText(record.title);
    const description = override.description ?? pick('description') ?? plainText(record.excerpt);
    if (!description) addFinding(record.key, 'description', 'No source description/excerpt; provide reviewed page metadata');
    const hero = record.featuredMedia ? destinations.get(record.featuredMedia) : undefined;
    const heroAlt = record.featuredMedia ? mediaById.get(record.featuredMedia).alt : undefined;
    if (hero && typeof heroAlt !== 'string') addFinding(record.key, 'hero-alt', 'Featured image needs verified alternative text');
    const sourcePath = record.permalink ? new URL(record.permalink).pathname : route.path;
    let canonical;
    const canonicalValue = pick('canonical') ?? record.rankmath?.canonical_url;
    if (canonicalValue) {
      const url = new URL(canonicalValue, snapshot.source.url);
      fact(['https:', 'http:'].includes(url.protocol) && !url.username && !url.password, 'SEO canonical uses an unsupported destination');
      canonical = url.origin === sourceOrigin ? (byPermalink.get(url.pathname.replace(/\/$/, '') + url.search) ?? url.pathname + url.search) + url.hash : url.href;
    }
    const robots = Array.isArray(record.rankmath?.robots) ? record.rankmath.robots : [];
    const data = { title: plainText(title), seoTitle: seoTitle ? plainText(seoTitle) : undefined, description: plainText(description), draft: false, sourceId: String(record.id), sourceType: record.type, sourcePath, path: route.path, publishedAt: date(record.date), modifiedAt: date(record.modified), author: record.author || undefined, locale: record.locale || undefined, translationGroup: record.translationGroup ? String(record.translationGroup) : undefined, canonical, noindex: seo.noindex === true || seo.noindex === '1' || robots.includes('noindex'), nofollow: seo.nofollow === true || seo.nofollow === '1' || robots.includes('nofollow'), hero, heroAlt };
    route.metadata = { description: data.description, canonical: data.canonical ?? null, noindex: data.noindex };
    if (!data.title) addFinding(record.key, 'title', 'A title is required', 'blocked');
    output('src/content/wordpress/' + route.id + '.md', frontmatter(data) + convert(record, destinations));
  }
  output('src/pages/[...wordpress].astro', [
    '---',
    "import { getCollection } from 'astro:content';",
    "import WordPressEntry from '../components/WordPressEntry.astro';",
    'export async function getStaticPaths() {',
    "  return (await getCollection('wordpress', entry => !entry.data.draft)).map(entry => ({",
    "    params: { wordpress: entry.data.path.replace(/^\\/+|\\/+$/g, '') || undefined },",
    '    props: { id: entry.id },',
    '  }));',
    '}',
    'interface Props { id: string; }',
    '---',
    '<WordPressEntry id={Astro.props.id} />', '',
  ].join('\n'));
  output('src/wordpress.collection.ts', collectionModule);
  output('src/components/WordPressEntry.astro', entryComponent);
  output('src/content.config.ts', registerCollection(readBytes(path.join(root, 'src/content.config.ts')).toString('utf8')), true);
  if (profile === 'static-sveltia') {
    let config;
    try { config = readJSON(path.join(root, 'public/admin/config.yml')); } catch { throw new Error('Existing Sveltia config must retain the generated JSON syntax; merge the staged collection manually for YAML configs'); }
    fact(Array.isArray(config.collections) && !config.collections.some(collection => collection.name === 'wordpress'), 'Sveltia collection already exists or is unsupported');
    config.collections.push(sveltiaCollection);
    output('public/admin/config.yml', jsonBytes(config), true);
  }
  const plan = {
    version: 1, profile, rootSHA256: digest(root), captureSHA256: source.sha256,
    profileSHA256: digest(readBytes(path.join(root, 'baseline.config.json'))), edits, findings, routes, exclusions,
    assets: [...assetOutputs].map(([id, output]) => ({ id, ...output })),
    retainedUnpublished: snapshot.records.filter(record => record.status !== 'publish').map(record => ({ key: record.key, status: record.status })),
    note: 'Only selected published content and its referenced media are proposed. Draft/private/scheduled content, raw custom metadata, comments, menus and settings remain in the private capture; apply does not claim complete migration acceptance.',
  };
  const assessed = assessSnapshot(snapshot, { profile, plan, captureSHA256: source.sha256, ...(sourceAssessment ? { designKit: sourceAssessment.designKit } : {}) });
  payload.set('assessment.json', jsonBytes(assessed)); payload.set('assessment.md', assessmentMarkdown(assessed));
  if (sourceAssessment) plan.assessmentSHA256 = sourceAssessment.sha256;
  payload.set('plan.json', jsonBytes(plan));
  const receipt = writeBundle(directory, payload, 'baseline-wordpress-static-plan');
  return { directory, sha256: receipt.sha256, routes: routes.length, media: used.size, findings, retainedUnpublished: plan.retainedUnpublished.length, exitCode: findings.length ? 1 : 0 };
}

const allowedTarget = target => /^(?:src\/(?:pages\/.*\.astro|content\/wordpress\/.*\.md|assets\/wordpress\/[^/]+|wordpress\.collection\.ts|components\/WordPressEntry\.astro|content\.config\.ts)|public\/(?:wordpress-downloads\/[^/]+|admin\/config\.yml))$/.test(target);
export function applyStatic({ stage, root = process.cwd(), review }) {
  root = noLinks(root); const profile = staticProfile(root), bundle = readBundle(stage, 'baseline-wordpress-static-plan');
  const plan = JSON.parse(bundle.files.get('plan.json'));
  fact(plan.version === 1 && plan.rootSHA256 === digest(root) && plan.profile === profile && plan.profileSHA256 === digest(readBytes(path.join(root, 'baseline.config.json'))), 'Plan belongs to another target or profile configuration');
  const required = plan.findings ?? [];
  fact(!required.some(finding => finding.severity === 'blocked'), 'Unresolved content or media blocks this plan');
  if (required.length) {
    fact(review?.planSHA256 === bundle.sha256 && Array.isArray(review.findings) && required.every(finding => review.findings.some(item => item.id === finding.id && typeof item.reason === 'string' && item.reason.trim().length >= 5)), 'Provide a reasoned review bound to the exact plan SHA-256 for every finding');
  }
  const lockFile = noLinks(path.join(backupRoot(root), 'wordpress-apply.lock'));
  const lock = fs.openSync(lockFile, 'wx'), completed = [];
  try {
    fact(Array.isArray(plan.edits) && new Set(plan.edits.map(edit => edit.target)).size === plan.edits.length, 'Invalid apply plan');
    for (const edit of plan.edits) {
      fact(safeKey(edit.target) && allowedTarget(edit.target) && edit.payload === 'payload/' + edit.target && bundle.files.has(edit.payload) && digest(bundle.files.get(edit.payload)) === edit.afterSHA256, 'Invalid planned file');
      fact(edit.beforeSHA256 === null || ['src/content.config.ts', 'public/admin/config.yml'].includes(edit.target), 'Only collection/editor integration may edit existing files');
      const file = noLinks(path.join(root, edit.target));
      fact(inside(root, file) && (edit.beforeSHA256 === null ? !fs.existsSync(file) : fs.existsSync(file) && digest(readBytes(file)) === edit.beforeSHA256), 'Target changed or already exists; create a fresh plan');
      if (edit.beforeSHA256 !== null) fact(digest(bundle.files.get('before/' + edit.target)) === edit.beforeSHA256, 'Original bytes are unavailable for recovery');
    }
    createFile(bundle.directory, 'apply-started.json', jsonBytes({ planSHA256: bundle.sha256, state: 'applying' }));
    for (const edit of plan.edits) {
      const file = noLinks(path.join(root, edit.target)), bytes = bundle.files.get(edit.payload);
      fact(edit.beforeSHA256 === null ? !fs.existsSync(file) : digest(readBytes(file)) === edit.beforeSHA256, 'Concurrent target edit; apply stopped');
      fs.mkdirSync(path.dirname(file), { recursive: true });
      if (edit.beforeSHA256 === null) fs.writeFileSync(file, bytes, { flag: 'wx' });
      else {
        const temporary = file + '.wordpress-migration-tmp';
        fs.writeFileSync(temporary, bytes, { flag: 'wx' });
        fs.renameSync(temporary, file);
      }
      completed.push(edit);
    }
    createFile(bundle.directory, 'apply-complete.json', jsonBytes({ planSHA256: bundle.sha256, state: 'complete', files: completed.length }));
    return { status: 'applied', files: completed.length, exitCode: 0 };
  } catch (error) {
    for (const edit of completed.reverse()) {
      const file = noLinks(path.join(root, edit.target));
      if (!fs.existsSync(file) || digest(readBytes(file)) !== edit.afterSHA256) continue;
      if (edit.beforeSHA256 === null) fs.unlinkSync(file);
      else fs.writeFileSync(file, bundle.files.get('before/' + edit.target));
    }
    throw error;
  } finally { fs.closeSync(lock); fs.unlinkSync(lockFile); }
}
