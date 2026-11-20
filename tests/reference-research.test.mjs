import test from 'node:test';
import assert from 'node:assert/strict';
import { validateComparison, validateReferences, COMPARISON_BAR, REFERENCE_BAR } from '../scripts/check-art-direction.mjs';

// Portable: synthetic references files only. The scorecard order is first screen, specificity,
// type, photographs, composition, craft, phone, fit.
const row = (id, source, kind, scores, verdict) => `| ${id} | ${source} | ${kind} | ${scores.join(' | ')} | ${scores.reduce((a, b) => a + b, 0)} | ${verdict} |`;
const strong = [3, 3, 2, 3, 2, 3, 2, 3]; // 21
const good = [2, 2, 3, 2, 2, 2, 3, 2]; // 18
const weak = [1, 1, 1, 2, 1, 2, 2, 1]; // 11
const madeWorld = [2, 2, 3, 2, 2, 3, 2, 2]; // 18, craft 3: a case study that shows a made world (same design total as good)

function file({ candidates, concepts, selectedSections = ['a', 'b', 'c'], searches = '"furniture maker workshop site", "stone carver portfolio", "woodworker studio"' } = {}) {
  const header = '| id | source | kind | first screen | specificity | type | photographs | composition | craft | phone | fit | total | verdict |\n|---|---|---|---|---|---|---|---|---|---|---|---|---|';
  const list = candidates ?? [
    row('a', 'https://maker-one.test', 'site', strong, 'selected'),
    row('b', 'https://maker-two.test', 'site', good, 'selected'),
    row('c', 'https://studio.test/work/market-bakery', 'study', madeWorld, 'selected'),
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

test('too few candidates, too few real sites, too few searches', () => {
  const few = file({ candidates: [row('a', 'https://a.test', 'site', strong, 'selected'), row('b', 'https://b.test', 'site', good, 'selected'), row('c', 'https://c.test', 'site', good, 'selected')], searches: '"one"' });
  const errors = validateReferences(few, images(2)).join('\n');
  assert.match(errors, new RegExp(`judge at least ${REFERENCE_BAR.candidates}`));
  assert.match(errors, /must be real sites/);
  // A prompt, template or system is a kind a candidate may have, not one the list must include.
  assert.doesNotMatch(errors, /prompt, template or system/);
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
  assert.match(validateReferences(low, images(2)).join('\n'), /chosen concept scores 14\/21 on the design lines \(photographs aside\), under the selected references' median of 16/);
  const gap = file({ concepts: [`| A | ${[3, 3, 3, 3, 3, 3, 1, 3].join(' | ')} | 22 | chosen |`, `| B | ${weak.join(' | ')} | 11 | not chosen |`] });
  assert.match(validateReferences(gap, images(2)).join('\n'), /under 2 on phone/);
  const none = file({ concepts: [`| A | ${good.join(' | ')} | 18 | not chosen |`, `| B | ${weak.join(' | ')} | 11 | not chosen |`] });
  assert.match(validateReferences(none, images(2)).join('\n'), /exactly one concept "chosen"/);
  assert.match(validateReferences(file().replace(/### Concepts against the bar[\s\S]*$/, ''), images(2)).join('\n'), /Missing the ### Concepts against the bar table/);
});

test('the concept bar leaves the photographs line out: the owner\'s camera does not hold the design down', () => {
  // References with strong photography (3) and a concept with phone photographs (1), equal elsewhere.
  const conceptScores = [2, 2, 3, 1, 2, 2, 3, 2]; // 17 in all, 16 on the design lines
  const other = `| B | ${weak.join(' | ')} | 11 | not chosen |`;
  assert.deepEqual(validateReferences(file({ concepts: [`| A | ${conceptScores.join(' | ')} | 17 | chosen |`, other] }), images(2)), []);
  const weakType = [2, 2, 1, 3, 2, 2, 3, 2];
  assert.match(validateReferences(file({ concepts: [`| A | ${weakType.join(' | ')} | 17 | chosen |`, other] }), images(2)).join('\n'), /under 2 on type/);
});

test('a real site at craft 3 sets the level, whether or not it is a studio case study', () => {
  // a scores craft 3 as a plain site; no case study is needed.
  const noStudy = file().replace('| c | https://studio.test/work/market-bakery | study |', '| c | https://maker-seven.test | site |');
  assert.deepEqual(validateReferences(noStudy, images(2)), []);
  // A source may carry a note after its URL.
  assert.deepEqual(validateReferences(file().replace('| c | https://studio.test/work/market-bakery |', '| c | https://studio.test/work/market-bakery (case study by a small studio) |'), images(2)), []);
});

test('one selected real site shows a made world: craft 3, not only quiet well-set sites', () => {
  const quietA = [3, 3, 2, 3, 3, 2, 2, 3]; // 21, craft 2
  const quiet = file()
    .replace(/\| a \| https:\/\/maker-one\.test \| site \|[^\n]+/, row('a', 'https://maker-one.test', 'site', quietA, 'selected'))
    .replace(/\| c \| https:\/\/studio\.test\/work\/market-bakery \| study \|[^\n]+/, row('c', 'https://studio.test/work/market-bakery', 'study', good, 'selected'));
  assert.match(validateReferences(quiet, images(2)).join('\n'), new RegExp(`at least one real site that scores ${REFERENCE_BAR.studyCraft} on craft`));
});

const comparison = (rows) => `### Built against the references\n| page | round | sheet | the references do | we built |\n|---|---|---|---|---|\n${rows.join('\n')}\n`;
const addition = (page, round, n) => `| ${page} | ${round} | audit/compare/home-1440.jpg | reference ${n} sets its works as numbered plates on a wall | the register as plates hung on a ruled board |`;

test('each compared page builds the five biggest differences in its first round', () => {
  const exists = { exists: (file) => file === 'audit/compare/home-1440.jpg' };
  assert.deepEqual(validateComparison(comparison([1, 2, 3, 4, 5].map((n) => addition('/', 1, n))), exists), []);
  assert.match(validateComparison(comparison([1, 2].map((n) => addition('/', 1, n))), exists).join('\n'), new RegExp(`round 1 builds 2 additions; build the ${COMPARISON_BAR.additions} biggest`));
  assert.match(validateComparison(comparison([addition('/', 3, 1)]), exists).join('\n'), /round must be 1 or 2/);
  assert.match(validateComparison(comparison([addition('/', 1, 1).replace('home-1440', 'missing')]), exists).join('\n'), /the sheet audit\/compare\/missing\.jpg does not exist/);
  assert.match(validateComparison(comparison(['| / | 1 | audit/compare/home-1440.jpg | TBD | more |']), exists).join('\n'), /"the references do" needs a concrete description/);
  assert.match(validateComparison('## Nothing here', exists).join('\n'), /Missing the ### Built against the references table/);
});

test('after three scored rounds, a concept within two points of the bar may stand with a recorded gap', () => {
  // Bar: the selected references' median on the design lines is 16. This concept is 14 there.
  const close = [2, 2, 2, 3, 2, 2, 2, 2];
  const rounds = [`| A | ${close.join(' | ')} | 17 | chosen |`, `| A2 | ${weak.join(' | ')} | 11 | not chosen |`, `| A3 | ${weak.join(' | ')} | 11 | not chosen |`];
  const gap = '\n### Gap to the bar\n- Every reviewer names the stand-in photographs: they do not read as one shoot of this house. The commissioned shoot closes it.\n';
  assert.deepEqual(validateReferences(file({ concepts: rounds }) + gap, images(2)), []);
  assert.match(validateReferences(file({ concepts: rounds }), images(2)).join('\n'), /### Gap to the bar section/);
  assert.match(validateReferences(file({ concepts: rounds.slice(0, 2) }) + gap, images(2)).join('\n'), /under the selected references' median of 16/);
  const low = [2, 2, 2, 3, 2, 2, 1, 2]; // 13 on the design lines: three under, and phone under 2
  assert.match(validateReferences(file({ concepts: [`| A | ${low.join(' | ')} | 16 | chosen |`, ...rounds.slice(1)] }) + gap, images(2)).join('\n'), /under the selected references' median of 16/);
});

test('a concept verdict may carry its reason after a colon, like a candidate verdict', () => {
  assert.deepEqual(validateReferences(file().replace('| 18 | chosen |', '| 18 | chosen: the strongest idea, built as the pages |'), images(2)), []);
});
