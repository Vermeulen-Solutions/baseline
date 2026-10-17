import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { baselineTokens } from '../src/utils/design-tweaks.mjs';

/**
 * Tokens the catalogue can write that deliberately have no authored value in global.css.
 * Consumers read these with a fallback, e.g. `filter: var(--hero-filter, none)`.
 * Every entry needs a reason: this list is the review surface for the decision.
 * A key that becomes authored, or leaves the catalogue, must fail so the entry is removed.
 */
const OPTIONAL_WRITE = new Map([
  // These five are written by createTokenMap but deliberately have no authored
  // value in global.css: the sheet reads them with a fallback, so an uncalibrated
  // site keeps its source value. Each consumer below was verified by reading it.
  ['--font-weight-display', 'Written by the "Header Weight" control (#tweak-type-weight) and createTokenMap at src/utils/design-tweaks.mjs:53; consumed as font-weight: var(--font-weight-display, 700) at src/styles/global.css:136.'],
  ['--letter-spacing-display', 'Written by the "Letter Spacing" control (#tweak-tracking) and createTokenMap at src/utils/design-tweaks.mjs:54; consumed as letter-spacing: var(--letter-spacing-display, normal) at src/styles/global.css:137.'],
  ['--hero-filter', 'Written by the hero Brightness/Contrast/Saturation controls (#tweak-hero-*) and createTokenMap at src/utils/design-tweaks.mjs:59-61; consumed as filter: var(--hero-filter, none) at src/styles/global.css:144, scoped to [data-hero-asset].'],
  ['--page-pattern', 'Written by the Surface pattern radios (Solid/Grid/Dots/Grain, name=tweak-surface) and createTokenMap at src/utils/design-tweaks.mjs:70-71; consumed as background-image: var(--page-pattern, none) at src/styles/global.css:107.'],
  ['--page-pattern-size', 'Written together with --page-pattern by the Surface pattern radios and createTokenMap at src/utils/design-tweaks.mjs:71; consumed as background-size: var(--page-pattern-size, auto) at src/styles/global.css:108.'],
]);

/**
 * Palette roles deliberately not exercised on /_styleguide.
 * Keyed by the role suffix, i.e. `focus-on-dark` for `--color-focus-on-dark`.
 * An entry that is no longer an authored role, or that gains a specimen, must fail
 * so the exemption cannot outlive the gap it was written for.
 */
const COLOR_SPECIMEN_EXEMPT = new Map([
  ['focus-on-dark', 'Authored at src/styles/global.css:33 and consumed only as the focus-ring replacement inside [data-surface="dark"] (src/styles/global.css:466). The palette section renders one swatch per specimenTokens entry (src/components/dev/Styleguide.astro:32) and no src/** markup uses data-surface, so the role has no specimen surface yet; adding that swatch is a src/** change deliberately out of scope here.'],
]);

/** Exemption reasons are reviewed decisions, so placeholders must not pass review. */
const REASON_MIN_LENGTH = 40;
const REASON_PLACEHOLDER = /todo|fixme|tbd|n\/a|placeholder/i;

/** Extract one top-level block from global.css, bounded by the next line-start `}`. */
function block(css, marker) {
  const start = css.indexOf(marker);
  assert.ok(start >= 0, `global.css must contain ${marker}`);
  const end = css.indexOf('\n}', start);
  assert.ok(end > start, `${marker} block must be closed by a line-start }`);
  return css.slice(start, end);
}

/** Custom properties declared in a block, one per declaration. */
function declared(cssBlock) {
  return [...cssBlock.matchAll(/^\s*(--[\w-]+)\s*:/gm)].map(match => match[1]);
}

/**
 * Palette roles named by specimenTokens in styleguide-fixtures.ts.
 * Parsed as text because that module imports .svg assets and cannot be loaded by Node.
 * Returns null when the array cannot be located at all.
 */
