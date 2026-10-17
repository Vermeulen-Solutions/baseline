import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { baselineTokens, tokenDefinitions, writeOnlyTokens } from '../src/utils/design-tweaks.mjs';
import { buildCatalog, renderCatalog } from '../scripts/generate-token-catalog.mjs';

const GENERATED_FILE = 'src/utils/token-catalog.generated.mjs';
const REASON_MIN_LENGTH = 40;
const REASON_PLACEHOLDER = /todo|fixme|tbd|n\/a|placeholder/i;

/**
 * Palette roles deliberately not exercised on /_styleguide.
 * Keyed by the role suffix, i.e. `focus-on-dark` for `--color-focus-on-dark`.
 */
const COLOR_SPECIMEN_EXEMPT = new Map([
  ['focus-on-dark', 'Authored in src/styles/global.css and consumed only as the focus-ring replacement inside [data-surface="dark"]. The palette section renders one swatch per specimenTokens entry (src/components/dev/Styleguide.astro), and no src/ markup uses data-surface, so the role has no specimen surface yet.'],
]);

/** Read the palette roles the styleguide actually renders, tolerating either quote style and comments. */
async function specimenRoles() {
  const fixtures = await readFile('src/dev/styleguide-fixtures.ts', 'utf8');
  const array = fixtures.match(/export const specimenTokens = \[([^\]]*)\]/);
  assert.ok(array, 'Could not recognise the specimenTokens array in src/dev/styleguide-fixtures.ts, so specimen coverage could not be checked. Update this guard to match that file.');
  const roles = [...array[1].matchAll(/['"]([a-z0-9-]+)['"]/g)].map(match => match[1]);
  assert.ok(roles.length > 0, 'specimenTokens parsed empty from src/dev/styleguide-fixtures.ts.');
  return new Set(roles);
}

test('the generated token catalogue is current', async () => {
  const expected = renderCatalog(buildCatalog());
  const actual = (await readFile(GENERATED_FILE, 'utf8')).replace(/\r\n/g, '\n');
  assert.equal(
    actual,
    expected.replace(/\r\n/g, '\n'),
    `${GENERATED_FILE} is stale or was edited by hand. Run: npm run tokens:generate`,
  );
});

test('every authored token is addressable and every write-only token is documented', () => {
  const { authored } = buildCatalog();
  const problems = [];

  const addressable = new Set(baselineTokens);
  for (const token of authored) {
    if (!addressable.has(token)) {
      problems.push(`Authored token is missing from the catalogue: ${token}. Check the group/role rules in scripts/generate-token-catalog.mjs.`);
    }
  }

  for (const definition of tokenDefinitions) {
    if (!definition.property || definition.property.trim() === '') {
      problems.push(`Catalogued token has no CSS role: ${definition.key}, so the panel cannot validate input for it.`);
    }
  }

  const authoredSet = new Set(authored);
  for (const { token, reason } of writeOnlyTokens) {
    if (authoredSet.has(token)) {
      problems.push(`Token is listed as write-only but is now authored in src/styles/global.css: ${token}. Remove it from the writeOnly list in scripts/token-catalog-overrides.mjs.`);
    }
    if (!reason || reason.trim().length < REASON_MIN_LENGTH || REASON_PLACEHOLDER.test(reason)) {
      problems.push(`Write-only token needs a real reason of at least ${REASON_MIN_LENGTH} characters and no placeholders: ${token}. Say which control writes it and how the stylesheet consumes it.`);
    }
  }

  assert.deepEqual(problems, [], problems.join('\n'));
});

test('every palette role is exercised by a specimen or exempted with a reason', async () => {
  const { authored } = buildCatalog();
  const specimens = await specimenRoles();
  const problems = [];

  const authoredRoles = new Map(
    authored.filter(token => token.startsWith('--color-')).map(token => [token.replace('--color-', ''), token]),
  );

  for (const role of specimens) {
    if (!authoredRoles.has(role)) {
      problems.push(`Styleguide renders a palette role that is not authored in src/styles/global.css: ${role}. Remove it from specimenTokens in src/dev/styleguide-fixtures.ts.`);
    }
  }

  for (const [role, token] of authoredRoles) {
    const exempt = COLOR_SPECIMEN_EXEMPT.has(role);
    if (!specimens.has(role) && !exempt) {
      problems.push(`Palette role has no styleguide specimen: ${token}. Add it to specimenTokens in src/dev/styleguide-fixtures.ts, or record it in COLOR_SPECIMEN_EXEMPT with a reason.`);
    }
    if (specimens.has(role) && exempt) {
      problems.push(`COLOR_SPECIMEN_EXEMPT is stale because specimenTokens already covers ${token}. Remove it from the exemption list.`);
    }
  }

  for (const [role, reason] of COLOR_SPECIMEN_EXEMPT) {
    if (!authoredRoles.has(role)) {
      problems.push(`COLOR_SPECIMEN_EXEMPT names a role that is not authored in src/styles/global.css: ${role}. Remove it from the exemption list.`);
    }
    if (!reason || reason.trim().length < REASON_MIN_LENGTH || REASON_PLACEHOLDER.test(reason)) {
      problems.push(`Exemption needs a real reason of at least ${REASON_MIN_LENGTH} characters and no placeholders: ${role}. Say why the gap is deliberate and cite the consumer in src/.`);
    }
  }

  assert.deepEqual(problems, [], problems.join('\n'));
});
