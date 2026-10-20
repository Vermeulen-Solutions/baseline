import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import { gzipSync } from 'node:zlib';
import ts from 'typescript';
import { spawnNpmSync } from './process-runner.mjs';

const PACKAGE = '@phosphor-icons/react';
const parse = (code, id) => ts.createSourceFile(id, code, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);

/** Read the installed package's actual named exports, including aliases. */
export function iconExportMap(requireEntry) {
  const packageRoot = path.resolve(path.dirname(requireEntry), '..');
  const metadata = JSON.parse(fs.readFileSync(path.join(packageRoot, 'package.json'), 'utf8'));
  const entry = metadata.exports?.['.']?.import;
  if (typeof entry !== 'string' || metadata.exports?.['./dist/csr/*']?.import !== './dist/csr/*.es.js') return new Map();
  const source = parse(fs.readFileSync(path.join(packageRoot, entry), 'utf8'), entry);
  const local = new Map(), exports = new Map();
  for (const node of source.statements) {
    if (!ts.isImportDeclaration(node) || !/^\.\/csr\/[\w]+\.es\.js$/.test(node.moduleSpecifier.text ?? '') || !node.importClause?.namedBindings || !ts.isNamedImports(node.importClause.namedBindings)) continue;
    for (const binding of node.importClause.namedBindings.elements) local.set(binding.name.text, {
      specifier: PACKAGE + node.moduleSpecifier.text.replace('./csr/', '/dist/csr/').replace('.es.js', ''),
      name: (binding.propertyName ?? binding.name).text,
    });
  }
  for (const node of source.statements) {
    if (!ts.isExportDeclaration(node) || !node.exportClause || !ts.isNamedExports(node.exportClause)) continue;
    for (const binding of node.exportClause.elements) {
      const target = local.get((binding.propertyName ?? binding.name).text);
      if (target) exports.set(binding.name.text, target);
    }
  }
  return exports;
}

/** Rewrite only known, named icon imports to public package export subpaths.
 * Keep namespaces/dynamic imports intact so custom admin icon names still work.
 * No dependency source files are modified and no component behavior is replaced.
 */
export function rewriteIconImports(code, id, exports) {
  const source = parse(code, id), changes = [];
  for (const node of source.statements) {
    const clause = node.importClause;
    if (!ts.isImportDeclaration(node) || node.moduleSpecifier.text !== PACKAGE || clause?.isTypeOnly || !clause?.namedBindings || !ts.isNamedImports(clause.namedBindings)) continue;
    const rest = [], imports = [];
    for (const binding of clause.namedBindings.elements) {
      const target = exports.get((binding.propertyName ?? binding.name).text);
      if (!binding.isTypeOnly && target) {
        // Root exports can rename a glyph (e.g. ActivityIcon -> PulseIcon).
        // Import its real submodule name and preserve the caller's local name.
        const name = target.name === binding.name.text ? target.name : `${target.name} as ${binding.name.text}`;
        imports.push(`import { ${name} } from ${JSON.stringify(target.specifier)};`);
      }
      else rest.push(binding.getText(source));
    }
    if (!imports.length) continue;
    if (rest.length || clause.name) imports.push('import ' + (clause.name ? clause.name.text + (rest.length ? ', ' : '') : '') + (rest.length ? '{ ' + rest.join(', ') + ' }' : '') + ` from "${PACKAGE}";`);
    changes.push({ start: node.getStart(source), end: node.end, text: imports.join('\n') });
  }
  if (!changes.length) return;
  for (const change of changes.reverse()) code = code.slice(0, change.start) + change.text + code.slice(change.end);
  return { code, map: null };
}

export function namedIconImports() {
  const cache = new Map();
  return { name: 'baseline-named-icon-imports', enforce: 'pre', transform(code, id) {
    if (!code.includes(PACKAGE) || id.includes('\0') || !/\.[cm]?[jt]sx?(?:\?|$)/.test(id) || id.replaceAll('\\', '/').includes('/@phosphor-icons/react/')) return;
    const file = id.split('?')[0];
    if (!path.isAbsolute(file)) return;
    const entry = createRequire(file).resolve(PACKAGE);
    if (!cache.has(entry)) cache.set(entry, iconExportMap(entry));
    return rewriteIconImports(code, id, cache.get(entry));
  } };
}

export function summarizeClientBundle(bundle) {
  const chunks = Object.values(bundle).filter(chunk => chunk.type === 'chunk').map(chunk => ({
    file: chunk.fileName, bytes: Buffer.byteLength(chunk.code), gzipBytes: gzipSync(chunk.code).length,
    imports: chunk.imports, dynamicImports: chunk.dynamicImports,
    roles: [...new Set(Object.keys(chunk.modules).flatMap(id => {
      const file = id.replaceAll('\\', '/').split('?')[0];
      return /\/InlinePortableTextEditor\.(?:[cm]?js|tsx?)$/.test(file) ? ['inline-editor'] : /\/PluginRegistry\.(?:[cm]?js|tsx?)$/.test(file) ? ['admin'] : [];
    }))],
    packages: [...new Set(Object.keys(chunk.modules).filter(id => id.includes('node_modules')).map(id => { const relative = id.replaceAll('\\', '/').split('node_modules/').at(-1); return relative.split('/').slice(0, relative.startsWith('@') ? 2 : 1).join('/'); }))].sort(),
  })).sort((a, b) => b.bytes - a.bytes);
  const byFile = new Map(chunks.map(chunk => [chunk.file, chunk]));
  const entries = chunks.filter(chunk => chunk.roles.length).map(chunk => {
    const seen = new Set();
    function visit(file) { if (seen.has(file)) return; seen.add(file); for (const dependency of byFile.get(file)?.imports ?? []) visit(dependency); }
    visit(chunk.file);
    const reachable = chunks.filter(chunk => seen.has(chunk.file));
    return { file: chunk.file, roles: chunk.roles, staticChunks: reachable.length, bytes: reachable.reduce((sum, chunk) => sum + chunk.bytes, 0), gzipBytes: reachable.reduce((sum, chunk) => sum + chunk.gzipBytes, 0) };
  });
  return { version: 1, scope: 'Minified emitted JS and sum of individually gzip-compressed chunks; static import closure only. Excludes CSS, dynamic imports, HTTP headers/cache and actual browser transfer.', chunks, entries };
}

export function clientBundleReport({ enabled = process.env.BASELINE_BUNDLE_REPORT === '1' } = {}) {
  return { name: 'baseline-client-bundle-report', generateBundle(_options, bundle) {
    if (!enabled || this.environment?.name !== 'client') return;
    fs.mkdirSync('.emdash/checks', { recursive: true });
    fs.writeFileSync('.emdash/checks/client-bundles.json', JSON.stringify(summarizeClientBundle(bundle), null, 2) + '\n');
  } };
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  if (process.argv.length !== 3 || process.argv[2] !== '--build') { console.error('Use npm run build:analyze'); process.exitCode = 1; }
  else {
    const report = '.emdash/checks/client-bundles.json';
    fs.rmSync(report, { force: true });
    const result = spawnNpmSync(['run', 'build'], { stdio: 'inherit', env: { ...process.env, BASELINE_BUNDLE_REPORT: '1' } });
    if (result.error) throw result.error;
    process.exitCode = result.status ?? 1;
    if (result.status === 0) {
      const summary = JSON.parse(fs.readFileSync(report, 'utf8'));
      console.log(JSON.stringify({ report, entries: summary.entries, largest: summary.chunks.slice(0, 3).map(({ file, bytes, gzipBytes }) => ({ file, bytes, gzipBytes })) }, null, 2));
    }
  }
}
