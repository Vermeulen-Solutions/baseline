import assert from 'node:assert/strict';
import test from 'node:test';
import { MAX_SCREENS, QUESTIONS, SCREENS, assessLook, parseArgs, parseLook, renderLook, screenTops, sheetsOf, slugOf } from '../scripts/design-look.mjs';

test('arguments: pages, widths, the output folder and the check', () => {
  const options = parseArgs(['--base', 'http://127.0.0.1:4321/', '--routes', '/,/programme/', '--widths', '390,768,1440', '--out', 'audit/look']);
  assert.equal(options.base, 'http://127.0.0.1:4321');
  assert.deepEqual(options.routes, ['/', '/programme/']);
  // Only the two widths a look is made at.
  assert.deepEqual(options.widths, [390, 1440]);
  assert.equal(parseArgs(['--check', '--src', 'src']).check, true);
  // Git Bash rewrites "/" and "/programme/" into paths under its install folder: the routes are put back.
  assert.deepEqual(parseArgs(['--routes', 'C:/Program Files/Git/,C:/Program Files/Git/programme/']).routes, ['/', '/programme/']);
  assert.throws(() => parseArgs(['--nope']), /Unknown argument/);
  assert.equal(slugOf('/'), 'home');
  assert.equal(slugOf('/la-carte/'), 'la-carte');
  assert.equal(slugOf('/a/b'), 'a-b');
});

test('a page is cut into the screens a visitor scrolls through, the last one ending at the foot', () => {
  const phone = SCREENS[390];
  assert.deepEqual(screenTops(800, phone), [0]);
  assert.deepEqual(screenTops(2000, phone), [0, 760, 1156]);
  // A very long page stops at the limit.
  assert.equal(screenTops(100000, phone).length, MAX_SCREENS);
  // Four phone screens stand side by side on a sheet, two wide screens one under the other.
  assert.deepEqual(sheetsOf(6, phone.perSheet), [[1, 2, 3, 4], [5, 6]]);
  assert.deepEqual(sheetsOf(3, SCREENS[1440].perSheet), [[1, 2], [3]]);
});

const section = { route: '/', width: 390, sheets: [[1, 2]], files: ['audit/look/home-390-1.jpg'], unchanged: [] };

