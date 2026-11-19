import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { checkMarkdown, checkTree, DEBT_FILE } from '../scripts/check-skill-wording.mjs';

const rules = (findings) => findings.map((f) => `${f.rule}:${f.match.toLowerCase()}`);

test('a branch settled by the agent\'s judgment is reported; a branch on a fact is not', () => {
  const findings = checkMarkdown('x.md', [
    'Add an inner page when useful.',
    'Score with two reviewers when possible, ideally three.',
    'Run the check if needed.',
    'Add the works page when the home page shows fewer than three works.',
    'Use the connected Refero tool when it is connected.',
  ].join('\n'));
  assert.deepEqual(rules(findings), ['judgment-branch:when useful', 'judgment-branch:when possible', 'judgment-branch:ideally', 'judgment-branch:if needed']);
  assert.deepEqual(findings.map((f) => f.line), [1, 2, 2, 3]);
});

test('code, frontmatter, comments and marked lines are not read', () => {
  const findings = checkMarkdown('x.md', [
    '---',
    'description: Use it when possible.',
    '---',
    'Never write `when possible` in a skill.',
    '```',
    'when possible',
    '```',
    'Keep the phrase "where practical" <!-- wording-ok: quoted from the owner\'s brief -->',
    '<!-- when needed -->',
  ].join('\n'));
  assert.deepEqual(findings, []);
});

test('capitalised commands are reported; plain ones are not', () => {
  const findings = checkMarkdown('x.md', 'Slugs MUST stay ASCII. Editors must NEVER see raw JSON. Keep it IMPORTANT? No, it must stay plain.');
  assert.deepEqual(rules(findings), ['shouting:must', 'shouting:never', 'shouting:important']);
});

test('a SKILL.md is held to its length and a third-person description', () => {
  const body = (description, lines = 3) => `---\nname: demo\ndescription: ${description}\n---\n${'line\n'.repeat(lines)}`;
  assert.deepEqual(checkMarkdown('a/SKILL.md', body('Builds the site from the brief. Use when starting a new site.')), []);
  assert.deepEqual(rules(checkMarkdown('a/SKILL.md', body('I build the site.'))), ['description:i build the']);
  assert.deepEqual(rules(checkMarkdown('a/SKILL.md', body('You can use this to build.'))), ['description:you can use']);
  assert.deepEqual(rules(checkMarkdown('a/SKILL.md', '# No frontmatter\n')), ['description:missing']);
  assert.deepEqual(rules(checkMarkdown('a/SKILL.md', body('Builds things.', 520))), ['skill-length:524 lines']);
  assert.deepEqual(checkMarkdown('a/references/long.md', body('Builds things.', 520)), [], 'the length rule is for SKILL.md');
});

test('the tree check reads owned skills and instructions, skips vendored and upstream files, and holds debt to the line', () => {
  const root = mkdtempSync(join(tmpdir(), 'skill-wording-'));
  try {
    const write = (file, text) => { mkdirSync(join(root, file, '..'), { recursive: true }); writeFileSync(join(root, file), text); };
    const skill = (description) => `---\nname: x\ndescription: ${description}\n---\n`;
    write('.agents/skills/own/SKILL.md', skill('Does a thing.') + 'Run it when useful.\n');
    write('.agents/skills/own/references/step.md', 'Capture the page if needed.\n');
    write('.agents/skills/own/references/upstream/vendor.md', 'Feel free to skip this.\n');
    write('.agents/skills/own/assets/template.md', 'Fill in as appropriate.\n');
    write('.agents/skills/impeccable/SKILL.md', skill('I am vendored.') + 'ALWAYS do this when possible.\n');
    write('AGENTS.md', 'Read the brief where relevant.\n');

    const all = checkTree(root);
    assert.deepEqual(all.findings.map((f) => `${f.file}:${f.match}`).sort(), [
      '.agents/skills/own/SKILL.md:when useful',
      '.agents/skills/own/references/step.md:if needed',
      'AGENTS.md:where relevant',
    ]);

    // Recorded debt passes; a new finding does not; an entry that no longer matches is stale.
    const debt = all.findings.filter((f) => f.file !== 'AGENTS.md');
    const withDebt = checkTree(root, debt);
    assert.equal(withDebt.known.length, 2);
    assert.deepEqual(withDebt.fresh.map((f) => f.file), ['AGENTS.md']);
    assert.deepEqual(withDebt.stale, []);

    // Touching a line with debt on it brings the finding back: the rewrite is due.
    write('.agents/skills/own/references/step.md', 'Capture the page at 390 if needed.\n');
    const touched = checkTree(root, debt);
    assert.deepEqual(touched.fresh.map((f) => f.file).sort(), ['.agents/skills/own/references/step.md', 'AGENTS.md']);
    assert.equal(touched.stale.length, 1);

    // Fixing it leaves only the stale entry, which must then be removed.
    write('.agents/skills/own/references/step.md', 'Capture the page at 390 and 1440.\n');
    const fixed = checkTree(root, debt);
    assert.equal(fixed.stale.length, 1);
    assert.ok(fixed.stale[0].startsWith('.agents/skills/own/references/step.md|judgment-branch|if needed|'));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('Baseline\'s own skills have no new findings and no stale debt', () => {
  const debt = JSON.parse(readFileSync(DEBT_FILE, 'utf8')).entries;
  const result = checkTree(process.cwd(), debt);
  assert.deepEqual(result.fresh.map((f) => `${f.file}:${f.line} ${f.match}`), []);
  assert.deepEqual(result.stale, []);
});
