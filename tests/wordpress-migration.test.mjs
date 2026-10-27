import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { connection, apiURL, captureExporter, captureWXR, parseWXR, saveCapture } from '../scripts/wordpress-source.mjs';
import { requester, publicAddress, publicRequest, readBundle, digest } from '../scripts/wordpress-io.mjs';
import { toMarkdown } from '../scripts/wordpress-markdown.mjs';
import { planStatic, applyStatic, registerCollection, routePath, sveltiaCollection } from '../scripts/wordpress-static.mjs';
import { planEmdash, runWordPress } from '../scripts/wordpress-migrate.mjs';

const origin = 'https://wordpress.example.test';
const key = 'em1.' + Buffer.from(JSON.stringify({ v: 1, url: origin, user: 'migration-editor', pass: 'private-application-password' })).toString('base64url');
const record = (id = 1, extra = {}) => ({ key: 'post:' + id, id, type: 'post', status: 'publish', slug: 'article-' + id, title: 'A source title', html: '<p>Source <strong>body</strong>.</p>', excerpt: 'A source description.', permalink: origin + '/article-' + id + '/', date: '2026-10-01T10:00:00', modified: null, author: 'Source author', featuredMedia: null, locale: null, translationGroup: null, meta: {}, taxonomies: {}, ...extra });
const response = (value, status = 200, type = 'application/json') => ({ status, headers: { 'content-type': type }, body: Buffer.isBuffer(value) ? value : Buffer.from(JSON.stringify(value)) });
const page = items => ({ page: 1, pages: items.length ? 1 : 0, total: items.length, per_page: 100, items });
async function fixture(run, profile = 'static') {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'baseline-wordpress-test-'));
  fs.writeFileSync(path.join(root, '.gitignore'), '.baseline/backups/\n');
  fs.writeFileSync(path.join(root, 'baseline.config.json'), JSON.stringify({ foundation: 'static', platformProfile: profile }));
  fs.mkdirSync(path.join(root, 'src/pages'), { recursive: true });
  fs.writeFileSync(path.join(root, 'src/content.config.ts'), "import { defineCollection } from 'astro:content';\nconst posts = defineCollection({});\nexport const collections = { posts, };\n");
  if (profile === 'static-sveltia') {
    fs.mkdirSync(path.join(root, 'public/admin'), { recursive: true });
    fs.writeFileSync(path.join(root, 'public/admin/config.yml'), JSON.stringify({ backend: { name: 'github', repo: 'owner/repo' }, collections: [{ name: 'posts', fields: [] }] }));
  }
  let number = 0;
  const out = () => path.join(root, '.baseline/backups', 'stage-' + ++number);
  const capture = async records => saveCapture({ version: 1, source: { kind: 'exporter', url: origin }, records, media: [], extras: {}, analysis: {} }, { out: out(), root });
  try { await run({ root, out, capture }); }
  finally {
    assert.equal(path.dirname(root), path.resolve(os.tmpdir()));
    assert.ok(path.basename(root).startsWith('baseline-wordpress-test-'));
    fs.rmSync(root, { recursive: true, force: true, maxRetries: 5, retryDelay: 50 });
  }
}

test('migration keys bind the exact source and never become capture fields or command-line arguments', () => {
  const connected = connection({ env: { WORDPRESS_MIGRATION_KEY: key } });
  assert.equal(connected.site.href, origin + '/');
  assert.ok(connected.authorization.startsWith('Basic '));
  assert.throws(() => connection({ url: 'https://other.example.test', env: { WORDPRESS_MIGRATION_KEY: key } }), /different/);
  assert.throws(() => connection({ url: origin, env: {} }), /environment/);
  assert.throws(() => connection({ env: { WORDPRESS_MIGRATION_KEY: 'bad' } }), /Unsupported/);
  assert.equal(apiURL(new URL(origin + '/subdirectory/'), 'content', { post_type: 'post' }).pathname, '/subdirectory/wp-json/emdash/v1/content');
  assert.equal(apiURL(new URL(origin + '/subdirectory/'), 'content', {}, true).searchParams.get('rest_route'), '/emdash/v1/content');
});

