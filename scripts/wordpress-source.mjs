import path from 'node:path';
import { SaxesParser } from 'saxes';
import { WP_LIMITS, fact, sourceURL, requester, privateDirectory, readBytes, jsonBytes, writeBundle, digest } from './wordpress-io.mjs';

export function connection({ url, env = process.env } = {}) {
  let user = env.WORDPRESS_USER, pass = env.WORDPRESS_APP_PASSWORD;
  if (env.WORDPRESS_MIGRATION_KEY) {
    fact(/^em1\.[A-Za-z0-9_-]{1,16000}$/.test(env.WORDPRESS_MIGRATION_KEY), 'Unsupported WordPress migration key');
    let key;
    try { key = JSON.parse(Buffer.from(env.WORDPRESS_MIGRATION_KEY.slice(4), 'base64url').toString('utf8')); }
    catch { throw new Error('Malformed WordPress migration key'); }
    fact(key.v === 1 && typeof key.url === 'string' && typeof key.user === 'string' && typeof key.pass === 'string', 'Unsupported migration key fields');
    fact(!url || sourceURL(url).href === sourceURL(key.url).href, 'Explicit source and migration key name different WordPress sites');
    url = key.url; user = key.user; pass = key.pass;
  }
  const site = sourceURL(url);
  fact(typeof user === 'string' && user.length > 0 && !/[:\r\n]/.test(user) && typeof pass === 'string' && pass.length > 0 && !/[\r\n]/.test(pass), 'Provide WORDPRESS_MIGRATION_KEY or WORDPRESS_USER and WORDPRESS_APP_PASSWORD in the environment');
  return { site, authorization: 'Basic ' + Buffer.from(user + ':' + pass.replace(/\s/g, '')).toString('base64') };
}

export function apiURL(site, endpoint, params = {}, plain = false) {
  fact(/^[a-z]+$/.test(endpoint), 'Unknown exporter endpoint');
  const url = new URL(plain ? site : site.href + 'wp-json/emdash/v1/' + endpoint);
  if (plain) url.searchParams.set('rest_route', '/emdash/v1/' + endpoint);
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, String(value));
  return url;
}

export function exporterAPI({ site, authorization, request } = {}) {
  const get = requester({ request, allowedOrigins: new Set([site.origin]), authorization, sourceOrigin: site.origin });
  return async (endpoint, params = {}, authenticated = true) => {
    let response;
    try { response = await get(apiURL(site, endpoint, params), { authenticated, allowedStatuses: [200, 404] }); }
    catch (error) { throw error; }
    if (response.status === 404) response = await get(apiURL(site, endpoint, params, true), { authenticated });
    fact((response.headers['content-type'] ?? '').includes('json'), 'Exporter returned non-JSON; check source protection and authentication');
    try { return JSON.parse(response.body); }
    catch { throw new Error('Exporter returned malformed JSON'); }
  };
}

async function pages(api, endpoint, params, expected) {
  const items = []; let pageCount;
  for (let page = 1; page <= (pageCount ?? 1); page++) {
    const response = await api(endpoint, { ...params, per_page: 100, page });
    fact(Number.isInteger(response.total) && response.total >= 0 && response.total <= WP_LIMITS.items && Number.isInteger(response.pages) && response.pages >= 0 && response.pages <= WP_LIMITS.pages && response.page === page && Array.isArray(response.items), 'Invalid exporter pagination');
    fact(pageCount === undefined || pageCount === response.pages, 'Exporter pagination changed during capture; retry with a stable source');
    pageCount = response.pages;
    fact(expected === undefined || response.total === expected, 'Exporter count differs from analysis; retry with a stable source');
    items.push(...response.items);
    fact(items.length <= WP_LIMITS.items && (page >= pageCount || response.items.length > 0), 'Incomplete exporter pagination');
    if (page >= pageCount) fact(items.length === response.total, 'Exporter item count is incomplete');
  }
  fact(new Set(items.map(item => item.id)).size === items.length, 'Duplicate source IDs during pagination');
  return items;
}

export async function probeWordPress(url, { request } = {}) {
  const site = sourceURL(url), api = exporterAPI({ site, request });
  const probe = await api('probe', {}, false);
  fact(typeof probe.emdash_exporter === 'string', 'Install the first-party EmDash Exporter in WordPress, then generate a migration key');
  return { source: site.href, exporterVersion: probe.emdash_exporter, needsAuthentication: true, instructions: 'WordPress: Tools > EmDash Migration > Generate migration key. Supply it privately as WORDPRESS_MIGRATION_KEY.' };
}

