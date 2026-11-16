# Visual renderer update for standards 0.2.1 (2026-11-16)

Source commit `983317274020826bf8dffd2b3c64ca24d576366e` (tree `3069417dd4bcce6d410b08f4fec3f921ff4a73a0`). It changes only `@playwright/test` (1.64.1 → 1.65.1), the visual contract, the `test:visual` version guard and the Windows reference images. Application source and every other dependency are unchanged from standards 0.2.0, so its framework evidence ([audit/certification-2026-11-16](../certification-2026-11-16/README.md)) still applies.

Environment: Windows x64, Node 24.22.3, Playwright 1.65.1, Chromium revision 1255 (Chromium 159.0.8154.6), pinned Noto Sans.

## Before renewing

`npm run test:visual` against the 1248 references stopped at the configured three failures, all screenshot comparisons with 17 to 23 differing pixels (`styleguide-no-js`, `text-spacing-320`, the 390 px styleguide capture). No behaviour assertion failed.

## Renewal and review

`npm run test:visual -- --update` rendered 105 tests and rewrote all 57 Windows reference images and their manifest. Each new image was compared with the committed one, pixel by pixel:

| Measure | Result |
| --- | --- |
| Images changed | 57 of 57 |
| Images with a different size | 0 |
| Largest change of any single pixel | 77 of 255 |
| Largest share of changed pixels in one image | 4.1% (`chromium-390/composition-open.png`) |
| Images by largest change | 25 up to 20; 14 from 21 to 60; 18 from 61 to 77 |

A moved element would redraw dark text over a light background, a change near 200 of 255 per pixel. No pixel came near that, so nothing in any capture moved. The largest diffs (the styleguide at 390 px, `composition-open` at 390 px, `zoom-200` at 1440 px) were inspected side by side as old, new and highlighted changes: wrapping, spacing, the right-to-left text and the long unbroken identifiers are identical, and the changes sit on glyph and border edges, which is Chromium 159's anti-aliasing.

## Proof on the new references

| Run | Result |
| --- | --- |
| `npm run test:visual -- --repeat=3` | 336 passed, none flaky (18.0 min) |
| `npm run test:visual:sensitivity` | 10 passed: deliberate changes are still detected |
| `npm run test:visual:functional` | 62 passed |
| `npm run check:visual-cleanup` | pass |
| `node tests/visual/editor-rehearsal.mjs` | pass |
| `npm run verify` | pass (464 unit, 165 rehearsal, typecheck clean) |