test('public transport refuses local/reserved addresses and credentials never follow API redirects or media requests', async () => {
  for (const address of ['127.0.0.1', '10.0.0.1', '169.254.169.254', '192.168.1.1', '::1', '::ffff:127.0.0.1', '64:ff9b::a00:1', '2001:db8::1']) assert.equal(publicAddress(address), false, address);
  assert.equal(publicAddress('8.8.8.8'), true);
  assert.equal(publicAddress('2606:4700:4700::1111'), true);
  await assert.rejects(publicRequest('https://127.0.0.1'), /private|reserved/);
  let calls = 0;
  const get = requester({ sourceOrigin: origin, allowedOrigins: new Set([origin, 'https://cdn.example.test']), authorization: 'private-value', request: async (_url, options) => { calls++; assert.equal(options.headers.authorization, 'private-value'); return { status: 302, headers: { location: 'https://cdn.example.test/file' }, body: Buffer.alloc(0) }; } });
  await assert.rejects(get(origin + '/api', { authenticated: true }), /redirect/);
  await assert.rejects(get('https://cdn.example.test/api', { authenticated: true }), /Credentials/);
  assert.equal(calls, 1);
  const media = requester({ sourceOrigin: origin, allowedOrigins: new Set([origin]), authorization: 'private-value', request: async (_url, options) => { assert.equal(options.headers.authorization, undefined); return { status: 302, headers: { location: 'https://unapproved.example.test/file' }, body: Buffer.alloc(0) }; } });
  await assert.rejects(media(origin + '/image.jpg'), /destination/);
});

test('exporter capture follows bounded pages, supports plain permalinks and stores authenticated data without credentials', () => fixture(async ({ root, out }) => {
  let analysisCalls = 0;
  const seen = [];
  const request = async (url, options) => {
    seen.push({ url: url.href, auth: options.headers.authorization });
    const endpoint = url.searchParams.get('rest_route')?.split('/').at(-1) ?? url.pathname.split('/').at(-1);
    if (!url.searchParams.has('rest_route')) return response({}, 404);
    if (endpoint !== 'probe') assert.ok(options.headers.authorization);
    if (endpoint === 'probe') return response({ emdash_exporter: '1.2.0' });
    if (endpoint === 'analyze') { analysisCalls++; return response({ post_types: [{ name: 'post', total: 2, by_status: { publish: 1, private: 1 } }], attachments: { count: 0 } }); }
    if (endpoint === 'content') {
      const current = Number(url.searchParams.get('page'));
      return response({ page: current, pages: 2, total: 2, items: [{ id: current, post_type: 'post', status: current === 1 ? 'publish' : 'private', slug: 'post-' + current, title: 'Title', content: '<p>Content</p>', permalink: origin + '/post-' + current + '/' }] });
    }
    if (['media', 'comments'].includes(endpoint)) return response(page([]));
    return response({});
  };
  const result = await captureExporter({ env: { WORDPRESS_MIGRATION_KEY: key }, out: out(), root }, { request });
  assert.equal(result.exitCode, 0); assert.equal(result.records, 2); assert.equal(analysisCalls, 2);
  const bundle = readBundle(result.directory, 'baseline-wordpress-capture');
  const snapshotText = bundle.files.get('snapshot.json').toString();
  assert.ok(!snapshotText.includes('private-application-password') && !snapshotText.includes(key) && !snapshotText.includes('Basic '));
  assert.equal(JSON.parse(snapshotText).records[1].status, 'private');
  assert.ok(seen.some(item => new URL(item.url).searchParams.get('page') === '2'));
}));

test('incomplete exporter pagination refuses instead of silently omitting content', () => fixture(async ({ root, out }) => {
  const request = async url => {
    const endpoint = url.pathname.split('/').at(-1);
    if (endpoint === 'probe') return response({ emdash_exporter: '1.2.0' });
    if (endpoint === 'analyze') return response({ post_types: [{ name: 'post', total: 2 }], attachments: { count: 0 } });
    return response({ page: 1, pages: 1, total: 2, items: [] });
  };
  await assert.rejects(captureExporter({ env: { WORDPRESS_MIGRATION_KEY: key }, out: out(), root }, { request }), /incomplete/);
}));

