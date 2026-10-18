import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { collectMigrationHTTP } from '../../../scripts/migration-http.mjs';
import { migrationReport, migrationMarkdown } from '../../../scripts/migration-report.mjs';
import { localEvidenceVerifier } from '../../../scripts/migration-verify.mjs';
import { reconcileContent } from '../../../scripts/migration-content.mjs';
import { inventoryTotals } from '../../../standards/schemas/migration-content.mjs';
import { contractDigest, sha256, resultOf } from '../../../standards/schemas/migration-acceptance.mjs';
import { portableFacts } from './fixture-tools.mjs';

export const replacement = [{ _type: 'block', style: 'normal', children: [{ _type: 'span', text: 'Saved builder fallback. Reviewed static replacement for the unsupported dynamic query.' }] }];
export const repairedSEO = (lane, slug) => ({ title: `Reviewed ${slug} SEO`, description: `Reviewed ${slug} description`, canonical: `https://production.example.test/view/${lane}_posts/en/${slug}`, noIndex: true });
export const blankSEO = { title: null, description: null, canonical: null, noindex: false };
export function expectedAfterRepair(expected) {
  const result = structuredClone(expected); result.unsupported = replacement;
  const classic = JSON.stringify(result.classic).replaceAll('/2020/old/permalink/', '/view/{collection}/en/gutenberg'); result.classic = JSON.parse(classic);
  return result;
}

