# Settings-to-output patterns — study conclusions and Design Tweaks integration

**Date:** 2026-10-17
**Subject:** a third-party settings-driven CSS framework, studied locally
**Scope:** investigation only. No source file in this repository was modified to produce this document.
**Companion:** [`implementation-plan.md`](./implementation-plan.md) holds the tracked backlog and the next
executable task. This file records the conclusions; the plan tracks the work.
**Evidence log:** [`reference-notes.local.md`](./reference-notes.local.md) — local only, never commit. It names
the studied implementation and cites its internal paths. This document deliberately does not, because a
committed document must not cite paths that no reader can resolve.

---

## 0. Method and limits

The study traced representative settings through five layers of a third-party framework: a declarative
settings schema, a server-side settings store, a compile step that turns settings into stylesheet variables,
the stylesheets themselves, and a browser-side settings panel that previews changes live.

Limits worth stating plainly:

- The reference implementation is **not part of this repository**. Its internal paths and line numbers are not
  reproduced here; they live in the local evidence log. Every claim below is therefore a *conclusion* that
  cannot be re-verified from this repository alone. Treat the lessons as design reasoning, not as citable
  authority.
- Where a conclusion can be checked against **our** files, it is cited with a path and line number. Those
  citations are verifiable.
- The reference's browser panel is a single-line minified bundle, so even in the local log it is cited by byte
  offset rather than line.

---

## 1. The architecture, in five layers

The shape of the studied framework, described generically:

1. **Declarative settings schema.** Screens and inputs are data files, not code. Each input carries its own
   label, help text, default, unit behaviour, conditional visibility, search title and documentation link. A
   closed list of input types (text, number, px, rem, percent, colour, select, toggle, code) is what makes the
   schema machine-readable rather than merely descriptive.
2. **Settings store with a server-side allow-list.** Only keys present in the schema may be saved; unknown
   keys are dropped. Validation is driven by the same schema data, so the schema is the single source for the
   UI, the storage contract and the validation rules.
3. **Compile step.** Stored settings become stylesheet variables through a chain of small transformers, one
   per concern: colour expansion (a single colour becomes hue/saturation/lightness plus per-shade variants and
   RGB components), unit conversion, percentage rescaling against a root font size, "scale fallback" (a ratio
   of zero falls back to a custom value), and custom-property wrapping. A second pass handles variables that
   depend on already-processed ones.
4. **Stylesheets.** Token emission is gated per feature toggle, and derived families are computed with
   fluid `clamp()` maths rather than fixed breakpoints.
5. **Live browser panel.** The panel recomputes the same derived families in JavaScript and writes the results
   as inline custom properties on the page, but **only for inputs the user has actually changed**, judged
   against the stored value. Untouched settings defer to the compiled stylesheet. Saving sends only the changed
   keys; afterwards the panel cache-busts the stylesheet links and signals other tabs to reload.

Two observations about this arrangement are the most useful things in the study:

- **The interesting part is not the settings UI. It is that one declaration feeds five consumers.** Schema
  data drives rendering, storage, validation, help text and search. We already have a small version of this in
  our token catalogue but hand-maintain it separately from the CSS (see §4, pattern P2).
- **"Changed, not merely present" is the load-bearing idea in the live panel.** Because preview state is
  derived from a diff against stored values, the preview and the stylesheet can never disagree about what the
  site actually has, and the export contains only overrides. Our panel already behaves this way
  (`src/utils/design-tweaks.mjs:41-77` deletes values that return to baseline).

---

## 2. Lessons: where configuration described more than the code did

Seven failure modes observed in the studied framework. Each is a design hazard worth avoiding in our own
tooling; none requires the implementation's name to be useful.

