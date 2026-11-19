import test from 'node:test';
import assert from 'node:assert/strict';
import { validateReferences, REFERENCE_BAR } from '../scripts/check-art-direction.mjs';

// Portable: synthetic references files only. The scorecard order is first screen, specificity,
// type, photographs, composition, craft, phone, fit.
const row = (id, source, kind, scores, verdict) => `| ${id} | ${source} | ${kind} | ${scores.join(' | ')} | ${scores.reduce((a, b) => a + b, 0)} | ${verdict} |`;
const strong = [3, 3, 2, 3, 2, 3, 2, 3]; // 21
const good = [2, 2, 3, 2, 2, 2, 3, 2]; // 18
const weak = [1, 1, 1, 2, 1, 2, 2, 1]; // 11

function file({ candidates, concepts, selectedSections = ['a', 'b', 'c'], searches = '"furniture maker workshop site", "stone carver portfolio", "woodworker studio"' } = {}) {
  const header = '| id | source | kind | first screen | specificity | type | photographs | composition | craft | phone | fit | total | verdict |\n|---|---|---|---|---|---|---|---|---|---|---|---|---|';
  const list = candidates ?? [
    row('a', 'https://maker-one.test', 'site', strong, 'selected'),
    row('b', 'https://maker-two.test', 'site', good, 'selected'),
    row('c', 'https://prompts.test/warm-editorial', 'prompt', good, 'selected'),
    row('d', 'https://maker-three.test', 'site', weak, 'rejected: kicker and split hero on every section'),
    row('e', 'https://maker-four.test', 'site', weak, 'rejected: stock photographs'),
    row('f', 'https://maker-five.test', 'site', weak, 'rejected: page builder theme'),
    row('g', 'https://museum.test/wood', 'site', [2, 2, 2, 2, 2, 2, 1, 1], 'rejected: fit, a museum not a maker'),
    row('h', 'https://maker-six.test', 'site', weak, 'rejected: broken on a phone'),
  ];
  const conceptHeader = '| concept | first screen | specificity | type | photographs | composition | craft | phone | fit | total | verdict |\n|---|---|---|---|---|---|---|---|---|---|---|';
  const conceptRows = concepts ?? [
    `| A | ${good.join(' | ')} | 18 | chosen |`,
    `| B | ${weak.join(' | ')} | 11 | not chosen |`,
  ];
  const sections = selectedSections.map(id => `#### ${id} — source\n- **Captured:** audit/references/${id}/\n- **Idea we take:** the work at full width, then a dated register\n- **What we refuse:** its grey sans-serif labels`).join('\n\n');
  return `## Reference research\n- **Brief:** a furniture maker who builds tables from local oak\n- **Searches:** ${searches}\n- **Judged by:** a reviewer sub-agent given only the screenshots and this card\n\n### Candidates\n${header}\n${list.join('\n')}\n\n### Selected\n${sections}\n\n### Concepts against the bar\n${conceptHeader}\n${conceptRows.join('\n')}\n`;
}
const images = (count) => ({ capturedImages: () => count });

test('a complete, judged record passes', () => {
  assert.deepEqual(validateReferences(file(), images(2)), []);
});

test('too few candidates, too few real sites, no prompt or template, too few searches', () => {
  const few = file({ candidates: [row('a', 'https://a.test', 'site', strong, 'selected'), row('b', 'https://b.test', 'site', good, 'selected'), row('c', 'https://c.test', 'site', good, 'selected')], searches: '"one"' });
  const errors = validateReferences(few, images(2)).join('\n');
  assert.match(errors, new RegExp(`judge at least ${REFERENCE_BAR.candidates}`));
  assert.match(errors, /must be real sites/);
  assert.match(errors, /design prompt, template or system/);
  assert.match(errors, /at least 3 quoted queries/);
});

test('a selected reference must clear the bar, and totals must add up', () => {
  const list = file().replace(/\| b \| https:\/\/maker-two\.test \| site \|[^\n]+/, row('b', 'https://maker-two.test', 'site', [3, 1, 3, 3, 3, 3, 3, 1], 'selected').replace('| 20 |', '| 19 |'));
  const errors = validateReferences(list, images(2)).join('\n');
  assert.match(errors, /total 19 should be 20/);
  assert.match(errors, /selected with specificity 1/);
  assert.match(errors, /selected with fit 1/);
});

test('every selected reference has its captures, the idea taken and what is refused', () => {
  const errors = validateReferences(file({ selectedSections: ['a', 'b'] }), images(1)).join('\n');
  assert.match(errors, /Selected c needs its own #### c section/);
  assert.match(errors, /audit\/references\/a\/ needs at least two screenshots/);
});

test('a rejected candidate gives its reason', () => {
  const errors = validateReferences(file().replace('rejected: stock photographs', 'rejected'), images(2)).join('\n');
  assert.match(errors, /Candidate e: verdict must be/);
});

test('the chosen concept reaches the selected references\' median and scores 2 or more everywhere', () => {
  const low = file({ concepts: [`| A | ${[2, 2, 2, 2, 2, 2, 2, 2].join(' | ')} | 16 | chosen |`, `| B | ${weak.join(' | ')} | 11 | not chosen |`] });
  assert.match(validateReferences(low, images(2)).join('\n'), /chosen concept scores 16\/24, under the selected references' median of 18/);
  const gap = file({ concepts: [`| A | ${[3, 3, 3, 3, 3, 3, 1, 3].join(' | ')} | 22 | chosen |`, `| B | ${weak.join(' | ')} | 11 | not chosen |`] });
  assert.match(validateReferences(gap, images(2)).join('\n'), /under 2 on phone/);
  const none = file({ concepts: [`| A | ${good.join(' | ')} | 18 | not chosen |`, `| B | ${weak.join(' | ')} | 11 | not chosen |`] });
  assert.match(validateReferences(none, images(2)).join('\n'), /exactly one concept "chosen"/);
  assert.match(validateReferences(file().replace(/### Concepts against the bar[\s\S]*$/, ''), images(2)).join('\n'), /Missing the ### Concepts against the bar table/);
});
