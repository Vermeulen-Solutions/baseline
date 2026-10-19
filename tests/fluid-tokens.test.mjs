import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import {
  AESTHETIC_LANES, TYPE_SCALE_RATIOS, applyTokenOverrides, auditDesignTokens,
  buildFluidClamp, diagnoseFluidToken, evaluateFluidClamp, generateSpaceScale,
  generateTypeScale, parseFluidClamp, validateClampToken,
} from '../scripts/design-system.mjs';

const close = (actual, expected, tolerance = 0.002) => assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} != ${expected} (tolerance ${tolerance})`);
const digest = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');

test('generator preserves previously emitted scales and authored lane values', () => {
  // Captured independently from the Phase 5 source, before mathematical hardening.
  assert.equal(digest({
    type: Object.keys(TYPE_SCALE_RATIOS).map(ratio => generateTypeScale({ ratio })),
    space: [1.25, 1.5, 2.2].map(ratio => generateSpaceScale({ ratio })),
  }), '9c49768d6ed034d7aa9d2c43b8b9de051b20cd92255c2ae7efae44f6002a6cd8');
  assert.equal(digest(AESTHETIC_LANES), 'd754fbdb6cfcf1c7f82352c69364a11ab53540a17cca5e2a30384e254f1ce535');
});

test('independent five-point interpolation, clamping and changed root font sizes', () => {
  const clamp = buildFluidClamp(1, 2);
  for (const rootFontPx of [16, 20, 32]) {
    // Expected sizes come from the requested endpoints, not the parsed affine coefficients.
    for (const [viewportRem, sizeRem] of [[10, 1], [20, 1], [50, 1.5], [80, 2], [100, 2]]) {
      close(evaluateFluidClamp(clamp, { viewportSizePx: viewportRem * rootFontPx, rootFontPx }), sizeRem * rootFontPx, 0.004);
    }
  }
});

test('Utopia comparison example matches independent endpoints after four-place rounding', () => {
  // https://utopia.fyi/blog/clamp/: 1rem..2rem across 320..1440px at a 16px root.
  // Keep logical vi in Baseline; the source example uses vw.
  const clamp = buildFluidClamp(1, 2, 20, 90);
  assert.equal(clamp, 'clamp(1rem, calc(0.7143rem + 1.4286vi), 2rem)');
  for (const [viewportSizePx, sizePx] of [[160, 16], [320, 16], [880, 24], [1440, 32], [1800, 32]]) {
    close(evaluateFluidClamp(clamp, { viewportSizePx }), sizePx);
  }
});

test('all generated scales interpolate requested bounds monotonically within rounding error', () => {
  const scales = [
    ...Object.keys(TYPE_SCALE_RATIOS).map(ratio => generateTypeScale({ ratio })),
    ...[1.25, 1.5, 2.2].map(ratio => generateSpaceScale({ ratio })),
  ];
  for (const scale of scales) for (const value of Object.values(scale)) {
    assert.match(value, /vi/);
    const { minRem, maxRem } = parseFluidClamp(value);
    let previous = 0;
    for (let viewportRem = 0; viewportRem <= 100; viewportRem += 2.5) {
      const actual = evaluateFluidClamp(value, { viewportSizePx: viewportRem * 16 }) / 16;
      const fraction = Math.max(0, Math.min(1, (viewportRem - 20) / 60));
      const expected = minRem + (maxRem - minRem) * fraction;
      // Independent rounding bound: intercept <= .00005rem, slope <= .00005 per 100vi.
      close(actual, expected, 0.00005 * (1 + viewportRem / 100) + 1e-12);
      assert.ok(actual >= previous && actual >= minRem && actual <= maxRem);
      previous = actual;
    }
  }
});

test('authored presets retain their own transition domains and diagnostic samples', () => {
  const css = readFileSync('src/styles/global.css', 'utf8');
  for (const lane of Object.keys(AESTHETIC_LANES)) {
    const audit = auditDesignTokens(applyTokenOverrides(css, lane));
    assert.equal(audit.valid, true, audit.errors.join('\n'));
    assert.equal(audit.fluid.tokens.length, 12);
    for (const token of audit.fluid.tokens) {
      assert.equal(token.unit, 'vi');
      let previous = 0;
      for (const sample of token.samples) {
        assert.ok(sample.sizeRem >= previous && sample.sizeRem >= token.minRem && sample.sizeRem <= token.maxRem);
        previous = sample.sizeRem;
      }
      if (token.transitionRem && token.transitionRem.min >= 0) {
        close(evaluateFluidClamp(audit.tokens.theme[token.name], { viewportSizePx: token.transitionRem.min * 16 }), token.minRem * 16);
        close(evaluateFluidClamp(audit.tokens.theme[token.name], { viewportSizePx: token.transitionRem.max * 16 }), token.maxRem * 16);
      }
    }
  }
  const authored = diagnoseFluidToken('--spacing-example', 'clamp(3rem, calc(1rem + 9.5vi), 8.75rem)');
  close(authored.transitionRem.min, 400 / 19, 1e-10);
  close(authored.transitionRem.max, 1550 / 19, 1e-10);
  assert.deepEqual(authored.advisories, []);
});

test('bounded grammar accepts negative intercepts, finite exponents and legacy viewport expressions', () => {
  for (const value of [
    'clamp(.75rem, calc(-.3333rem + 5.4167vi), 4rem)',
    'clamp(1rem, 5vi, 3rem)',
    'clamp(1rem, .5rem + 2.5vw, 3rem)',
    'CLAMP(1e0rem, CALC(+.5rem + 2.5e0VI), 3rem)',
    'clamp(1rem, calc(1rem + 0vi), 1rem)',
  ]) assert.equal(validateClampToken('--text-step-0', value), null, value);
  assert.equal(parseFluidClamp(buildFluidClamp(1, 1)).transitionRem, null);
  assert.ok(diagnoseFluidToken('--text-step-0', 'clamp(1rem, 5vw, 3rem)').advisories.some(text => text.includes('Legacy vw')));
});

test('invalid CSS, nonfinite math, contextless cqi and descending or flat varying scales fail closed', () => {
  const invalid = [
    'clamp(1..2rem, 5vi, 3rem)', 'clamp(.rem, 5vi, 3rem)',
    'clamp(1rem, calc(1rem+2vi), 3rem)', 'clamp(1rem, calc(1rem + -2vi), 3rem)',
    'clamp(1rem, calc(1rem + 2vi) garbage, 3rem)', 'clamp(1rem, calc(1rem + 2vi + 1px), 3rem)',
    'clamp(1rem, invalidvi, 3rem)', 'clamp(1rem, var(--vi), 3rem)',
    'clamp(1rem, calc(Infinity * 1vi), 3rem)', 'clamp(1rem, calc(NaN * 1vi), 3rem)',
    'clamp(1rem, calc(1rem + 1e309vi), 3rem)', 'clamp(1rem, 5vi, 1e309rem)',
    'clamp(1rem, calc(1e308rem + 5e-324vi), 3rem)',
    'clamp(0rem, 5vi, 3rem)', 'clamp(3rem, 5vi, 1rem)',
    'clamp(1rem, calc(3rem - 2vi), 3rem)', 'clamp(1rem, calc(1rem + 0vi), 3rem)',
    'clamp(1rem, 5cqi, 3rem)', 'clamp(1rem, calc(1rem + 2cqi /* vi */), 3rem)',
  ];
  for (const value of invalid) {
    assert.throws(() => parseFluidClamp(value), undefined, value);
    assert.match(validateClampToken('--text-step-0', value), /Token --text-step-0:/, value);
  }
  const css = readFileSync('src/styles/global.css', 'utf8');
  assert.equal(auditDesignTokens(applyTokenOverrides(css, { theme: { '--text-step-0': invalid[4] } })).valid, false);
});

test('generator rejects invalid domains and nonrepresentable coefficients before emitting CSS', () => {
  for (const args of [
    [NaN, 2], [1, Infinity], [1, 2, 20, 20], [1, 2, 80, 20], [1, 2, -1, 80],
    [1, 2, 20, Infinity], [1, 2, NaN, 80], [2, 1], [0.000001, 1],
    [1, 2, 0, 5e-324], [1, 2, 0, 1e100], ['1', 2],
  ]) assert.throws(() => buildFluidClamp(...args), undefined, JSON.stringify(args));
  assert.throws(() => generateTypeScale({ baseMinRem: 2, baseMaxRem: 1 }));
  assert.throws(() => generateSpaceScale({ baseMinRem: 2, baseMaxRem: 1 }));
  // Existing ratio range is not a promise that every base-size/ratio combination is ascending.
  assert.throws(() => generateSpaceScale({ ratio: 1.15 }), /bounds/);
});

test('viewport shrink and changed root sizes are advisory, with no false accessibility certification', () => {
  const value = 'clamp(1rem, calc(.5rem + 2.5vi), 3rem)';
  const diagnostic = diagnoseFluidToken('--text-step-0', value);
  assert.deepEqual(diagnostic.rootFontSamples, [{ rootFontPx: 16, sizePx: 40 }, { rootFontPx: 20, sizePx: 42 }, { rootFontPx: 32, sizePx: 48 }]);
  assert.deepEqual(diagnostic.zoom, [{ factor: 2, cssViewportPx: 640, effectiveSizeRatio: 1.2 }, { factor: 4, cssViewportPx: 320, effectiveSizeRatio: 1.6 }]);
  assert.match(diagnostic.advisories[0], /not a WCAG verdict/);
  assert.deepEqual(diagnoseFluidToken('--spacing-grid', value).advisories, []);
  const css = readFileSync('src/styles/global.css', 'utf8');
  assert.equal(auditDesignTokens(css).valid, true);
  assert.ok(auditDesignTokens(css).fluid.tokens.some(token => token.advisories.length));
});

test('evaluator rejects nonfinite environments and arithmetic overflow', () => {
  const value = buildFluidClamp(1, 2);
  for (const environment of [{}, { viewportSizePx: NaN }, { viewportSizePx: -1 }, { viewportSizePx: Infinity }, { viewportSizePx: 320, rootFontPx: 0 }, { viewportSizePx: 320, rootFontPx: Infinity }]) {
    assert.throws(() => evaluateFluidClamp(value, environment));
  }
  assert.throws(() => evaluateFluidClamp('clamp(1e308rem, 5vi, 1e308rem)', { viewportSizePx: 320 }), /overflow/);
});
