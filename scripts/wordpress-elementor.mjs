import path from 'node:path';
import { inflateRawSync, crc32 } from 'node:zlib';
import { fact, readBytes, safeKey, digest } from './wordpress-io.mjs';
import { plainText } from './wordpress-markdown.mjs';

const escape = value => String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const object = value => value && typeof value === 'object' && !Array.isArray(value);
const text = value => typeof value === 'string' ? plainText(value) : '';
const normal = value => text(value).toLowerCase().replace(/\s+/g, ' ').trim();
const safeURL = (value, base) => { if (typeof value !== 'string' || !value.trim()) return null; try { const url = new URL(value, base); return ['https:', 'http:', 'mailto:', 'tel:'].includes(url.protocol) && !url.username && !url.password ? url.href : null; } catch { return null; } };
const basic = new Set(['heading', 'text-editor', 'image', 'button', 'icon-list', 'image-gallery', 'gallery', 'divider', 'spacer']);

/** Read-only inventory and candidate copy. No scripts, PHP, dynamic tags or widget code execute. */
export function analyzeElementor(record) {
  const raw = record.meta?._elementor_data;
  const detected = raw !== undefined || record.meta?._elementor_edit_mode === 'builder' || /\belementor[- ]/.test(record.html ?? '');
  if (!detected) return null;
  const result = { detected: true, data: raw === undefined ? 'missing' : 'available', pageSettings: record.meta?._elementor_page_settings ?? null, templateType: record.meta?._elementor_template_type ?? null, widgets: Object.create(null), nodes: [], copy: [], media: [], links: [], templateReferences: [], dynamic: [], unsupported: [], candidateHTML: '', requiresRecovery: false };
  let roots;
  try { roots = typeof raw === 'string' ? JSON.parse(raw) : raw; } catch { result.data = 'invalid'; }
  if (!Array.isArray(roots)) { result.data = result.data === 'available' ? 'invalid' : result.data; result.requiresRecovery = true; return result; }
  const pieces = [], seen = new Set(); let count = 0;
  const image = (value, caption = '', node = null, usage = 'content') => {
    if (!object(value)) return;
    const url = safeURL(value.url, record.permalink), id = Number(value.id), alt = typeof value.alt === 'string' ? text(value.alt) : null;
    if (!url && !Number.isSafeInteger(id)) return;
    result.media.push({ node, id: Number.isSafeInteger(id) && id > 0 ? id : null, url, usage, alt, caption: text(caption) });
    if (url && usage === 'content') pieces.push('<img src="' + escape(url) + '"' + (id > 0 ? ' class="wp-image-' + id + '"' : '') + (alt === null ? '' : ' alt="' + escape(alt) + '"') + '>');
  };
  const link = (value, node) => { const url = safeURL(value?.url, record.permalink); if (url) result.links.push({ node, url }); return url; };
  function walk(nodes, parent, depth) {
    fact(depth <= 40 && Array.isArray(nodes), 'Elementor layout exceeds supported depth or has invalid children');
    for (const node of nodes) {
      fact(object(node) && ++count <= 20000 && !seen.has(node), 'Elementor layout has invalid or excessive nodes'); seen.add(node);
      const settings = object(node.settings) ? node.settings : {}, widget = typeof node.widgetType === 'string' ? node.widgetType : null;
      const identity = typeof node.id === 'string' ? node.id : 'node-' + count;
      const responsive = Object.fromEntries(Object.entries(settings).filter(([key]) => /_(?:mobile|tablet|widescreen|laptop)(?:_extra)?$/.test(key)));
      result.nodes.push({ id: identity, parent, type: node.elType ?? null, widget, settings, responsive, globals: settings.__globals__ ?? null });
      if (widget) {
        result.widgets[widget] = (result.widgets[widget] ?? 0) + 1;
        if (!basic.has(widget)) result.unsupported.push({ node: identity, widget });
      }
      if (settings.__dynamic__ && Object.keys(settings.__dynamic__).length) result.dynamic.push({ node: identity, fields: Object.keys(settings.__dynamic__) });
      for (const key of ['template_id', 'global_widget', 'templateID']) if (settings[key]) result.templateReferences.push({ node: identity, key, id: String(settings[key]) });
      if (node.templateID) result.templateReferences.push({ node: identity, key: 'templateID', id: String(node.templateID) });
      const addCopy = (rawCopy, tag = 'p') => { const value = text(rawCopy); if (value) { result.copy.push({ node: identity, text: value }); pieces.push('<' + tag + '>' + escape(value) + '</' + tag + '>'); } };
      if (widget === 'heading') addCopy(settings.title, /^h[1-6]$/.test(settings.header_size) ? settings.header_size : 'h2');
      if (widget === 'text-editor') addCopy(settings.editor);
      if (widget === 'button') { addCopy(settings.text); link(settings.link, identity); }
      if (widget === 'image') { image(settings.image, settings.caption ?? '', identity); link(settings.link, identity); }
      if (widget === 'icon-list') for (const item of settings.icon_list ?? []) { addCopy(item.text); link(item.link, identity); }
      if (['image-gallery', 'gallery'].includes(widget)) for (const item of settings.gallery ?? []) image(item, '', identity);
      // Preserve evidence of background assets without pretending they are editorial inline images.
      if (settings.background_image) image(settings.background_image, '', identity, 'background');
      if (node.elements !== undefined) walk(node.elements, identity, depth + 1);
    }
  }
  try { walk(roots, null, 0); } catch { result.data = 'invalid'; result.requiresRecovery = true; }
  result.candidateHTML = pieces.join('\n');
  const body = normal(record.html ?? '');
  result.missingCopy = result.copy.filter(item => normal(item.text).length >= 4 && !body.includes(normal(item.text))).map(item => item.node);
  const savedHTML = (record.html ?? '').replaceAll('&amp;', '&');
  result.missingMedia = result.media.filter(item => item.usage === 'content' && !(item.url && savedHTML.includes(item.url)) && !(item.id && new RegExp('\\bwp-image-' + item.id + '\\b').test(savedHTML))).map(item => ({ node: item.node, id: item.id }));
  result.requiresRecovery ||= result.missingCopy.length > 0 || result.missingMedia.length > 0 || !body && (result.unsupported.length > 0 || result.dynamic.length > 0 || result.templateReferences.length > 0);
  return result;
}

