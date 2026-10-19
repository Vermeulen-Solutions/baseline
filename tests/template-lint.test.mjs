import test from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { ESLint } from 'eslint';

const cwd = fileURLToPath(new URL('../', import.meta.url));
const eslint = new ESLint({ cwd });
// Virtual input exercises the real project config without racing source inventory tests.
const lint = async source => (await eslint.lintText(source, { filePath: 'src/components/AccessibilityProbe.astro' }))[0];

for (const [name, source, rule] of [
  ['image alternative', '<img src="/example.svg" />', 'alt-text'],
  ['ARIA value', '<button aria-expanded="perhaps">Open</button>', 'aria-proptypes'],
  ['keyboard interaction', '<div onclick={() => {}}>Open</div>', 'click-events-have-key-events'],
  ['label control association', '<label>Name</label>', 'label-has-associated-control'],
  ['real link destination', '<a href="#">More</a>', 'anchor-is-valid'],
  ['natural tab order', '<button tabindex="2">Open</button>', 'tabindex-no-positive'],
  ['unreviewed autofocus', '<input aria-label="Name" autofocus />', 'no-autofocus'],
  ['known image component alternative', '<ResponsiveImage src="/example.svg" />', 'alt-text'],
]) {
  test(`template gate rejects missing/invalid ${name}`, async () => {
    const result = await lint(source);
    assert.ok(result.messages.some(m => m.severity === 2 && m.ruleId === `astro/jsx-a11y/${rule}`), JSON.stringify(result.messages));
  });
}

test('template gate accepts typed frontmatter, slots, native disclosure and labelled fields', async () => {
  const result = await lint(`---
interface Props { id: string; }
const { id } = Astro.props;
---
<section aria-labelledby={id}>
  <h2 id={id}><slot name="heading" /></h2>
  <details><summary>Details</summary><slot /></details>
  <label for="name">Name</label><input id="name" name="name" />
  <ResponsiveImage src="/example.svg" alt="Example diagram" />
</section>`);
  assert.equal(result.errorCount, 0, JSON.stringify(result.messages));
  assert.equal(result.warningCount, 0, JSON.stringify(result.messages));
});

test('line exceptions stay narrow and become errors when obsolete', async () => {
  const directive = '{/* eslint-disable-next-line astro/jsx-a11y/no-autofocus -- deliberate server-error focus */}';
  assert.equal((await lint(`${directive}\n<input autofocus aria-label="Name" />`)).errorCount, 0);
  const obsolete = await lint(`${directive}\n<input aria-label="Name" />`);
  assert.ok(obsolete.messages.some(m => m.severity === 2 && /Unused eslint-disable directive/.test(m.message)));
  const nextLine = await lint(`${directive}\n<input autofocus aria-label="Name" />\n<input autofocus aria-label="Email" />`);
  assert.ok(nextLine.messages.some(m => m.ruleId === 'astro/jsx-a11y/no-autofocus' && m.line === 3));
});
