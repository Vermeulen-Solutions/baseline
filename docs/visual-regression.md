# Visual regression capture and sensitivity

Use Node **24.21.0**, npm/lockfile, **@playwright/test 1.64.1**, bundled full Chromium **revision 1248** (channel chromium), locale en-US, UTC, light scheme and device scale 1. Windows is the authoritative local renderer. No Linux/Docker baseline or browser CI is required. The fixture profile uses pinned Noto Sans latin 400/700 from `@fontsource/noto-sans@5.3.0`; its [OFL license](licenses/noto-sans-OFL.txt) is retained. The profile attribute scopes font overrides; normal public pages retain their source fonts.

This starter suite certifies the stated fixture font, not operating-system font fallback. A client site must replace the renderer font contract with its actual licensed brand faces and review new baselines; the neutral override must not conceal a client typography change.

## Run and review

```sh
npm ci
npx playwright install chromium
npm run test:visual
npm run test:visual -- --repeat=3
npm run test:visual:sensitivity
```

The default command never creates/replaces goldens. Missing baselines fail. `npm run test:visual -- --update` is the only supported update path, local only. CI and raw Playwright update flags are rejected. It writes per-platform PNG candidates and a manifest after the complete update suite succeeds. A failed update can leave partial PNG changes; review the diff and complete a successful verification before accepting them. There is no automatic update based on PR input or screenshot failure.

Review full-page captures, focused state images, changed dimensions and the environment manifest together. Check source identity, lower sections, imagery, focus and reflow rather than accepting a green comparison of an existing defect. Windows baselines under `baselines/win32` are authoritative for this local suite. Keep source changes and approved baseline changes together in review. `--functional` selects browser-state tests and their comparisons; it is not a baseline bypass.

### Local-only policy

Visual tests never run automatically on git push, pull requests, production builds or deployments. Both wrapper and direct Playwright configuration reject CI/GitHub Actions execution. There is no visual GitHub job or Linux/Docker prerequisite. Install Chromium locally only; npm ci in CI does not download browsers. This preserves the account's 2,000 minute/month budget. Local visual Node 24.21.0 is a pinned renderer input; automated build/unit CI uses only Node 22.23.3 LTS.

## Built-server fixtures and readiness

Native Playwright Test owns assertions, reports, traces, workers and global teardown. Global setup copies only source/public/seed/config into an owned temporary app, links installed dependencies, creates a fresh SQLite database using supported EmDash dev setup, and then starts the real Node standalone build. No working DB, uploads, env files or CMS/cloud credentials are copied. A process-only fixed Date makes seed publication/server dates reproducible without assuming SQL tables or editing working content. Browser Date is fixed separately; animation/performance clocks continue for behavior tests.

Bootstrap verifies a clean normal build (healthy public content, styleguide GET/HEAD 404 despite runtime/query/cookie flags) before building separate `dist-fixtures`. The fixture artifact must be rejected by the release guard. Runtime specimens must contain fixture version 2; a setup/login/error page with status 200 fails identity checks. No fixture artifact is uploaded for deployment.

`tests/visual/contract.mjs` defines actual fixture routes: home, about, posts, welcome post, general category, starter tag, intentional 404 and styleguide. They render at 390×844, 768×1024 and 1440×900. Each capture verifies expected HTTP status/headings/content, local font faces, loaded/decoded images, no HUD or fake edit identities, and runtime/network health. External requests are blocked and surfaced. Lazy sections are visited before full-page capture; inert hidden ticker clone images are excluded from readiness because native lazy loading intentionally leaves them unloaded. This is not a screenshot mask. No regions are masked.

## Browser states and sensitivity

- Static captures disable animations/caret. Separate no-preference tests prove real CSS motion advances, keyboard/touch-compatible native checkbox stop/resume, hover/focus pause, equal adjacent tracks at start/mid/end, viewport edge coverage and visible logo content, short/wide RTL tracks, reduced-motion/print fallback and empty omission. Adjacent tracks alone do not prove viewport coverage: visual review caught and corrected the RTL animation rule losing to the checked-state shorthand. Animation frames are explicitly sought/paused only after behavior checks for deterministic targeted stills.
- A JavaScript-disabled context verifies a page-script sentinel does not run, native controls/ticker still work and gallery links navigate to the original image. Native paint/readiness avoids page-JS frame callbacks in this mode.
- A 320px text-spacing case applies line height 1.5, letter spacing .12em, word spacing .16em and paragraph spacing 2em. It checks page overflow and keyboard usability; code/table wrappers may intentionally scroll internally.
- Gallery captions must remain inside their own layout items at text spacing and actual zoom. The harness exposed and corrected a justified-gallery bug where fixed item height clipped captions; only image-link height is fixed now, so captions contribute to row height.
- Actual 200%/400% Chromium browser zoom uses a tiny repository-owned extension in an ephemeral isolated profile. The test asserts Chrome's zoom API, effective CSS viewport (1280 → 640/320) and DPR (1 → 2/4). CSS zoom, pinch scale and merely narrowing the viewport are not substitutes. The extension never attaches to the user's browser.
- Sensitivity starts with an ordinary matching control baseline, injects a shared token defect and a small targeted control defect, requires the real screenshot matcher to reject each and retain diff artifacts, removes the defect and requires a clean match. Baseline hashes must remain unchanged. Separate probes reject missing baseline/route/font/image and a setup response for their specific reasons.

Pixelmatch color threshold **0.1** is independent from the allowed changed-pixel count **0**. There is no area-based ratio allowance that dilutes small defects on long pages. Three unchanged local Windows runs establish whether this strict count is stable on the pinned renderer; investigate instability before relaxing it. Targeted control/ticker/gallery captures complement full-page comparisons.

`tests/visual/capture.css` makes gallery items `content-visibility:visible` only during screenshot assertions. Chromium can otherwise skip offscreen gallery paint after text-spacing reflow even after scrolling, producing intermittently blank images. This explicit paint-scheduling override has no mask or spacing/size/color rules. Image readiness, keyboard/lightbox behavior and reflow checks run with production CSS before capture. Baselines verify fully painted content; they do not test the browser's offscreen paint optimization.

## Receipts, cleanup and CI

`.emdash/visual/` contains bootstrap/environment/cleanup receipts, server logs, JSON/HTML reports, expected/actual/diff images and retained traces for unexpected failures. These are ignored locally; reviewable goldens remain under tests. Native framework artifacts use synthetic public content and no authenticated browser storage. Cleanup stops the owned server, unlinks the dependency junction, validates the absolute temporary path and removes only that app. Wrapper cancellation uses IPC to reach Playwright's graceful signal handlers: Windows `child.kill('SIGINT')` would terminate immediately and bypass teardown. Failure/abort cleanup and the IPC relay have separate verification. Forced OS process-tree termination can still bypass JavaScript cleanup and requires removing the verified owned temporary tree. Never recursively delete through its dependency junction.

Automated CI is one Node 22.23.3 job: changed-source art-direction validation, fast script syntax lint, schema-budget checks, unit tests and a normal Astro build. No matrix, browser installation, screenshots, heavy container, visual artifacts or automatic pre-commit hook. The target is under 60 seconds, measured rather than guaranteed; runner queue/setup/network time can vary. The five-minute hard job cap bounds failures. Local reports remain available until the next run; copy dated receipts when retaining evidence. Production/deployment commands have no screenshot dependency.

Screenshots do not certify editor saves, Cloudflare, provider delivery or WCAG conformance. Real editor/database/media acceptance stays separate.
