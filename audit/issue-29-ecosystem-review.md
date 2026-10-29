# Issue #29: evidence review and proposed implementation scope

Audited 27 October 2026 against Baseline `e2992d0`, Windows, Node 24.21.0 and the checked-in lockfile. [Issue #29](https://github.com/Vermeulen-Solutions/baseline/issues/29) is the research brief. The pre-existing, untracked [proposal copy](issue-design-pipeline-ecosystem-audit.md) was left unchanged. This report and its isolated prototype are local research artifacts; no production command, dependency, profile manifest, site token, skill or CI policy was changed.

**Final disposition, 27 October 2026:** the user declined further benchmarking and implementation. Issue #29 was closed as `not_planned` at the user's request. The recommendations below remain historical options, not an approved backlog; the isolated prototype is not shipped tooling. No implementation or release scope remains pending for this issue.

## Recommended follow-up and decisions

1. **First: add narrowly scoped mechanical diagnostics to existing checks (proposal 3).** Reuse Astro ESLint/PostCSS rather than introduce another parser or a competing gate. Start literal-color and intrinsic-image-size diagnostics in advisory mode, resolve dynamic/composition cases against rendered output, and promote only demonstrated high-confidence rules to errors. Extend the rendered HTML audit for heading-order advisories. Keep overflow, contrast in actual states and visual quality in browser acceptance.
2. **Second: formalize a bounded DTCG export contract around the existing canvas kit (part of proposal 2).** Keep CSS authoritative, preserve source expressions and contexts, and distinguish sampled canvas values from portable source tokens. Add format validation and explicit loss diagnostics before considering imports. Do not replace client CSS with generated JSON or add Style Dictionary by default.
3. **Defer:** automatic React-to-Astro quarantine, a second concepting system, browser-extracted tokens written directly into the site, and CI screenshot migration. These either duplicate current capabilities, require semantic decisions a transform cannot infer, or change an explicit support boundary.

The meaningful selection is **both priorities** (recommended), **mechanical diagnostics only**, or **research only**. For implementation, also agree the release endpoint: a proposed `codex/issue-29-design-diagnostics` branch and reviewable PR, with verified commit/push; no site deployment is applicable to this starter-tooling change. Branch creation, commit, push, PR creation and issue comments were not performed in this audit. Do not interpret this recommendation as user approval.

## What the issue gets wrong about the current baseline

| Issue assumption | Observed implementation | Consequence |
| --- | --- | --- |
| Fast verification is mostly typechecking/full HTML/Vitest | `package.json`: `verify:fast` already runs Astro accessibility lint, CSS contracts, art-direction/token checks and Node unit tests. Typecheck belongs to full `verify`; the runner uses `node:test`. | Extend existing ownership instead of introducing a second generic linter. |
| Token handling is custom regex only | `scripts/design-system.mjs` parses declarations/scopes with PostCSS, resolves a bounded color grammar, calculates luminance/contrast, generates OKLCH accents and validates fluid expressions. | Improve documented gaps; do not replace a nonexistent regex-only architecture. |
| No DTCG interoperability | `scripts/canvas-kit.mjs` emits viewport-specific `$type`/`$value` color/dimension files, source hashes, expressions, scope/context risks and font mappings. OpenDesign also receives source CSS. | A portable contract is incremental. Two-way synchronization is not already solved. |
| Only a single concept direction is generated | `site-art-direction/references/design-iteration.md` already calls for two or three concepts, focused iteration, direction selection and representative Astro proof. OpenDesign/OpenPencil/Penpot/direct Astro are supported. | Reuse the loop and its explicit choices. Do not add mandatory variations to every small refinement. |
| Missing image sizing/alt rules must all be invented | `eslint.config.mjs` includes strict Astro accessibility rules and a `ResponsiveImage` mapping; `scripts/audit-html-integrity.mjs:118` checks actual emitted image alt/sizing. CSS contracts already parse Astro styles. | Earlier sizing warnings may help, but must not duplicate or weaken rendered checks. |
| Screenshot tests need a headless implementation | The current Chromium runner already uses `headless: true`. Windows/Node/browser/font pins and CI refusal are deliberate contracts. | Containerization is a renderer certification and policy change, not a missing flag. |

These findings are from source inspection, not claims of fresh visual/editor acceptance. Relevant local contracts: [CONTRIBUTING](../CONTRIBUTING.md), [canvas kit](../docs/canvas-kit.md), [visual regression](../docs/visual-regression.md), [profile architecture](../docs/platform-profiles.md), [bounded updates](../docs/baseline-updates.md), and [audit/release policy](../.agents/skills/new-site-workflow/SKILL.md#audit-requests-and-release-completion).

## Search method and limitations

Used GitHub repository, README and source tools first. GitHub REST supplemented metadata fields omitted by the connector (stars, `pushed_at`, detected license and current head). Repository discovery used a six-month window starting **2026-04-27**, then a three-month window starting **2026-07-27**. Stars are discovery filters, never a quality score; `pushed_at` does not demonstrate release quality or sustained maintenance. This is a bounded survey, not an exhaustive census or an installation recommendation.

| Search performed | Result and interpretation |
| --- | --- |
| Web: `site:github.com "mcp" ("design system" OR "astro" OR "tailwind") stars:<100` | Useful leads, but GitHub star qualifiers are not a dependable web-search filter. Recheck through GitHub metadata. |
| GitHub repositories: `"design gate" stars:<100 pushed:>=2026-04-27` | Found `0xdesign/design-gate` and `jkf87/gnomon` among other unrelated matches. |
| GitHub repositories: `"design system" mcp stars:<100 pushed:>=2026-04-27` and the narrower `pushed:>=2026-07-27 archived:false` | Found Storybook extraction, design-system-specific MCPs and brand-context tools; inspected selected primary READMEs rather than assuming all results fit Baseline. |
| GitHub repositories: `"anti-slop" stars:<100 pushed:>=2026-04-27`, then the three-month nonarchived variant | Found additional doctrine repositories; do not equate keyword matching with better model behavior. |
| Web and GitHub Code: `filename:AGENTS.md ("art direction" OR "section rhythm")`; `filename:DESIGN.md ("token physics" OR "anti-patterns")` | REST rejected the parenthesized queries with HTTP 422. Retried four individual filename/phrase queries successfully. Results were noisy (including suffix filenames and non-design uses); they do not establish ecosystem-wide prevalence. |
| GitHub commits: `"design-gate" OR "component quarantine" committer-date:>=2026-04-27` | Found recent design-variant/acceptance-gate work, but many hits were unrelated product gates. No architecture claim rests on commit-message matching. |
| Official registry: `/v0.1/servers?search=design&limit=10`; Glama design-token/brand searches | The official first page contained repeated versions and unrelated design domains. Glama supplied further leads, including `sam-rubinstein/frontend-design-mcp`; capabilities below were checked against its primary README. A listing is not source verification. |

Discovery links: [official registry](https://registry.modelcontextprotocol.io/docs), [Glama brand compiler listing](https://glama.ai/mcp/servers/Brandcode-Studio/brandsystem-mcp/schema), [frontend-design-mcp listing](https://glama.ai/mcp/servers/sam-rubinstein/frontend-design-mcp). A `N-Link-Lab/design-tokens-mcp` README lookup returned 404; exclude it from verified candidates rather than infer capabilities from directory copy.

## Repository evidence, corrections and transferable patterns

Metadata below was read from GitHub on the audit date. Dates are UTC `pushed_at`; heads identify the inspected snapshot. MIT/BSD identifiers are GitHub's detection, not a legal review. An undetected license is not permission to copy code. No third-party code was installed or copied into the prototype.

| Repository / immutable README | Stars / pushed / license | Evidence and Baseline decision |
| --- | --- | --- |
| [0xdesign/design-gate](https://github.com/0xdesign/design-gate/blob/23dd3a8ab703dacee689741a1d4c6ddac7d1dc08/README.md) | 3 / 2026-09-17 / MIT | Current project captures rendered pages, compiles deterministic measurements and optionally uses TypeSafe/Jev judgments. [Capture source](https://github.com/0xdesign/design-gate/blob/23dd3a8ab703dacee689741a1d4c6ddac7d1dc08/src/capture/playwright.ts) imports Playwright and AxeBuilder. It is **not** evidence for a sub-millisecond Astro AST gate. Borrow separation of measured facts and judgments; do not adopt its runtime/service loop for fast lint. |
| [0xdesign/design-plugin](https://github.com/0xdesign/design-plugin/blob/913a7ab2ac7e0f48eab77c93f2f5376150864b02/README.md) | 782 / 2026-09-17 / undetected; README says MIT | README describes five variants, comparison UI and cleanup/handoff. Correct the issue's low-star and 3–4-variant descriptions. Baseline already has a focused concept loop; inline feedback is a possible future UX experiment, not a missing architecture. |
| [ryanthedev/design-for-ai](https://github.com/ryanthedev/design-for-ai/blob/37d7ae63d1afa45eb57ec90bc246cef6dd60c033/README.md) | 317 / 2026-07-02 / undetected; README says MIT | Describes research → plan → mock → build, user-pinned aesthetic axes, deterministic selection and palette generation. Useful lesson: preserve user constraints while varying unresolved axes. README claims do not prove prompt bans are an industry-best defense or justify forbidding equal-height sections. No comparative model trial was run. |
| [Brandcode-Studio/brandsystem-mcp](https://github.com/Brandcode-Studio/brandsystem-mcp/blob/83c02a5d59d1b1673c2123d542e235fd09bf9908/README.md) | 15 / 2026-10-26 / MIT | Corrects the issue's link to a GitHub account rather than the repository. Describes extraction evidence, confidence, DTCG output and portable brand runtime. Borrow provenance/confidence and unresolved-value reporting; do not add a second authoritative `.brand` store automatically. |
| [sunil-dsb/design.md](https://github.com/sunil-dsb/design.md/blob/8267737bf1392628d655b880431b56a9f6c3b625/README.md) | 73 / 2026-05-19 / MIT | Describes multi-page/multi-viewport Playwright extraction, role naming and per-token provenance. Extraction is an observation of a site/state, not permission to overwrite a brand or a guarantee of reproducibility on changing sites. Keep as optional discovery evidence. |
| [1999AZZAR/designer-mcp](https://github.com/1999AZZAR/designer-mcp/blob/e9dfb9fac1544b39f1d18a798a4acc2bfaf30f28/README.md) | 15 / 2026-10-23 / MIT | Current README describes 46 tools and WCAG 2.1 static auditing, not the issue's 37-tool WCAG 2.2/APCA characterization. OKLCH is useful for generation; rendered pair/state evaluation remains necessary. Baseline already has relevant math. |
| [httpsteven/multi-design-mcp](https://github.com/httpsteven/multi-design-mcp/blob/a5f754b69116131dc3c982581391f2ffd375da75/README.md) | 0 / 2026-07-07 / undetected | New lead: shared site plans, seeded variations, bounded per-page briefs. Transfer the consistency/variation distinction, not its generic scaffold or default motion dependencies. No unverified token-saving claim. |
| [freema/mcp-design-system-extractor](https://github.com/freema/mcp-design-system-extractor/blob/20384f662c8208e29d37200c835cb122e271977e/README.md) | 72 / 2026-10-25 / MIT | New lead: extracts Storybook component variants/HTML/theme; compact responses and async job IDs for expensive operations. Useful when a real client Storybook exists. Not a universal website-to-Astro converter; would add a browser-backed service. |
| [jkf87/gnomon](https://github.com/jkf87/gnomon/blob/6f9ea4e601108441be46a6f1f2a6b0d8af76ed24/README.md) | 3 / 2026-07-03 / MIT | New lead: rubric-first evaluation distinguishes quantitative, model and human evidence. Useful evidence discipline; its arbitrary ratio/closure policy is not a Baseline requirement. No agent runtime was installed or launched. |
| [sam-rubinstein/frontend-design-mcp](https://github.com/sam-rubinstein/frontend-design-mcp/blob/2d5a0410f47b93ce03ea8c455dba08db3d7c31da/README.md) | 1 / 2026-10-01 / BSD-3-Clause | Registry-discovered lead: retrieve structured tokens or individual DESIGN.md sections with origin metadata. Borrow narrow retrieval and provenance; existing local OpenDesign catalogs already cover part of this need. A famous brand reference is not automatically the client's direction. |

Established projects remain useful comparators, without the issue's unsupported universal claims: [Onlook](https://github.com/onlook-dev/onlook) demonstrates editing with real code; [Mitosis](https://github.com/BuilderIO/mitosis) compiles a constrained component representation across targets. Neither establishes that arbitrary React effects, state, focus management, CMS edit proxies or semantic token roles can be safely deleted/inferred. Storybook/Ladle can host isolated components, but Baseline already owns native Astro fixtures and release exclusion. Tina-style editing would require an independently scoped static-editor/auth/publishing design; it is not a verification improvement.

## Isolated mechanical-gate experiment

Files: [prototype](issue-29/design-gate-prototype.mjs) and [eight tests](issue-29/design-gate-prototype.test.mjs). The experiment uses already-installed `astro-eslint-parser`, PostCSS and parse5, performs no writes, has no package command, and is not in `verify:fast`, profile manifests or the distributed test inventory.

```powershell
node --test audit/issue-29/design-gate-prototype.test.mjs
node audit/issue-29/design-gate-prototype.mjs src profiles/static/project/src
# For heading checks, pass actual complete rendered .html documents explicitly.
```

Rules exercised: hex colors in literal component style declarations and selected attributes; native `img` sizing with positive literal dimensions or inline aspect-ratio; upward heading-level skips in complete rendered HTML. Astro frontmatter, comments, prose and fragment links are excluded from color checks. Dynamic attributes/spreads defer to rendered verification. Source heading order is deliberately not judged because slots, conditionals and repeated components do not establish the page outline. Parse failures are errors; experimental findings are warnings/deferred observations, not release blockers.

Eight passing tests cover detection, token/URL/prose exclusions, invalid dimensions, dynamic deferral, conditional headings, HTML templates, malformed input and byte preservation. Three fresh processes scanned the same **38 Astro files**, returning **18 observations** each: **4 warnings, 14 deferred, zero parse errors**. Scan-only times were **72.54 / 75.67 / 69.50 ms**; PowerShell wall-clock timings including startup, imports, JSON piping and conversion were **436.49 / 368.75 / 337.76 ms**. An earlier scan took 97.91 ms. These are local observations, not a CI budget or a general benchmark; the sub-millisecond proposal is unsupported.

The four warnings illustrate why advisory-first matters:

- `PartnersPanel.astro:10`: native logo dimensions absent; review media metadata and the rendered placement.
- `PartnersPanel.astro:17`: literal `#171717` is a deliberate dark logo ground candidate, not automatically a wrong color. A semantic role decision is required.
- `ResponsiveImage.astro:33`: fallback image is absolutely positioned inside a wrapper whose dynamic aspect ratio reserves space. A local intrinsic-size rule cannot see that contract and must not force an unsafe rewrite.
- `Base.astro:71`: conditional CMS site-logo image lacks literal dimensions; verify the real logo source/placement separately.

None was fixed as part of this audit. The prototype intentionally does not prove accessibility, infer CSS layout, resolve arbitrary expressions, validate every CSS color syntax or inspect hidden/interactive browser states. Its bounded value matching is not a general CSS value parser. It does not recognize every Tailwind utility, SVG paint server or aspect-ratio wrapper; production rules need additional false-positive/refusal fixtures before enforcement. Full documents supplied to parse5 are assumed to be rendered evidence, not arbitrary source fragments.

After the fresh build and passing HTML integrity audit, the prototype also scanned **9 captured HTML documents in 35.17 ms**. It reported three global-outline `h1` → `h3` advisories on `/about`, `/category/updates` and `/404`, where footer widget headings follow the main content without an intervening h2. This is a concrete gap in the current HTML audit's coverage, but global outline order across landmarks alone is not a WCAG verdict. Decide the intended footer/landmark heading contract before making this rule blocking; no markup or CMS widget was changed.

## DTCG feasibility and proposed contract

The [DTCG 2025.10 Format Module](https://www.designtokens.org/tr/2025.10/format/) is a stable Community Group specification, **not a W3C Standard**. It defines interchange, types, references and extensions; it does not model an entire CSS cascade or guarantee that a design tool imports every token. [Style Dictionary](https://styledictionary.com/info/dtcg/) supports DTCG from v4 but currently documents incomplete 2025.10 support. Pin a tested subset/version rather than promise universal tool interoperability.

Baseline already exports sampled sRGB colors and px dimensions with source context. Sampling can clip gamut and quantize colors, collapse aliases, flatten fluid lengths to a viewport sample, and omit font-relative or unsupported values. Its font mappings are separate diagnostics, not a universal font installation/export contract. Source expressions, selector/media/layer contexts, role mapping and root-font assumptions must survive alongside samples; never reconstruct global CSS from the px outputs. Keep unknown/custom properties visible as unsupported rather than silently invent types.

**Proposed first slice:** specify and validate the existing `color`/`dimension` subset, deterministic token naming, namespace/type/reference restrictions, source hash/context metadata and an explicit unsupported/loss list. Test real exported files against the selected DTCG contract. Keep font stacks, motion, shadows, percentages, container/font-relative units and conditional tokens unsupported or separately described until their mappings are proved. Add an optional portable export only where the current canvas-specific extension structure is insufficient. No production/runtime dependency is required for JSON generation; reconsider Style Dictionary only when actual multi-target needs justify its build dependency.

An import is a later feature: require an explicit role map and selected target scopes; reject unknown types, cycles, ambiguous duplicate keys, unsupported values and unresolved aliases; stage a diff bound to the original source hash; preserve local calibration. Do not write `AGENTS.md`, `global.css` or `component-calibration.md` automatically from extracted observations. A saved token report is not rendered calibration evidence.

For palette work, compare actual foreground/background pairs after gamut handling, opacity/compositing and state selection. The [WCAG contrast requirement](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html) uses luminance contrast, including 4.5:1 for ordinary text and 3:1 for large text; OKLCH lightness differences or APCA scores alone do not establish WCAG 2.2 AA. The existing bounded converter is not a complete browser color engine. Generation can solve supported pairs, but cannot guarantee every authored combination, surface, focus ring or image background.

## Cross-platform visual/accessibility feasibility

Technically feasible; **not authorized as a policy change**. Current `AGENTS.md`, CONTRIBUTING, `scripts/test-visual.mjs`, `playwright.config.mjs` and `tests/visual/contract.mjs` explicitly keep screenshots local, independent from CI/build/deploy, and certify a Windows reference renderer. Removing a platform guard would not certify a Linux renderer or its baselines.

A separately approved Linux pilot would need:

1. A pinned [Playwright Docker image](https://playwright.dev/docs/docker) matching the lockfile's Playwright 1.64.1, pinned image digest and recorded OS/font/browser provenance. Confirm the desired Node runtime inside it rather than assuming the image matches Node 24.21.0. The image supplies browsers/system dependencies; project packages still require installation.
2. Separate Linux goldens and manifest, keeping Windows goldens intact. Fix locale, timezone, DPR, root fonts, font readiness and animations. Font pinning alone does not make Windows/Linux glyph rasterization identical.
3. Three unchanged matching runs and deliberate token/control fault injections, missing font/image/route rejection, keyboard/no-JS/reflow/actual zoom acceptance, resource bounds and cancellation/cleanup on Linux. Keep zero changed-pixel tolerance unless instability is explained; never loosen it to hide platform differences.
4. Independent accessibility scanning through [Playwright and axe](https://playwright.dev/docs/accessibility-testing), with a reviewed build-only dependency, explicit route/state matrix and failures bound to rule/selector/state evidence. A stylesheet-only specimen sweep misses real route composition. Automated scanning supplements keyboard/screen-reader/editor acceptance; it does not certify WCAG conformance.
5. An explicit support decision and coordinated docs/guard/CI updates before making the pilot required. Browser work stays outside the existing 60-second fast-check segment and outside deployment dependencies under current policy.

No Docker image, new browser, accessibility package, service or CI job was installed/launched for this feasibility review. The policy-compliant nearer option is an optional local axe rehearsal using existing synthetic fixtures; even that would be a separately selected implementation slice.

## Implementation specification for the top two priorities

### A. Mechanical diagnostics

**Problem/behavior:** mechanical defects surface late, but indiscriminate source rules reject legitimate dynamic layouts. Add earlier, attributable observations without claiming source code establishes rendered accessibility.

**Implementation:** own source rules in Astro ESLint/local helpers beside `scripts/css-contracts.mjs`; reuse the installed AST and PostCSS parsing. Report file/line/rule/reason/severity and whether resolution requires rendering. Keep frontmatter, prose, URLs, comments and tokens out of color matching; distinguish font/image fallback containers, native `img`, Astro Image and mapped adapters. Extend the complete rendered HTML audit for heading-order advisories with explicit evidence limits. Do not ban all hex strings everywhere, require meaningless ARIA, enforce varying section heights or automatically strip hydration/effects. Preserve the existing art-direction gate and hash-bound exceptions as a separate contract.

**Acceptance:** malicious/malformed input errors; dynamic/spread/conditional/slot cases deferred; positive and negative color/URL/gradient/SVG examples; real fallback-image wrappers; empty decorative alt permitted by existing checks; native image dimensions/aspect ratio validated; complete-page heading jumps distinguished from fragment order. Verify that the repository's known 18 observations do not become unexplained blocking failures. Measure cold/warm costs with file counts on Windows and the supported CI runtime; retain the 60-second overall fast-check budget. No sub-millisecond target.

**Distribution:** prefer extending installed files/config to reduce new membership. If new files/commands/tests are needed, update root scripts, `profiles/manifests/shared.json`, applicable static overrides, `profiles/file-inventory.json`, dependency inventory and resolved generated checks together. Classify shipped top-level tests in `tests/test-tiers.json`; generated static tests use their own installed runner/overrides. Keep report/prototype files out of distribution. If a new command is retained, document root/static discovery and generated command parity.

### B. Bounded DTCG export

**Problem/behavior:** canvas exports exist, but consumers can mistake sampled values for source truth or assume broader format compatibility than proved.

**Implementation:** document the exact supported DTCG subset/version, validate actual `canvasPayload` outputs, retain source/context metadata and explicitly classify unsupported/lossy values. Reuse PostCSS/browser evaluation and existing export outputs. Avoid a second token authority, runtime packages or automatic CSS/record regeneration. Add a generic export command only if a consumer requirement cannot use the existing files. Keep the current source-derived OpenDesign path working.

**Acceptance:** colors including alpha and gamut-loss diagnostics; dimensions and namespaced token paths; invalid finite values and unsupported types; aliases/context/duplicate declarations; 390/1440 samples and changed root fonts; unresolved font/container units; role remapping; changed source hash; byte-for-byte input preservation. Prove a consumer imports the supported payload and label untested tools honestly. JSON shape tests alone do not establish OpenPencil/Penpot/Figma behavior or a round trip.

**Distribution/adoption:** update the canvas tool, its tests/docs and manifests only as needed. New static sites receive the reviewed files through resolved allowlists. Existing generated static/Sveltia sites stage an immutable `sync:baseline` update, preserve calibrated CSS and inspect conflicts; new paths, commands and package changes require explicit additive adoption because sync cannot expand installed membership. Existing EmDash sites adapt the reviewed source manually, retaining SSR/edit proxies/content. No schema, CMS migration, Sveltia auth or content changes are involved.

### Verification and release for either selected slice

Run doctor before any dependency installation; use the lockfile and npm. During edits run `verify:fast`; before release run full `verify`, fresh `build`, `audit:html`, and the applicable independent `test:profiles` checks for both generated static profiles. Include installed commands, package boundaries and refusal/preservation behavior. If visual/component behavior changes during implementation, add the required local Windows browser acceptance and explain any changed golden. Preserve local calibration and source hashes; source exceptions are not blanket waivers.

After the user selects implementation/release scope, finish all agreed work through verification, a focused commit, push and PR attachment without repeated continuation prompts. PR text should describe the resulting behavior and actual verification, linking issue #29. No unrelated site deployment is required. If only local implementation is selected, finish locally and state the remaining release boundary.

## Audit completion and remaining limits

The issue's five research tasks are covered: dated discovery/corrections, an isolated tested mechanical prototype, DTCG feasibility, cross-platform feasibility, and specifications for two selected priorities. Fresh verification results are recorded in [the audit receipt](issue-29/verification.md). Repository sources/READMEs were inspected, but third-party tooling effectiveness, cross-model taste, external design-tool import compatibility, Linux screenshots, real editor saves and production deployment were not exercised. Report those as untested rather than inferred from stars, claims or historical receipts.
