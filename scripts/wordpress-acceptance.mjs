import path from 'node:path';
import { readBundle, fact, privateDirectory, writeBundle, jsonBytes, digest, readBytes } from './wordpress-io.mjs';
import { validateManifest, isOrigin } from '../standards/schemas/migration-acceptance.mjs';

/** Build a reviewed HTTP acceptance input. Full parity remains unknown until content/editor evidence is supplied. */
export function wordpressAcceptance({ capture, stage, out, url, productionOrigin, revision, mapping = {}, assetOrigins = [], root = process.cwd() }) {
  const source = readBundle(capture, 'baseline-wordpress-capture'), snapshot = JSON.parse(source.files.get('snapshot.json'));
  fact(snapshot.complete && isOrigin(url) && isOrigin(productionOrigin) && typeof revision === 'string' && revision.trim(), 'Acceptance needs a complete capture, exact target/production origins and target revision');
  fact(Array.isArray(assetOrigins) && assetOrigins.every(isOrigin), 'Asset origins must be explicit exact HTTP(S) origins');
  fact(mapping && Object.keys(mapping).every(key => ['version', 'records'].includes(key)) && (!Object.keys(mapping).length || mapping.version === 1), 'Unsupported acceptance mapping');
  fact(mapping.records === undefined || mapping.records && typeof mapping.records === 'object' && !Array.isArray(mapping.records), 'Acceptance record mappings must be an object');
  fact(Object.keys(mapping.records ?? {}).every(key => snapshot.records.some(record => record.key === key)), 'Acceptance mapping names an unknown record');
  let plan = null, stageSHA256 = null;
  if (stage) {
    const bundle = readBundle(stage, 'baseline-wordpress-static-plan'); stageSHA256 = bundle.sha256; plan = JSON.parse(bundle.files.get('plan.json'));
    fact(plan.captureSHA256 === source.sha256, 'Acceptance plan and capture differ');
  }
  const urls = [], checklist = [], files = new Map();
  for (const exclusion of snapshot.sourceExclusions ?? []) checklist.push({ sourceType: exclusion.type, analyzedRecords: exclusion.analyzed, disposition: 'deferred-source-scope', reason: exclusion.reason, pending: 'Keep this explicit exclusion visible; it is not evidence of migrated content.' });
  for (const record of snapshot.records) {
    const route = plan?.routes.find(item => item.key === record.key), exclude = plan?.exclusions.find(item => item.key === record.key);
    const override = mapping.records?.[record.key] ?? {};
    fact(Object.keys(override).every(key => ['path', 'excludeReason', 'title', 'description', 'canonical', 'fragments', 'unpublishedPath'].includes(key)), 'Unsupported acceptance record mapping');
    if (!record.permalink) { checklist.push({ key: record.key, pending: 'No source permalink; record an intentional disposition before final acceptance.' }); continue; }
    const sourceURL = new URL(record.permalink), sourcePath = sourceURL.pathname + sourceURL.search;
    const item = { id: 'wp-' + record.type.toLowerCase().replace(/[^a-z0-9-]/g, '-').slice(0, 20) + '-' + record.id + '-' + digest(record.key).slice(0, 12), sourceUrl: sourceURL.href, locale: record.locale ?? 'und' };
    if (record.type === 'elementor_library') {
      fact(Object.keys(override).every(key => key === 'excludeReason'), 'Elementor templates are reference-only; acceptance mappings cannot turn them into ordinary page routes');
      const reason = override.excludeReason ?? 'Elementor templates/settings are retained privately as reconstruction references, not ordinary public content pages.';
      fact(typeof reason === 'string' && reason.trim().length >= 5, 'Exclusion needs a concrete reason');
      urls.push({ ...item, disposition: 'excluded', reason }); continue;
    }
    if (record.status !== 'publish') {
      const requestPath = override.unpublishedPath ?? sourcePath;
      if (snapshot.records.some(other => other.status === 'publish' && other.permalink && new URL(other.permalink).pathname + new URL(other.permalink).search === requestPath) || urls.some(entry => entry.requestPath === requestPath)) {
        checklist.push({ key: record.key, pending: 'Unpublished URL collides with another source record; verify absence independently.' });
        continue;
      }
      urls.push({ ...item, disposition: 'removed', requestPath, expected: { status: 404 } }); continue;
    }
    const reason = override.excludeReason ?? exclude?.reason;
    if (reason) {
      fact(typeof reason === 'string' && reason.trim().length >= 5 && Object.keys(override).every(key => key === 'excludeReason'), 'Exclusion needs a reason and cannot also set target expectations');
      urls.push({ ...item, disposition: 'excluded', reason }); continue;
    }
    const targetPath = override.path ?? route?.path ?? sourcePath;
    const expected = { status: 200, links: { value: 'reachable', required: true }, assets: { value: 'reachable', required: true }, reviewSignals: { value: 'report', required: false } };
    const metadata = route?.metadata ?? {};
    const canonical = override.canonical ?? metadata.canonical ?? targetPath;
    const canonicalURL = new URL(canonical, productionOrigin);
    if (canonicalURL.origin === productionOrigin && !canonicalURL.hash) expected.canonical = { value: canonicalURL.href, required: true };
    else checklist.push({ key: record.key, pending: 'External/fragment canonical requires separate review; current HTTP acceptance schema expects production-origin canonicals.' });
    for (const key of ['title', 'description']) {
      const value = override[key] ?? (key === 'description' ? metadata.description : undefined);
      if (typeof value === 'string' && value.trim()) expected[key] = { value, required: true };
    }
    if (!expected.title) checklist.push({ key: record.key, pending: 'Verify the final rendered title, including the target site title suffix. Add its exact value to the acceptance mapping when settled.' });
    if (override.fragments) expected.fragments = { value: override.fragments, required: true };
    if (metadata.noindex !== undefined) expected.indexability = { value: metadata.noindex ? 'noindex' : 'indexable', required: true };
    if (sourcePath !== targetPath) expected.redirects = [{ status: 301, path: targetPath }];
    urls.push({ ...item, disposition: sourcePath === targetPath ? 'retained' : 'redirected', requestPath: sourcePath, expected });
    checklist.push({ key: record.key, targetPath, sourcePath, pending: 'Compare content, taxonomy/custom-field decisions, media meaning, interactions and responsive rendering against the source.' });
  }
  const manifest = { manifestVersion: 2, id: 'wordpress-migration', sourceOrigin: new URL(snapshot.source.url).origin, targetOrigin: url, productionOrigin, allowedAssetOrigins: [url, productionOrigin, ...assetOrigins].filter((value, index, all) => all.indexOf(value) === index), sourceCapture: { id: 'wp-' + source.sha256.slice(0, 16), sha256: source.sha256 }, targetRevision: revision, policies: { trailingSlash: 'preserve', query: 'exact' }, urls,
    acceptanceChecks: [
      { id: 'content-reconciliation', category: 'content', required: true, expectation: 'Reconcile every source entity/status, content and media reference against the target, including exclusions and raw-only fields; HTTP alone cannot establish parity.' },
      { id: 'editor-workflow', category: 'editor', required: true, expectation: 'Exercise actual content edit, save/reload and publication in the selected target workflow; verify private content stays inaccessible.' },
      { id: 'design-and-behavior', category: 'content', required: true, expectation: 'Review all retained routes and required interactions at mobile/desktop sizes, including Elementor replacements and intentionally retired features.' },
    ] };
  fact(!validateManifest(manifest).length, 'Acceptance expectations are incomplete, duplicated or outside supported schema/URL limits; review record mappings');
  if (plan) {
    const observedFiles = plan.edits.map(edit => {
      let actualSHA256 = null; try { actualSHA256 = digest(readBytes(path.join(root, edit.target), 32 * 1024 * 1024)); } catch { /* Missing/changed files remain explicit. */ }
      return { target: edit.target, plannedSHA256: edit.afterSHA256, observedSHA256: actualSHA256, state: actualSHA256 === edit.afterSHA256 ? 'matches-plan' : actualSHA256 ? 'changed-needs-review' : 'missing' };
    });
    files.set('planned-file-observations.json', jsonBytes({ stageSHA256, observedAt: new Date().toISOString(), files: observedFiles, scope: 'Local file observations only; changes after rebuilding are expected to need review. This is not rendered or deployment content parity.' }));
  }
  files.set('acceptance.json', jsonBytes(manifest)); files.set('checklist.json', jsonBytes({ captureSHA256: source.sha256, stageSHA256, revision, records: checklist }));
  files.set('README.md', '# WordPress migration acceptance\n\nRun `npm run migration:verify -- --manifest <this-directory>/acceptance.json --scope full` from the target project. The default run retains JSON, Markdown and replayable HTTP evidence privately. Full acceptance remains unverified until the required content/editor/design checks have bound evidence. Use `--scope url` only for HTTP coverage; it does not certify complete migration. Review checklist.json and generated redirects before running.\n');
  const directory = privateDirectory(out, root), receipt = writeBundle(directory, files, 'baseline-wordpress-acceptance');
  return { directory, sha256: receipt.sha256, urls: urls.length, pendingReview: checklist.length, next: 'npm run migration:verify -- --manifest ' + directory + '/acceptance.json --scope full', exitCode: 0 };
}
