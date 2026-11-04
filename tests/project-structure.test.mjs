import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { inspectProject } from '../scripts/inspect-project.mjs';

const repository = fileURLToPath(new URL('../', import.meta.url));
function fixture(run) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'baseline-structure-'));
  const write = (name, source) => { const file = path.join(directory, name); fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, source); };
  write('package.json', JSON.stringify({ scripts: { dev: 'must-not-execute' } }));
  try { return run(directory, write); }
  finally { assert.equal(path.dirname(directory), path.resolve(os.tmpdir())); assert.ok(path.basename(directory).startsWith('baseline-structure-')); fs.rmSync(directory, { recursive: true, force: true }); }
}
const structure = root => inspectProject(root, { structure: true }).structure;

test('route structure distinguishes imports, rendered components and markup-producing loops', () => fixture((root, write) => {
  write('src/pages/services.astro', `---\nimport Card from '../components/Card.astro';\nimport Unused from '../components/Unused.astro';\nimport {getCollection as read} from 'astro:content';\nconst services=await read('services');\nconst titles=services.map(item=>item.data.title);\n---\n<ul>{services.map(service=><Card title={service.data.title} {...service.edit.title}/>)}</ul>`);
  write('src/components/Card.astro', `---\nimport Heading from './Heading.astro';\nconst {title}=Astro.props;\n---\n<li><Heading>{title}</Heading></li>`);
  write('src/components/Heading.astro', '<h2><slot/></h2>');
  write('src/components/Unused.astro', '<aside>Not rendered</aside>');
  const report = structure(root), route = report.sources.find(item => item.source === 'src/pages/services.astro');
  assert.equal(report.routes.length, 1); assert.equal(report.sources.length, 4);
  assert.equal(route.imports.length, 3);
  assert.equal(route.renderedComponents.length, 1);
  assert.deepEqual(route.renderedComponents[0], { tag: 'Card', source: 'src/components/Card.astro', status: 'local-astro-source', inRepeatedExpression: true, line: 8, column: 28 });
  assert.equal(route.repeatedExpressions.length, 1, 'A data-only map is not a rendered repetition');
  assert.equal(route.contentQueries[0].collection, 'services');
  assert.deepEqual(route.contentQueries[0].resultBindings, ['services']);
  assert.deepEqual(route.editorialAccess.map(item => [item.binding, item.access, item.field]), [['service', 'data', 'title'], ['service', 'edit', 'title'], ['item', 'data', 'title']].sort());
  assert.equal(report.sources.find(item => item.source.endsWith('/Card.astro')).renderedComponents[0].source, 'src/components/Heading.astro');
  assert.ok(report.limits.some(item => item.includes('do not prove live collection binding')));
}));

test('literal duplicated lists and component occurrences are reported separately from loops', () => fixture((root, write) => {
  write('src/pages/index.astro', `---\nimport Card from '../components/Card.astro';\n---\n<Card/><Card/><ul><li>First</li><li>Second</li></ul>`);
  write('src/components/Card.astro', '<article>Example</article>');
  const route = structure(root).sources.find(item => item.source === 'src/pages/index.astro');
  assert.equal(route.repeatedExpressions.length, 0);
  assert.deepEqual(route.componentOccurrencesOutsideLoops, [{ tag: 'Card', count: 2 }]);
  assert.equal(route.staticLists[0].literalItemCount, 2);
  assert.ok(route.renderedComponents.every(item => item.inRepeatedExpression === false));
}));

test('dynamic sources and shadowed imports remain unresolved without executing expressions', () => fixture((root, write) => {
  write('astro.config.mjs', `throw Error('must-not-execute')`);
  write('.env', 'PRIVATE_MARKER=secret');
  write('src/pages/index.astro', `---\nimport {getCollection as read} from 'astro:content';\nimport Card from '../components/Card.astro';\nconst services=await read(process.env.COLLECTION);\nconst custom=await import(process.env.MODULE);\nfunction other(read){return read('not-a-query')}\n---\n{services.map(Card=><Card value={services.edit[field]}/>)} `);
  write('src/components/Card.astro', '<article/>');
  const report = structure(root), route = report.sources.find(item => item.source === 'src/pages/index.astro');
  assert.equal(route.contentQueries.length, 1);
  assert.equal(route.contentQueries[0].collection, null);
  assert.equal(route.contentQueries[0].status, 'unresolved-dynamic-argument');
  assert.ok(route.unresolved.some(item => item.kind === 'dynamic-import'));
  assert.equal(route.renderedComponents[0].status, 'unresolved-binding');
  assert.equal(route.editorialAccess[0].field, null);
  assert.ok(!JSON.stringify(report).includes('PRIVATE_MARKER'));
}));

