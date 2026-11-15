import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { findBrokenLinks, markdownAnchors, LINK_TARGETS, LINK_SKIP } from '../scripts/check-docs-format.mjs';

test('heading anchors follow GitHub slugs, including duplicates, formatting and explicit ids', () => {
  const anchors = markdownAnchors('# Start here\n\n## Stage 4.5: `/_styleguide` & tokens\n\n## Start here\n\n<a id="Custom-Anchor"></a>\n\n```md\n## Not a heading\n```\n');
  assert.deepEqual([...anchors].sort(), ['custom-anchor', 'stage-45-_styleguide--tokens', 'start-here', 'start-here-1']);
});

test('missing files and missing headings are reported; code fences, URLs and skipped trees are not', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'baseline-docs-links-'));
  try {
    fs.mkdirSync(path.join(root, 'mirror'));
    fs.writeFileSync(path.join(root, 'a.md'), [
      '[ok](b.md#real-heading) [same page](#here) [web](https://example.com/x#y)',
      '[gone](missing.md) [bad anchor](b.md#nope) [bad local](#absent)',
      '```',
      '[in code](missing-too.md)',
      '```',
      '## Here',
    ].join('\n'));
    fs.writeFileSync(path.join(root, 'b.md'), '## Real heading\n');
    fs.writeFileSync(path.join(root, 'mirror', 'c.md'), '[gone](nowhere.md)\n');
    const broken = findBrokenLinks([root], { skip: [path.join(root, 'mirror').split(path.sep).join('/') + '/'] }).map(item => item.replace(/^.*:(\d+) -> /, '$1 '));
    assert.deepEqual(broken, ['2 missing.md', '2 b.md#nope (no such heading)', '2 #absent (no such heading)']);
  } finally {
    assert.equal(path.dirname(root), path.resolve(os.tmpdir()));
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('repository documents and maintained skills have no broken relative links', () => {
  assert.deepEqual(findBrokenLinks(LINK_TARGETS, { skip: LINK_SKIP }), []);
});
