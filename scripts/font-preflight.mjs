import fs from 'node:fs';
import path from 'node:path';
import postcss from 'postcss';

const ROLES = ['--font-body', '--font-display', '--font-accent', '--font-mono'];
const SYSTEM = new Set(['serif', 'sans-serif', 'monospace', 'cursive', 'fantasy', 'system-ui', 'ui-serif', 'ui-sans-serif', 'ui-monospace', 'ui-rounded', 'emoji', 'math', 'fangsong', 'arial', 'helvetica', 'helvetica neue', 'verdana', 'tahoma', 'trebuchet ms', 'times new roman', 'times', 'georgia', 'cambria', 'courier new', 'courier', 'consolas', 'liberation mono', 'menlo', 'monaco', 'segoe ui', 'roboto', 'noto sans', 'apple color emoji', 'noto color emoji', 'segoe ui emoji', 'segoe ui symbol', '-apple-system', 'blinkmacsystemfont']);
const BOUNDS = { files: 64, cssBytes: 1024 * 1024, faces: 256, assets: 256, fontBytes: 32 * 1024 * 1024, packageBytes: 256 * 1024, roleDeclarations: 256, diagnostics: 1024 };
const unquote = value => value.trim().replace(/^(['"])([\s\S]*)\1$/, '$2');
const familyName = value => !value || /[\\();]/.test(value) ? null : unquote(value).replace(/\s+/g, ' ').toLowerCase();
const dynamic = value => /\b(?:var|env|calc|clamp|min|max)\s*\(|[\\]/i.test(value);
const CSS_NUMBER = /^[+-]?(?:\d+|\d*\.\d+)(?:e[+-]?\d+)?$/;

function sourceLocation(node, source) { return { source, line: node.source?.start?.line ?? null }; }

// This validates container signatures and bounded header fields, not font decoding,
// glyph coverage, licensing, variation axes or whether a face actually rendered.
function headerFormat(file, size) {
  const fd = fs.openSync(file, fs.constants.O_RDONLY);
  const bytes = Buffer.alloc(48); let count;
  try { count = fs.readSync(fd, bytes, 0, bytes.length, 0); } finally { fs.closeSync(fd); }
  if (count < 12) return { error: 'Font header is truncated' };
  const magic = bytes.toString('latin1', 0, 4);
  if (magic === 'wOF2' || magic === 'wOFF') {
    const minimum = magic === 'wOF2' ? 48 : 44;
    if (count < minimum || bytes.readUInt32BE(8) !== size || !bytes.readUInt16BE(12) || bytes.readUInt16BE(12) > 4096 || bytes.readUInt16BE(14) !== 0 || !bytes.readUInt32BE(16)) return { error: 'Font container header/length is inconsistent' };
    if (magic === 'wOF2' && (!bytes.readUInt32BE(20) || bytes.readUInt32BE(20) > size - minimum)) return { error: 'Font compressed-length header is inconsistent' };
    return { format: magic === 'wOF2' ? 'woff2' : 'woff' };
  }
  if (magic === 'OTTO' || bytes.readUInt32BE(0) === 0x00010000 || magic === 'true') {
    const tables = bytes.readUInt16BE(4);
    if (!tables || tables > 4096 || size < 12 + tables * 16) return { error: 'Font table-directory header is inconsistent' };
    return { format: magic === 'OTTO' ? 'opentype' : 'truetype' };
  }
  if (magic === 'ttcf') return { format: 'collection' };
  return { error: 'File does not have a supported font signature' };
}

function validWeight(value) {
  if (/^(?:auto|normal|bold)$/.test(value)) return true;
  const parts = value.split(/\s+/);
  if (!parts.every(part => CSS_NUMBER.test(part))) return false;
  const numbers = parts.map(Number);
  return numbers.length >= 1 && numbers.length <= 2 && numbers.every(number => Number.isFinite(number) && number >= 1 && number <= 1000) && (numbers.length === 1 || numbers[0] <= numbers[1]);
}
function angle(value) {
  const match = value.match(/^([+-]?(?:\d+|\d*\.\d+)(?:e[+-]?\d+)?)(deg|grad|rad|turn)$/);
  return match ? Number(match[1]) * ({ deg: 1, grad: 0.9, rad: 180 / Math.PI, turn: 360 })[match[2]] : NaN;
}
function validStyle(value) {
  if (/^(?:auto|normal|italic|oblique)$/.test(value)) return true;
  const parts = value.split(/\s+/), numbers = parts.slice(1).map(angle);
  return parts[0] === 'oblique' && numbers.length >= 1 && numbers.length <= 2 && numbers.every(number => Number.isFinite(number) && number >= -90 && number <= 90) && (numbers.length === 1 || numbers[0] <= numbers[1]);
}

export function auditFontPreflight(css, { rootDir = '.', cssPath = 'src/styles/global.css' } = {}) {
  const root = path.resolve(rootDir);
  const report = {
    valid: true, status: 'observed', errors: [], advisories: [], faces: [], roles: [], sources: [], bounds: { ...BOUNDS },
    limits: ['Static owned CSS, explicitly followed local CSS imports and bounded package.json dependency names only; no configuration, package code, browser or network executes.', 'Font signatures/container headers are checked, not full decoding, actual family/axis metadata, glyph coverage or rendered use.', 'Package/remote/dynamic sources and locally installed font names require separate build/browser verification. Role entries describe source declarations, not a computed cascade.'],
  };
  let cssBytes = 0, assets = 0, aliasSteps = 0;
  let declaredPackages;
  const seen = new Set(), declarations = new Map(), faceFamilies = new Set();
  const outside = file => { const rel = path.relative(root, file); return rel === '..' || rel.startsWith('..' + path.sep) || path.isAbsolute(rel); };
  const relative = file => outside(file) ? '[external-css]' : path.relative(root, file).split(path.sep).join('/');
  const issue = (level, code, location, message) => {
    if (report.errors.length + report.advisories.length >= BOUNDS.diagnostics) throw Error('Font diagnostic bound exceeded');
    report[level].push({ code, ...location, message });
  };
  const error = (code, location, message) => issue('errors', code, location, message);
  const advisory = (code, location, message) => issue('advisories', code, location, message);
  function safeFile(file) {
    const target = path.resolve(file), rel = path.relative(root, target);
    if (rel.startsWith('..' + path.sep) || rel === '..' || path.isAbsolute(rel)) throw Error('Path escapes the project');
    const parts = rel.split(path.sep).filter(Boolean);
    if (parts.some(part => part.startsWith('.') || part === 'node_modules')) throw Error('Private/package paths are outside static owned-source scope');
    if (fs.lstatSync(root).isSymbolicLink()) throw Error('Linked project roots are refused');
    let current = root;
    for (const part of parts) {
      const entries = fs.readdirSync(current);
      if (!entries.includes(part)) {
        if (entries.some(entry => entry.toLowerCase() === part.toLowerCase())) throw Error('Path case does not match the stored filename');
        throw Error('Referenced file is missing');
      }
      current = path.join(current, part);
      if (fs.lstatSync(current).isSymbolicLink()) throw Error('Linked source/asset paths are refused');
    }
    const stat = fs.statSync(target);
    if (!stat.isFile()) throw Error('Referenced source/asset is not a regular file');
    return { target, stat };
  }
  function declaredPackageImport(value) {
    if (!declaredPackages) {
      declaredPackages = new Set();
      try {
        const { target, stat } = safeFile(path.join(root, 'package.json'));
        if (stat.size > BOUNDS.packageBytes) return false;
        const metadata = JSON.parse(fs.readFileSync(target, 'utf8'));
        for (const key of ['dependencies', 'devDependencies', 'optionalDependencies', 'peerDependencies']) {
          const group = metadata[key];
          if (group && typeof group === 'object' && !Array.isArray(group)) for (const name of Object.keys(group)) declaredPackages.add(name);
        }
      } catch { /* Missing/invalid metadata never authorizes following package files. */ }
    }
    return declaredPackages.has(value.split(/[/?#]/)[0]);
  }
  function resolveOwned(value, source, location, kind) {
    if (dynamic(value)) { advisory('dynamic-source', location, `${kind} uses an unresolved expression/escape`); return null; }
    if (/^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(value)) { advisory('external-source', location, `${kind} is remote, embedded or scheme-based; no request made`); return null; }
    if (!value || /[\0\r\n\\]/.test(value)) { error('invalid-path', location, `${kind} path is invalid`); return null; }
    let decoded;
    try { decoded = decodeURIComponent(value.split(/[?#]/)[0]); } catch { error('invalid-path', location, `${kind} path has invalid URL encoding`); return null; }
    if (/[\0\\]/.test(decoded)) { error('invalid-path', location, `${kind} path is invalid`); return null; }
    if (decoded.startsWith('/') && decoded.split('/').includes('..')) { error('invalid-path', location, `${kind} absolute URL has traversal segments`); return null; }
    const file = decoded.startsWith('/') ? path.resolve(root, 'public', '.' + decoded) : path.resolve(path.dirname(source), decoded);
    if (outside(source) && outside(file)) { advisory('external-css-reference', location, `${kind} resolves outside the project from an explicitly supplied external stylesheet; no file read`); return null; }
    return file;
  }
  function inspectAsset(value, format, source, location) {
    if (++assets > BOUNDS.assets) throw Error('Font asset bound exceeded');
    const file = resolveOwned(value, source, location, 'Font');
    const asset = { ...location, status: 'unresolved', declaredFormat: format ?? null };
    if (!file) return asset;
    asset.path = relative(file);
    const extension = path.extname(file).toLowerCase();
    try {
      const { target, stat } = safeFile(file);
      if (stat.size > BOUNDS.fontBytes) throw Error('Font file exceeds the inspection byte bound');
      if (!['.woff2', '.woff', '.ttf', '.otf', '.ttc'].includes(extension)) { advisory('unsupported-font-format', location, 'Font extension is outside the supported bounded header checks; path exists but contents were not read'); return asset; }
      const header = headerFormat(target, stat.size);
      if (header.error) { error('invalid-font-header', location, `${asset.path}: ${header.error}`); asset.status = 'invalid'; return asset; }
      asset.format = header.format; asset.bytes = stat.size;
      const expected = { '.woff2': 'woff2', '.woff': 'woff', '.ttf': 'truetype', '.otf': 'opentype', '.ttc': 'collection' }[extension];
      const declared = format?.toLowerCase().replace(/-variations$/, '');
      if ((header.format !== expected && !(extension === '.otf' && header.format === 'truetype')) || (declared && declared !== header.format && !(declared === 'opentype' && header.format === 'truetype'))) {
        error('font-format-mismatch', location, `${asset.path}: extension/format declaration does not match the font signature`); asset.status = 'invalid';
      } else asset.status = 'header-checked';
      if (header.format !== 'woff2') advisory('prefer-woff2', location, `${asset.path}: valid legacy/native format; prefer WOFF2 for modern web delivery when requirements permit`);
    } catch (failure) { error('font-path', location, `${asset.path}: ${failure.message}`); asset.status = 'invalid'; }
    return asset;
  }
  function parseSource(sourceCSS, file) {
    if (seen.has(file)) return;
    if (seen.size >= BOUNDS.files) throw Error('CSS source count bound exceeded');
    cssBytes += Buffer.byteLength(sourceCSS);
    if (cssBytes > BOUNDS.cssBytes) throw Error('CSS source byte bound exceeded');
    seen.add(file); const source = relative(file); report.sources.push(source);
    const ast = postcss.parse(sourceCSS, { from: source });
    ast.walkDecls(declaration => {
      if (!declaration.prop.startsWith('--')) return;
      const location = sourceLocation(declaration, source);
      const values = declarations.get(declaration.prop) ?? [];
      values.push({ value: declaration.value, ...location }); declarations.set(declaration.prop, values);
    });
    ast.walkAtRules(/^import$/i, node => {
      const location = sourceLocation(node, source);
      const match = node.params.match(/^(?:url\(\s*)?(?:"([^"]+)"|'([^']+)')(?:\s*\))?(?:\s|$)/);
      if (!match) { advisory('unresolved-css-import', location, 'CSS import is not a supported literal; inspect through the build'); return; }
      const value = match[1] ?? match[2];
      if (/^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(value)) { advisory('external-css-import', location, 'Remote/embedded CSS import requires separate verification; no request made'); return; }
      if (!value.startsWith('.') && !value.startsWith('/') && (value.startsWith('@') || !/\.css(?:[?#]|$)/i.test(value))) { advisory('package-css-import', location, 'Package CSS import requires build/browser verification'); return; }
      const imported = resolveOwned(value, file, location, 'CSS import');
      if (!imported) return;
      if (seen.has(imported)) return;
      if (path.extname(imported).toLowerCase() !== '.css') { advisory('unresolved-css-import', location, 'Only explicit CSS files are followed'); return; }
      try {
        const { target, stat } = safeFile(imported);
        if (stat.size > BOUNDS.cssBytes || cssBytes + stat.size > BOUNDS.cssBytes) throw Error('CSS source byte bound exceeded');
        parseSource(fs.readFileSync(target, 'utf8'), target);
      } catch (failure) {
        const bare = !value.startsWith('.') && !value.startsWith('/');
        if (bare && failure.message === 'Referenced file is missing' && declaredPackageImport(value)) advisory('package-css-import', location, 'Declared package CSS import requires build/browser verification; package files were not read');
        else error('css-import', location, `Owned CSS import refused: ${failure.message}`);
      }
    });
    ast.walkAtRules(/^font-face$/i, node => {
      if (report.faces.length >= BOUNDS.faces) throw Error('Font face bound exceeded');
      const location = sourceLocation(node, source), descriptors = new Map();
      for (const child of node.nodes ?? []) if (child.type === 'decl') descriptors.set(child.prop.toLowerCase(), child.value.trim());
      const family = descriptors.get('font-family'), normalizedFamily = familyName(family);
      const face = { ...location, family: normalizedFamily, weight: descriptors.get('font-weight') ?? 'normal', style: descriptors.get('font-style') ?? 'normal', assets: [] };
      report.faces.push(face);
      if (!normalizedFamily || postcss.list.comma(family).length !== 1) error('font-family-descriptor', location, 'Font face needs one literal family name');
      else faceFamilies.add(normalizedFamily);
      for (const [name, validate] of [['font-weight', validWeight], ['font-style', validStyle]]) {
        const value = descriptors.get(name);
        if (value && dynamic(value)) advisory('dynamic-descriptor', location, `${name} requires computed validation`);
        else if (value && !validate(value.toLowerCase())) error('font-descriptor', location, `${name} is not a supported valid face descriptor: ${value.slice(0, 80)}`);
      }
      const display = descriptors.get('font-display');
      if (!display) advisory('font-display-unspecified', location, 'Choose an intentional font-display policy and inspect loading/layout shifts');
      else if (dynamic(display)) advisory('dynamic-descriptor', location, 'font-display requires computed validation');
      else if (!/^(?:auto|block|swap|fallback|optional)$/.test(display.toLowerCase())) error('font-descriptor', location, 'font-display is invalid');
      const src = descriptors.get('src');
      if (!src) { error('missing-font-source', location, 'Font face has no src descriptor'); return; }
      for (const part of postcss.list.comma(src)) {
        if (/^local\(/i.test(part)) { advisory('local-font-source', location, 'Locally installed font availability requires browser verification'); continue; }
        const match = part.match(/^url\(\s*(?:"([^"]*)"|'([^']*)'|([^)'"\s]+))\s*\)(?:\s+format\(\s*(?:"([^"]+)"|'([^']+)'|([\w-]+))\s*\))?(?:\s+tech\([^)]*\))?\s*$/i);
        if (!match) { advisory('unresolved-font-source', location, 'Font src is not a supported literal URL/format expression'); continue; }
        face.assets.push(inspectAsset(match[1] ?? match[2] ?? match[3], match[4] ?? match[5] ?? match[6], file, location));
      }
    });
  }
  function roleFamilies(value, visiting = new Set()) {
    if (++aliasSteps > 10000 || visiting.size > 32) return null;
    const alias = value.trim().match(/^var\(\s*(--[\w-]+)\s*\)$/);
    if (alias) {
      if (visiting.has(alias[1])) return null;
      const candidates = declarations.get(alias[1]);
      if (!candidates?.length) return null;
      const next = new Set([...visiting, alias[1]]);
      const groups = candidates.map(candidate => roleFamilies(candidate.value, next));
      return groups.every(Boolean) ? [...new Set(groups.flat())] : null;
    }
    if (dynamic(value)) return null;
    const names = postcss.list.comma(value).map(familyName);
    return names.every(Boolean) ? names : null;
  }
  try {
    if (typeof css !== 'string') throw Error('CSS source must be a string');
    const file = path.resolve(root, cssPath);
    parseSource(css, file);
    for (const role of ROLES) for (const declaration of declarations.get(role) ?? []) {
      if (report.roles.length >= BOUNDS.roleDeclarations) throw Error('Font role declaration bound exceeded');
      const families = roleFamilies(declaration.value), location = { source: declaration.source, line: declaration.line };
      const mapping = { role, ...location, families, status: !families ? 'unresolved' : families.every(family => SYSTEM.has(family) || faceFamilies.has(family)) ? 'source-declared' : 'unresolved' };
      report.roles.push(mapping);
      if (mapping.status === 'unresolved') advisory('role-source-unverified', location, `${role} family/alias requires package, cascade or browser verification`);
    }
  } catch (failure) {
    // Reserve the final diagnostic for the reason a bounded inspection stopped.
    if (report.errors.length + report.advisories.length >= BOUNDS.diagnostics) (report.advisories.length ? report.advisories : report.errors).pop();
    report.errors.push({ code: 'inspection-refused', source: null, line: null, message: failure.reason ?? failure.message });
  }
  report.valid = report.errors.length === 0;
  report.status = report.errors.length ? 'invalid' : report.advisories.length ? 'requires-review' : 'observed';
  return report;
}