| # | Lesson | Why it matters here |
| --- | --- | --- |
| 1 | **A documented input property with no consumer.** The schema advertised a property that would toggle a CSS class on a target element; the panel never read it, and the compiled CSS was gated on a different mechanism entirely. | Our catalogue could grow properties nobody consumes. T1 plus the exemption-integrity checks are the countermeasure. |
| 2 | **Settings with no UI and no default.** A family of breakpoint settings was referenced by template substitution, but no screen defined them and nothing supplied a default, so the placeholder could survive into emitted CSS. | Any schema-driven system needs a check that every referenced key actually exists somewhere. |
| 3 | **The same calculation implemented twice.** The compiled value came from stylesheet maths; the preview value came from separate JavaScript. Nothing kept them in step. | Duplicated maths is a silent divergence risk. Our panel scales a token list rather than recomputing clamps, which avoids this; keep it that way. |
| 4 | **Validation that exists but is switched off by default.** Range, format, enum and arithmetic checks were implemented server-side but gated behind a flag that shipped disabled, leaving the browser as the only enforcer. | A check that is off is not a check. Prefer checks that are on by default and cheap to run. |
| 5 | **Two competing answers to "what was generated?"** The server derived the available feature set by re-parsing the stylesheets it had just written; the browser separately evaluated the schema's own conditions. The two could disagree — and the code said so in a comment. | This is the strongest single argument for pattern P1: derive availability from real output, not from a second description of the output. |
| 6 | **Computed error state that is never rendered.** A per-input validity flag and message were calculated and discarded. Cosmetic, but it hinted at unimplemented UI. | Dead paths accumulate trust. Delete or wire them. |
| 7 | **A schema type defined but used by no screen.** A paired-input control type existed in the schema and appeared in no shipped screen; the underlying need was met differently. | Schema surface is not evidence of capability. |

---

## 3. Patterns worth borrowing, ranked by value ÷ effort

| # | Pattern | Value | Effort | Where it lands here |
| --- | --- | --- | --- | --- |
| P1 | **Verify the catalogue against real output, and fail open.** Re-derive what exists from the artefact itself; if the artefact is absent, show everything rather than nothing. | High — it is the only check that can contradict a declaration with evidence. | S–M | `tests/token-coverage.test.mjs` (landed, unrecorded) |
| P2 | **One declarative source for UI + docs + search.** Stop hand-maintaining a catalogue separately from the thing it describes. | High — removes drift by construction. | M | generated catalogue module replacing `tokenGroups` in `src/utils/design-tweaks.mjs:3-31` |
| P3 | **Base value + ratio families with derived steps**, and preview/export limited to what changed. | High for calibration quality. | M | `src/utils/design-tweaks.mjs` currently scales a fixed list by one factor (`:34`, `:49-52`) |
| P4 | **Machine-readable calibration I/O plus a staleness check** (export/import/reset, and a diagnostic that reports whether outputs are current). | High for handoff and review. | M | `scripts/`; depends on W-B |
| P5 | **Conditional availability of whole output blocks**, with unset inputs falling back to authored values. | Medium | M | later, if token sets ever need route/feature scoping |
| P6 | **Critical token CSS inlined rather than linked** (the reference makes token emission inline-or-linked a setting). | Medium | M | `src/layouts/Base.astro` head; `src/styles/global.css` is already small enough to inline selectively |
| P7 | **Search with breadcrumbs, and group headings that follow a name field.** | Low–Medium at 37 tokens; the dynamic-heading part is the real win. | S | `src/components/TweaksBar.astro` |
| P8 | **An in-browser stylesheet compiler for live custom-CSS preview.** | Attractive, and rejected: it ships a second copy of the framework into the browser, so the preview can diverge from the real build. | L | not recommended |

**Anti-patterns observed, worth naming so we do not repeat them:** shipping a documented option no code reads
(§2.1); two implementations of one calculation (§2.3); a schema type with no UI (§2.7); and a preview that
duplicates the build toolchain (P8).

---

## 4. Design Tweaks: where it can join the workflow

Observed current state — the panel already has the shape the reference suggests, search and categories
included, and `docs/dev-hud.md:21` records that its organisation came from research into how dashboard-style
settings interfaces are structured. Evidence: `src/components/TweaksBar.astro:15-24, 156-158, 436, 613-620`; screenshot
`docs/images/design-tweaks.png`. What is missing is **a trigger and an artefact**, not capability: today it is
invoked from prose (`AGENTS.md:53`, `docs/design-framework.md:195-202`, Stage 4.5 in
`docs/site-delivery-workflow.md`) and hands off a clipboard string.

