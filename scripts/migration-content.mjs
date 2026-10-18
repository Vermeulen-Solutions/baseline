import { contractDigest, sha256 } from '../standards/schemas/migration-acceptance.mjs';
import { CONTENT_CHECKS, inventoryTotals, validateContentInventory, validateContentMapping } from '../standards/schemas/migration-content.mjs';

const same = (a, b) => contractDigest(a) === contractDigest(b);

// JSON projections of installed EmDash 1.3.0 WxrPost and ContentItem contracts.
// Pagination completeness, resolved media and relationship evidence are explicit
// sidecars. Neither a public crawl nor a bootstrap seed can supply that evidence.
export function readContentInventory(value, side) {
  if (value?.inventoryVersion !== undefined) return value;
  const format = side === 'source' ? 'wordpress-wxr-json/1' : 'emdash-content-items/1';
  const keys = ['snapshotVersion', 'format', 'binding', 'complete', 'coverage', 'media', 'records'];
  if (!value || value.snapshotVersion !== 1 || value.format !== format || Object.keys(value).some(k => !keys.includes(k)) || keys.some(k => !Object.hasOwn(value, k)) || !Array.isArray(value.records) || value.records.length > 5000) throw Error('Unsupported offline snapshot contract');
  const entities = value.records.map(entry => {
    if (!entry || Object.keys(entry).sort().join(',') !== 'evidence,record' || !entry.record || !entry.evidence) throw Error('Missing record sidecar');
    const r = entry.record, e = entry.evidence;
    if (Object.keys(e).sort().join(',') !== 'mediaIds,parentId,requiredFields,seo') throw Error('Explicit relationship, SEO and media sidecars required');
    if (side === 'source') {
      if (!Number.isSafeInteger(r.id) || r.id <= 0 || !Number.isSafeInteger(r.postParent) || r.postParent < 0 || e.parentId !== (r.postParent ? String(r.postParent) : null)) throw Error('Stable WXR ID/parent required');
      return { id: String(r.id), entityType: r.postType ?? null, status: r.status ?? null, locale: r.locale ?? null, slug: r.postName ?? null, title: r.title ?? null,
        fields: Object.fromEntries(['content', 'excerpt'].filter(k => Object.hasOwn(r, k)).map(k => [k, contractDigest(r[k])])), requiredFields: e.requiredFields, parentId: e.parentId, translationGroup: r.translationGroup ?? null, mediaIds: e.mediaIds, seo: e.seo };
    }
    if (typeof r.id !== 'string' || !r.data || typeof r.data !== 'object' || Array.isArray(r.data) || Object.hasOwn(r, 'liveData')) throw Error('ContentItem with explicit data revision required; mixed live/draft overlay refused');
    return { id: r.id, entityType: r.type ?? null, status: r.status ?? null, locale: r.locale ?? null, slug: r.slug ?? null, title: r.data.title ?? null,
      fields: Object.fromEntries(Object.entries(r.data).map(([k, v]) => [k, contractDigest(v)])), requiredFields: e.requiredFields, parentId: e.parentId, translationGroup: r.translationGroup ?? null, mediaIds: e.mediaIds,
      seo: r.seo ? { title: r.seo.title, description: r.seo.description, canonical: r.seo.canonical, noindex: r.seo.noIndex } : e.seo };
  });
  return { inventoryVersion: 1, side, binding: value.binding, complete: value.complete, coverage: value.coverage, media: value.media, entities };
}

