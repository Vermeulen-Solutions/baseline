import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { parse } from 'parse5';

// Runs after a fresh production build, including from npm run build's postbuild.
const files = fs.readdirSync('dist', { recursive: true }).filter(file => file.endsWith('.html'));
const output = new Map(files.map(file => [file.replaceAll(path.sep, '/'), fs.readFileSync(path.join('dist', file), 'utf8')]));
const html = output.get('workshops/index.html');
assert.ok(html, 'Build the public /workshops/ page before running output acceptance.');
const nodes = [];
const walk = node => { nodes.push(node); (node.childNodes ?? []).forEach(walk); };
walk(parse(html));
const attr = (node, name) => node.attrs?.find(attribute => attribute.name === name)?.value;
const text = node => node.value ?? (node.childNodes ?? []).map(text).join('');

test('public workshops include the published entry and never expose the draft', () => {
  const articles = nodes.filter(node => node.tagName === 'article');
  assert.equal(articles.length, 1);
  assert.equal(attr(articles[0], 'id'), 'clear-project-briefs');
  assert.match(text(articles[0]), /Clear project briefs/);
  assert.match(text(articles[0]), /Learn how to turn an initial conversation into a useful project brief\./);
  for (const [file, source] of output) {
    for (const privateValue of ['Winter planning clinic', 'winter-planning-clinic', 'A working session for planning the next quarter.']) {
      assert.ok(!source.includes(privateValue), `Draft content leaked into ${file}: ${privateValue}`);
    }
  }
});

test('workshop date is calendar-safe and venue is visible', () => {
  const dates = nodes.filter(node => node.tagName === 'time');
  assert.equal(dates.length, 1);
  assert.equal(attr(dates[0], 'datetime'), '2026-11-12');
  assert.equal(text(dates[0]), '12 November 2026');
  assert.match(html, /Venue: Northline Studio/);
});

test('email enquiry action and primary navigation have the agreed destinations', () => {
  const actions = nodes.filter(node => node.tagName === 'a' && text(node).trim() === 'Ask about a place');
  assert.equal(actions.length, 1);
  assert.equal(attr(actions[0], 'href'), 'mailto:hello@northline.example.test');
  for (const [file, source] of output) {
    const navNodes = [];
    const visit = node => { if (node.tagName === 'nav' && attr(node, 'aria-label') === 'Primary navigation') navNodes.push(node); (node.childNodes ?? []).forEach(visit); };
    visit(parse(source));
    assert.equal(navNodes.length, 1, `${file} has one primary navigation`);
    const links = navNodes[0].childNodes.filter(node => node.tagName === 'a' && text(node).trim() === 'Workshops');
    assert.equal(links.length, 1, `${file} links to workshops once`);
    assert.equal(attr(links[0], 'href'), '/workshops/');
  }
});

test('existing routes survive and workshop detail routes are not generated', () => {
  assert.deepEqual([...output.keys()].sort(), [
    '404.html', 'about/index.html', 'contact/index.html', 'index.html',
    'posts/index.html', 'posts/welcome/index.html', 'services/index.html', 'workshops/index.html',
  ]);
});