const wxr = '<?xml version="1.0"?><rss xmlns:wp="http://wordpress.org/export/1.2/" xmlns:content="http://purl.org/rss/1.0/modules/content/"><channel><title>Source</title><link>' + origin + '</link><item><title>A &amp; B</title><link>' + origin + '/article/</link><wp:post_id>1</wp:post_id><wp:post_type>post</wp:post_type><wp:status>publish</wp:status><wp:post_name>article</wp:post_name><content:encoded><![CDATA[<p>Article body.</p>]]></content:encoded><wp:postmeta><wp:meta_key>custom</wp:meta_key><wp:meta_value><![CDATA[a:1:{untrusted PHP}]]></wp:meta_value></wp:postmeta></item></channel></rss>';
test('WXR preserves CDATA and raw meta without evaluating PHP or allowing XML entities', () => {
  const data = parseWXR(Buffer.from(wxr));
  assert.equal(data.records[0].title, 'A & B');
  assert.equal(data.records[0].html, '<p>Article body.</p>');
  assert.equal(data.records[0].meta.custom, 'a:1:{untrusted PHP}');
  assert.throws(() => parseWXR(Buffer.from('<!DOCTYPE rss [<!ENTITY x "expanded">]>' + wxr)), /DTD/);
  assert.throws(() => parseWXR(Buffer.from(wxr.replace('A &amp; B', '&external;'))), /Malformed/);
  assert.throws(() => parseWXR(Buffer.from('<rss>')), /Malformed/);
});