export function reconcileContent(source, target, mapping, manifest, { unavailable = false } = {}) {
  const findings = new Map();
  const add = (facet, code, state = 'fail') => {
    const key = `${facet}:${code}:${state}`;
    findings.set(key, (findings.get(key) ?? 0) + 1);
  };
  const validSource = !validateContentInventory(source, 'source').length;
  const validTarget = !validateContentInventory(target, 'target').length;
  const validMapping = !validateContentMapping(mapping).length;
  if (unavailable || !validSource || !validTarget || !validMapping) add('inputs', 'inventory-unavailable', 'unverified');
  const s = validSource ? source.entities : [], t = validTarget ? target.entities : [];
  const rules = validMapping ? mapping.rules : [];
  const expected = rules.flatMap(r => r.targets);
  const sm = new Map(s.map(e => [e.id, e])), tm = new Map(t.map(e => [e.id, e]));
  const sourceMedia = new Map((validSource ? source.media : []).map(m => [m.id, m]));
  const targetMedia = new Map((validTarget ? target.media : []).map(m => [m.id, m]));
  const mediaLinks = new Map((validMapping ? mapping.media : []).map(m => [m.sourceId, m]));
  const groupLinks = new Map((validMapping ? mapping.translationGroups : []).map(m => [m.sourceId, m]));
  const targetsOf = new Map(rules.flatMap(r => r.sources.map(id => [id, r.targets.map(e => e.id)])));
  if (validSource && source.binding !== manifest.sourceCapture.sha256 || validTarget && target.binding !== manifest.targetRevision) add('inputs', 'inventory-binding', 'unverified');
  for (const [inv, valid] of [[source, validSource], [target, validTarget]]) if (valid) {
    if (!inv.complete || inv.entities.some(e => ['entityType', 'locale', 'status', 'slug', 'title'].some(k => e[k] === null))) add('inputs', 'inventory-incomplete', 'unverified');
    // Declared zero-count buckets are useful scope evidence; compare all nonzero buckets.
    if (!same(inventoryTotals(inv.entities), [...inv.coverage].filter(c => c.total > 0).sort((a, b) => JSON.stringify([a.entityType, a.locale, a.status]).localeCompare(JSON.stringify([b.entityType, b.locale, b.status]))))) add('coverage', 'inventory-coverage', 'unverified');
    for (const e of inv.entities) for (const field of e.requiredFields) {
      if (!Object.hasOwn(e.fields, field)) add('fields', 'required-field-missing');
      else if (e.fields[field] === null) add('fields', 'required-field-unavailable', 'unverified');
    }
  }
  if (validSource && validTarget && validMapping) {
    const assignedSource = new Set(rules.flatMap(r => r.sources)), assignedTarget = new Set(expected.map(e => e.id));
    for (const e of s) if (!assignedSource.has(e.id)) add('identity', 'unmapped-source');
    for (const e of t) if (!assignedTarget.has(e.id)) add('identity', 'unexpected-target');
    for (const r of rules) {
      const sources = r.sources.map(id => sm.get(id));
      for (const e of sources) if (!e) add('identity', 'missing-source');
      for (const e of sources.filter(Boolean)) for (const field of e.requiredFields) {
        if (!Object.hasOwn(e.fields, field)) add('fields', 'source-field-missing');
        else if (e.fields[field] === null) add('fields', 'source-field-unavailable', 'unverified');
        if (r.kind !== 'exclude' && !r.fieldLinks.some(f => f.sourceId === e.id && f.sourceField === field)) add('fields', 'field-mapping-missing');
      }
      for (const f of r.fieldLinks) {
        const a = sm.get(f.sourceId), b = tm.get(f.targetId);
        if (!a || !b) continue;
        if (!Object.hasOwn(a.fields, f.sourceField) || !Object.hasOwn(b.fields, f.targetField)) add('fields', 'mapped-field-missing');
        else if (a.fields[f.sourceField] === null || b.fields[f.targetField] === null) add('fields', 'mapped-field-unavailable', 'unverified');
        else if (f.mode === 'preserve' && a.fields[f.sourceField] !== b.fields[f.targetField]) add('fields', 'mapped-field-mismatch');
        if (!Object.hasOwn(r.targets.find(e => e.id === f.targetId).fields, f.targetField)) add('fields', 'field-expectation-missing');
      }
      for (const exp of r.targets) {
        const actual = tm.get(exp.id);
        if (!actual) { add('identity', 'missing-target'); continue; }
        for (const key of ['entityType', 'status', 'locale', 'slug']) {
          if (actual[key] === null) add('fields', 'entity-evidence-missing', 'unverified');
          else if (actual[key] !== exp[key]) add('fields', 'entity-mismatch');
        }
        if (actual.title === null) add('fields', 'title-unavailable', 'unverified');
        else if (contractDigest(actual.title) !== exp.titleSHA256) add('fields', 'title-mismatch');
        for (const [field, digest] of Object.entries(exp.fields)) {
          if (!Object.hasOwn(actual.fields, field)) add('fields', 'required-field-missing');
          else if (actual.fields[field] === null) add('fields', 'required-field-unavailable', 'unverified');
          else if (actual.fields[field] !== digest) add('fields', 'required-field-mismatch');
        }
        for (const key of ['parentId', 'translationGroup']) if (actual[key] !== exp[key]) add('relationships', 'relationship-mismatch');
        if (actual.parentId !== null && (!tm.has(actual.parentId) || actual.parentId === actual.id)) add('relationships', 'broken-parent');
        if (r.relationships === 'preserve') {
          const parents = sources.filter(Boolean).map(e => e.parentId);
          const parentTargets = parents.flatMap(id => id === null ? [null] : targetsOf.get(id) ?? []);
          if (sources.every(Boolean) && !parentTargets.includes(actual.parentId)) add('relationships', 'parent-preservation');
          const groups = sources.filter(Boolean).map(e => e.translationGroup);
          const groupTargets = groups.map(id => id === null ? null : groupLinks.get(id)?.targetId);
          if (groupTargets.includes(undefined)) add('relationships', 'translation-mapping-missing');
          else if (sources.every(Boolean) && !groupTargets.includes(actual.translationGroup)) add('relationships', 'translation-preservation');
        }
        if (actual.mediaIds === null) add('media', 'media-unavailable', 'unverified');
        else {
          if (!same([...actual.mediaIds].sort(), [...exp.mediaIds].sort())) add('media', 'media-assignment');
          for (const id of actual.mediaIds) {
            const media = targetMedia.get(id);
            if (!media || media.resolved === false) add('media', 'media-unresolved');
            else if (media.resolved === null) add('media', 'media-unavailable', 'unverified');
          }
        }
        for (const field of mapping.seoPolicy.fields) {
          if (!sources.every(Boolean)) continue; // Missing identities are already confirmed failures.
          if (!actual.seo || !exp.seo) { add('fields', 'seo-unavailable', 'unverified'); continue; }
          let want = exp.seo[field];
          if (mapping.seoPolicy.canonical !== 'explicit') {
            const values = sources.filter(Boolean).map(e => e.seo?.[field]);
            if (sources.some(e => !e?.seo) || !values.length) { add('fields', 'seo-source-unavailable', 'unverified'); continue; }
            if (!values.every(v => same(v, values[0]))) { add('fields', 'seo-merge-policy'); continue; }
            want = values[0];
            if (field === 'canonical' && want !== null && mapping.seoPolicy.canonical === 'map-production-origin') {
              try { const url = new URL(want); if (url.origin !== manifest.sourceOrigin) throw Error(); want = manifest.productionOrigin + url.href.slice(url.origin.length); }
              catch { add('fields', 'seo-canonical-policy'); continue; }
            }
          }
          if (field === 'canonical' && want !== null) {
            try { const url = new URL(want); if (url.origin !== manifest.productionOrigin || url.username || url.password) throw Error(); }
            catch { add('fields', 'seo-canonical-policy'); continue; }
          }
          if (!same(actual.seo[field], want)) add('fields', 'seo-mismatch');
        }
      }
      // Every source attachment must survive somewhere in this rule, or have a reasoned media exclusion.
      if (r.kind !== 'exclude') for (const e of sources.filter(Boolean)) {
        if (e.mediaIds === null) { add('media', 'media-source-unavailable', 'unverified'); continue; }
        for (const id of e.mediaIds) {
          const link = mediaLinks.get(id);
          if (!sourceMedia.has(id)) add('media', 'source-media-missing');
          if (!link) add('media', 'media-mapping-missing');
          else if (link.targetId !== null && !r.targets.some(exp => tm.get(exp.id)?.mediaIds?.includes(link.targetId))) add('media', 'media-preservation');
        }
      }
    }
    if (!same(inventoryTotals(t), inventoryTotals(expected))) add('coverage', 'target-totals-mismatch');
    for (const m of mapping.media) if (!sourceMedia.has(m.sourceId) || m.targetId !== null && !targetMedia.has(m.targetId)) add('media', 'media-link-missing');
    for (const g of mapping.translationGroups) if (!s.some(e => e.translationGroup === g.sourceId) || g.targetId !== null && !t.some(e => e.translationGroup === g.targetId)) add('relationships', 'translation-link-missing');
    // Distinct locales in a group; detect cycles even when the expected IDs also describe a cycle.
    const groups = new Set();
    for (const e of t) {
      if (e.translationGroup !== null) {
        const key = JSON.stringify([e.translationGroup, e.locale]);
        if (groups.has(key)) add('relationships', 'translation-locale-duplicate');
        groups.add(key);
      }
      const seen = new Set([e.id]); let parent = e.parentId;
      while (parent !== null && tm.has(parent)) {
        if (seen.has(parent)) { add('relationships', 'parent-cycle'); break; }
        seen.add(parent); parent = tm.get(parent).parentId;
      }
    }
    for (const e of s) if (e.parentId !== null && !sm.has(e.parentId)) add('relationships', 'source-parent-missing');
  }
  const summary = { contentVersion: 1, source: inventoryTotals(s), target: inventoryTotals(t), expectedTarget: inventoryTotals(expected), rules: rules.length,
    findings: [...findings].map(([key, count]) => { const [, code, state] = key.split(':'); return { code, state, count }; }) };
  const checks = CONTENT_CHECKS.map(facet => {
    const items = [...findings].filter(([key]) => key.startsWith(facet + ':'));
    const status = items.some(([key]) => key.endsWith(':unverified')) ? 'unverified' : items.length ? 'fail' : unavailable || !validSource || !validTarget || !validMapping ? 'unverified' : 'pass';
    return { id: `content:${facet}`, status, reason: status === 'pass' ? `Offline content ${facet} checks passed against the explicit mapping.` : `Offline content ${facet}: ${items.map(([key, n]) => `${key.split(':')[1]} (${n})`).join(', ') || 'required input unavailable'}.`, observed: `source ${s.length}; target ${t.length}; expected target ${expected.length}; rules ${rules.length}`, evidence: [] };
  });
  return { summary, checks };
}

export function contentEvidence(result) {
  const bytes = JSON.stringify({ producer: 'baseline-content-reconciliation/1', ...result }, null, 2) + '\n';
  return { bytes, sha256: sha256(bytes) };
}
