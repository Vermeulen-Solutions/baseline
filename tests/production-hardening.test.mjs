import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { parse } from 'parse5';
import { safeJsonLdSerialize } from 'emdash/page';
import { isCmsFlagSet, isCmsFlagEnabled } from '../src/lib/cms-flag.ts';
import { breadcrumbGraph, organizationGraph, taxonomyRobots } from '../src/lib/structured-data.ts';
import { normalizedPageLocation } from '../src/lib/page-url.ts';
import { isWebhookDomainAllowed } from '../src/lib/webhook-domain.ts';
import { checkProductionSetup } from '../scripts/check-production-setup.mjs';
import { retainBuildAssets } from '../scripts/retain-build-assets.mjs';
import { siteMetadata } from '../src/plugins/baseline-metadata/index.ts';
import { createPublicPageContext, resolvePageMetadata } from 'emdash/page';

test('CMS flags distinguish explicit true/integer flags, absent opt-outs, and malformed values', () => {
  for (const value of [true, 1]) { assert.equal(isCmsFlagSet(value), true); assert.equal(isCmsFlagEnabled(value), true); }
  for (const value of [undefined, null]) { assert.equal(isCmsFlagSet(value), false); assert.equal(isCmsFlagEnabled(value), true); }
  for (const value of [false, 0, '', 'false', '0', 'true', '1', 2, [], {}, NaN]) {
    assert.equal(isCmsFlagSet(value), false); assert.equal(isCmsFlagEnabled(value), false);
  }
});

test('breadcrumb and organization graphs use real absolute facts and serialize hostile strings safely', () => {
  const site = 'https://example.test';
  assert.equal(breadcrumbGraph([], site), undefined);
  assert.equal(breadcrumbGraph([{ name: 'Home', url: '/' }], site), undefined);
  const graph = breadcrumbGraph([{ name: 'Home', url: '/' }, { name: '</script><img src=x>\u2028', url: '/posts/story' }], site);
  assert.deepEqual(graph.itemListElement.map(item => [item.position, item.item]), [[1, site + '/'], [2, site + '/posts/story']]);
  assert.equal(breadcrumbGraph([{ name: 'Home', url: '/' }, { name: 'Bad', url: 'javascript:alert(1)' }], site), undefined);
  const tree = parse(`<script type="application/ld+json">${safeJsonLdSerialize(graph)}</script>`);
  const nodes = []; const walk = node => { nodes.push(node); (node.childNodes || []).forEach(walk); }; walk(tree);
  assert.equal(nodes.filter(node => node.tagName === 'script').length, 1);
  assert.equal(nodes.filter(node => node.tagName === 'img').length, 0);
  assert.deepEqual(organizationGraph('Publisher', site, '/logo.svg'), {
    '@context': 'https://schema.org', '@type': 'Organization', '@id': site + '/#organization', name: 'Publisher', url: site + '/', logo: site + '/logo.svg',
  });
  assert.equal(organizationGraph(' ', site), undefined);
  assert.equal(organizationGraph('Name', site, 'javascript:alert(1)').logo, undefined);
  assert.equal(taxonomyRobots(0), 'noindex, follow'); assert.equal(taxonomyRobots(1), undefined);
});

test('URL normalization preserves case-sensitive assets, auth, queries, escapes and unsafe methods', () => {
  const url = path => new URL(path, 'https://example.test');
  assert.equal(normalizedPageLocation(url('/Posts/Story/?Campaign=ABC')), '/posts/story?Campaign=ABC');
  for (const path of ['/', '/posts/story', '/_astro/XyZ.css/', '/_EMDASH/api/media/file/KeY', '/_image/XYZ', '/uploads/KeY/', '/api/WebHook/', '/files/PDF.PDF/', '/Posts/%41/', '/.well-known/X', '/Posts/?_edit=1', '/Posts/?_preview=abc']) {
    assert.equal(normalizedPageLocation(url(path)), undefined, path);
  }
  for (const method of ['POST', 'PUT', 'DELETE', 'OPTIONS']) assert.equal(normalizedPageLocation(url('/Posts/'), method), undefined);
  assert.equal(normalizedPageLocation(url('/Posts/'), 'HEAD'), '/posts');
});

