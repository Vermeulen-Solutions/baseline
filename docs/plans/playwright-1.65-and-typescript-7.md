# Plan: Playwright 1.65 and TypeScript 7

Both updates were left out of standards 0.2.0 on 2026-11-16, which adopted every other non-major update that `check:upstream` reported. Each one changes something the certification pins, so each gets its own change and its own evidence.

## Playwright 1.64.1 → 1.65.1

**Done 2026-11-16** as standards 0.2.1; evidence in `audit/visual-renderer-2026-11-16/README.md`.

**What changes.** Playwright 1.65.1 bundles Chromium revision 1255 (Chromium 159). The visual contract pins revision 1248 (Chromium 156), and every reference image under `tests/visual/baselines/win32` was rendered by it. A new Chromium can move text rendering, antialiasing and layout by a pixel, and the comparison allows zero different pixels, so the reference images have to be renewed and reviewed, not just re-run.

**When.** Ready now: nothing upstream blocks it. Do it as its own change, after 0.2.0 is published, so a renderer difference is never mixed with a framework difference.

**Steps.**

1. On Windows with the CI pin (Node 24.22.3), install `@playwright/test@1.65.1` exactly, then `npx playwright install chromium`.
2. Update `tests/visual/contract.mjs` (`playwright`, `chromiumRevision`) and the version guard in `scripts/test-visual.mjs`.
3. Run `npm run test:visual` once on the old reference images and keep the diff report: it shows what the new Chromium changes before anything is renewed.
4. Run `npm run test:visual -- --update`, then review every changed PNG against the old one. Accept only renderer differences (glyph edges, subpixel positions); a layout or content change means a real regression to fix first.
5. Prove the new references: `npm run test:visual -- --repeat=3` (no flakes), `test:visual:sensitivity` (a deliberate change is still detected), `test:visual:functional`, `check:visual-cleanup`, and the editor rehearsal.
6. Release it as standards `0.2.1`: the manifest's `browser` block and the `visual-regression` check record the new versions, with a short note in `standards/releases/0.2.1.md` listing the reviewed image changes.

**Risk.** Low for sites: Playwright is a development dependency and the visual suite is local-only. The cost is the review in step 4.

## TypeScript 6.0.3 → 7.0.2

**What changes.** A major version. `npm run typecheck` runs `astro check`, so TypeScript 7 also has to be accepted by the Astro language tooling and by the lint parser.

**Blocked upstream.** As of 2026-11-16, `@astrojs/check` 0.9.12 accepts `typescript` `^5.0.0 || ^6.0.0`, and `@typescript-eslint/parser` 8.72.2 accepts `>=4.8.4 <6.1.0`. Installing TypeScript 7 today would put both outside their supported range.

**Steps.**

1. Watch `check:upstream` (it already reports TypeScript 7) and the two packages above. Start only when both declare TypeScript 7 support in a release.
2. On a branch: install the supporting `@astrojs/check`, `@typescript-eslint/parser` and `typescript@7` versions exactly; run `npm run typecheck`, `npm run lint` and `npm run verify` on the Node engine minimum and on the CI pin.
3. Read the TypeScript 7 breaking changes against `tsconfig.json` and `emdash-env.d.ts`; fix new errors in source rather than loosening compiler options.
4. Check that generated sites still pass: `npm run test:profiles`.
5. TypeScript is development-only and does not change built output, so this needs a normal verified release, not a new standards baseline, unless the type checks find a defect in shipped source.

**Risk.** Medium: new strictness can surface errors in starter code and in client sites that copy it. Sites adopt it only through the reviewed update path.
