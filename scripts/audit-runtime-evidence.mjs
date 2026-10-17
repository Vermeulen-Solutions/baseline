import fs from 'node:fs';
import path from 'node:path';
import { gitRead, readTarget, readJSON, sha256 } from './audit-evidence.mjs';

const hash = value => typeof value === 'string' && /^[a-f0-9]{64}$/.test(value);
const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const exact = (value, keys) => object(value) && Object.keys(value).length === keys.length && keys.every(key => Object.hasOwn(value, key));
const route = value => typeof value === 'string' && /^\/(?:[a-zA-Z0-9_./~-]*)$/.test(value) && !value.includes('..') && !value.includes('//');
const word = value => typeof value === 'string' && /^[a-zA-Z0-9_-]{1,64}$/.test(value);
const list = value => Array.isArray(value) && value.length <= 200;
const key = fact => JSON.stringify([fact.route, fact.state, fact.locale, fact.viewport.width, fact.viewport.height]);
function captureScope(fact) {
  return route(fact.route) && ['public', 'editor'].includes(fact.state) && word(fact.locale) && exact(fact.viewport, ['width', 'height']) && ['width', 'height'].every(axis => Number.isInteger(fact.viewport[axis]) && fact.viewport[axis] >= 200 && fact.viewport[axis] <= 4000);
}

/** Bind external observations to this checkout and its actual tracked/unignored bytes, not HEAD alone. */
export function evidenceBinding(root) {
  const target = fs.realpathSync(root);
  if (fs.realpathSync(gitRead(target, 'rev-parse', '--show-toplevel')) !== target) throw Error('Evidence requires a Git root');
  const revision = gitRead(target, 'rev-parse', '--verify', 'HEAD');
  if (!/^[a-f0-9]{40,64}$/.test(revision)) throw Error('Unknown revision');
  const files = [...new Set(gitRead(target, 'ls-files', '--cached', '--others', '--exclude-standard', '-z').split('\0').filter(Boolean))].sort();
  if (!files.length || files.length > 10000) throw Error('Unsupported inventory');
  let total = 0;
  const inventory = files.map(file => {
    const bytes = readTarget(target, file).bytes;
    if (!bytes || (total += bytes.length) > 1024 * 1024 * 1024) throw Error('Refused source inventory');
    return [file, sha256(bytes)];
  });
  return { targetId: sha256(process.platform === 'win32' ? target.toLowerCase() : target), revision, workingTreeSHA256: sha256(JSON.stringify(inventory)) };
}

