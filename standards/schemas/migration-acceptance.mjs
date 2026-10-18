import { CONTENT_CHECKS, validateContentSummary } from './migration-content.mjs';
import { createHash } from 'node:crypto';

// Executable schemas are authoritative. No implicit coercion/defaults or unknown keys.
export const CONTRACT_VERSION = 1;
export const SUPPORTED_VERSIONS = Object.freeze([1, 2, 3]);
export const STATES = Object.freeze(['pass', 'fail', 'advisory', 'unverified', 'not-applicable']);
const CATEGORIES = ['url', 'content', 'editor'];
const DISPOSITIONS = ['retained', 'redirected', 'removed', 'excluded'];
const META = ['title', 'description', 'canonical', 'robots', 'fragments'];
const HTTP_META = ['links', 'assets', 'indexability', 'reviewSignals'];
export const HTTP_LIMITS = Object.freeze({ timeoutMs: 10000, runTimeoutMs: 60000, concurrency: 4, maxResponseBytes: 4194304, maxTotalBytes: 33554432, maxRequests: 500, maxRedirects: 10, maxReferencesPerPage: 100 });
export const reportScopeNotice = scope => scope === 'url' ? 'URL-only scope: content, editor and provider parity were not assessed.' : 'HTTP evidence alone does not establish content, editor or provider parity; separate acceptance evidence is required.';
const metaKeys = manifest => manifest.manifestVersion >= 2 ? [...META, ...HTTP_META] : META;
const id = value => typeof value === 'string' && /^[a-z][a-z0-9-]{0,63}$/.test(value);
const hash = value => typeof value === 'string' && /^[a-f0-9]{64}$/.test(value);
const text = (value, max = 2048) => typeof value === 'string' && value.length <= max && value.trim().length > 0 && !/[\x00-\x1f\x7f]/.test(value);
const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const list = (value, min = 0, max = 5000) => Array.isArray(value) && value.length >= min && value.length <= max;
const unique = values => new Set(values).size === values.length;
export const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');

function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (object(value)) return Object.fromEntries(Object.keys(value).sort().map(key => [key, canonical(value[key])]));
  return value;
}
export const contractDigest = value => sha256(JSON.stringify(canonical(value)));