export async function httpAcceptance(out, label, origin, lane, { repaired = true } = {}) {
  const manifest = { manifestVersion: 2, id: 'synthetic-importer', sourceOrigin: 'https://wordpress.example.test', targetOrigin: origin, productionOrigin: 'https://production.example.test', allowedAssetOrigins: [origin], sourceCapture: { id: 'synthetic-wp-capture', sha256: sha256('synthetic-fixture') }, targetRevision: 'synthetic-importer-fixture', policies: { trailingSlash: 'preserve', query: 'exact' },
    urls: ['classic', 'gutenberg', 'gallery', 'unsupported', 'yoast', 'rankmath'].map(slug => ({ id: slug, sourceUrl: `https://wordpress.example.test/2020/${slug}/`, locale: 'en', disposition: 'retained', requestPath: `/view/${lane}_posts/en/${slug}`, expected: { status: 200, title: { value: ['yoast', 'rankmath'].includes(slug) && repaired ? `Reviewed ${slug} SEO` : ({ rankmath: 'Rank Math fixture', unsupported: 'Unsupported fixture' }[slug] ?? slug[0].toUpperCase() + slug.slice(1) + ' fixture'), required: true }, canonical: { value: `https://production.example.test/view/${lane}_posts/en/${slug}`, required: true }, links: { value: 'reachable', required: true }, assets: { value: 'reachable', required: true }, reviewSignals: { value: 'report', required: false }, ...(['yoast', 'rankmath'].includes(slug) && repaired ? { description: { value: `Reviewed ${slug} description`, required: true }, indexability: { value: 'noindex', required: true } } : {}) } })),
    acceptanceChecks: [{ id: 'content', category: 'content', required: true, expectation: 'Separate inventory evidence' }, { id: 'editor', category: 'editor', required: true, expectation: 'Separate editor evidence' }] };
  const directory = path.join(out, label); fs.mkdirSync(directory);
  const observations = await collectMigrationHTTP(manifest, { directory });
  const report = migrationReport(manifest, observations, { scope: 'url', runId: label, generatedAt: new Date().toISOString(), collected: true, verifyArtifact: localEvidenceVerifier(directory) });
  fs.writeFileSync(path.join(directory, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
  fs.writeFileSync(path.join(directory, 'report.json'), JSON.stringify(report, null, 2) + '\n');
  fs.writeFileSync(path.join(directory, 'report.md'), migrationMarkdown(report));
  return report;
}

export function inventoryAcceptance(out, label, fixture, items, expected, media, stableIds, { preserveParent = false } = {}) {
  const manifest = { sourceCapture: { sha256: sha256('synthetic-fixture') }, targetRevision: 'synthetic-importer-fixture', sourceOrigin: fixture.origin, productionOrigin: 'https://production.example.test' };
  const mediaMap = new Map(media.map(m => [String(m.wpId), m.mediaId]));
  const source = { inventoryVersion: 1, side: 'source', binding: manifest.sourceCapture.sha256, complete: true, entities: fixture.posts.map(p => ({ id: String(p.id), entityType: p.post_type, status: p.status, locale: p.locale, slug: p.slug, title: p.title, fields: { source_html: contractDigest(p.content) }, requiredFields: ['source_html'], parentId: p.parent ? String(p.parent) : null, translationGroup: p.translation_group ?? null, mediaIds: p.slug === 'gallery' ? ['201', '202'] : [], seo: blankSEO })), media: fixture.media.map(m => ({ id: String(m.id), resolved: true })) };
  const target = { inventoryVersion: 1, side: 'target', binding: manifest.targetRevision, complete: true, entities: items.map(i => ({ id: i.id, entityType: i.collection, status: i.status, locale: i.locale, slug: i.slug, title: i.data.title, fields: { content_facts: contractDigest(portableFacts(i.data.content, media)) }, requiredFields: ['content_facts'], parentId: null, translationGroup: i.translationGroup, mediaIds: [...new Set(media.filter(m => JSON.stringify(i.data.content).includes(m.newUrl)).map(m => m.mediaId))], seo: i.seo ? { title: i.seo.title, description: i.seo.description, canonical: i.seo.canonical, noindex: i.seo.noIndex } : null })), media: media.map(m => ({ id: m.mediaId, resolved: true })) };
  source.coverage = inventoryTotals(source.entities); target.coverage = inventoryTotals(target.entities);
  const byId = new Map(items.map(i => [i.id, i]));
  const mapping = { mappingVersion: 1, rules: fixture.posts.map(p => {
    const id = stableIds[String(p.id)];
    if (p.post_type === 'wp_block') return { id: 'section-exclusion', kind: 'exclude', sources: [String(p.id)], targets: [], reason: 'Reusable section verified separately by actual WXR finalization, outside these entry collections.', relationships: 'replace', fieldLinks: [] };
    const item = byId.get(id); assert.ok(item, 'Stable captured import identity');
    const lane = item.collection.startsWith('wxr') ? 'wxr' : 'plugin';
    const seo = ['yoast', 'rankmath'].includes(p.slug) ? repairedSEO(lane, p.slug) : null;
    return { id: 'source-' + p.id, kind: 'one-to-one', sources: [String(p.id)], targets: [{ id, entityType: `${lane}_${p.post_type}s`, status: p.status === 'publish' ? 'published' : p.status === 'future' ? 'scheduled' : 'draft', locale: p.locale, slug: p.slug, titleSHA256: contractDigest(p.title), parentId: null, translationGroup: p.translation_group ? stableIds['107'] : id, mediaIds: p.slug === 'gallery' ? [...mediaMap.values()] : [], fields: { content_facts: contractDigest(expected[p.slug]) }, seo: seo ? { title: seo.title, description: seo.description, canonical: seo.canonical, noindex: seo.noIndex } : blankSEO }], reason: p.parent ? 'Parent relationship unsupported by selected importer; explicit scoped exception, requires native reference rebuild for a real site.' : p.slug === 'unsupported' ? 'Reviewed fixture-only static replacement; shortcode/provider behavior is not certified.' : 'Reviewed structural conversion and raw-status policy; ungrouped source rows become native singleton groups; private/pending/trash become drafts.', relationships: p.parent && preserveParent || p.translation_group ? 'preserve' : 'replace', fieldLinks: [{ sourceId: String(p.id), sourceField: 'source_html', targetId: id, targetField: 'content_facts', mode: 'replace', reason: 'HTML to reviewed semantic Portable Text oracle, not raw byte equality.' }] };
  }), media: media.map(m => ({ sourceId: String(m.wpId), targetId: m.mediaId, reason: 'Actual importer media receipt and stored byte verification.' })), translationGroups: [{ sourceId: '701', targetId: stableIds['107'], reason: 'Verified native row-per-locale translation link.' }], seoPolicy: { fields: ['title', 'description', 'canonical', 'noindex'], canonical: 'explicit' } };
  const reconciliation = reconcileContent(source, target, mapping, manifest);
  const result = resultOf(reconciliation.checks.map(c => ({ ...c, required: true })));
  fs.writeFileSync(path.join(out, label + '.json'), JSON.stringify({ ...reconciliation, ...result }, null, 2) + '\n');
  return { ...reconciliation, ...result };
}