test('baseline metadata has explicit ownership, stable override IDs and no competing primary graph', () => {
  const page = createPublicPageContext({ url: 'https://example.test/', kind: 'custom', siteUrl: 'https://example.test', siteName: 'Publisher', breadcrumbs: [{ name: 'Home', url: '/' }, { name: 'Story', url: '/story' }] });
  const defaults = siteMetadata(page);
  assert.deepEqual(defaults.map(item => item.id), ['breadcrumbs', 'organization']);
  assert.ok(!defaults.some(item => item.id === 'primary'));
  const resolved = resolvePageMetadata([{ kind: 'jsonld', id: 'organization', graph: { '@type': 'Organization', name: 'Other plugin owns this ID' } }, ...defaults]);
  assert.equal(resolved.jsonld.length, 2);
  assert.equal(JSON.parse(resolved.jsonld[0].json).name, 'Other plugin owns this ID');
  assert.deepEqual(siteMetadata(page, { breadcrumbs: false, organizationPaths: [] }), []);
  assert.equal(siteMetadata({ ...page, path: '/person' }).length, 1);
});

test('verified webhook events require an exact configured sending domain, never suffix/recipient matching', () => {
  const allowed = ['cms-mail.example.test'];
  assert.equal(isWebhookDomainAllowed('CMS-MAIL.EXAMPLE.TEST', allowed), true);
  for (const value of [undefined, {}, 'other.test', 'example.test', 'x.cms-mail.example.test', 'cms-mail.example.test.evil.test', ' cms-mail.example.test', 'a@cms-mail.example.test', 'https://cms-mail.example.test', 'cms-mail.example.test.']) {
    assert.equal(isWebhookDomainAllowed(value, allowed), false);
  }
  assert.equal(isWebhookDomainAllowed('cms-mail.example.test', []), false);
});

test('setup probe fails closed on wizard, external login, bad JSON, server errors and wrong envelope', async () => {
  const invoke = response => checkProductionSetup('https://example.test', async (url, options) => {
    assert.equal(url.pathname, '/_emdash/api/setup/status'); assert.equal(options.redirect, 'manual');
    return response;
  });
  assert.equal((await invoke(Response.json({ success: true, data: { needsSetup: false } }))).setupLocked, true);
  for (const response of [Response.json({ success: true, data: { needsSetup: true } }), Response.json({ needsSetup: false }), new Response('<html>Access login</html>'), new Response(null, { status: 302 }), new Response(null, { status: 500 })]) await assert.rejects(invoke(response));
  await assert.rejects(checkProductionSetup('https://example.test/path', () => { throw new Error('must not fetch'); }));
});

test('seven-day build retention carries exact-case assets, expires old generations and rejects collisions/tampering', async () => {
  const root = await mkdtemp(join(tmpdir(), 'baseline-assets-'));
  const archive = join(root, 'archive'), day = 86400000, now = Date.UTC(2026, 9, 20);
  async function build(name, content) { const dir = join(root, name); await mkdir(dir); await writeFile(join(dir, content[0]), content[1]); return dir; }
  try {
    const old = await build('old', ['OldHash.CSS', 'old']);
    await retainBuildAssets(old, archive, now - 8 * day);
    const recent = await build('recent', ['RecentHash.js', 'recent']);
    const receipt = await retainBuildAssets(recent, archive, now - day);
    const current = await build('current', ['Current.css', 'current']);
    assert.equal((await retainBuildAssets(current, archive, now)).retained, 1);
    assert.equal(await readFile(join(current, 'RecentHash.js'), 'utf8'), 'recent');
    await assert.rejects(readFile(join(current, 'OldHash.CSS')));
    const collision = await build('collision', ['RecentHash.js', 'different bytes']);
    await assert.rejects(retainBuildAssets(collision, archive, now), /collision/);
    await writeFile(join(receipt.release, '_astro', 'RecentHash.js'), 'tampered');
    const next = await build('next', ['New.css', 'new']);
    await assert.rejects(retainBuildAssets(next, archive, now), /integrity/);
    await assert.rejects(readFile(join(next, 'RecentHash.js')));
    await assert.rejects(retainBuildAssets(current, join(current, 'nested'), now), /separate trees/);
  } finally { await rm(root, { recursive: true, force: true }); }
});