function recordOf(item, origin) {
  fact(Number.isSafeInteger(item.id) && item.id > 0 && typeof item.post_type === 'string' && /^[a-zA-Z0-9_-]+$/.test(item.post_type) && typeof item.content === 'string' && typeof item.title === 'string' && typeof item.status === 'string', 'Malformed WordPress content record');
  const permalink = item.permalink || null;
  if (permalink) { const url = new URL(permalink); fact(url.origin === origin && !url.username && !url.password, 'Source permalink is outside the WordPress site'); }
  return {
    key: item.post_type + ':' + item.id, id: item.id, type: item.post_type, status: item.status,
    slug: item.slug ?? '', title: item.title, html: item.content, excerpt: item.excerpt ?? '', permalink,
    date: item.date_gmt || null, modified: item.modified_gmt || null,
    locale: item.locale ?? null, translationGroup: item.translation_group ?? null,
    author: item.author?.display_name ?? null, featuredMedia: item.featured_image?.id ?? null,
    parent: item.parent ?? null, menuOrder: item.menu_order ?? null,
    taxonomies: item.taxonomies ?? {}, meta: item.meta ?? {}, acf: item.acf ?? null, yoast: item.yoast ?? null, rankmath: item.rankmath ?? null,
  };
}

export async function captureExporter({ url, env, out, root = process.cwd(), mediaOrigins = [] }, { request } = {}) {
  const { site, authorization } = connection({ url, env });
  const api = exporterAPI({ site, authorization, request });
  const probe = await api('probe', {}, false);
  fact(/^1\.(?:[2-9]|\d{2,})\./.test(probe.emdash_exporter ?? ''), 'Use EmDash Exporter 1.2.0 or later');
  const analysis = await api('analyze');
  fact(Array.isArray(analysis.post_types) && analysis.post_types.length <= 100 && Number.isInteger(analysis.attachments?.count), 'Invalid exporter analysis');
  const records = [];
  for (const type of analysis.post_types) {
    fact(/^[a-zA-Z0-9_-]+$/.test(type.name) && Number.isInteger(type.total), 'Invalid source post type');
    if (type.name === 'attachment') continue;
    const items = await pages(api, 'content', { post_type: type.name, status: 'any' }, type.total);
    records.push(...items.map(item => recordOf(item, site.origin)));
    fact(records.length <= WP_LIMITS.items, 'Content item limit exceeded');
  }
  fact(new Set(records.map(item => item.key)).size === records.length, 'Duplicate WordPress record identity');
  const media = await pages(api, 'media', {}, analysis.attachments.count);
  const extras = {};
  for (const endpoint of ['taxonomies', 'options', 'menus']) extras[endpoint] = await api(endpoint);
  extras.comments = await pages(api, 'comments', {});
  // Reconcile counts after collection; this cannot establish a transactional source snapshot.
  const after = await api('analyze');
  fact(JSON.stringify(after.post_types?.map(type => [type.name, type.total, type.by_status])) === JSON.stringify(analysis.post_types.map(type => [type.name, type.total, type.by_status])) && after.attachments?.count === analysis.attachments.count, 'WordPress counts changed while capturing; retry after a source freeze');
  return saveCapture({ version: 1, source: { kind: 'exporter', url: site.href, exporterVersion: probe.emdash_exporter }, capturedAt: new Date().toISOString(), records, media, analysis, extras }, { out, root, mediaOrigins, request });
}

/** WXR parsing retains raw postmeta strings. It never evaluates PHP or expands entities/DTDs. */
export function parseWXR(bytes) {
  fact(bytes.length <= WP_LIMITS.responseBytes, 'WXR exceeds the input bound');
  const parser = new SaxesParser({ xmlns: false });
  const stack = [], items = []; let site = null, title = '', current = null, meta = null;
  parser.on('doctype', () => { throw new Error('WXR DTDs and external entities are refused'); });
  parser.on('error', () => { throw new Error('Malformed WXR XML'); });
  parser.on('opentag', node => {
    fact(stack.length < 100, 'WXR nesting limit exceeded');
    stack.push({ name: node.name, text: '', attributes: node.attributes });
    if (node.name === 'item') { fact(!current, 'Nested WXR items'); current = { values: {}, meta: {}, categories: [] }; }
    if (node.name === 'wp:postmeta') meta = {};
  });
  const append = value => { if (stack.length) { const node = stack.at(-1); node.text += value; fact(node.text.length <= WP_LIMITS.responseBytes, 'WXR field exceeds bound'); } };
  parser.on('text', append); parser.on('cdata', append);
  parser.on('closetag', () => {
    const node = stack.pop(), parent = stack.at(-1)?.name;
    if (!current && parent === 'channel' && node.name === 'link') site = node.text;
    if (!current && parent === 'channel' && node.name === 'title') title = node.text;
    if (current) {
      if (parent === 'item') current.values[node.name] = node.text;
      if (node.name === 'category' && parent === 'item') current.categories.push({ domain: node.attributes.domain ?? 'category', slug: node.attributes.nicename ?? node.text, name: node.text });
      if (meta && parent === 'wp:postmeta') meta[node.name] = node.text;
      if (node.name === 'wp:postmeta') { fact(meta['wp:meta_key'], 'WXR postmeta key missing'); current.meta[meta['wp:meta_key']] = meta['wp:meta_value'] ?? ''; meta = null; }
      if (node.name === 'item') { items.push(current); current = null; fact(items.length <= WP_LIMITS.items, 'WXR item limit exceeded'); }
    }
  });
  parser.write(new TextDecoder('utf-8', { fatal: true }).decode(bytes)).close();
  fact(site && items.length > 0, 'WXR needs a channel source URL and content items');
  const source = sourceURL(site), media = [], records = [];
  for (const item of items) {
    const value = item.values, id = Number(value['wp:post_id']), type = value['wp:post_type'];
    fact(Number.isSafeInteger(id) && id > 0 && type, 'WXR item identity missing');
    if (type === 'attachment') {
      media.push({ id, url: value['wp:attachment_url'], title: value.title ?? '', alt: item.meta._wp_attachment_image_alt ?? '', caption: value['excerpt:encoded'] ?? '', mime_type: null, originalFile: item.meta._wp_attached_file ?? null });
    } else if (!['nav_menu_item', 'revision', 'acf-field', 'acf-field-group', 'acf_field', 'acf_field_group'].includes(type)) {
      const taxonomies = {};
      for (const term of item.categories) (taxonomies[term.domain] ??= []).push(term);
      records.push(recordOf({ id, post_type: type, status: value['wp:status'], slug: value['wp:post_name'], title: value.title ?? '', content: value['content:encoded'] ?? '', excerpt: value['excerpt:encoded'] ?? '', permalink: value.link || null, date_gmt: value['wp:post_date_gmt']?.replace(' ', 'T'), modified_gmt: value['wp:post_modified_gmt']?.replace(' ', 'T'), parent: Number(value['wp:post_parent']) || null, menu_order: Number(value['wp:menu_order']) || null, author: { display_name: value['dc:creator'] ?? null }, featured_image: item.meta._thumbnail_id ? { id: Number(item.meta._thumbnail_id) } : null, meta: item.meta, taxonomies }, source.origin));
    }
  }
  fact(new Set([...records.map(item => String(item.id)), ...media.map(item => String(item.id))]).size === records.length + media.length, 'Duplicate WXR source identities');
  return { version: 1, source: { kind: 'wxr', url: source.href }, capturedAt: new Date().toISOString(), records, media, analysis: { title }, extras: {}, limitations: ['WXR source metadata, custom fields, translations, menus and settings need source-specific review; raw postmeta is retained without PHP evaluation.'] };
}

