// Versioned offline contracts. Unknown evidence is null, never an invented default.

export const CONTENT_VERSION = 1;
export const CONTENT_CHECKS = ['inputs', 'coverage', 'identity', 'fields', 'relationships', 'media'];
const obj = x => x !== null && typeof x === 'object' && !Array.isArray(x);
const shape = (x, keys) => obj(x) && keys.every(k => Object.hasOwn(x, k)) && Object.keys(x).every(k => keys.includes(k));
const str = x => typeof x === 'string' && x.trim().length > 0 && x.length <= 256 && !/[\x00-\x1f\x7f]/.test(x);
export const contentID = x => str(x) && !/[\s\\]/.test(x) && !/^[a-z][a-z0-9+.-]*:\/\//i.test(x) && !x.startsWith('/');
const label = x => str(x) && /^[A-Za-z0-9_-]+$/.test(x);
const hash = x => typeof x === 'string' && /^[a-f0-9]{64}$/.test(x);
const array = x => Array.isArray(x) && x.length <= 5000;
const unique = x => new Set(x).size === x.length;
const ids = x => array(x) && x.every(contentID) && unique(x);
const nullable = (x, test) => x === null || test(x);
const fields = x => obj(x) && Object.keys(x).length <= 100 && Object.entries(x).every(([k, v]) => label(k) && nullable(v, hash));
const seo = x => x === null || shape(x, ['title', 'description', 'canonical', 'noindex']) && ['title', 'description', 'canonical'].every(k => x[k] === null || typeof x[k] === 'string' && x[k].length <= 4096 && !/[\x00-\x1f\x7f]/.test(x[k])) && typeof x.noindex === 'boolean';
const entity = x => shape(x, ['id', 'entityType', 'status', 'locale', 'slug', 'title', 'fields', 'requiredFields', 'parentId', 'translationGroup', 'mediaIds', 'seo']) && contentID(x.id) && ['entityType', 'status', 'locale'].every(k => nullable(x[k], label)) && nullable(x.slug, s => typeof s === 'string' && s.length <= 512 && !/[\x00-\x1f\x7f]/.test(s)) && nullable(x.title, s => typeof s === 'string' && s.length <= 4096 && !/[\x00-\x1f\x7f]/.test(s)) && fields(x.fields) && Array.isArray(x.requiredFields) && x.requiredFields.length <= 100 && x.requiredFields.every(label) && unique(x.requiredFields) && nullable(x.parentId, contentID) && nullable(x.translationGroup, contentID) && nullable(x.mediaIds, ids) && seo(x.seo);
export const inventoryTotals = entities => {
  const groups = new Map();
  for (const e of entities) {
    const key = JSON.stringify([e.entityType, e.locale, e.status]);
    groups.set(key, (groups.get(key) ?? 0) + 1);
  }
  return [...groups].sort(([a], [b]) => a.localeCompare(b)).map(([key, total]) => { const [entityType, locale, status] = JSON.parse(key); return { entityType, locale, status, total }; });
};
export function validateContentInventory(x, side) {
  const errors = [];
  if (!shape(x, ['inventoryVersion', 'side', 'binding', 'complete', 'coverage', 'entities', 'media']) || x.inventoryVersion !== 1 || x.side !== side || typeof x.complete !== 'boolean' || !str(x.binding)) return ['inventory: invalid envelope/version/binding'];
  if (!array(x.entities) || !x.entities.every(entity) || !unique(x.entities.map(e => e?.id))) errors.push('inventory: invalid or duplicate entity identity/evidence');
  if (!array(x.media) || !x.media.every(m => shape(m, ['id', 'resolved']) && contentID(m.id) && (m.resolved === null || typeof m.resolved === 'boolean')) || !unique(x.media.map(m => m?.id))) errors.push('inventory: invalid or duplicate media catalog');
  if (!array(x.coverage) || !x.coverage.every(c => shape(c, ['entityType', 'locale', 'status', 'total']) && ['entityType', 'locale', 'status'].every(k => label(c[k])) && Number.isSafeInteger(c.total) && c.total >= 0) || !unique(x.coverage.map(c => JSON.stringify([c.entityType, c.locale, c.status])))) errors.push('inventory: invalid coverage');
  return errors;
}
const expectation = x => shape(x, ['id', 'entityType', 'status', 'locale', 'slug', 'titleSHA256', 'parentId', 'translationGroup', 'mediaIds', 'fields', 'seo']) && contentID(x.id) && ['entityType', 'status', 'locale'].every(k => label(x[k])) && typeof x.slug === 'string' && x.slug.length <= 512 && !/[\x00-\x1f\x7f]/.test(x.slug) && hash(x.titleSHA256) && nullable(x.parentId, contentID) && nullable(x.translationGroup, contentID) && ids(x.mediaIds) && fields(x.fields) && Object.values(x.fields).every(hash) && seo(x.seo);
export function validateContentMapping(x) {
  if (!shape(x, ['mappingVersion', 'rules', 'media', 'translationGroups', 'seoPolicy']) || x.mappingVersion !== 1 || !array(x.rules) || !array(x.media) || !array(x.translationGroups)) return ['mapping: invalid envelope/version'];
  const errors = [];
  for (const r of x.rules) {
    if (!shape(r, ['id', 'kind', 'sources', 'targets', 'reason', 'relationships', 'fieldLinks']) || !contentID(r.id) || !['one-to-one', 'merge', 'split', 'exclude'].includes(r.kind) || !ids(r.sources) || !array(r.targets) || !r.targets.every(expectation) || !str(r.reason) || !['preserve', 'replace'].includes(r.relationships) || !array(r.fieldLinks) || !r.fieldLinks.every(f => shape(f, ['sourceId', 'sourceField', 'targetId', 'targetField', 'mode', 'reason']) && r.sources.includes(f.sourceId) && r.targets.some(t => t.id === f.targetId) && label(f.sourceField) && label(f.targetField) && ['preserve', 'replace'].includes(f.mode) && str(f.reason))) { errors.push('mapping: invalid rule/expectation/reason'); continue; }
    const a = r.sources.length, b = r.targets.length;
    if (!(r.kind === 'one-to-one' && a === 1 && b === 1 || r.kind === 'merge' && a > 1 && b === 1 || r.kind === 'split' && a === 1 && b > 1 || r.kind === 'exclude' && a > 0 && b === 0)) errors.push('mapping: contradictory cardinality');
  }
  if (!unique(x.rules.map(r => r?.id)) || !unique(x.rules.flatMap(r => Array.isArray(r?.sources) ? r.sources : [])) || !unique(x.rules.flatMap(r => Array.isArray(r?.targets) ? r.targets.map(t => t?.id) : []))) errors.push('mapping: duplicate source/target assignment');
  for (const key of ['media', 'translationGroups']) {
    if (!x[key].every(m => shape(m, ['sourceId', 'targetId', 'reason']) && contentID(m.sourceId) && nullable(m.targetId, contentID) && str(m.reason)) || !unique(x[key].map(m => m?.sourceId))) errors.push(`mapping: invalid ${key} links/exclusion reasons`);
  }
  if (!shape(x.seoPolicy, ['fields', 'canonical']) || !Array.isArray(x.seoPolicy.fields) || !unique(x.seoPolicy.fields) || !x.seoPolicy.fields.every(k => ['title', 'description', 'canonical', 'noindex'].includes(k)) || !['preserve', 'map-production-origin', 'explicit'].includes(x.seoPolicy.canonical)) errors.push('mapping: invalid explicit SEO policy');
  return errors;
}
export function validateContentSummary(x) {
  if (!shape(x, ['contentVersion', 'source', 'target', 'expectedTarget', 'rules', 'findings']) || x.contentVersion !== 1 || !Number.isSafeInteger(x.rules) || x.rules < 0) return false;
  for (const k of ['source', 'target', 'expectedTarget']) if (!array(x[k]) || !x[k].every(c => shape(c, ['entityType', 'locale', 'status', 'total']) && ['entityType', 'locale', 'status'].every(f => nullable(c[f], label)) && Number.isSafeInteger(c.total) && c.total >= 0)) return false;
  return array(x.findings) && x.findings.every(f => shape(f, ['code', 'state', 'count']) && /^[a-z-]+$/.test(f.code) && ['fail', 'unverified'].includes(f.state) && Number.isSafeInteger(f.count) && f.count > 0);
}