test('Markdown conversion preserves supported content, maps attachment IDs and quarantines active/unsupported content', () => {
  const findings = [];
  const result = toMarkdown('<h2>Heading</h2><p><strong>Bold</strong> <a href="/page/">link</a></p><ul><li>One</li><li>Two</li></ul><img class="wp-image-22" src="/photo-300x200.jpg" alt="A photo"><script>secret()</script><!-- wp:latest-posts /-->', {
    base: origin, media: (_url, id) => id === 22 ? '../../assets/photo.jpg' : null,
    link: url => url.pathname, finding: code => findings.push(code),
  });
  assert.match(result, /## Heading/); assert.match(result, /\*\*Bold\*\*/);
  assert.match(result, /- One/); assert.match(result, /!\[A photo\]\(<\.\.\/\.\.\/assets\/photo.jpg>\)/);
  assert.ok(!result.includes('<script>') && !result.includes('secret()'));
  assert.ok(findings.includes('active-content') && findings.includes('dynamic-block'));
  const active = toMarkdown('<p>&lt;script&gt;literal&lt;/script&gt;</p><a href="javascript:alert(1)">unsafe</a>', { base: origin });
  assert.ok(!active.includes('javascript:') && !active.includes('<script>'));
});

test('static plans retain private/scheduled source records outside public files and refuse changed targets', () => fixture(async ({ root, capture, out }) => {
  const source = await capture([record(), record(2, { status: 'private', html: 'PRIVATE SOURCE VALUE' }), record(3, { status: 'future', html: 'SCHEDULED SOURCE VALUE' })]);
  const originalConfig = fs.readFileSync(path.join(root, 'src/content.config.ts'));
  const plan = planStatic({ capture: source.directory, out: out(), root });
  assert.equal(plan.findings.length, 0); assert.equal(plan.retainedUnpublished, 2);
  assert.deepEqual(fs.readFileSync(path.join(root, 'src/content.config.ts')), originalConfig);
  const bundle = readBundle(plan.directory, 'baseline-wordpress-static-plan');
  assert.ok(![...bundle.files.values()].some(bytes => /PRIVATE SOURCE VALUE|SCHEDULED SOURCE VALUE/.test(bytes.toString())));
  assert.match(bundle.files.get('payload/src/pages/[...wordpress].astro').toString(), /!entry.data.draft/);
  const result = applyStatic({ stage: plan.directory, root });
  assert.equal(result.status, 'applied');
  assert.match(fs.readFileSync(path.join(root, 'src/content/wordpress/wp-post-1.md'), 'utf8'), /publishedAt: "2026-10-01T10:00:00.000Z"/);
  assert.throws(() => applyStatic({ stage: plan.directory, root }), /changed|exists/);
  assert.match(fs.readFileSync(path.join(root, 'src/content.config.ts'), 'utf8'), /posts, wordpress/);
}));

test('unsupported content requires a reasoned review bound to the exact plan and missing media cannot be waved through', () => fixture(async ({ root, capture, out }) => {
  const source = await capture([record(1, { html: '<p>Body.</p><iframe src="https://widget.example.test"></iframe>' })]);
  const plan = planStatic({ capture: source.directory, out: out(), root });
  assert.equal(plan.findings[0].code, 'active-content');
  assert.throws(() => applyStatic({ stage: plan.directory, root }), /review/);
  assert.throws(() => applyStatic({ stage: plan.directory, root, review: { planSHA256: 'changed', findings: [] } }), /review/);
  applyStatic({ stage: plan.directory, root, review: { planSHA256: plan.sha256, findings: plan.findings.map(finding => ({ id: finding.id, reason: 'Source widget deliberately retired in the reviewed migration.' })) } });
}));

test('uncaptured inline images block application even with a reasoned review', () => fixture(async ({ root, capture, out }) => {
  const source = await capture([record(5, { html: '<img src="/missing.jpg" alt="Missing">' })]);
  const plan = planStatic({ capture: source.directory, out: out(), root });
  assert.equal(plan.findings.find(finding => finding.code === 'missing-image').severity, 'blocked');
  assert.throws(() => applyStatic({ stage: plan.directory, root, review: { planSHA256: plan.sha256, findings: plan.findings.map(finding => ({ id: finding.id, reason: 'Acknowledged for testing.' })) } }), /blocks/);
  assert.equal(fs.existsSync(path.join(root, 'src/content/wordpress')), false);
}));

test('a concurrent target edit prevents every mutation before application begins', () => fixture(async ({ root, capture, out }) => {
  const source = await capture([record()]);
  const plan = planStatic({ capture: source.directory, out: out(), root });
  fs.appendFileSync(path.join(root, 'src/content.config.ts'), '\n// New client edit.\n');
  const expected = fs.readFileSync(path.join(root, 'src/content.config.ts'));
  assert.throws(() => applyStatic({ stage: plan.directory, root }), /changed/);
  assert.deepEqual(fs.readFileSync(path.join(root, 'src/content.config.ts')), expected);
  assert.equal(fs.existsSync(path.join(root, 'src/content/wordpress')), false);
}));

test('existing routes and collection configurations remain owned by the site', () => fixture(async ({ root, capture, out }) => {
  fs.writeFileSync(path.join(root, 'src/pages/article-1.astro'), 'SITE OWNED');
  const source = await capture([record()]);
  assert.throws(() => planStatic({ capture: source.directory, out: out(), root }), /existing route/);
  const plan = planStatic({ capture: source.directory, out: out(), root, mapping: { version: 1, records: { 'post:1': { path: '/news/article/' } } } });
  applyStatic({ stage: plan.directory, root });
  assert.equal(fs.readFileSync(path.join(root, 'src/pages/article-1.astro'), 'utf8'), 'SITE OWNED');
  assert.throws(() => registerCollection('export const collections = { ...clientCollections };'), /spreads/);
  assert.throws(() => routePath('/%2e%2e/private/'), /unsafe/);
  assert.throws(() => routePath('/?p=1'), /pathname/);
}));

test('Sveltia receives the same schema fields without replacing its existing backend or posts form', () => fixture(async ({ root, capture, out }) => {
  const source = await capture([record()]);
  const plan = planStatic({ capture: source.directory, out: out(), root });
  applyStatic({ stage: plan.directory, root });
  const config = JSON.parse(fs.readFileSync(path.join(root, 'public/admin/config.yml'), 'utf8'));
  assert.equal(config.backend.repo, 'owner/repo'); assert.equal(config.collections[0].name, 'posts');
  assert.deepEqual(config.collections[1], sveltiaCollection);
  assert.equal(config.collections[1].fields.find(field => field.name === 'body').widget, 'markdown');
}, 'static-sveltia'));

test('empty SEO templates fall back to the content title while canonical remapping and robots values survive', () => fixture(async ({ root, capture, out }) => {
  const source = await capture([record(1, { yoast: { title: '', description: '', noindex: '1', nofollow: '1' }, rankmath: { canonical_url: origin + '/article-1/' } })]);
  const plan = planStatic({ capture: source.directory, out: out(), root, mapping: { version: 1, records: { 'post:1': { path: '/news/imported/' } } } });
  assert.deepEqual(plan.findings, []);
  applyStatic({ stage: plan.directory, root });
  const markdown = fs.readFileSync(path.join(root, 'src/content/wordpress/wp-post-1.md'), 'utf8');
  assert.match(markdown, /title: "A source title"/);
  assert.match(markdown, /description: "A source description\."/);
  assert.match(markdown, /canonical: "\/news\/imported\/"/);
  assert.match(markdown, /noindex: true/); assert.match(markdown, /nofollow: true/);
}));

test('public HTML collisions and unknown mapping identities are refused before application', () => fixture(async ({ root, capture, out }) => {
  fs.mkdirSync(path.join(root, 'public/article-1'), { recursive: true });
  fs.writeFileSync(path.join(root, 'public/article-1/index.html'), 'PUBLIC FILE');
  const source = await capture([record()]);
  assert.throws(() => planStatic({ capture: source.directory, out: out(), root }), /public file/);
  assert.throws(() => planStatic({ capture: source.directory, out: out(), root, mapping: { version: 1, records: { 'post:999': { path: '/other/' } } } }), /unknown source/);
  assert.equal(fs.readFileSync(path.join(root, 'public/article-1/index.html'), 'utf8'), 'PUBLIC FILE');
}));

test('media capture failures and tampered bundles cannot produce an accepted static import', () => fixture(async ({ root, out }) => {
  const source = await saveCapture({ version: 1, source: { kind: 'wxr', url: origin }, records: [record()], media: [{ id: 9, url: origin + '/missing.pdf' }] }, { root, out: out(), request: async () => response({}, 403) });
  assert.equal(source.exitCode, 1);
  assert.throws(() => planStatic({ capture: source.directory, out: out(), root }), /Complete/);
  const file = path.join(source.directory, 'snapshot.json');
  fs.appendFileSync(file, ' ');
  assert.throws(() => readBundle(source.directory, 'baseline-wordpress-capture'), /changed/);
}));

test('the EmDash writer emits a native WXR handoff without credentials or CMS mutations', () => fixture(async ({ root, capture, out }) => {
  const source = await capture([record(1, { meta: { quoted: '<keep> ]]> & raw' } })]);
  const result = planEmdash({ capture: source.directory, out: out(), root });
  const bundle = readBundle(result.directory, 'baseline-wordpress-emdash-handoff');
  const roundTrip = parseWXR(bundle.files.get('native-import.xml'));
  assert.equal(roundTrip.records[0].meta.quoted, '<keep> ]]> & raw');
  assert.equal(roundTrip.records[0].html, record().html);
  assert.ok(!bundle.files.get('handoff.json').toString().includes('private-application-password'));
  assert.equal(result.next, '/_emdash/admin/import/wordpress');
}));

test('WXR capture archives the exact XML for a native handoff instead of reconstructing its metadata', () => fixture(async ({ root, out }) => {
  const file = path.join(root, 'source.xml'); fs.writeFileSync(file, wxr);
  const capture = await captureWXR({ wxr: file, out: out(), root });
  const handoff = planEmdash({ capture: capture.directory, out: out(), root });
  assert.equal(readBundle(handoff.directory, 'baseline-wordpress-emdash-handoff').files.get('native-import.xml').toString(), wxr);
}));

test('the distributed CLI rejects stray secrets/flags and provides a discoverable help contract', async () => {
  await assert.rejects(runWordPress(['capture', '--password', 'private-value']), /argument/);
  await assert.rejects(runWordPress(['probe', '--url', origin, '--out', 'unexpected']), /operation/);
  const result = await runWordPress(['--help']);
  assert.match(result.help, /WORDPRESS_MIGRATION_KEY/);
});
