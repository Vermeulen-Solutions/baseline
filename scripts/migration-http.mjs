import fs from 'node:fs';
import path from 'node:path';
import { HTTP_LIMITS, contractDigest, sha256, validateManifest, validateObservations } from '../standards/schemas/migration-acceptance.mjs';
import { inspectMigrationHTML } from './migration-html.mjs';

const REDIRECTS = new Set([301, 302, 303, 307, 308]);
const normalize = value => value.replace(/\s+/gu, ' ').trim();
const pathOf = value => { const url = new URL(value); return url.href.slice(url.origin.length).split('#')[0]; };
const safeString = value => {
  const json = JSON.stringify(value);
  return json.length <= 512 ? json : JSON.stringify({ truncated: true, sha256: sha256(json), preview: json.slice(0, 240) });
};
class HttpUnknown extends Error {}
class HttpFailure extends Error {}

function robotsOf(meta, header) {
  const directives = new Set(); let uncertain = false;
  for (const raw of [...meta, ...(header ? [header] : [])]) for (let part of raw.toLowerCase().split(',')) {
    part = part.trim().replace(/:\s+/g, ':'); if (!part) continue;
    // Agent-qualified restrictions are evaluated conservatively for this generic crawl.
    if (/^[a-z][\w-]*:(?:noindex|nofollow|none|all|index|follow)$/.test(part)) part = part.slice(part.indexOf(':') + 1);
    if (part === 'all') { directives.add('index'); directives.add('follow'); }
    else if (part === 'none') { directives.add('noindex'); directives.add('nofollow'); }
    else if (/^[a-z0-9:.-]+$/.test(part)) directives.add(part);
    else uncertain = true;
  }
  return { directives: [...directives].sort(), uncertain };
}

