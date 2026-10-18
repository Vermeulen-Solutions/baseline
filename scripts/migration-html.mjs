import { Worker, isMainThread, parentPort, workerData } from 'node:worker_threads';
import { parse } from 'parse5';
import parseSrcset from 'parse-srcset';

const normalize = value => value.replace(/\s+/gu, ' ').trim();
function nodeText(node) {
  const parts = [], queue = [node];
  while (queue.length) {
    const current = queue.pop();
    if (current.nodeName === '#text') parts.push(current.value);
    else if (!['script', 'style', 'template'].includes(current.tagName)) queue.push(...[...(current.childNodes ?? [])].reverse());
  }
  return normalize(parts.join(''));
}

function analyze(html, sourceOrigin, productionOrigin, referenceLimit) {
  let parserErrors = 0, srcsetErrors = 0;
  const document = parse(html, { scriptingEnabled: false, onParseError: () => { parserErrors++; } });
  // parse-srcset 1.0.2 logs malformed descriptors. Silence only this isolated worker.
  console.log = () => { srcsetErrors++; };
  const result = { titles: [], descriptions: [], canonicals: [], robots: [], base: null, headings: [], ids: [], links: [], assets: [], linksOverflow: false, assetsOverflow: false, idsOverflow: false, invalidImages: 0, embeddedImages: 0, parserErrors, srcsetErrors: 0, signals: { shortcodes: 0, wordpressComments: 0, sourceRemnants: 0, textTruncated: false } };
  const ids = new Set(), links = new Set(), assets = new Set(), text = [];
  let nodes = 0, textBytes = 0;
  function reference(value, type) {
    if (!value) return;
    if (type === 'assets' && value.startsWith('data:')) { result.embeddedImages++; return; }
    const set = type === 'links' ? links : assets;
    if (value.length > 4096 || set.size >= referenceLimit && !set.has(value)) { result[type + 'Overflow'] = true; return; }
    set.add(value);
  }
  const queue = [document];
  while (queue.length) {
    if (++nodes > 100000) throw Error('HTML node limit');
    const node = queue.pop(), tag = node.tagName, attrs = Object.fromEntries((node.attrs ?? []).map(attr => [attr.name, attr.value]));
    if (node.nodeName === '#comment' && /^\s*\/?wp:/i.test(node.data)) result.signals.wordpressComments++;
    if (node.nodeName === '#text') {
      if (textBytes + node.value.length <= 1048576) { text.push(node.value); textBytes += node.value.length; }
      else result.signals.textTruncated = true;
    }
    if (attrs.id) { if (ids.size < 10000 && attrs.id.length <= 1024) ids.add(attrs.id); else result.idsOverflow = true; }
    if (/^h[1-6]$/.test(tag) && result.headings.length < 200) result.headings.push({ level: Number(tag[1]), text: nodeText(node).slice(0, 1000) });
    if (node.parentNode?.tagName === 'head') {
      if (tag === 'title') result.titles.push(nodeText(node));
      if (tag === 'base' && result.base === null && attrs.href !== undefined) result.base = attrs.href;
      if (tag === 'meta' && attrs.name?.toLowerCase() === 'description') result.descriptions.push(normalize(attrs.content ?? ''));
      if (tag === 'meta' && attrs.name?.toLowerCase() === 'robots') result.robots.push(attrs.content ?? '');
      if (tag === 'link' && (attrs.rel ?? '').toLowerCase().split(/\s+/).includes('canonical')) result.canonicals.push(attrs.href ?? '');
    }
    if (tag === 'a') reference(attrs.href, 'links');
    if (tag === 'img' || tag === 'source' && node.parentNode?.tagName === 'picture') {
      if (tag === 'img') { reference(attrs.src, 'assets'); if (!attrs.src && !attrs.srcset) result.invalidImages++; }
      if (attrs.srcset) {
        const candidates = parseSrcset(attrs.srcset);
        if (!candidates.length) srcsetErrors++;
        for (const candidate of candidates) reference(candidate.url, 'assets');
      }
    }
    if (!['script', 'style', 'template'].includes(tag)) queue.push(...[...(node.childNodes ?? [])].reverse());
  }
  result.signals.shortcodes = [...text.join(' ').matchAll(/\[(?:gallery|contact-form-7|vc_[\w-]*|et_pb_[\w-]*|elementor)(?:\s[^\]]{0,1000})?\]/gi)].length;
  const source = html.toLowerCase(), oldURL = new URL(sourceOrigin), productionURL = new URL(productionOrigin);
  const needle = oldURL.hostname !== productionURL.hostname ? oldURL.hostname.toLowerCase() : sourceOrigin === productionOrigin ? '' : sourceOrigin.toLowerCase();
  if (needle) for (let at = source.indexOf(needle); at !== -1; at = source.indexOf(needle, at + needle.length)) result.signals.sourceRemnants++;
  result.ids = [...ids]; result.links = [...links]; result.assets = [...assets]; result.srcsetErrors = srcsetErrors;
  return result;
}

if (!isMainThread && workerData?.migrationHTML === true) {
  try { parentPort.postMessage({ value: analyze(workerData.html, workerData.sourceOrigin, workerData.productionOrigin, workerData.referenceLimit) }); }
  catch { parentPort.postMessage({ error: 'HTML parsing exceeded supported bounds' }); }
}

export function inspectMigrationHTML(html, { sourceOrigin, productionOrigin, referenceLimit, signal }) {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) { reject(Error('HTML parsing cancelled')); return; }
    const worker = new Worker(new URL(import.meta.url), { workerData: { migrationHTML: true, html, sourceOrigin, productionOrigin, referenceLimit }, execArgv: [], stdout: true, stderr: true, resourceLimits: { maxOldGenerationSizeMb: 128, stackSizeMb: 4 } });
    worker.stdout.resume(); worker.stderr.resume();
    let settled = false;
    const finish = (error, value) => {
      if (settled) return; settled = true;
      clearTimeout(timer); signal?.removeEventListener('abort', cancelled);
      void worker.terminate(); if (error) reject(Error('HTML parsing unavailable or over bounds')); else resolve(value);
    };
    const cancelled = () => finish(true), timer = setTimeout(() => finish(true), 3000);
    signal?.addEventListener('abort', cancelled, { once: true });
    worker.once('message', message => finish(message.error, message.value));
    worker.once('error', () => finish(true)); worker.once('exit', () => { if (!settled) finish(true); });
  });
}
