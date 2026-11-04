import fs from 'node:fs';
import path from 'node:path';
import { parseForESLint } from 'astro-eslint-parser';
import tsParser from '@typescript-eslint/parser';

const MAX_FILES = 300;
const MAX_BYTES = 8 * 1024 * 1024;
const MAX_OBSERVATIONS = 12000;
const queryModules = new Map([
  ['astro:content', new Set(['getCollection', 'getEntry'])],
  ['emdash', new Set(['getEmDashCollection', 'getEmDashEntry'])],
]);
const location = node => ({ line: node.loc.start.line, column: node.loc.start.column + 1 });
const nameOf = node => node?.type === 'Identifier' || node?.type === 'JSXIdentifier' ? node.name : node?.type === 'MemberExpression' || node?.type === 'JSXMemberExpression' ? `${nameOf(node.object) ?? '?'}.${node.computed ? (typeof node.property?.value === 'string' ? node.property.value : '?') : nameOf(node.property) ?? '?'}` : null;
const literal = node => node?.type === 'Literal' && typeof node.value === 'string' ? node.value : null;
const boundedName = value => typeof value === 'string' && value.length <= 200 ? value : null;
const children = node => Object.entries(node).filter(([key]) => !['parent', 'loc', 'range', 'tokens', 'comments'].includes(key)).flatMap(([, value]) => Array.isArray(value) ? value.filter(item => item?.type) : value?.type ? [value] : []);
const containsMarkup = node => Boolean(node && (node.type === 'JSXElement' || node.type === 'AstroFragment' || children(node).some(containsMarkup)));
const staticMarkup = node => node && !['JSXExpressionContainer', 'JSXSpreadAttribute'].includes(node.type) && children(node).every(staticMarkup);
function bindings(node) {
  if (!node) return [];
  if (node.type === 'Identifier') return [boundedName(node.name) ?? 'unresolved-binding'];
  if (node.type === 'ObjectPattern') return node.properties.flatMap(item => bindings(item.value ?? item.argument));
  if (node.type === 'ArrayPattern') return node.elements.flatMap(bindings);
  return [];
}