function parseSpecimenRoles(fixtures) {
  const match = fixtures.match(/export const specimenTokens = \[([^\]]*)\]/);
  if (!match) return null;
  return [...match[1].matchAll(/['"]([a-z0-9-]+)['"]/g)].map(entry => entry[1]);
}

test('catalogue, authored CSS and specimen coverage stay in step', async () => {
  const css = await readFile('src/styles/global.css', 'utf8');
  const fixtures = await readFile('src/dev/styleguide-fixtures.ts', 'utf8');

  const authoredTokens = [...new Set([
    ...declared(block(css, '@theme {')),
    ...declared(block(css, ':root {')),
  ])];
  const catalogue = new Set(baselineTokens);
  const authoredRoles = authoredTokens
    .filter(token => token.startsWith('--color-'))
    .map(token => token.replace('--color-', ''));
  const specimenRoles = parseSpecimenRoles(fixtures);
  const problems = [];

  // 1. Authored means catalogued. There is no exemption for this direction.
  for (const token of authoredTokens) {
    if (!catalogue.has(token)) {
      problems.push(`Authored token has no catalogue entry: ${token}. Add it to tokenGroups in src/utils/design-tweaks.mjs, or remove it from src/styles/global.css.`);
    }
  }

  // 2. The catalogue may only write what is authored, or a recorded optional write.
  for (const token of catalogue) {
    if (!authoredTokens.includes(token) && !OPTIONAL_WRITE.has(token)) {
      problems.push(`Catalogue entry has no authored value and no recorded exemption: ${token}. Author it in src/styles/global.css, or record it in OPTIONAL_WRITE with a reason.`);
    }
  }

  // 3. OPTIONAL_WRITE means exactly "in the catalogue and deliberately not authored".
  for (const token of OPTIONAL_WRITE.keys()) {
    if (!catalogue.has(token)) {
      problems.push(`OPTIONAL_WRITE names a token that is not in the catalogue: ${token}. Remove it from OPTIONAL_WRITE.`);
    }
    if (authoredTokens.includes(token)) {
      problems.push(`OPTIONAL_WRITE names a token that is now authored in src/styles/global.css: ${token}. Remove it from OPTIONAL_WRITE.`);
    }
  }

  // 4. Specimens may only name authored palette roles.
  if (specimenRoles === null) {
    problems.push('Could not recognise the specimenTokens array in src/dev/styleguide-fixtures.ts, so specimen coverage could not be checked. Update this guard to match that file.');
  } else if (specimenRoles.length === 0) {
    problems.push('specimenTokens in src/dev/styleguide-fixtures.ts listed no roles, so specimen coverage could not be checked. Update this guard to match that file.');
  } else {
    const specimens = new Set(specimenRoles);

    for (const role of specimens) {
      if (!authoredRoles.includes(role)) {
        problems.push(`Specimen role has no authored palette token: --color-${role}. Fix specimenTokens in src/dev/styleguide-fixtures.ts, or remove the authored token.`);
      }
    }

    // 5. Every authored palette role is exercised, or exempted with a reason.
    for (const role of authoredRoles) {
      if (!specimens.has(role) && !COLOR_SPECIMEN_EXEMPT.has(role)) {
        problems.push(`Palette role has no styleguide specimen and no recorded exemption: --color-${role}. Add it to specimenTokens in src/dev/styleguide-fixtures.ts, or record it in COLOR_SPECIMEN_EXEMPT with a reason.`);
      }
    }

    // 6. An exemption must still describe a live gap, or it blinds the check above.
    for (const role of COLOR_SPECIMEN_EXEMPT.keys()) {
      if (!authoredRoles.includes(role)) {
        problems.push(`COLOR_SPECIMEN_EXEMPT names a role that is not an authored palette token: ${role}. Remove it from COLOR_SPECIMEN_EXEMPT.`);
      } else if (specimens.has(role)) {
        problems.push(`COLOR_SPECIMEN_EXEMPT is stale because specimenTokens already covers --color-${role}. Remove it from COLOR_SPECIMEN_EXEMPT.`);
      }
    }
  }

  // 7. Exemptions are decisions, so they must carry a real reason.
  for (const [token, reason] of [...OPTIONAL_WRITE, ...COLOR_SPECIMEN_EXEMPT]) {
    const text = String(reason ?? '').trim();
    if (text.length < REASON_MIN_LENGTH || REASON_PLACEHOLDER.test(text)) {
      problems.push(`Exemption needs a real reason of at least ${REASON_MIN_LENGTH} characters and no placeholders: ${token}. Say why the gap is deliberate and cite the consumer in src/.`);
    }
  }

  assert.deepEqual(problems, [], problems.join('\n'));
});
