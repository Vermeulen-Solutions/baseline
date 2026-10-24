import { parse } from 'parse5';
import { createHash } from 'node:crypto';
import { readFile, writeFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
const [origin, fixture, output] = process.argv.slice(2);
assert.ok(['127.0.0.1', 'localhost'].includes(new URL(origin).hostname));
const report = { reviewerKind: 'parent agent, actual HTTP and emitted artifact observations after independent fresh build', routes: [] };
const walk = node => [node, ...(node.childNodes || []).flatMap(walk)];
const attr = (node, name) => node.attrs?.find(item => item.name === name)?.value;
for (const route of ['/', '/workshops/', '/contact/', '/not-a-real-page/', '/_styleguide/']) {
  const response = await fetch(new URL(route, origin));
  const html = await response.text();
  const nodes = walk(parse(html));
  const expected = ['/', '/workshops/', '/contact/'].includes(route) ? 200 : 404;
  assert.equal(response.status, expected, route);
  assert.equal(attr(nodes.find(node => node.tagName === 'html'), 'lang'), 'en');
  assert.equal(nodes.filter(node => node.tagName === 'title').length, 1);
  assert.equal(nodes.filter(node => node.tagName === 'h1').length, 1);
  assert.equal(nodes.filter(node => node.tagName === 'link' && attr(node, 'rel') === 'canonical').length, 0, 'undecided production origin');
  if (expected === 404) assert.ok(nodes.some(node => node.tagName === 'meta' && attr(node, 'name') === 'robots' && attr(node, 'content')?.includes('noindex')));
  report.routes.push({route, status: response.status, language: 'en', htmlSHA256: createHash('sha256').update(html).digest('hex')});
}
async function files(directory, prefix = '') {
  return (await Promise.all((await readdir(directory, {withFileTypes: true})).map(async entry => entry.isDirectory() ? files(path.join(directory, entry.name), prefix + entry.name + '/') : [prefix + entry.name]))).flat();
}
report.htmlFiles = (await files(path.join(fixture, 'dist'))).filter(file => file.endsWith('.html')).sort();
assert.deepEqual(report.htmlFiles, ['404.html', 'contact/index.html', 'index.html', 'workshops/index.html']);
const lockBytes = await readFile(path.join(fixture, 'package-lock.json'));
const lock = JSON.parse(lockBytes);
assert.ok(!Object.keys(lock.packages).some(name => /(?:^|\/)(?:@emdash-cms|emdash|[^/]*sqlite[^/]*|libsql|@libsql)(?:\/|$)/i.test(name)));
report.lockfileSHA256 = createHash('sha256').update(lockBytes).digest('hex');
report.sharp = lock.packages['node_modules/sharp'].version;
report.status = 'pass';
await writeFile(output, JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report, null, 2));