/** Ingest caller-supplied attestations only. No URL fetch, target execution or CMS request. */
export function runtimeEvidenceRules(root, evidenceFile, runtime, add) {
  const options = { required: Boolean(evidenceFile), confidence: 'none', applicability: 'Caller-declared route/field scope only; supplied attestations are not independent certification' };
  const unknown = reason => {
    add('route-capture-evidence', 'unverified', 'Current hash-bound route/state/locale/viewport captures', reason, options);
    add('editor-save-reload', 'unverified', 'Explicit supported editor save, reload and anonymous public read', reason, options);
  };
  if (!evidenceFile) return unknown('No external evidence supplied; observed markers never verify a save');
  try {
    const file = path.resolve(evidenceFile), directory = fs.realpathSync(path.dirname(file));
    const input = readJSON(directory, path.basename(file));
    if (!input.bytes || input.bytes.length > 1024 * 1024) throw Error();
    const bundle = input.data;
    if (!exact(bundle, ['evidenceVersion', 'capturedAt', 'runtime', 'binding', 'expected', 'captures', 'editors']) || bundle.evidenceVersion !== 1 || bundle.runtime !== runtime || !exact(bundle.binding, ['targetId', 'revision', 'workingTreeSHA256'])) throw Error();
    if (typeof bundle.capturedAt !== 'string' || !/^\d{4}-\d\d-\d\dT/.test(bundle.capturedAt)) throw Error();
    const age = Date.now() - Date.parse(bundle.capturedAt), current = evidenceBinding(root);
    if (!Number.isFinite(age) || age < -300000 || age > 30 * 86400000 || Object.keys(current).some(name => bundle.binding[name] !== current[name])) throw Error();
    if (![bundle.expected, bundle.captures, bundle.editors].every(list) || !bundle.expected.length || !bundle.expected.every(fact => exact(fact, ['route', 'state', 'locale', 'viewport']) && captureScope(fact))) throw Error();
    const expected = bundle.expected.map(key);
    if (new Set(expected).size !== expected.length) throw Error();
    let artifactBytes = 0;
    function artifact(value) {
      if (!exact(value, ['path', 'sha256']) || !hash(value.sha256)) throw Error();
      const bytes = readTarget(directory, value.path).bytes;
      if (!bytes || (artifactBytes += bytes.length) > 64 * 1024 * 1024 || sha256(bytes) !== value.sha256) throw Error();
      return bytes;
    }
    for (const fact of bundle.captures) {
      if (!exact(fact, ['route', 'state', 'locale', 'viewport', 'httpStatus', 'ready', 'overflow', 'consoleErrors', 'annotationCount', 'screenshot']) || !captureScope(fact) || !expected.includes(key(fact)) || !Number.isInteger(fact.httpStatus) || fact.httpStatus < 100 || fact.httpStatus > 599 || typeof fact.ready !== 'boolean' || typeof fact.overflow !== 'boolean' || !Number.isInteger(fact.consoleErrors) || fact.consoleErrors < 0 || !Number.isInteger(fact.annotationCount) || fact.annotationCount < 0) throw Error();
      const png = artifact(fact.screenshot);
      if (png.length < 24 || png.subarray(0, 8).toString('hex') !== '89504e470d0a1a0a' || png.readUInt32BE(16) !== fact.viewport.width || png.readUInt32BE(20) !== fact.viewport.height) throw Error();
    }
    if (new Set(bundle.captures.map(key)).size !== bundle.captures.length) throw Error();
    // Validate all editor artifacts before emitting any pass. Annotation count has no save semantics.
    const editors = bundle.editors.map(fact => {
      if (!exact(fact, ['route', 'locale', 'field', 'surface', 'receipt']) || !route(fact.route) || !word(fact.locale) || !word(fact.field) || !['emdash-inline', 'emdash-admin', 'cms-api'].includes(fact.surface)) throw Error();
      const receipt = JSON.parse(artifact(fact.receipt).toString('utf8'));
      if (!exact(receipt, ['route', 'locale', 'field', 'surface', 'beforeSHA256', 'submittedSHA256', 'reloadedSHA256', 'publicSHA256', 'saveHTTPStatus', 'restored']) || !['beforeSHA256', 'submittedSHA256', 'reloadedSHA256', 'publicSHA256'].every(name => hash(receipt[name])) || ['route', 'locale', 'field', 'surface'].some(name => receipt[name] !== fact[name]) || typeof receipt.restored !== 'boolean' || !Number.isInteger(receipt.saveHTTPStatus)) throw Error();
      return { fact, receipt };
    });
    const complete = bundle.captures.length === expected.length;
    const defective = bundle.captures.some(fact => fact.httpStatus !== 200 || !fact.ready || fact.overflow || fact.consoleErrors > 0);
    const observation = { expected: expected.length, captured: bundle.captures.length, declaredScopes: bundle.expected, captureFacts: bundle.captures.map(({ screenshot, ...fact }) => ({ ...fact, screenshotSHA256: screenshot.sha256 })), annotatedCaptures: bundle.captures.filter(fact => fact.annotationCount > 0).length, bundleSHA256: sha256(input.bytes), note: 'Hash-checked supplied observations; markers do not prove registration, saving or visual/accessibility quality' };
    add('route-capture-evidence', defective ? 'fail' : complete ? 'pass' : 'unverified', 'Complete declared capture matrix, HTTP 200, ready, no reported overflow/errors', observation, { ...options, confidence: 'bounded-static' });
    const supported = editors.filter(({ fact }) => fact.surface !== 'cms-api');
    const failed = supported.some(({ receipt: r }) => r.beforeSHA256 === r.submittedSHA256 || r.submittedSHA256 !== r.reloadedSHA256 || r.submittedSHA256 !== r.publicSHA256 || r.saveHTTPStatus < 200 || r.saveHTTPStatus > 299 || !r.restored);
    const covered = supported.every(({ fact }) => bundle.captures.some(c => c.route === fact.route && c.locale === fact.locale && c.state === 'editor') && bundle.captures.some(c => c.route === fact.route && c.locale === fact.locale && c.state === 'public'));
    add('editor-save-reload', failed ? 'fail' : supported.length && covered && complete && !defective ? 'pass' : 'unverified', 'Changed field survives supported editor save/reload and anonymous public read; fixture restored', { supportedEditorReceipts: supported.length, apiOnlyReceipts: editors.length - supported.length, fieldScopes: supported.map(({ fact }) => ({ route: fact.route, locale: fact.locale, field: fact.field, surface: fact.surface, receiptSHA256: fact.receipt.sha256 })), note: 'Supplied field-level round-trip attestation only; no inference for other fields, locales, permissions, media or providers' }, { ...options, confidence: 'bounded-static' });
  } catch { unknown('Evidence missing, malformed, stale, mismatched, linked, oversized or artifact hash invalid; details withheld'); }
}