export async function captureWXR({ wxr, out, root = process.cwd(), mediaOrigins = [] }, { request } = {}) {
  const bytes = readBytes(wxr), snapshot = parseWXR(bytes);
  snapshot.source.originalXMLSHA256 = digest(bytes);
  return saveCapture(snapshot, { out, root, mediaOrigins, request, sourceFiles: new Map([['source.xml', bytes]]) });
}

const mimeExtension = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/avif': 'avif', 'image/gif': 'gif', 'image/svg+xml': 'svg', 'application/pdf': 'pdf', 'video/mp4': 'mp4', 'audio/mpeg': 'mp3' };
export async function saveCapture(snapshot, { out, root = process.cwd(), mediaOrigins = [], request, sourceFiles = new Map() } = {}) {
  const directory = privateDirectory(out, root), source = new URL(snapshot.source.url);
  const allowedOrigins = new Set([source.origin, ...mediaOrigins.map(value => sourceURL(value).origin)]);
  const get = requester({ request, allowedOrigins, sourceOrigin: source.origin });
  const files = new Map(sourceFiles), failures = []; let total = 0;
  fact(snapshot.media.length <= WP_LIMITS.items, 'Media item limit exceeded');
  const seen = new Set();
  for (const item of snapshot.media) {
    fact(Number.isSafeInteger(item.id) && item.id > 0 && !seen.has(item.id) && typeof item.url === 'string', 'Malformed or duplicate media identity'); seen.add(item.id);
    try {
      const url = new URL(item.url), response = await get(url, { maxBytes: WP_LIMITS.mediaBytes });
      const contentType = (response.headers['content-type'] ?? '').split(';')[0].trim().toLowerCase();
      fact(!['text/html', 'application/xhtml+xml'].includes(contentType) && response.body.length > 0, 'Media endpoint returned an error page or empty file');
      const extension = mimeExtension[contentType] ?? (path.extname(url.pathname).slice(1).toLowerCase().match(/^[a-z0-9]{1,8}$/)?.[0] || 'bin');
      item.file = 'media/' + item.id + '.' + extension; item.sha256 = digest(response.body); item.mime_type = contentType || item.mime_type;
      total += response.body.length; fact(total <= WP_LIMITS.totalBytes, 'Media total exceeds bound'); files.set(item.file, response.body);
    } catch {
      item.file = null; failures.push({ id: item.id, code: 'media-unavailable', message: 'Media could not be read within HTTPS/origin/size limits. Check reachability or declare its CDN with --media-origin.' });
    }
  }
  snapshot.failures = failures; snapshot.complete = failures.length === 0;
  const data = jsonBytes(snapshot); fact(data.length <= WP_LIMITS.responseBytes, 'Captured content exceeds snapshot byte bound');
  files.set('snapshot.json', data);
  const receipt = writeBundle(directory, files, 'baseline-wordpress-capture', { sourceKind: snapshot.source.kind, complete: snapshot.complete });
  return { directory, ...receipt, records: snapshot.records.length, media: snapshot.media.length, failures, exitCode: failures.length ? 1 : 0 };
}