test('a new look has one empty line per screen, a place for what was fixed and the six questions', () => {
  const markdown = renderLook([section], null, '2026-11-23T15:00:00.000Z');
  assert.match(markdown, /<!-- screens taken 2026-11-23T15:00:00\.000Z -->/);
  assert.match(markdown, /## \/ at 390px/);
  assert.match(markdown, /Sheet `audit\/look\/home-390-1\.jpg` \(screens 1, 2\):/);
  assert.match(markdown, /- Screen 1\. First read: … Faults: …/);
  for (const question of QUESTIONS) assert.ok(markdown.includes(`| ${question} |  |  |`));
  const look = parseLook(markdown);
  assert.deepEqual(look.sections[0].screens.map((s) => s.screen), [1, 2]);
  const problems = assessLook(markdown);
  assert.match(problems[0], /\/ at 390px: screens 1, 2 have no line yet/);
  assert.match(problems[1], /"## Score" has no score from 0 to 3 with what shows it for: Object, Feature, Phone job, Craft, Made things, One idea/);
});

const filledLook = (extra = {}) => {
  const lines = {
    one: '- Screen 1. First read: the next date, 11 DÉC. Faults: none',
    two: '- Screen 2. First read: the fête photograph. Faults: the second date card is four letters wide and its words run over the link',
    fixed: '- The date cards stack one under another below 600px.',
    score: QUESTIONS.map((q) => `| ${q} | 2 | the pennants carry the three next dates |`).join('\n'),
    lowest: 'Lowest: Craft — the cards no longer break at 390px.',
    ...extra,
  };
  return `# Look\n\n<!-- screens taken 2026-11-23T15:00:00.000Z -->\n\n## / at 390px\n\nSheet \`audit/look/home-390-1.jpg\` (screens 1, 2):\n\n${lines.one}\n${lines.two}\n\n## Fixed\n\n${lines.fixed}\n\n## Score\n\n| question | score | what on the page shows it |\n|---|---|---|\n${lines.score}\n\n${lines.lowest}\n`;
};

test('a finished look passes; a fault without an answer, a missing score and a changed site do not', () => {
  assert.deepEqual(assessLook(filledLook()), []);
  assert.match(assessLook(filledLook({ fixed: '- …' }))[0], /1 screen name a fault and "## Fixed" is empty/);
  // With no fault named, nothing has to be fixed.
  assert.deepEqual(assessLook(filledLook({ two: '- Screen 2. First read: the fête photograph. Faults: none', fixed: '- …' })), []);
  assert.match(assessLook(filledLook({ score: QUESTIONS.map((q) => `| ${q} | ${q === 'Craft' ? '' : 2} | the pennants carry the dates |`).join('\n') }))[0], /no score from 0 to 3 with what shows it for: Craft/);
  assert.match(assessLook(filledLook({ score: QUESTIONS.map((q) => `| ${q} | 5 | the pennants carry the dates |`).join('\n') }))[0], /for: Object, Feature/);
  assert.match(assessLook(filledLook({ lowest: 'Lowest: …' }))[0], /no `Lowest:` line/);
  assert.match(assessLook(filledLook(), { staleBy: 'src/pages/index.astro' })[0], /The site changed after these screens were taken \(src\/pages\/index\.astro is newer\)/);
  assert.match(assessLook('# Look\n')[0], /has no screens/);
});

test('a second look keeps the lines of the screens that did not change and empties the others', () => {
  const previous = parseLook(filledLook());
  const again = renderLook([{ ...section, unchanged: [1] }], previous, '2026-11-23T15:20:00.000Z');
  assert.match(again, /- Screen 1\. First read: the next date, 11 DÉC\. Faults: none \(unchanged since the last look\)/);
  assert.match(again, /- Screen 2\. First read: … Faults: …/);
  // What was fixed and the scores are carried over, to be brought up to date.
  assert.match(again, /- The date cards stack one under another below 600px\./);
  assert.match(again, /\| Craft \| 2 \| the pennants carry the three next dates \|/);
  const look = parseLook(again);
  assert.equal(look.sections[0].screens[0].carried, true);
  assert.match(assessLook(again)[0], /screen 2 has no line yet/);
});

test('a long page is looked at to its foot, and a page past the limit says what is left', async () => {
  const { sameScreen, MARK_SIDE } = await import('../scripts/design-look.mjs');
  const phone = SCREENS[390];
  // A phone page of 14 687px (a trial page built from a full kit) is 20 screens, the last ending at the foot.
  const tops = screenTops(14687, phone);
  assert.equal(tops.length, 20);
  assert.equal(tops.at(-1) + phone.height, 14687);
  assert.ok(MAX_SCREENS >= 36, 'a page as long as the longest reference page (about 27 700px on a phone) must fit');
  // Past the limit the section says how much is outside the look.
  const markdown = renderLook([{ ...section, beyond: 3200 }], null, '2026-11-24T12:00:00.000Z');
  assert.match(markdown, /The page goes on 3200px below screen 2, outside this look\. Open the page itself at 390px wide/);
  assert.doesNotMatch(renderLook([{ ...section, beyond: 0 }], null, '2026-11-24T12:00:00.000Z'), /outside this look/);
  assert.deepEqual(parseLook(markdown).sections[0].screens.map((s) => s.screen), [1, 2]);

  // Which screens changed: a small drawing added to one screen moves a few cells, and that is a change.
  const blank = Array.from({ length: MARK_SIDE * MARK_SIDE }, () => 20);
  assert.equal(sameScreen(blank, [...blank]), true);
  const withDial = [...blank];
  for (let row = 4; row < 12; row++) for (let col = 30; col < 35; col++) withDial[row * MARK_SIDE + col] = 28;
  assert.equal(sameScreen(withDial, blank), false);
  // Marks from an older look (another size) or no marks at all are a change.
  assert.equal(sameScreen(blank, blank.slice(0, 576)), false);
  assert.equal(sameScreen(blank, undefined), false);
});
