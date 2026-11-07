import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, rmSync, mkdirSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { inspectArtifact, parseArgs, summarize, exceedsThreshold, renderAgentMessage, RULES } from '../scripts/check-artifact.mjs';

const ids = html => inspectArtifact(html).map(f => f.id);
const cli = (args, input) => spawnSync(process.execPath, [path.resolve('scripts/check-artifact.mjs'), ...args], { input, encoding: 'utf8' });

test('real content is inspected while comments, code, scripts, styles and templates are inert', () => {
  assert.deepEqual(ids('<!-- lorem ipsum --><script>"lorem ipsum"</script><style>.x{--copy:"lorem ipsum"}</style><template><p>lorem ipsum</p></template><pre>lorem ipsum</pre><p hidden>lorem ipsum</p><p aria-hidden="true">lorem ipsum</p><p>Real brief-derived content.</p>'), []);
  const finding = inspectArtifact('<p>Real copy</p>\n<p>Lor&#101;m ipsum</p>')[0];
  assert.equal(finding.id, 'filler-copy');
  assert.equal(finding.line, 2);
  assert.equal(finding.severity, 'P1');
});

test('metrics and stock images request evidence without declaring fabrication or rejecting approved brands', () => {
  const findings = inspectArtifact('<p>10× faster, with 99.9% uptime</p><img src="//picsum.photos/400/300"><img srcset="https://images.unsplash.com/photo-1 2x">');
  assert.deepEqual(findings.map(f => f.id).sort(), ['external-image', 'external-image', 'invented-metric']);
  assert.ok(findings.every(f => f.severity === 'P2'));
  assert.deepEqual(ids('<style>h1{font-family:Inter;background:linear-gradient(purple,blue);border-left:4px solid red;border-radius:8px}</style><h1>✨ Welcome</h1><section>Real content</section>'), []);
  assert.deepEqual(ids('<img src="https://images.unsplash.com.example.test/a.jpg"><img src="/local.jpg">'), []);
});

test('uppercase tracking handles parsed CSS, inline styles, tokens and conservative unknowns', () => {
  assert.deepEqual(ids('<style>:root{--track:var(--tracking);--tracking:.08em} @layer components{.label{text-transform:uppercase;letter-spacing:var(--track)}}</style>'), []);
  assert.deepEqual(ids('<span style="text-transform:uppercase;letter-spacing:1.2px;font-size:20px">Label</span>'), []);
  assert.deepEqual(ids('<style>.label{text-transform:uppercase!important;text-transform:none;letter-spacing:0}</style>'), ['all-caps-no-tracking']);
  assert.deepEqual(ids('<style>.label{text-transform:none!important;text-transform:uppercase}</style>'), []);
  for (const spacing of ['normal', '0.02em', 'var(--unknown)', '.05rem']) assert.ok(ids(`<span style="text-transform:uppercase;letter-spacing:${spacing}">Label</span>`).includes('all-caps-no-tracking'));
  assert.ok(ids('<style>/* text-transform:uppercase */.label{color:var(--color-text)}</style>').length === 0);
  assert.ok(ids('<style>.label{text-transform:uppercase}.label{letter-spacing:.08em}</style>').includes('all-caps-no-tracking'), 'separate cascade remains advisory');
});

test('literal-colour count includes all styles and inline blocks, excludes token values and URL fragments', () => {
  assert.deepEqual(ids(`<style>:root{${Array.from({ length: 15 }, (_, i) => `--color-${i}:#fff`).join(';')}}</style>`), []);
  assert.deepEqual(ids('<style>.x{background:url(#abc);content:"#fff"}</style>'), []);
  const html = Array.from({ length: 13 }, (_, i) => `<style>.c${i}{color:#aabbcc}</style>`).join('');
  assert.ok(ids(html).includes('raw-hex'));
  assert.ok(ids(Array(13).fill('<p style="color:#fff">Copy</p>').join('')).includes('raw-hex'));
});

test('accent counts use Baseline roles and remain advisory; section anchors are OpenDesign-only', () => {
  const html = Array(7).fill('<p style="color:var(--color-action)">Copy</p>').join('');
  assert.deepEqual(ids(html), ['accent-overuse']);
  assert.deepEqual(ids('<section>Copy</section>'), []);
  assert.deepEqual(inspectArtifact('<section></section><section data-od-id="named"></section><section data-screen-label="01 Cover"></section>', { opendesign: true }).map(f => f.id), ['missing-section-anchor']);
});

test('rule metadata, thresholds and actionable agent report retain stable IDs', () => {
  assert.equal(new Set(RULES.map(r => r.id)).size, RULES.length);
  const findings = inspectArtifact('<p>lorem ipsum</p><p>10× faster</p>');
  assert.deepEqual(summarize(findings), { p0: 0, p1: 1, p2: 1 });
  for (const [threshold, expected] of [['p0', false], ['p1', true], ['p2', true], ['none', false]]) assert.equal(exceedsThreshold(findings, threshold), expected);
  assert.match(renderAgentMessage(findings), /artifact-lint>[\s\S]*filler-copy[\s\S]*Fix:/);
  assert.equal(renderAgentMessage([]), '');
});

test('CLI handles stdin, thresholds, invalid CSS and invalid arguments without claiming a pass', () => {
  const p1 = cli(['-', '--json'], '<p>lorem ipsum</p>');
  assert.equal(p1.status, 1);
  const report = JSON.parse(p1.stdout);
  assert.equal(report.ok, false);
  assert.match(report.coverage, /source-only/);
  assert.match(report.results[0].agentMessage, /filler-copy/);
  assert.equal(cli(['-'], '<p>10× faster</p>').status, 0);
  assert.equal(cli(['-', '--fail-on', 'p2'], '<p>10× faster</p>').status, 1);
  assert.equal(cli(['-', '--fail-on', 'none'], '<p>lorem ipsum</p>').status, 0);
  assert.equal(cli(['-'], '<style>.a{</style>').status, 2);
  assert.equal(cli(['-'], '   ').status, 2);
  assert.equal(cli(['--fail-on', 'p9'], '').status, 2);
  assert.equal(cli(['--wat'], '').status, 2);
  assert.throws(() => parseArgs(['-', 'a.html']), /only input/);
});

test('directory collection is recursive, deterministic, deduplicated and leaves source bytes intact', () => {
  const root = mkdtempSync(path.join(tmpdir(), 'baseline-artifact-lint-'));
  try {
    mkdirSync(path.join(root, 'nested'));
    const file = path.join(root, 'nested/a.html'), source = '<p>Real content.</p>';
    writeFileSync(file, source);
    writeFileSync(path.join(root, 'b.htm'), '<p>10× faster</p>');
    writeFileSync(path.join(root, 'source.src.html.tpl'), '<p>lorem ipsum</p>');
    const result = cli([root, file, '--json']);
    assert.equal(result.status, 0, result.stderr);
    assert.equal(JSON.parse(result.stdout).results.length, 2);
    assert.equal(readFileSync(file, 'utf8'), source);
    assert.equal(cli([path.join(root, 'missing')]).status, 2);
    assert.equal(cli([path.join(root, 'source.src.html.tpl')]).status, 2);
  } finally { rmSync(root, { recursive: true, force: true }); }
});