**A. Give calibration a trigger, in the artefact the workflow already expects.** Stage 4.5 exists and the gate
already prints it: `scripts/check-art-direction.mjs` ends by directing the reader to calibrate on
`/_styleguide` and record findings in `audit/component-calibration.md`. That file is currently absent, and
`scripts/audit-design-system.mjs:177-212` already reports `calibrationRecord: false`. Add a
`## Token Calibration` section there rather than inventing a new document.

**B. Make the export reviewable, not just pasteable.** Keep `Copy Tokens (CSS)`; add a deterministic receipt
(`{tokens, sourceValues, exportedAt, globalCssSha256}`) that a developer saves under `audit/` and that review
can diff. The hash binds a calibration to specific `src/styles/global.css` bytes — the same primitive
`audit/design-gate-exceptions.json` already uses (path + reason + LF-normalised SHA-256, validated in
`scripts/check-art-direction.mjs`). The rule that design output must never be redirected straight over
`global.css` stays intact: the receipt is evidence, the merge remains an edit.

**C. Drive calibration from coverage.** `src/dev/styleguide-fixtures.ts:9-14` carries `specimenTokens` and a
`componentCoverage` map; `src/utils/design-tweaks.mjs:3-36` declares the catalogue. Flagging
catalogued-but-unexercised tokens turns "calibrate what you happen to look at" into "calibrate what is
unverified" — P1 applied to tokens. T1's exemption lists are the seed.

**D. Keep it pre-handoff, not runtime.** The existing constraints are correct and worth defending: DEV-only
mount (`src/layouts/Base.astro:93`), `_styleguide` returning 404 in production
(`src/pages/_styleguide.astro:4`), no storage API, in-memory overrides only, teardown on navigation.
Calibration state belongs in `audit/`, never in browser storage.

---

## 5. Platform-specific mechanisms that do not carry over

The studied framework is a CMS plugin. Several of its mechanisms exist only because of that environment, and
copying them here would be a mistake:

| Mechanism | Why it does not transfer |
| --- | --- |
| Settings stored in the CMS options table and edited through an admin page with nonce-protected requests | We have **no settings store**. `src/styles/global.css` is the source of truth, so there is nothing for a server to validate. |
| Generated stylesheets written to an uploads directory, cache-busted by query string, hot-reloaded via browser storage | Our CSS is produced at build time. Adding a per-user generated stylesheet would break the "source is authoritative" contract. |
| Server-side SCSS compilation with feature-gated emission | Our tokens are hand-authored custom properties, not compiled output. Feature gating into CSS is the wrong tool here. |
| Editor/page-builder integrations that reach into a third-party editor's DOM and global-class stores | No equivalent abstraction exists here, and this is where most of the reference's complexity lives. |
| A documented input property expecting the platform to add classes to elements | Not merely platform-specific — it does not work in the reference either (§2.1). Do not copy the pattern. |
| Per-builder include/exclude of UI, and layer toggles to avoid editor style conflicts | No editor surfaces to exclude, and the rationale is editor-specific. |
| The command-line settings surface itself | The *idea* (P4) transfers; the command surface does not. |

Note the direction of the dependency difference. The reference treats **settings as source** and CSS as build
output; we treat **CSS as source** and have no settings at all. Any borrowed pattern must be re-expressed
against that inversion — which is why P1 and P4 port cleanly while the storage half of P2 and all of P8 do not.

---

## 6. Evidence index (verifiable, our side only)

- Token catalogue and preview maths: `src/utils/design-tweaks.mjs`
- Authored tokens and consumers: `src/styles/global.css`
- Styleguide specimens and coverage: `src/dev/styleguide-fixtures.ts`, `src/components/dev/Styleguide.astro`
- Panel: `src/components/TweaksBar.astro`; production gating: `src/pages/_styleguide.astro`
- Guard under construction: `tests/token-coverage.test.mjs`
- Workflow and gates: `scripts/check-art-direction.mjs`, `scripts/audit-design-system.mjs`, `AGENTS.md`,
  `docs/dev-hud.md`, `docs/design-framework.md`, `docs/site-delivery-workflow.md`
- Existing gate exceptions: `audit/design-gate-exceptions.json`
- Study evidence log (local, never commit): `reference-notes.local.md` in this directory