function shape(value, required, optional = []) {
  return object(value) && required.every(key => Object.hasOwn(value, key)) && Object.keys(value).every(key => [...required, ...optional].includes(key));
}
function jsonValue(value, ancestors = new Set(), depth = 0) {
  if (depth > 30 || ['undefined', 'bigint', 'symbol', 'function'].includes(typeof value) || typeof value === 'number' && !Number.isFinite(value)) return false;
  if (!value || typeof value !== 'object') return true;
  if (ancestors.has(value) || !Array.isArray(value) && Object.getPrototypeOf(value) !== Object.prototype && Object.getPrototypeOf(value) !== null) return false;
  ancestors.add(value);
  const valid = Object.values(value).every(child => jsonValue(child, ancestors, depth + 1)); ancestors.delete(value);
  return valid;
}
function exactURL(value) {
  if (!text(value, 4096) || /[\\\s]/u.test(value) || /%(?![a-f0-9]{2})/i.test(value)) return false;
  try { const url = new URL(value); return ['http:', 'https:'].includes(url.protocol) && !url.username && !url.password && url.href === value; }
  catch { return false; }
}
export function isOrigin(value) {
  return exactURL(typeof value === 'string' ? value + '/' : value) && new URL(value).origin === value;
}
function pathURL(value) {
  return text(value, 4096) && value.startsWith('/') && !value.startsWith('//') && !value.includes('#') && exactURL('https://path.example.test' + value);
}
const timestamp = value => typeof value === 'string' && /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(value) && Number.isFinite(Date.parse(value)) && new Date(value).toISOString() === value;
const evidenceRef = value => shape(value, ['reference', 'sha256']) && text(value.reference) && hash(value.sha256);
export function isArtifact(value) {
  return shape(value, ['path', 'sha256']) && text(value.path, 1024) && !/[\\:#?]/.test(value.path) && !value.path.startsWith('/') && value.path.split('/').every(part => part && part !== '.' && part !== '..') && hash(value.sha256);
}
function identity(value) {
  // Reject ambiguous percent spelling; preserve query order, slash and every actual URL value.
  return value.replace(/%[a-f0-9]{2}/gi, code => {
    const char = String.fromCharCode(Number.parseInt(code.slice(1), 16));
    return /^[a-z0-9._~-]$/i.test(char) ? char : code.toUpperCase();
  });
}
function slashMatches(route, policy) {
  const pathname = new URL(route, 'https://path.example.test').pathname;
  return pathname === '/' || policy === 'preserve' || (policy === 'always' ? pathname.endsWith('/') : !pathname.endsWith('/'));
}

export function validateManifest(manifest) {
  const errors = [], bad = message => errors.push(message);
  if (!jsonValue(manifest) || !shape(manifest, ['manifestVersion', 'id', 'sourceOrigin', 'targetOrigin', 'productionOrigin', 'allowedAssetOrigins', 'sourceCapture', 'targetRevision', 'policies', 'urls', 'acceptanceChecks'], [2, 3].includes(manifest?.manifestVersion) ? ['inventories', 'http'] : ['inventories'])) return ['manifest: invalid shape or non-JSON value'];
  if (!SUPPORTED_VERSIONS.includes(manifest.manifestVersion) || !id(manifest.id)) bad('manifest: unsupported version or ID');
  if (manifest.http !== undefined && (!shape(manifest.http, [], Object.keys(HTTP_LIMITS)) || Object.entries(manifest.http).some(([key, value]) => !Number.isInteger(value) || value < 1 || value > HTTP_LIMITS[key]))) bad('http: positive integer limits may only reduce the fixed caps');
  for (const key of ['sourceOrigin', 'targetOrigin', 'productionOrigin']) if (!isOrigin(manifest[key])) bad(`${key}: exact HTTP(S) origin required (no slash, path, credentials or implicit normalization)`);
  if (!list(manifest.allowedAssetOrigins, 0, 32) || !manifest.allowedAssetOrigins.every(isOrigin) || !unique(manifest.allowedAssetOrigins)) bad('allowedAssetOrigins: unique explicit origins required');
  if (!shape(manifest.sourceCapture, ['id', 'sha256']) || !text(manifest.sourceCapture.id, 200) || !hash(manifest.sourceCapture.sha256) || !text(manifest.targetRevision, 200)) bad('sourceCapture/targetRevision: explicit capture and revision required');
  if (!shape(manifest.policies, ['trailingSlash', 'query']) || !['preserve', 'always', 'never'].includes(manifest.policies.trailingSlash) || manifest.policies.query !== 'exact') bad('policies: trailingSlash preserve|always|never and query exact required');
  if (manifest.inventories !== undefined && (!shape(manifest.inventories, ['source', 'target', 'mapping']) || !Object.values(manifest.inventories).every(evidenceRef))) bad('inventories: source/target/mapping references and digests required');
  if (manifest.manifestVersion === 3 && !manifest.inventories) bad('inventories: version 3 requires source/target/mapping evidence');
  if (errors.length) return errors;
  if (!list(manifest.urls, 1, 500)) bad('urls: 1–500 entries required');
  else {
    const ids = [], sources = [], requests = [];
    for (const entry of manifest.urls) {
      if (!object(entry) || !DISPOSITIONS.includes(entry.disposition)) { bad('url: unknown disposition'); continue; }
      const excluded = entry.disposition === 'excluded';
      if (!shape(entry, ['id', 'sourceUrl', 'locale', 'disposition', ...(excluded ? ['reason'] : ['requestPath', 'expected'])], ['approvedDifferences'])) { bad('url: contradictory or unknown disposition fields'); continue; }
      if (!id(entry.id) || !text(entry.locale, 40) || !/^[A-Za-z0-9]+(?:-[A-Za-z0-9]+)*$/.test(entry.locale)) bad('url: invalid ID/locale');
      ids.push(entry.id);
      if (!exactURL(entry.sourceUrl) || new URL(entry.sourceUrl).origin !== manifest.sourceOrigin || entry.sourceUrl.includes('#')) bad('sourceUrl: exact declared-source URL without fragment required');
      else sources.push(identity(entry.sourceUrl));
      if (entry.approvedDifferences !== undefined && (!list(entry.approvedDifferences, 1, 50) || !entry.approvedDifferences.every(item => shape(item, ['reason', 'evidence']) && text(item.reason) && evidenceRef(item.evidence)))) bad('approvedDifferences: reason and evidence required; expectations must still be explicit');
      if (excluded) { if (!text(entry.reason)) bad('excluded: nonempty reason required'); continue; }
      if (!pathURL(entry.requestPath)) bad('requestPath: exact root-relative path/query without fragment required');
      else requests.push(identity(entry.requestPath));
      const expected = entry.expected;
      if (entry.disposition === 'removed') {
        if (!shape(expected, ['status']) || ![404, 410].includes(expected.status)) bad('removed: expected status must be 404 or 410, without metadata/redirect fields');
        continue;
      }
      const redirected = entry.disposition === 'redirected';
      if (!shape(expected, ['status', ...(redirected ? ['redirects'] : [])], metaKeys(manifest)) || expected.status !== 200) { bad('expected: terminal 200 and valid disposition fields required'); continue; }
      let terminal = entry.requestPath;
      if (redirected) {
        if (!list(expected.redirects, 1, 10) || !expected.redirects.every(hop => shape(hop, ['status', 'path']) && [301, 302, 303, 307, 308].includes(hop.status) && pathURL(hop.path))) bad('redirects: 1–10 explicit status/path hops required');
        else {
          const chain = [entry.requestPath, ...expected.redirects.map(hop => hop.path)];
          if (!unique(chain.map(identity))) bad('redirects: expected chain contains a loop');
          terminal = chain.at(-1);
        }
      }
      if (pathURL(terminal) && !slashMatches(terminal, manifest.policies.trailingSlash)) bad('expected terminal path contradicts trailing-slash policy');
      for (const key of metaKeys(manifest)) if (Object.hasOwn(expected, key)) {
        const assertion = expected[key];
        if (!shape(assertion, ['value', 'required']) || typeof assertion.required !== 'boolean') { bad(`${key}: value and explicit required boolean needed`); continue; }
        const value = assertion.value;
        if (['title', 'description'].includes(key) && value !== null && !text(value)) bad(`${key}: bounded string or null (absent) required`);
        if (key === 'canonical' && value !== null && (!exactURL(value) || new URL(value).origin !== manifest.productionOrigin || value.includes('#'))) bad('canonical: production-origin URL or null required, never implicit preview origin');
        if (key === 'robots' && (!list(value, 0, 32) || !value.every(token => text(token, 100) && /^[a-z0-9:.-]+$/.test(token)) || !unique(value) || value.includes('index') && value.includes('noindex') || value.includes('follow') && value.includes('nofollow'))) bad('robots: unique noncontradictory directives required');
        if (key === 'fragments' && (!list(value, 1, 100) || !value.every(fragment => text(fragment, 200) && !fragment.startsWith('#')) || !unique(value))) bad('fragments: unique literal IDs without # required');
        if (['links', 'assets'].includes(key) && value !== 'reachable') bad(`${key}: value must be reachable`);
        if (key === 'indexability' && !['indexable', 'noindex'].includes(value)) bad('indexability: indexable or noindex required');
        if (key === 'reviewSignals' && (value !== 'report' || assertion.required !== false)) bad('reviewSignals: explicit optional report assertion required');
      }
    }
    if (!unique(ids) || !unique(sources) || !unique(requests)) bad('urls: duplicate or ambiguous ID/source URL/fetch path');
    if (!requests.length) bad('urls: at least one nonexcluded fetch path required');
  }
  if (!list(manifest.acceptanceChecks, manifest.manifestVersion === 3 ? 1 : 2, 200)) bad('acceptanceChecks: content and editor declarations required');
  else {
    for (const check of manifest.acceptanceChecks) if (!shape(check, ['id', 'category', 'required', 'expectation']) || !id(check.id) || !['content', 'editor'].includes(check.category) || typeof check.required !== 'boolean' || !text(check.expectation)) bad('acceptanceChecks: invalid declaration');
    if (!unique(manifest.acceptanceChecks.map(check => check?.id))) bad('acceptanceChecks: duplicate ID');
    for (const category of (manifest.manifestVersion === 3 ? ['editor'] : ['content', 'editor'])) if (!manifest.acceptanceChecks.some(check => check?.category === category && check.required === true)) bad(`acceptanceChecks: required ${category} parity declaration missing`);
  }
  if (!errors.length && declarations(manifest, 'full').length > 5000) bad('manifest: at most 5000 generated checks supported');
  return errors;
}

export function declarations(manifest, scope) {
  const checks = [];
  const add = (entry, name, expectation, required = true) => checks.push({ id: `url:${entry.id}:${name}`, urlId: entry.id, category: 'url', required, expectation: JSON.stringify(expectation) });
  for (const entry of manifest.urls) {
    if (entry.disposition === 'excluded') { add(entry, 'excluded', { reason: entry.reason }, false); continue; }
    add(entry, 'status', { path: entry.requestPath, terminalStatus: entry.expected.status });
    if (manifest.manifestVersion >= 2) add(entry, 'collection', 'Complete evidence for required HTTP checks within the declared limits');
    if (entry.disposition === 'redirected') add(entry, 'redirects', { hops: entry.expected.redirects, loops: false });
    for (const key of metaKeys(manifest)) if (Object.hasOwn(entry.expected, key)) add(entry, key, entry.expected[key].value, entry.expected[key].required);
  }
  if (manifest.manifestVersion === 3) for (const facet of CONTENT_CHECKS) checks.push({ id: `content:${facet}`, urlId: null, category: 'content', required: scope === 'full', expectation: `Version-1 offline content reconciliation: ${facet}` });
  for (const check of manifest.acceptanceChecks) checks.push({ id: `acceptance:${check.id}`, urlId: null, category: check.category, required: scope === 'full' && check.required, expectation: check.expectation });
  return checks;
}

export function validateObservations(bundle, manifest) {
  const errors = [];
  if (validateManifest(manifest).length) return ['observations: valid manifest required'];
  if (!jsonValue(bundle) || !shape(bundle, ['observationsVersion', 'manifestSHA256', 'sourceCaptureSHA256', 'targetRevision', 'capturedAt', 'checks'], manifest.manifestVersion === 3 ? ['content'] : [])) return ['observations: invalid shape'];
  if (bundle.observationsVersion !== manifest.manifestVersion || bundle.manifestSHA256 !== contractDigest(manifest) || bundle.sourceCaptureSHA256 !== manifest.sourceCapture.sha256 || bundle.targetRevision !== manifest.targetRevision || !timestamp(bundle.capturedAt)) errors.push('observations: version, capture, revision, timestamp or manifest binding mismatch');
  if (bundle.content !== undefined && !validateContentSummary(bundle.content)) errors.push('observations: invalid content summary');
  const expected = new Set(declarations(manifest, 'full').map(check => check.id));
  if (!list(bundle.checks, 0, 5000)) errors.push('observations: bounded checks required');
  else {
    for (const check of bundle.checks) {
      if (!shape(check, ['id', 'status', 'reason', 'observed', 'evidence']) || !expected.has(check.id) || !STATES.includes(check.status) || !text(check.reason) || check.observed !== null && !text(check.observed, 8192) || !list(check.evidence, 0, 20) || !check.evidence.every(isArtifact)) errors.push('observations: invalid check/status/observed/evidence or undeclared ID');
      else if (['pass', 'fail', 'advisory'].includes(check.status) && (!check.evidence.length || check.observed === null)) errors.push('observations: asserted result requires an observed value and local evidence');
    }
    if (!unique(bundle.checks.map(check => check?.id))) errors.push('observations: duplicate check IDs');
  }
  return errors;
}

export function resultOf(checks) {
  const required = checks.filter(check => check?.required);
  const unknown = required.some(check => !['pass', 'fail'].includes(check.status));
  const failed = required.some(check => check.status === 'fail');
  return { result: unknown ? 'unverified' : failed ? 'fail' : 'pass', exitCode: unknown ? 2 : failed ? 1 : 0 };
}
export function coverageOf(manifest, checks) {
  return {
    urls: { total: manifest.urls.length, ...Object.fromEntries(DISPOSITIONS.map(disposition => [disposition, manifest.urls.filter(entry => entry.disposition === disposition).length])) },
    checks: { total: checks.length, required: checks.filter(check => check?.required).length, ...Object.fromEntries(STATES.map(state => [state, checks.filter(check => check?.status === state).length])) },
  };
}

export function validateMigrationReport(report, manifest) {
  const errors = validateManifest(manifest);
  if (errors.length) return ['report: valid paired manifest required'];
  if (!jsonValue(report) || !shape(report, ['reportVersion', 'toolVersion', 'run', 'scope', 'mode', 'binding', 'observationsSHA256', 'coverage', 'checks', 'result', 'exitCode', ...(manifest.manifestVersion >= 2 ? ['scopeNotice'] : []), ...(manifest.manifestVersion === 3 ? ['content'] : [])])) return ['report: invalid shape'];
  if (manifest.manifestVersion === 3 && report.content !== null && !validateContentSummary(report.content)) errors.push('report: invalid content summary');
  if (manifest.manifestVersion === 3 && report.scope === 'url' && report.content !== null) errors.push('report: URL scope cannot certify content');
  const modes = manifest.manifestVersion >= 2 ? ['none', 'supplied-observations', 'http-collected'] : ['none', 'supplied-observations'];
  if (report.reportVersion !== manifest.manifestVersion || report.toolVersion !== `migration-acceptance/${manifest.manifestVersion}` || !['url', 'full'].includes(report.scope) || !modes.includes(report.mode)) errors.push('report: invalid version, scope or mode');
  if (manifest.manifestVersion >= 2 && report.scopeNotice !== reportScopeNotice(report.scope)) errors.push('report: scope notice missing or incorrect');
  if (!shape(report.run, ['id', 'generatedAt']) || !id(report.run.id) || !timestamp(report.run.generatedAt)) errors.push('report: invalid run identity');
  const binding = { manifestId: manifest.id, manifestSHA256: contractDigest(manifest), sourceCaptureSHA256: manifest.sourceCapture.sha256, targetRevision: manifest.targetRevision, sourceOrigin: manifest.sourceOrigin, targetOrigin: manifest.targetOrigin, productionOrigin: manifest.productionOrigin };
  if (contractDigest(report.binding) !== contractDigest(binding)) errors.push('report: binding mismatch');
  if (report.mode === 'none' ? report.observationsSHA256 !== null : !hash(report.observationsSHA256)) errors.push('report: observation digest/mode mismatch');
  const expected = declarations(manifest, report.scope);
  if (!list(report.checks, expected.length, expected.length)) return [...errors, 'report: missing or extra declarations'];
  for (let i = 0; i < expected.length; i++) {
    const check = report.checks[i], declaration = expected[i];
    if (!shape(check, ['id', 'urlId', 'category', 'required', 'expectation', 'status', 'reason', 'observed', 'evidence']) || Object.keys(declaration).some(key => check[key] !== declaration[key]) || !CATEGORIES.includes(check.category) || !STATES.includes(check.status) || !text(check.reason) || check.observed !== null && !text(check.observed, 8192) || !list(check.evidence, 0, 20) || !check.evidence.every(isArtifact)) { errors.push('report: invalid/missing/reordered check declaration'); continue; }
    const excluded = check.category === 'url' && check.id.endsWith(':excluded');
    const outOfScope = report.scope === 'url' && check.category !== 'url';
    if ((excluded || outOfScope) && (check.status !== 'not-applicable' || check.evidence.length || check.observed !== null)) errors.push('report: excluded/out-of-scope check must be not-applicable without evidence/observed values');
    if (!excluded && !outOfScope && check.status === 'not-applicable') errors.push('report: active check cannot waive applicability');
    if (!excluded && !outOfScope && check.required && !['pass', 'fail', 'unverified'].includes(check.status)) errors.push('report: required check cannot be downgraded');
    if (['pass', 'fail', 'advisory'].includes(check.status) && (!check.evidence.length || check.observed === null || report.mode === 'none')) errors.push('report: asserted result requires supplied observation/evidence');
  }
  if (contractDigest(report.coverage) !== contractDigest(coverageOf(manifest, report.checks))) errors.push('report: inconsistent coverage');
  const outcome = resultOf(report.checks);
  if (report.exitCode !== outcome.exitCode || report.result !== outcome.result) errors.push('report: inconsistent outcome; required unknowns take precedence');
  return errors;
}