/** Bounded ZIP reader: JSON only, no filesystem extraction, ZIP64/encryption/links refused. */
export function kitJSONFiles(bytes) {
  fact(bytes.length <= 32 * 1024 * 1024 && bytes.length >= 22, 'Elementor kit exceeds the ZIP input bound');
  let end = -1;
  for (let i = bytes.length - 22; i >= Math.max(0, bytes.length - 65557); i--) if (bytes.readUInt32LE(i) === 0x06054b50 && i + 22 + bytes.readUInt16LE(i + 20) === bytes.length) { end = i; break; }
  fact(end >= 0 && bytes.readUInt16LE(end + 4) === 0 && bytes.readUInt16LE(end + 6) === 0, 'Unsupported or incomplete Elementor ZIP');
  const entries = bytes.readUInt16LE(end + 10), size = bytes.readUInt32LE(end + 12), start = bytes.readUInt32LE(end + 16);
  fact(entries === bytes.readUInt16LE(end + 8) && entries < 10000 && entries !== 65535 && start + size === end, 'Unsupported ZIP directory or entry count');
  const files = new Map(), names = new Set(); let at = start, total = 0;
  for (let i = 0; i < entries; i++) {
    fact(at + 46 <= end && bytes.readUInt32LE(at) === 0x02014b50, 'Malformed ZIP directory');
    const flags = bytes.readUInt16LE(at + 8), method = bytes.readUInt16LE(at + 10), crc = bytes.readUInt32LE(at + 16), packed = bytes.readUInt32LE(at + 20), length = bytes.readUInt32LE(at + 24);
    const nameLength = bytes.readUInt16LE(at + 28), extra = bytes.readUInt16LE(at + 30), comment = bytes.readUInt16LE(at + 32), offset = bytes.readUInt32LE(at + 42);
    fact(at + 46 + nameLength + extra + comment <= end && !(flags & 1) && bytes.readUInt16LE(at + 34) === 0 && ((bytes.readUInt32LE(at + 38) >>> 16) & 0o170000) !== 0o120000, 'Encrypted, linked or malformed ZIP entry');
    const name = bytes.subarray(at + 46, at + 46 + nameLength).toString('utf8'), key = name.replace(/\/$/, '');
    fact(safeKey(key) && !names.has(name) && length !== 0xffffffff && packed !== 0xffffffff, 'Unsafe, duplicate or ZIP64 kit path'); names.add(name);
    at += 46 + nameLength + extra + comment;
    if (!name.endsWith('.json')) continue;
    fact(length <= 8 * 1024 * 1024 && (total += length) <= 16 * 1024 * 1024 && [0, 8].includes(method), 'Kit JSON exceeds bounds or uses unsupported compression');
    fact(offset + 30 <= start && bytes.readUInt32LE(offset) === 0x04034b50 && bytes.readUInt16LE(offset + 8) === method && bytes.readUInt16LE(offset + 6) === flags, 'ZIP local header differs from directory');
    const localName = bytes.readUInt16LE(offset + 26), localExtra = bytes.readUInt16LE(offset + 28), begin = offset + 30 + localName + localExtra;
    fact(bytes.subarray(offset + 30, offset + 30 + localName).toString('utf8') === name && begin + packed <= start, 'Invalid ZIP data range or local name');
    const compressed = bytes.subarray(begin, begin + packed), data = method === 0 ? compressed : inflateRawSync(compressed, { maxOutputLength: Math.max(1, length) });
    fact(data.length === length && crc32(data) === crc, 'Kit JSON size or checksum differs'); files.set(name, data);
  }
  fact(at === end && files.size > 0, 'Kit contains no supported JSON documents'); return files;
}

export function readElementorKit(file) {
  const bytes = readBytes(file, 32 * 1024 * 1024), extension = path.extname(file).toLowerCase();
  fact(['.zip', '.json'].includes(extension), 'Use an Elementor Website Template ZIP or individual template JSON');
  fact(extension !== '.json' || bytes.length <= 8 * 1024 * 1024, 'Template JSON exceeds the document bound');
  const files = extension === '.zip' ? kitJSONFiles(bytes) : new Map([['template.json', bytes]]), documents = [], settings = [], unknown = [];
  for (const [name, data] of files) {
    const decoded = data.toString('utf8'); fact(Buffer.from(decoded).equals(data), 'Kit JSON is not valid UTF-8');
    let value; try { value = JSON.parse(decoded); } catch { fact(false, 'Kit contains invalid JSON'); }
    if (Array.isArray(value.content)) documents.push({ file: name, id: value.id ?? null, title: text(value.title), type: value.type ?? null, pageSettings: value.page_settings ?? {}, analysis: analyzeElementor({ meta: { _elementor_data: value.content }, html: '' }) });
    else if (/site-settings|site_settings/.test(name)) settings.push({ file: name, values: value });
    else unknown.push(name);
  }
  return { bytes, extension, analysis: { sha256: digest(bytes), documents, settings, otherJSONFiles: unknown, binding: 'Operator-supplied reference; document IDs and source ownership are not independently verified. Assets remain references; no kit code or plugins execute.' } };
}
