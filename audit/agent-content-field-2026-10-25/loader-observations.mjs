import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { parse as parseHTML } from 'parse5';
const root = 'C:/dev/baseline-field-maintenance-20261025-run1';
const clearingReview = process.argv.includes('--clearing-review');
const output = `audit/agent-content-field-2026-10-25/after/loader-${clearingReview ? 'reviewed' : 'frozen'}.json`;
const contentPath = path.join(root, 'src/content/posts/welcome.md');
const original = await fs.readFile(contentPath, 'utf8');
assert.match(original, /^readingMinutes:\s*5\s*$/m);
const without = original.replace(/^readingMinutes:[^\r\n]*\r?\n/m, '');
const report = { reviewer: 'parent-operated real Astro build boundary checks', oracle: clearingReview ? 'Reviewed optional-field clearing semantics; see oracle-review.md' : 'Frozen initial oracle', cases: [], sourceRestored: false };
const cases = [
  { name: 'omitted', valid: true }, { name: 'lower', value: 1, valid: true }, { name: 'upper', value: 60, valid: true },
  { name: 'zero', value: 0, valid: false }, { name: 'negative', value: -1, valid: false }, { name: 'above', value: 61, valid: false },
  { name: 'fraction', value: 1.5, valid: false }, { name: 'numeric-string', value: '5', valid: false },
  { name: 'text', value: 'five', valid: false }, { name: 'null', value: null, valid: clearingReview }, { name: 'empty-string', value: '', valid: false },
];
function build() {
  const result = spawnSync(process.execPath, ['node_modules/astro/bin/astro.mjs', 'build'], { cwd: root, encoding: 'utf8', timeout: 120000, windowsHide: true });
  assert.equal(result.error, undefined);
  return { exitCode: result.status, output: result.stdout + result.stderr };
}
async function mainText() {
  const doc = parseHTML(await fs.readFile(path.join(root, 'dist/posts/welcome/index.html'), 'utf8'));
  function find(node) { if (node.tagName === 'main') return node; for (const child of node.childNodes ?? []) { const hit = find(child); if (hit) return hit; } }
  function text(node) { if (['script', 'style'].includes(node.tagName)) return ''; return node.nodeName === '#text' ? node.value : (node.childNodes ?? []).map(text).join(' '); }
  return text(find(doc)).replace(/\s+/g, ' ').trim();
}
try {
  for (const item of cases) {
    const candidate = item.name === 'omitted' ? without : without.replace(/^---\r?\n/, match => match + `readingMinutes: ${JSON.stringify(item.value)}\n`);
    await fs.writeFile(contentPath, candidate);
    const built = build();
    const record = { ...item, exitCode: built.exitCode };
    report.cases.push(record);
    if (item.valid) {
      assert.equal(built.exitCode, 0, built.output.slice(-3000));
      const rendered = await mainText();
      const labels = rendered.match(/\b\d+ min read\b/g) ?? [];
      assert.deepEqual(labels, item.name === 'omitted' || item.value === null ? [] : [`${item.value} min read`]);
      record.renderedLabels = labels;
      await assert.rejects(fs.stat(path.join(root, 'dist/posts/draft-planning/index.html')), { code: 'ENOENT' });
    } else {
      assert.notEqual(built.exitCode, 0, item.name);
      assert.match(built.output, /readingMinutes/);
      record.errorExcerpt = built.output.split(/\r?\n/).filter(line => /readingMinutes|Expected|Invalid|expected|invalid|integer|number/.test(line)).slice(0, 8).join('\n');
    }
    record.status = 'pass';
  }
  report.status = 'pass';
} catch (error) { report.status = 'fail'; report.error = error.stack; process.exitCode = 1; }
finally {
  await fs.writeFile(contentPath, original);
  report.sourceRestored = (await fs.readFile(contentPath, 'utf8')) === original;
  const final = build(); report.finalBuildExitCode = final.exitCode;
  if (final.exitCode !== 0) { process.exitCode = 1; report.status = 'fail'; report.finalBuildError = final.output.slice(-3000); }
  await fs.mkdir(path.dirname(output), { recursive: true });
  await fs.writeFile(output, JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify({ status: report.status, cases: report.cases.length, sourceRestored: report.sourceRestored, finalBuildExitCode: final.exitCode, error: report.error }));
}
