import { listenLoopback, availableLoopbackPort } from './loopback-port.mjs';
// Disposable synthetic runtime/protocol rehearsal; no working CMS or credentials.
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import http from 'node:http';
import { once } from 'node:events';
import { spawn } from 'node:child_process';
import { randomBytes, randomUUID } from 'node:crypto';
import { fileURLToPath, pathToFileURL } from 'node:url';
import assert from 'node:assert/strict';
import sharp from 'sharp';
import { argumentsOf, newDirectory, isMain, writeJSON, jsonOf as json } from './infrastructure-io.mjs';
import { contractDigest, sha256 } from '../standards/schemas/migration-acceptance.mjs';
import { exporterHandler, syntheticWXR, portableFacts, htmlFacts } from '../tests/fixtures/importer-fidelity/fixture-tools.mjs';
import { httpAcceptance, inventoryAcceptance, expectedAfterRepair, replacement, repairedSEO } from '../tests/fixtures/importer-fidelity/acceptance.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const fixtures = path.join(root, 'tests/fixtures/importer-fidelity');
export async function rehearseImporter({ out, signal } = {}) {
  out = newDirectory(out ?? path.join(root, '.emdash/migration-acceptance/f5-' + randomUUID()));
  const fixture = json(path.join(fixtures, 'wordpress.json')), state = { fixture: structuredClone(fixture) };
  assert.equal(fs.readFileSync(path.join(fixtures, 'wordpress.xml'), 'utf8'), syntheticWXR(fixture));
  const requests = [], images = new Map();
  const versions = Object.fromEntries(['astro', 'emdash', '@emdash-cms/gutenberg-to-portable-text'].map(name => [name, json(path.join(root, 'node_modules', name, 'package.json')).version]));
  assert.equal(versions.astro, '7.4.0'); assert.equal(versions.emdash, '1.3.0');
  let child, protocol; const logs = [];
  const executableHashes = Object.fromEntries(['dist/astro/routes/api/import/wordpress/execute.mjs', 'dist/astro/routes/api/import/wordpress-plugin/execute.mjs', 'dist/astro/routes/api/import/wordpress/rewrite-urls.mjs', 'dist/index.mjs'].map(file => [file, sha256(fs.readFileSync(path.join(root, 'node_modules/emdash', file)))]));
  executableHashes['@emdash-cms/gutenberg-to-portable-text/dist/index.mjs'] = sha256(fs.readFileSync(path.join(root, 'node_modules/@emdash-cms/gutenberg-to-portable-text/dist/index.mjs')));
  const fixtureHashes = Object.fromEntries(['wordpress.json', 'wordpress.xml', 'expected-content.json', 'fixture-tools.mjs', 'acceptance.mjs', 'site/astro.config.mjs', 'site/preload.mjs', 'site/src/pages/view/[...path].astro'].map(file => [file, sha256(fs.readFileSync(path.join(fixtures, file)))]));
  const receipt = { rehearsalVersion: 1, versions, executableHashes, fixtureHashes, harnessSHA256: sha256(fs.readFileSync(fileURLToPath(import.meta.url))), node: process.versions.node, status: 'running', scope: 'Owned disposable Node/SQLite Astro dev instance; synthetic WXR and Exporter protocol fixture; anonymous public reads, no browser/editor certification', externalNetworkRequests: 0, observations: {} };
  const stage = fs.mkdtempSync(path.join(os.tmpdir(), 'baseline-importer-'));
  const result = receipt.observations;
  try {
    for (const [id, color] of [[201, '#e02020'], [202, '#2040e0']]) images.set(`/uploads/${id}.png`, await sharp({ create: { width: 4, height: 3, channels: 3, background: color } }).png().toBuffer());
    protocol = http.createServer(exporterHandler(state, images, requests)); await listenLoopback(protocol);
    const protocolOrigin = `http://127.0.0.1:${protocol.address().port}`;
    const port = await availableLoopbackPort();
    const origin = `http://127.0.0.1:${port}`;
    fs.cpSync(path.join(fixtures, 'site'), stage, { recursive: true });
    fs.symlinkSync(path.join(root, 'node_modules'), path.join(stage, 'node_modules'), process.platform === 'win32' ? 'junction' : 'dir');
    const env = Object.fromEntries(Object.entries(process.env).filter(([key]) => /^(PATH|PATHEXT|SYSTEMROOT|WINDIR|COMSPEC|TEMP|TMP|HOME|USERPROFILE|LOCALAPPDATA|APPDATA)$/i.test(key)));
    Object.assign(env, { IMPORTER_PROTOCOL_ORIGIN: protocolOrigin, IMPORTER_CMS_ORIGIN: origin, EMDASH_ENCRYPTION_KEY: 'emdash_enc_v1_' + randomBytes(32).toString('base64url'), ASTRO_TELEMETRY_DISABLED: '1', TZ: 'UTC' });
    child = spawn(process.execPath, ['--import', pathToFileURL(path.join(stage, 'preload.mjs')).href, path.join(root, 'node_modules/astro/bin/astro.mjs'), 'dev', '--host', '127.0.0.1', '--port', String(port)], { cwd: stage, env, stdio: ['ignore', 'pipe', 'pipe'] });
    for (const stream of [child.stdout, child.stderr]) stream.on('data', bytes => { logs.push(String(bytes)); if (logs.length > 1000) logs.shift(); fs.writeFileSync(path.join(out, 'server.log'), logs.join('')); });
    child.on('error', error => logs.push(error.message));
    const fetchLocal = (route, options = {}) => fetch(origin + route, { ...options, signal: AbortSignal.any([AbortSignal.timeout(30000), ...(options.signal ? [options.signal] : []), ...(signal ? [signal] : [])]) });
    const deadline = Date.now() + 90000;
    for (;;) {
      if (signal?.aborted) throw Error('Importer rehearsal cancelled');
      if (child.exitCode !== null) throw Error('Owned Astro instance exited: ' + logs.slice(-6).join(''));
      if (logs.some(line => line.includes('[ERROR]'))) throw Error('Owned Astro initialization failed: ' + logs.slice(-8).join(''));
      try { const r = await fetchLocal('/health', { signal: AbortSignal.timeout(2000) }); if (r.status === 200 && (await r.text()).includes('importer-fixture-ready')) break; } catch {}
      if (Date.now() > deadline) throw Error('Owned Astro readiness timed out: ' + logs.slice(-6).join(''));
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    await fetchLocal('/_emdash/api/setup/dev-bypass', { redirect: 'manual' });
    const auth = await fetchLocal('/_emdash/api/auth/dev-bypass', { redirect: 'manual' });
    const cookie = auth.headers.get('set-cookie')?.split(';')[0]; assert.ok(cookie, 'Disposable development admin cookie');
    const api = async (route, body, method = body === undefined ? 'GET' : 'POST') => {
      const form = body instanceof FormData;
      const response = await fetchLocal('/_emdash/api/' + route, { method, headers: { cookie, origin, 'X-EmDash-Request': '1', ...(body !== undefined && !form ? { 'content-type': 'application/json' } : {}) }, ...(body !== undefined ? { body: form ? body : JSON.stringify(body) } : {}) });
      const data = await response.json(); assert.ok(response.ok, route + ': ' + JSON.stringify(data)); return data.data ?? data;
    };
    const wxrForm = (posts, config, extra = {}) => { const form = new FormData(); form.set('file', new File([syntheticWXR(fixture, posts)], 'synthetic.xml', { type: 'application/xml' })); if (config) form.set('config', JSON.stringify(config)); for (const [k, v] of Object.entries(extra)) form.set(k, typeof v === 'string' ? v : JSON.stringify(v)); return form; };
    const configs = Object.fromEntries(['wxr', 'plugin'].map(lane => [lane, { postTypeMappings: Object.fromEntries(['post', 'page'].map(type => [type, { collection: lane + '_' + type + 's', enabled: true }])), skipExisting: true, locale: 'en', importSections: true, importSeo: true, importMenus: true, importSiteTitle: false, importLogo: false }]));
    const token = 'Zml4dHVyZTpzeW50aGV0aWM=';
    const wxrAnalysis = await api('import/wordpress/analyze', wxrForm(fixture.posts));
    const pluginAnalysis = await api('import/wordpress-plugin/analyze', { url: fixture.origin, token });
    for (const [lane, analysis] of [['wxr', wxrAnalysis], ['plugin', pluginAnalysis.analysis]]) {
      const postTypes = analysis.postTypes.filter(pt => ['post', 'page'].includes(pt.name)).map(pt => ({ name: pt.name, collection: configs[lane].postTypeMappings[pt.name].collection, fields: pt.requiredFields }));
      const prepared = await api('import/wordpress/prepare', { postTypes }); assert.equal(prepared.success, true);
      for (const pt of postTypes) await api('schema/collections/' + pt.collection, { hasSeo: true }, 'PUT');
    }
    const wxrImport = async posts => {
      let phase = await api('import/wordpress/execute', wxrForm(posts, configs.wxr, { phase: 'taxonomy' })), cursor = phase.cursor, chunk = phase.chunk;
      let imported = 0, skipped = 0;
      for (let at = 0; at < 10; at++) {
        phase = await api('import/wordpress/execute', wxrForm(posts, configs.wxr, { phase: 'content', cursor, chunk }));
        assert.equal(phase.result.errors.length, 0, JSON.stringify(phase.result)); imported += phase.result.imported; skipped += phase.result.skipped;
        cursor = phase.cursor; chunk = phase.chunk; if (phase.done) break; assert.ok(at < 9);
      }
      const final = await api('import/wordpress/execute', wxrForm(posts, configs.wxr, { phase: 'finalize', cursor }));
      assert.equal(final.result.errors.length, 0, JSON.stringify(final)); return { imported, skipped, sections: final.result.sections };
    };
    result.wxrPartial = await wxrImport(fixture.posts.slice(0, 3));
    result.wxrResume = await wxrImport(fixture.posts); assert.equal(result.wxrResume.skipped, 3);
    const pluginChunk = body => api('import/wordpress-plugin/execute', { url: fixture.origin, token, config: configs.plugin, phase: 'content', ...body });
    result.pluginPartial = (await pluginChunk({})).result;
    const pluginImport = async () => {
      let cursor, idMap = {}, translationGroups = {}, imported = 0, skipped = 0;
      for (let at = 0; at < 20; at++) {
        const r = await pluginChunk({ ...(cursor ? { cursor } : {}), idMap, translationGroups });
        assert.equal(r.result.errors.length, 0, JSON.stringify(r.result)); imported += r.result.imported; skipped += r.result.skipped;
        idMap = r.chunk?.idMap ?? idMap; translationGroups = r.chunk?.translationGroups ?? translationGroups; cursor = r.cursor;
        if (r.done) break; assert.ok(at < 19);
      }
      const final = await api('import/wordpress-plugin/execute', { url: fixture.origin, token, config: configs.plugin, phase: 'finalize', idMap });
      assert.equal(final.result.errors.length, 0, JSON.stringify(final)); return { imported, skipped, idMap, menus: final.result.menus };
    };
    result.pluginResume = await pluginImport(); assert.equal(result.pluginResume.skipped, 3);
    assert.deepEqual(result.pluginResume.menus, { created: 1, items: 1 });
    assert.equal(result.wxrResume.sections.created, 1);
    const list = async lane => (await Promise.all(['post', 'page'].map(async type => {
      const collection = configs[lane].postTypeMappings[type].collection;
      const r = await api(`content/${collection}?status=all&limit=100`); return r.items.map(item => ({ ...item, collection }));
    }))).flat();
    let wxr = await list('wxr'), plugin = await list('plugin');
    writeJSON(path.join(out, 'imported-before-repairs.json'), { wxr, plugin });
    result.statuses = { wxr: wxr.map(i => [i.slug, i.locale, i.status]), plugin: plugin.map(i => [i.slug, i.locale, i.status]) };
    result.seo = { wxr: wxr.filter(i => ['yoast', 'rankmath'].includes(i.slug)).map(i => ({ slug: i.slug, data: i.data, seo: i.seo })), plugin: plugin.filter(i => ['yoast', 'rankmath'].includes(i.slug)).map(i => ({ slug: i.slug, data: i.data, seo: i.seo })) };
    for (const slug of ['yoast', 'rankmath']) {
      const p = fixture.posts.find(p => p.slug === slug), imported = plugin.find(i => i.slug === slug), wxrImported = wxr.find(i => i.slug === slug);
      assert.equal(imported.data.seo_title, p[slug].title); assert.equal(imported.data.seo_description, p[slug].description);
      assert.equal(imported.seo.title, null); assert.equal(imported.seo.canonical, null); assert.equal(imported.seo.noIndex, false); assert.equal(imported.seo.image, null);
      assert.equal(wxrImported.data.seo_title, undefined); assert.equal(wxrImported.seo.title, null);
    }
    const attachments = fixture.media.map(m => ({ id: m.id, url: m.url, filename: m.filename, mimeType: m.mime_type, title: m.title }));
    const media = await api('import/wordpress/media', { attachments, stream: false });
    result.media = media; assert.equal(media.failed.length, 0, JSON.stringify(media));
    result.rewrite = await api('import/wordpress/rewrite-urls', { urlMap: media.urlMap, collections: ['wxr_posts', 'plugin_posts'] });
    wxr = await list('wxr'); plugin = await list('plugin');
    writeJSON(path.join(out, 'imported-after-media.json'), { wxr, plugin });
    const expected = json(path.join(fixtures, 'expected-content.json'));
    for (const lane of [wxr, plugin]) for (const i of lane) {
      assert.deepEqual(portableFacts(i.data.content, media.imported), expected[i.slug], i.collection + '/' + i.slug + ' reviewed structural content');
      const p = fixture.posts.find(p => p.slug === i.slug);
      assert.equal(i.status, p.status === 'publish' ? 'published' : p.status === 'future' ? 'scheduled' : 'draft');
      assert.equal(i.locale, p.locale);
      if (p.status === 'future') assert.equal(i.scheduledAt, '2032-01-01T10:00:00.000Z');
      if (i.locale === 'en') assert.ok(i.bylines.length > 0);
      else assert.equal(i.bylines.length, 0, 'Missing translated byline is an explicit observed limitation');
    }
    for (const lane of [wxr, plugin]) assert.equal(lane.find(i => i.slug === 'translation').translationGroup, lane.find(i => i.slug === 'vertaling').translationGroup);
    const stableIds = Object.fromEntries(['wxr', 'plugin'].map(lane => [lane, Object.fromEntries(fixture.posts.filter(p => p.post_type !== 'wp_block').map(p => [String(p.id), (lane === 'wxr' ? wxr : plugin).find(i => i.slug === p.slug && i.locale === p.locale).id]))]));
    result.authorIDsPerSingleSource = { wxr: new Set(wxr.flatMap(i => i.bylines.map(b => b.byline.id))).size, plugin: new Set(plugin.flatMap(i => i.bylines.map(b => b.byline.id))).size };
    assert.ok(result.authorIDsPerSingleSource.wxr > 1); assert.ok(result.authorIDsPerSingleSource.plugin > 1);
    for (const m of media.imported) {
      const bytes = Buffer.from(await (await fetchLocal(m.newUrl)).arrayBuffer());
      assert.equal(sha256(bytes), sha256(images.get(`/uploads/${m.wpId}.png`)));
    }
    const html = await (await fetchLocal('/view/wxr_posts/en/classic')).text(); fs.writeFileSync(path.join(out, 'classic.html'), html);
    result.public = { wxrClassic: (await fetchLocal('/view/wxr_posts/en/classic')).status, pluginClassic: (await fetchLocal('/view/plugin_posts/en/classic')).status };
    assert.deepEqual(result.public, { wxrClassic: 200, pluginClassic: 200 }, 'Public render failed: ' + JSON.stringify(result.public) + '\nClassic HTML:\n' + html.slice(0, 500) + '\nServer logs:\n' + logs.slice(-20).join(''));
    assert.match(html, /Classic heading/); assert.match(html, /First classic item/); assert.match(html, /legacy inline link/);
    const publicFacts = {};
    for (const lane of ['wxr', 'plugin']) {
      const galleryHTML = await (await fetchLocal(`/view/${lane}_posts/en/gallery`)).text(), facts = htmlFacts(galleryHTML);
      assert.deepEqual(facts.images.map(i => i.alt), ['Image 202', 'Image 201', 'Image 202']);
      assert.ok(!facts.links.some(href => href?.includes('/custom-gallery-destination/')));
      const seo = htmlFacts(await (await fetchLocal(`/view/${lane}_posts/en/yoast`)).text());
      assert.equal(seo.title, 'Yoast fixture'); assert.equal(seo.metas.description, 'Synthetic excerpt');
      assert.equal(seo.metas.robots, undefined); assert.equal(seo.metas['og:title'], 'Yoast fixture'); assert.equal(seo.metas['og:image'], undefined);
      const gutenberg = htmlFacts(await (await fetchLocal(`/view/${lane}_posts/en/gutenberg`)).text());
      assert.ok(gutenberg.headings.includes('Gutenberg heading')); assert.deepEqual(gutenberg.listItems, ['First Gutenberg item', 'Second Gutenberg item']);
      for (const slug of ['draft', 'scheduled', 'pending', 'trashed']) assert.equal((await fetchLocal(`/view/${lane}_posts/en/${slug}`)).status, 404);
      assert.equal((await fetchLocal(`/view/${lane}_posts/nl/vertaling`)).status, 404);
      publicFacts[lane] = { orderedImageIDs: [202, 201, 202], customNestedLinkPreserved: false, unresolvedTemplateValuesOnlyInGenericFields: true, nativeSeoOverridesBeforeRepair: false, unpublishedFixturesAnonymous: 404, localizedBylineMissing: 'nl' };
    }
    assert.equal((await fetchLocal('/2020/old/permalink/', { redirect: 'manual' })).status, 404);
    result.renderedFidelity = publicFacts;
    const reviewed = expectedAfterRepair(expected);
    const initialHTTP = await httpAcceptance(out, 'http-initial', origin, 'plugin', { repaired: false });
    assert.ok(initialHTTP.checks.some(c => c.id === 'url:classic:links' && c.status === 'fail'));
    assert.ok(initialHTTP.checks.some(c => c.id === 'url:unsupported:reviewSignals' && c.status === 'advisory'));
    const initialInventory = inventoryAcceptance(out, 'inventory-initial', fixture, plugin, reviewed, media.imported, stableIds.plugin);
    assert.equal(initialInventory.exitCode, 1);
    // Fixture-only supported API repairs: no custom importer or upstream edits.
    const update = async (item, changes) => {
      const route = `content/${item.collection}/${item.id}`;
      const current = await api(route); await api(route, { ...changes, _rev: current._rev }, 'PUT');
      const fresh = await api(route); await api(route + '/publish', { _rev: fresh._rev });
    };
    for (const lane of ['wxr', 'plugin']) {
      const items = lane === 'wxr' ? wxr : plugin;
      await api('import/wordpress/rewrite-urls', { urlMap: { '/2020/old/permalink/': `/view/${lane}_posts/en/gutenberg` }, collections: [lane + '_posts'] });
      const unsupported = items.find(i => i.slug === 'unsupported'); await update(unsupported, { data: { ...unsupported.data, content: replacement } });
      for (const slug of ['yoast', 'rankmath']) await update(items.find(i => i.slug === slug), { seo: repairedSEO(lane, slug) });
    }
    wxr = await list('wxr'); plugin = await list('plugin');
    for (const [lane, items] of [['wxr', wxr], ['plugin', plugin]]) {
      const r = inventoryAcceptance(out, 'inventory-repaired-' + lane, fixture, items, reviewed, media.imported, stableIds[lane]);
      assert.equal(r.exitCode, 0, JSON.stringify(r.summary.findings));
      const parent = inventoryAcceptance(out, 'inventory-parent-required-' + lane, fixture, items, reviewed, media.imported, stableIds[lane], { preserveParent: true });
      assert.equal(parent.exitCode, 1); assert.ok(parent.summary.findings.some(f => f.code === 'parent-preservation'));
      const h = await httpAcceptance(out, 'http-repaired-' + lane, origin, lane); assert.equal(h.exitCode, 0, JSON.stringify(h.checks.filter(c => c.required && c.status !== 'pass')));
    }
    // Deliberate losses in actual stored entries, followed by restoration.
    const gallery = plugin.find(i => i.slug === 'gallery'), classic = plugin.find(i => i.slug === 'classic');
    const broken = structuredClone(gallery.data); broken.content[0].images.pop(); broken.content[0].images[0].asset.url = '/_emdash/api/media/file/deliberately-missing.png'; broken.content[0].images[0].asset._ref = broken.content[0].images[0].asset.url;
    await update(gallery, { data: broken });
    const currentClassic = await api(`content/${classic.collection}/${classic.id}`); await api(`content/${classic.collection}/${classic.id}/unpublish`, { _rev: currentClassic._rev });
    const lostHTTP = await httpAcceptance(out, 'http-deliberate-loss', origin, 'plugin');
    assert.ok(lostHTTP.checks.some(c => c.id === 'url:classic:status' && c.status === 'fail'));
    assert.ok(lostHTTP.checks.some(c => c.id === 'url:gallery:assets' && c.status === 'fail'));
    const lostInventory = inventoryAcceptance(out, 'inventory-deliberate-loss', fixture, await list('plugin'), reviewed, media.imported, stableIds.plugin);
    assert.equal(lostInventory.exitCode, 1); assert.ok(lostInventory.summary.findings.some(f => f.code === 'required-field-mismatch'));
    await update(gallery, { data: gallery.data }); await update(classic, { data: classic.data });
    assert.equal(inventoryAcceptance(out, 'inventory-restored', fixture, await list('plugin'), reviewed, media.imported, stableIds.plugin).exitCode, 0);
    assert.equal((await httpAcceptance(out, 'http-restored', origin, 'plugin')).exitCode, 0);
    result.acceptance = { initialInventory: initialInventory.exitCode, initialHTTP: initialHTTP.exitCode, repairedHTTP: 0, repairedInventories: 0, deliberateLossHTTP: lostHTTP.exitCode, deliberateLossInventory: lostInventory.exitCode, restorationHTTP: 0, restorationInventory: 0, parentPreservation: 'fails; explicitly scoped unsupported relationship', editorAndProviderParity: 'unverified' };
    result.wxrRepeat = await wxrImport(fixture.posts); result.pluginRepeat = await pluginImport();
    assert.equal(result.wxrRepeat.imported, 0); assert.equal(result.pluginRepeat.imported, 0);
    // Retry is not delta sync: source changes never update/delete the existing row.
    const modified = structuredClone(fixture.posts); modified.find(p => p.id === 102).content = '<p>Changed source content that must not overwrite the target</p>';
    const editedWxr = await wxrImport(modified); assert.equal(editedWxr.imported, 0);
    state.fixture.posts = modified; assert.equal((await pluginImport()).imported, 0);
    for (const lane of ['wxr', 'plugin']) assert.deepEqual(portableFacts((await list(lane)).find(i => i.slug === 'gutenberg').data.content, media.imported), expected.gutenberg);
    const collision = { ...fixture.posts[1], id: 999, title: 'Different source, existing slug' };
    assert.equal((await wxrImport([collision])).skipped, 1);
    state.fixture.posts = [collision]; assert.equal((await pluginImport()).skipped, 1);
    const changed = structuredClone(fixture.posts.filter(p => p.id !== 102)); changed.find(p => p.id === 101).slug = 'classic-changed';
    assert.equal((await wxrImport(changed)).imported, 1);
    state.fixture.posts = changed; assert.equal((await pluginImport()).imported, 1);
    for (const lane of ['wxr', 'plugin']) {
      const items = await list(lane); assert.equal(items.length, 14);
      assert.ok(items.some(i => i.slug === 'classic')); assert.ok(items.some(i => i.slug === 'classic-changed')); assert.ok(items.some(i => i.slug === 'gutenberg'));
    }
    result.retrySemantics = { partialResumeSkips: 3, repeatImports: 0, sourceEditOverwritten: false, sameSlugDifferentSourceSkipped: true, changedSlugCreatesExtraEntity: true, deletedSourceRemovesTarget: false };
    result.dispositions = { classicAndGutenberg: 'Imported', galleryOrderAndMediaIdentity: 'Imported', unsupportedSavedHTML: 'Preserved for repair', dynamicQueryFixtureReplacement: 'Deliberately rebuilt', shortcodeExecution: 'Unsupported', nativeSEO: 'Preserved for repair', customNestedImageLinks: 'Unsupported', automaticParentRelationsAndPermalinkRedirects: 'Unsupported' };
    receipt.status = 'passed';
  } catch (error) { receipt.status = 'failed'; throw error; }
  finally {
    if (child?.pid && child.exitCode === null && child.signalCode === null) { const exit = once(child, 'exit'); child.kill(); const timer = setTimeout(() => child.kill('SIGKILL'), 5000); try { await exit; } finally { clearTimeout(timer); } }
    if (protocol) { protocol.closeAllConnections(); await new Promise(resolve => protocol.close(resolve)); }
    fs.writeFileSync(path.join(out, 'server.log'), logs.join(''));
    assert.equal(path.dirname(stage), path.resolve(os.tmpdir())); assert.match(path.basename(stage), /^baseline-importer-/);
    try { fs.unlinkSync(path.join(stage, 'node_modules')); } catch (error) { if (error.code !== 'ENOENT') throw error; }
    fs.rmSync(stage, { recursive: true, force: true });
    receipt.cleanup = { ownedServerStopped: true, dependencyLinkRemoved: true, disposableDatabaseAndMediaRemoved: true, workingDatabaseCopied: false };
    receipt.protocol = { requests: requests.length, paths: [...new Set(requests.map(r => r.path))], authenticatedAPIRequests: requests.filter(r => r.path.includes('/wp-json/') && r.authenticated).length };
    writeJSON(path.join(out, 'receipt.json'), receipt);
  }
  return { out, receipt };
}
if (isMain(import.meta.url)) {
  const controller = new AbortController(), cancel = () => controller.abort();
  process.once('SIGINT', cancel); process.once('SIGTERM', cancel);
  try { const options = argumentsOf(process.argv.slice(2), ['--out']); const r = await rehearseImporter({ ...options, signal: controller.signal }); console.log(JSON.stringify({ out: r.out, ...r.receipt }, null, 2)); }
  catch (error) { console.error(error.message); process.exitCode = 1; }
  finally { process.off('SIGINT', cancel); process.off('SIGTERM', cancel); }
}