test('namespace content calls, recursive imports and unparseable routes have bounded explicit results', () => fixture((root, write) => {
  write('src/pages/index.astro', `---\nimport * as content from 'emdash';\nimport A from '../components/A.astro';\nconst {entries:items}=await content.getEmDashCollection('services');\n---\n{items.flatMap(item=><A/>)} `);
  write('src/components/A.astro', `---\nimport B from './B.astro';\n---\n<B/>`);
  write('src/components/B.astro', `---\nimport A from './A.astro';\n---\n<A/>`);
  write('src/pages/broken.astro', '---\nconst x = ;\n---\n<p/>');
  const report = structure(root), route = report.sources.find(item => item.source.endsWith('/index.astro'));
  assert.equal(report.sources.length, 4);
  assert.equal(route.repeatedExpressions[0].method, 'flatMap');
  assert.deepEqual(route.contentQueries[0].resultBindings, ['items']);
  assert.equal(report.sources.find(item => item.source.endsWith('/broken.astro')).status, 'unresolved-parse');
}));

test('opt-in structure preserves default output and CLI failure messages withhold source details', () => fixture((root, write) => {
  const before = inspectProject(root); assert.equal('structure' in before, false);
  write('src/pages/index.astro', '<main/>');
  const after = inspectProject(root); assert.deepEqual(after, before);
  const script = path.join(repository, 'scripts/inspect-project.mjs');
  let result = spawnSync(process.execPath, [script, '--root', root, '--structure', '--json'], { encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr); assert.equal(JSON.parse(result.stdout).structure.routes.length, 1);
  write('src/pages/index.astro', "---\nimport Private from '../../PRIVATE_MARKER.astro';\n---\n<Private/>");
  result = spawnSync(process.execPath, [script, '--root', root, '--structure', '--json'], { encoding: 'utf8' });
  assert.equal(result.status, 1); assert.ok(!result.stdout.includes('PRIVATE_MARKER')); assert.ok(!result.stderr.includes('PRIVATE_MARKER'));
}));

test('linked, oversized and excessive route inputs fail without partial success', () => fixture((root, write) => {
  write('src/pages/index.astro', ' '.repeat(1024 * 1024 + 1));
  assert.throws(() => structure(root), /bounded/);
  write('src/pages/index.astro', '<main/>');
  const outside = path.join(root, 'outside'); fs.mkdirSync(outside);
  fs.symlinkSync(outside, path.join(root, 'src/pages/linked'), process.platform === 'win32' ? 'junction' : 'dir');
  assert.throws(() => structure(root), /Linked/); fs.unlinkSync(path.join(root, 'src/pages/linked'));
  for (let i = 0; i < 301; i++) write(`src/pages/p${i}.astro`, '<main/>');
  assert.throws(() => structure(root), /bound/);
}));

test('comments and strings do not fabricate loops or query calls; missing and aliased components remain unknown', () => fixture((root, write) => {
  write('src/pages/index.astro', `---\nimport Alias from '@/components/Card.astro';\nimport Missing from '../components/Missing.astro';\n// getCollection('invented'); things.map(x => <Card/>);\nconst example="entry.edit.secret";\n---\n<Alias/><Missing/><p>items.map is explanatory prose.</p>`);
  const route = structure(root).sources[0];
  assert.equal(route.contentQueries.length, 0); assert.equal(route.repeatedExpressions.length, 0); assert.equal(route.editorialAccess.length, 0);
  assert.deepEqual(route.renderedComponents.map(item => item.status), ['unresolved-module', 'missing-source']);
  write('src/components/real.astro', '<p/>');
  fs.symlinkSync(path.join(root, 'src/components/real.astro'), path.join(root, 'src/components/Missing.astro'), 'file');
  assert.throws(() => structure(root), /Linked/);
  fs.unlinkSync(path.join(root, 'src/components/Missing.astro'));
}));
