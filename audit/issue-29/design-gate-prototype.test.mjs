import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { inspectAstro, inspectHeadingOutline, scanFiles } from './design-gate-prototype.mjs';

test('checks real style declarations and static color attributes, not frontmatter, prose or fragments', () => {
  const findings = inspectAstro(`---
const example = '#fff';
---
<!-- #abc is an example -->
<p>#abc</p><a href="#abc">Link</a>
<svg fill="#1234"></svg><div class="bg-[#123456]" style="color: #12345678"></div>
<style>@layer components { .x { color: #abc; background: url('/img.svg#fff'); content: '#fff'; } }</style>`);
  assert.equal(findings.length, 4);
  assert.ok(findings.every(finding => finding.rule === 'literal-color' && finding.line > 3));
});

test('accepts tokens and excludes malformed hex values', () => {
  assert.deepEqual(inspectAstro('<style>@layer components { .x { color: var(--color-text); background: #abcde; } }</style>'), []);
});

test('image sizing accepts positive literals and inline aspect-ratio, flags absent/invalid sizes', () => {
  const findings = inspectAstro('<img width="100" height="50"/><img style="aspect-ratio: 16 / 9"/><img width="0" height="50"/><img/>');
  assert.equal(findings.length, 2);
  assert.ok(findings.every(finding => finding.rule === 'image-dimensions' && finding.severity === 'warning'));
});

test('dynamic props are deferred rather than declared passing or invalid', () => {
  const findings = inspectAstro('<img {...props}/><img width={image.width} height={image.height}/><div style={styles}></div><ResponsiveImage src={image}/>');
  assert.equal(findings.length, 3);
  assert.ok(findings.every(finding => finding.severity === 'deferred'));
});

test('does not infer page outlines from conditional component fragments', () => {
  assert.deepEqual(inspectAstro('<h1>A</h1>{condition ? <h2>B</h2> : <h3>C</h3>}'), []);
});

test('rendered outlines flag upward skips and allow return to shallower headings', () => {
  const findings = inspectHeadingOutline('<h1>A</h1>\n<h3>B</h3><h2>C</h2><h3>D</h3><h2>E</h2>');
  assert.equal(findings.length, 1);
  assert.equal(findings[0].line, 2);
  assert.match(findings[0].message, /h1 to h3/);
  assert.deepEqual(inspectHeadingOutline('<template><h5>Not rendered</h5></template><h1>A</h1><h2>B</h2>'), []);
});

test('reports parse failures without silently accepting incomplete input', () => {
  assert.equal(inspectAstro('<div><')[0].severity, 'error');
});

test('scanner preserves source bytes and ignores unrelated file extensions', () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'baseline-issue-29-'));
  try {
    const source = '<img/>';
    fs.writeFileSync(path.join(directory, 'sample.astro'), source);
    fs.writeFileSync(path.join(directory, 'notes.md'), '# Example');
    const report = scanFiles([directory]);
    assert.equal(report.files, 1);
    assert.equal(report.findings.length, 1);
    assert.equal(fs.readFileSync(path.join(directory, 'sample.astro'), 'utf8'), source);
  } finally {
    fs.rmSync(directory, { recursive: true });
  }
});