// The supplied reader enforces project-root, regular-file and symlink boundaries.
// Only src/pages and recursively imported local Astro sources are inspected.
export function inspectStructure(io) {
  const pages = [], pending = [], records = new Map();
  let bytes = 0, observations = 0, directoryEntries = 0;
  const push = (array, value) => {
    if (++observations > MAX_OBSERVATIONS) throw Error('Structure observation bound exceeded');
    array.push(value);
  };
  function walk(relative) {
    const directory = io.locate(relative);
    if (!directory) return;
    if (!fs.statSync(directory).isDirectory()) throw Error('Route source must be a directory');
    for (const entry of fs.readdirSync(directory, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      if (++directoryEntries > 2000) throw Error('Route directory bound exceeded');
      if (entry.name.startsWith('.')) continue;
      const source = `${relative}/${entry.name}`;
      const file = io.locate(source);
      if (!file) throw Error('Route source changed during inspection');
      const stat = fs.statSync(file);
      if (stat.isDirectory()) walk(source);
      else if (entry.name.endsWith('.astro')) {
        if (!stat.isFile()) throw Error('Route source must be regular');
        if (pages.length >= MAX_FILES) throw Error('Route file bound exceeded');
        pages.push(source); pending.push(source);
      }
    }
  }
  function resolveImport(source, specifier) {
    if (!specifier.startsWith('.')) return { status: 'unresolved-module' };
    // An explicit non-Astro extension is not followed, including script/config imports.
    if (path.posix.extname(specifier) && !specifier.endsWith('.astro')) return { status: 'not-astro-source' };
    const relative = path.posix.normalize(path.posix.join(path.posix.dirname(source), specifier));
    if (!relative.startsWith('src/') || relative.includes('\\')) throw Error('Component import escapes source boundary');
    const candidates = relative.endsWith('.astro') ? [relative] : [`${relative}.astro`, `${relative}/index.astro`];
    const found = candidates.filter(candidate => io.locate(candidate));
    if (found.length !== 1) return { status: found.length ? 'ambiguous-source' : 'missing-source' };
    return { status: 'local-astro-source', source: found[0] };
  }
  walk('src/pages');
  while (pending.length) {
    const source = pending.shift();
    if (records.has(source)) continue;
    if (records.size >= MAX_FILES) throw Error('Structure source bound exceeded');
    const text = io.read(source);
    if (text === null) throw Error('Imported source disappeared');
    bytes += Buffer.byteLength(text);
    if (bytes > MAX_BYTES) throw Error('Structure byte bound exceeded');
    const record = { source, status: 'parsed', imports: [], renderedComponents: [], repeatedExpressions: [], staticLists: [], contentQueries: [], editorialAccess: [], unresolved: [] };
    records.set(source, record);
    let ast, scopes;
    try { const parsed = parseForESLint(text, { filePath: source, parser: tsParser, ecmaVersion: 'latest', sourceType: 'module', loc: true, range: true }); ast = parsed.ast; scopes = parsed.scopeManager.scopes; }
    catch { record.status = 'unresolved-parse'; push(record.unresolved, { kind: 'unsupported-or-invalid-source' }); continue; }
    const imports = new Map(), importedReferences = new WeakMap();
    for (const node of ast.body) {
      if (node.type !== 'ImportDeclaration' || node.importKind === 'type') continue;
      const specifier = boundedName(literal(node.source));
      if (!specifier) { push(record.unresolved, { kind: 'import-specifier', ...location(node) }); continue; }
      const resolution = resolveImport(source, specifier);
      for (const item of node.specifiers) {
        if (item.importKind === 'type') continue;
        const local = boundedName(item.local?.name), imported = item.type === 'ImportDefaultSpecifier' ? 'default' : item.type === 'ImportNamespaceSpecifier' ? '*' : item.imported?.name ?? literal(item.imported);
        if (!local) continue;
        push(record.imports, { local, imported, specifier, ...resolution, ...location(node) });
        imports.set(local, { ...resolution, specifier });
        if (resolution.status === 'local-astro-source') pending.push(resolution.source);
      }
    }
    for (const scope of scopes) for (const reference of scope.references) {
      const definition = reference.resolved?.defs.find(item => item.type === 'ImportBinding');
      if (!definition) continue;
      const specifier = literal(definition.parent?.source), item = definition.node;
      const imported = item.type === 'ImportDefaultSpecifier' ? 'default' : item.type === 'ImportNamespaceSpecifier' ? '*' : item.imported?.name ?? literal(item.imported);
      importedReferences.set(reference.identifier, { local: item.local.name, module: specifier, imported });
    }
    const outsideCounts = new Map();
    function visit(node, repeated = false, ancestors = []) {
      const call = node.type === 'CallExpression';
      const method = call && node.callee.type === 'MemberExpression' ? (node.callee.computed ? literal(node.callee.property) : node.callee.property.name) : null;
      const repeat = call && ['map', 'flatMap'].includes(method) && node.arguments.some(containsMarkup);
      // Array.from is represented as a member call with method "from".
      const arrayFrom = call && node.callee.type === 'MemberExpression' && nameOf(node.callee.object) === 'Array' && method === 'from' && node.arguments.some(containsMarkup);
      const rendersRepeated = repeat || arrayFrom;
      if (rendersRepeated) push(record.repeatedExpressions, { method: arrayFrom ? 'Array.from' : method, input: boundedName(nameOf(node.callee.object)) ?? 'unresolved-expression', status: 'markup-producing-source-expression', ...location(node) });
      if (node.type === 'ImportExpression' || (call && node.callee.type === 'Import')) push(record.unresolved, { kind: 'dynamic-import', ...location(node) });
      if (call) {
        let query = node.callee.type === 'Identifier' ? importedReferences.get(node.callee) : null;
        if (node.callee.type === 'MemberExpression') {
          const namespace = importedReferences.get(node.callee.object);
          if (namespace?.imported === '*' && queryModules.get(namespace.module)?.has(method)) query = { module: namespace.module, imported: method };
        }
        if (queryModules.get(query?.module)?.has(query.imported)) {
          const collection = boundedName(literal(node.arguments[0]));
          const declarator = [...ancestors].reverse().find(parent => parent.type === 'VariableDeclarator');
          const resultBindings = declarator ? bindings(declarator.id) : [];
          if (resultBindings.length > 100) throw Error('Structure query binding bound exceeded');
          push(record.contentQueries, { api: query.imported, module: query.module, collection, status: collection ? 'literal-argument-observed' : 'unresolved-dynamic-argument', resultBindings, ...location(node) });
        }
      }
      if (node.type === 'JSXOpeningElement') {
        const tag = boundedName(nameOf(node.name));
        if (tag && (/^[A-Z]/.test(tag) || tag.includes('.'))) {
          let root = node.name;
          while (root.type === 'JSXMemberExpression') root = root.object;
          const referenced = importedReferences.get(root);
          const base = referenced ? imports.get(referenced.local) : null;
          push(record.renderedComponents, { tag, ...(base?.source ? { source: base.source } : {}), status: base?.status ?? 'unresolved-binding', inRepeatedExpression: repeated, ...location(node) });
          if (!repeated) outsideCounts.set(tag, (outsideCounts.get(tag) ?? 0) + 1);
        }
      }
      if (node.type === 'JSXElement' && ['ul', 'ol'].includes(nameOf(node.openingElement.name))) {
        const items = node.children.filter(child => child.type === 'JSXElement' && nameOf(child.openingElement.name) === 'li' && staticMarkup(child));
        if (items.length > 1) push(record.staticLists, { tag: nameOf(node.openingElement.name), literalItemCount: items.length, status: 'literal-list-items-observed', ...location(node) });
      }
      if (node.type === 'MemberExpression') {
        const chain = nameOf(node);
        const match = chain?.match(/^([A-Za-z_$][\w$]*)\.(data|edit)\.([A-Za-z_$][\w$]*|\?)$/);
        if (match) {
          const binding = boundedName(match[1]), field = boundedName(match[3] === '?' ? null : match[3]);
          push(record.editorialAccess, { binding, access: match[2], field, status: !binding || !field ? 'unresolved-dynamic-field' : 'source-access-observed', ...location(node) });
        }
      }
      for (const child of children(node)) visit(child, repeated || rendersRepeated, [...ancestors, node]);
    }
    visit(ast);
    record.componentOccurrencesOutsideLoops = [...outsideCounts].map(([tag, count]) => ({ tag, count }));
    for (const key of ['imports', 'renderedComponents', 'repeatedExpressions', 'staticLists', 'contentQueries', 'editorialAccess', 'unresolved']) record[key].sort((a, b) => (a.line ?? 0) - (b.line ?? 0) || (a.column ?? 0) - (b.column ?? 0));
  }
  return {
    schemaVersion: 1,
    status: 'source-observations-only',
    routes: pages.map(source => ({ source, status: records.get(source)?.status ?? 'unresolved' })),
    sources: [...records.values()].sort((a, b) => a.source.localeCompare(b.source)),
    bounds: { maxFiles: MAX_FILES, maxFileBytes: 1024 * 1024, maxTotalBytes: MAX_BYTES, filesRead: records.size, bytesRead: bytes },
    limits: ['Only .astro routes under src/pages and recursively imported local .astro sources under src are read. Hidden paths, script modules, aliases, plugin/generated routes and runtime configuration are not resolved.', 'Imports and rendered tags are distinct observations; expressions are not evaluated. Component occurrences outside loops and literal lists are not automatic defects.', 'Markup-producing map/flatMap/Array.from expressions do not prove live collection binding, effective reuse or record coverage. Confirm with a changed-record browser rehearsal.', 'Recognized content APIs are imported astro:content getCollection/getEntry and emdash getEmDashCollection/getEmDashEntry. Literal collection arguments and data/edit member accesses are hints, not verified canonical ownership, schema, publication state or editor save acceptance.'],
  };
}