export async function collectMigrationHTTP(manifest, { directory, signal, request = fetch } = {}) {
  if (validateManifest(manifest).length) throw Error('Invalid HTTP migration manifest');
  const limits = { ...HTTP_LIMITS, ...(manifest.http ?? {}) };
  const artifacts = path.join(directory, 'artifacts'); fs.mkdirSync(artifacts, { mode: 0o700 });
  const controller = new AbortController(), cancel = () => controller.abort();
  signal?.addEventListener('abort', cancel, { once: true }); if (signal?.aborted) cancel();
  const timer = setTimeout(cancel, limits.runTimeoutMs);
  const allowedPages = new Set([manifest.targetOrigin, manifest.productionOrigin]);
  const observations = { observationsVersion: manifest.manifestVersion, manifestSHA256: contractDigest(manifest), sourceCaptureSHA256: manifest.sourceCapture.sha256, targetRevision: manifest.targetRevision, capturedAt: new Date().toISOString(), checks: [] };
  let requestCount = 0, totalBytes = 0, evidenceBytes = 0, cursor = 0;
  const entries = manifest.urls.filter(entry => entry.disposition !== 'excluded');

  async function trace(initial, { method = 'GET', asset = false, read = false } = {}) {
    const allow = asset ? new Set(manifest.allowedAssetOrigins) : allowedPages;
    let current = initial; const visited = new Set(), hops = [], responses = [];
    for (;;) {
      const url = new URL(current); url.hash = '';
      if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || !allow.has(url.origin)) throw Object.assign(new HttpFailure('Destination origin or URL scheme is not declared'), { responses, hops });
      current = url.href;
      if (visited.has(current)) throw Object.assign(new HttpFailure('Redirect loop'), { responses, hops });
      visited.add(current);
      if (controller.signal.aborted || requestCount >= limits.maxRequests) throw Object.assign(new HttpUnknown('Cancelled, timed out or request budget exhausted'), { responses, hops });
      requestCount++;
      let response, body = null;
      const timeout = AbortSignal.timeout(limits.timeoutMs), requestSignal = AbortSignal.any([controller.signal, timeout]);
      try {
        // No caller headers, cookie jar, authorization, referer or credentials are carried across requests.
        response = await request(current, { method, redirect: 'manual', credentials: 'omit', referrerPolicy: 'no-referrer', headers: { accept: asset ? 'image/*,*/*;q=0.1' : 'text/html,application/xhtml+xml,*/*;q=0.1', 'user-agent': 'Baseline-Migration-Acceptance/1' }, signal: requestSignal });
        const record = { url: current, method, status: response.status, contentType: response.headers.get('content-type') ?? '', robots: response.headers.get('x-robots-tag') ?? '' };
        responses.push(record);
        if (REDIRECTS.has(response.status)) {
          const location = response.headers.get('location'); await response.body?.cancel();
          if (!location || hops.length >= limits.maxRedirects) throw new HttpFailure('Missing redirect destination or redirect hop limit exceeded');
          const destination = new URL(location, current);
          // Do not persist user-info URLs or sensitive response headers.
          if (destination.username || destination.password || !['http:', 'https:'].includes(destination.protocol) || !allow.has(destination.origin)) throw new HttpFailure('Redirect destination is not declared');
          if (url.protocol === 'https:' && destination.protocol !== 'https:') throw new HttpFailure('HTTPS downgrade redirect');
          destination.hash = '';
          hops.push({ status: response.status, path: pathOf(destination), origin: destination.origin }); current = destination.href; continue;
        }
        if (method === 'HEAD' && response.status === 405) {
          await response.body?.cancel();
          // Retry this same URL, retaining the chain/hop budget; never recurse/reset it.
          method = 'GET'; read = true; visited.delete(current); continue;
        }
        if (method === 'GET' && read) {
          const announced = Number(response.headers.get('content-length'));
          if (Number.isFinite(announced) && announced > limits.maxResponseBytes) { await response.body?.cancel(); throw new HttpUnknown('Response size limit'); }
          const chunks = []; let bytes = 0;
          if (response.body) for await (const chunk of response.body) {
            bytes += chunk.length; totalBytes += chunk.length;
            if (bytes > limits.maxResponseBytes || totalBytes > limits.maxTotalBytes) { controller.abort(); throw new HttpUnknown('Response or total byte budget exceeded'); }
            chunks.push(chunk);
          }
          body = Buffer.concat(chunks);
          record.bodySHA256 = sha256(body); record.bytes = body.length;
        } else await response.body?.cancel();
        return { url: current, status: response.status, type: record.contentType, robots: record.robots, body, hops, responses };
      } catch (error) {
        await response?.body?.cancel().catch(() => {});
        if (error instanceof HttpFailure || error instanceof HttpUnknown) throw Object.assign(error, { responses, hops });
        throw Object.assign(new HttpUnknown('HTTP request unavailable, cancelled or timed out'), { responses, hops });
      }
    }
  }

  async function collect(entry) {
    const facts = [], evidence = { producer: 'baseline-http-collector/1', manifestSHA256: observations.manifestSHA256, targetRevision: manifest.targetRevision, entryId: entry.id, responses: [], headings: [], signals: null, references: {}, limits };
    const set = (key, status, reason, observed) => facts.push({ id: `url:${entry.id}:${key}`, status, reason, observed: safeString(observed), evidence: [] });
    let page, html, incompleteRequired = false;
    try {
      page = await trace(manifest.targetOrigin + entry.requestPath, { read: Object.keys(entry.expected).some(key => !['status', 'redirects'].includes(key)) }); evidence.responses.push(...page.responses);
      const expectedHops = entry.expected.redirects ?? [], actualHops = page.hops.map(({ status, path: hopPath }) => ({ status, path: hopPath }));
      const chainMatches = JSON.stringify(actualHops) === JSON.stringify(expectedHops);
      const expectedTerminal = expectedHops.at(-1)?.path ?? entry.requestPath;
      const statusMatches = page.status === entry.expected.status && pathOf(page.url) === expectedTerminal && chainMatches;
      set('status', statusMatches ? 'pass' : 'fail', statusMatches ? 'Expected status and exact path/query/chain observed.' : 'Unexpected status, destination, query, slash or redirect chain.', { status: page.status, terminalPath: pathOf(page.url), hops: actualHops });
      if (entry.disposition === 'redirected') set('redirects', chainMatches ? 'pass' : 'fail', chainMatches ? 'Exact expected redirect chain; no loop.' : 'Redirect status/path chain differs from the manifest.', actualHops);
      const metadataKeys = Object.keys(entry.expected).filter(key => !['status', 'redirects'].includes(key));
      if (!metadataKeys.length) return await save();
      if (page.status !== 200 || !/^(?:text\/html|application\/xhtml\+xml)(?:;|$)/i.test(page.type)) {
        for (const key of metadataKeys) set(key, 'unverified', 'Expected HTML page unavailable; metadata/reference acceptance not established.', { status: page.status, type: page.type });
        return await save();
      }
      const charset = /charset\s*=\s*["']?([^;\s"']+)/i.exec(page.type)?.[1] ?? 'utf-8';
      html = await inspectMigrationHTML(new TextDecoder(charset, { fatal: true }).decode(page.body), { sourceOrigin: manifest.sourceOrigin, productionOrigin: manifest.productionOrigin, referenceLimit: limits.maxReferencesPerPage, signal: controller.signal });
      evidence.headings = html.headings.slice(0, 50).map(heading => ({ ...heading, text: heading.text.slice(0, 200) })); evidence.signals = html.signals;
      let base = page.url;
      if (html.base !== null) { try { base = new URL(html.base, page.url).href; } catch { base = 'invalid-base'; } }
      const robots = robotsOf(html.robots, page.robots);
      for (const key of metadataKeys) {
        const wanted = entry.expected[key].value;
        if (['title', 'description', 'canonical'].includes(key)) {
          const values = html[key === 'title' ? 'titles' : key === 'description' ? 'descriptions' : 'canonicals'];
          let actual = values.length ? values[0] : null;
          if (key === 'canonical' && actual !== null) { try { const url = new URL(actual, base); actual = url.username || url.password ? 'invalid-canonical' : url.href; } catch { actual = 'invalid-canonical'; } }
          const match = values.length <= 1 && actual === (key === 'canonical' || wanted === null ? wanted : normalize(wanted));
          set(key, match ? 'pass' : 'fail', match ? 'Declared metadata matches.' : 'Missing, conflicting, duplicate or incorrect metadata.', { value: actual, count: values.length });
        } else if (key === 'robots') {
          const match = JSON.stringify(robots.directives) === JSON.stringify([...wanted].sort());
          set(key, robots.uncertain ? 'unverified' : match ? 'pass' : 'fail', 'Combined meta robots and X-Robots-Tag directives.', robots);
        } else if (key === 'indexability') {
          const noindex = robots.directives.includes('noindex');
          set(key, robots.uncertain ? 'unverified' : noindex === (wanted === 'noindex') ? 'pass' : 'fail', 'Indexing restriction evaluated across HTML and HTTP directives.', robots);
        } else if (key === 'fragments') {
          const missing = wanted.filter(fragment => !html.ids.includes(fragment));
          set(key, html.idsOverflow ? 'unverified' : missing.length ? 'fail' : 'pass', 'Declared fragment IDs evaluated against the parsed HTML document.', { missing });
        } else if (key === 'reviewSignals') {
          const found = Object.values(html.signals).some(Boolean) || html.parserErrors || html.srcsetErrors;
          set(key, found ? 'advisory' : 'pass', 'Heuristic review signals; no automatic content parity claim.', { ...html.signals, parserErrors: html.parserErrors, srcsetErrors: html.srcsetErrors });
        } else if (key === 'links' || key === 'assets') {
          const checked = [], skipped = { external: 0, nonHttp: 0, excluded: 0 }, seen = new Set();
          let failed = key === 'assets' && html.invalidImages > 0, unknown = html[key + 'Overflow'] || key === 'assets' && html.srcsetErrors > 0;
          for (const raw of html[key]) {
            let target;
            try { target = new URL(raw, base); } catch { failed = true; continue; }
            if (target.username || target.password) { failed = true; checked.push({ status: 'fail', reason: 'User-info URL refused' }); continue; }
            if (!['http:', 'https:'].includes(target.protocol)) { skipped.nonHttp++; if (key === 'assets') failed = true; continue; }
            if (key === 'links' && !allowedPages.has(target.origin)) { skipped.external++; continue; }
            if (key === 'links') {
              const excluded = manifest.urls.some(item => item.disposition === 'excluded' && pathOf(item.sourceUrl) === pathOf(target));
              if (excluded) { skipped.excluded++; continue; }
            }
            target.hash = ''; const href = target.href; if (seen.has(href)) continue; seen.add(href);
            try {
              const probe = await trace(href, { method: 'HEAD', asset: key === 'assets' });
              evidence.responses.push(...probe.responses);
              const valid = probe.status >= 200 && probe.status < 300 && (key !== 'assets' || /^image\//i.test(probe.type));
              if (!valid) failed = true; checked.push({ url: href, status: probe.status, type: probe.type, valid });
            } catch (error) {
              evidence.responses.push(...(error.responses ?? []));
              if (error instanceof HttpFailure) failed = true; else unknown = true;
              checked.push({ url: href, status: error instanceof HttpFailure ? 'fail' : 'unverified' });
            }
          }
          evidence.references[key] = { checked, skipped, overflow: html[key + 'Overflow'] };
          if (unknown && entry.expected[key].required) incompleteRequired = true;
          set(key, failed ? 'fail' : unknown ? 'unverified' : 'pass', 'Bounded declared HTML references; no browser image decode or JS discovery.', { checked: checked.length, failed: checked.filter(item => item.valid === false || item.status === 'fail').length, unverifiedCoverage: Boolean(unknown), skipped, truncated: html[key + 'Overflow'], invalidImages: key === 'assets' ? html.invalidImages : 0, embeddedImages: key === 'assets' ? html.embeddedImages : 0 });
        }
      }
    } catch (error) {
      evidence.responses.push(...(error.responses ?? []));
      // Preserve known status/redirect failures before marking only unavailable checks unknown.
      const known = new Set(facts.map(fact => fact.id.split(':').at(-1)));
      for (const key of ['status', ...(entry.disposition === 'redirected' ? ['redirects'] : []), ...Object.keys(entry.expected).filter(key => !['status', 'redirects'].includes(key))]) if (!known.has(key)) {
        const last = evidence.responses.at(-1);
        const knownBadStatus = key === 'status' && last && !REDIRECTS.has(last.status) && last.status !== 405 && last.status !== entry.expected.status;
        const confirmed = knownBadStatus || error instanceof HttpFailure && ['status', 'redirects'].includes(key);
        set(key, confirmed ? 'fail' : 'unverified', knownBadStatus ? 'Wrong HTTP status observed before collection was interrupted.' : confirmed ? 'Unsafe/unexpected redirect or loop.' : 'Collection interrupted, unavailable or exceeded supported bounds.', { responseCount: evidence.responses.length });
      }
    }
    return await save();

    async function save() {
      if (manifest.manifestVersion >= 2) {
        const requiredUnknown = incompleteRequired || facts.some(fact => fact.status === 'unverified' && (['status', 'redirects'].includes(fact.id.split(':').at(-1)) || entry.expected[fact.id.split(':').at(-1)]?.required));
        set('collection', requiredUnknown ? 'unverified' : 'pass', requiredUnknown ? 'Required HTTP coverage is incomplete; known failures are retained separately.' : 'Required HTTP collection completed within the supported scope.', { complete: !requiredUnknown });
      }
      evidence.checks = facts.map(({ evidence: ignored, ...fact }) => fact);
      const bytes = Buffer.from(JSON.stringify(evidence, null, 2) + '\n'), relative = `artifacts/${entry.id}.json`;
      if (bytes.length > 8 * 1024 * 1024 || evidenceBytes + bytes.length > 32 * 1024 * 1024) return facts.map(fact => ({ ...fact, status: 'unverified', reason: 'Evidence byte budget exceeded.', observed: null, evidence: [] }));
      evidenceBytes += bytes.length;
      fs.writeFileSync(path.join(directory, relative), bytes, { flag: 'wx', mode: 0o600 });
      const artifact = { path: relative, sha256: sha256(bytes) };
      return facts.map(fact => ({ ...fact, evidence: [artifact] }));
    }
  }
  try {
    const batches = new Array(entries.length);
    await Promise.all(Array.from({ length: Math.min(limits.concurrency, entries.length) }, async () => {
      for (;;) { const at = cursor++; if (at >= entries.length) break; batches[at] = await collect(entries[at]); }
    }));
    observations.checks = batches.flat();
    if (validateObservations(observations, manifest).length) throw Error('Collected observations violate migration contract');
    let json = JSON.stringify(observations, null, 2) + '\n';
    if (Buffer.byteLength(json) > 4 * 1024 * 1024) {
      observations.checks.forEach(check => { if (check.observed !== null) check.observed = JSON.stringify({ sha256: sha256(check.observed), note: 'See evidence artifact.' }); });
      json = JSON.stringify(observations) + '\n';
    }
    if (Buffer.byteLength(json) > 4 * 1024 * 1024) throw Error('Observation byte budget exceeded');
    fs.writeFileSync(path.join(directory, 'observations.json'), json, { flag: 'wx', mode: 0o600 });
    return observations;
  } finally { clearTimeout(timer); signal?.removeEventListener('abort', cancel); }
}
