# Skill audit — 2026-11-06

Audit of the eleven Vermeulen-maintained skills in `.agents/skills/` against five skill-writing tests, with a piloted rewrite of the top two items. The upstream mirrors (`impeccable`, `building-emdash-site`, `creating-plugins`, `emdash-cli`) and the bundled OpenPencil upstream files were not audited or edited.

## Recommended follow-up plan

This audit does not authorize the rest of the backlog. The decisions it needs are listed with each step.

1. **Review and merge the pilot** (this branch): `new-site-workflow` split into a router plus five stage references; `responsive-architecture.md` rewritten as a decision table with reasons; one corrupted rule in `wordpress-to-emdash-content` repaired. Decision: accept the router pattern as the model for the other long skills.
2. **Remove cross-skill boilerplate** (one PR, mechanical, about 1,500 words saved per full workflow load): replace the seven identical *Engineering verification loop* sections with a one-line pointer to the site's `AGENTS.md` *Verify and hand off* section, and replace the eight copies of the design-surface paragraph with one canonical copy in `site-art-direction/references/design-iteration.md` plus a one-line pointer. Decision: whether generated static sites need the pointer target to be their own `AGENTS.md` (they do; it ships).
3. **Split `astro-site-design/SKILL.md`** the same way as the workflow: keep the decision rules in the skill; move the six dense recipe bullets (lines 59–67) into a `references/baseline-utilities.md` with a decision table for when to use each utility family. Behaviour-test with T3-style craft tasks.
4. **Add decision tables and reasons to `site-art-direction`**: hero specimen choice, header archetype and expressive range are choices written as prose lists. Behaviour-test with a concept-direction task.
5. **Fix `Card layout="horizontal"`** to be narrow-first (`@container (min-width: …)`), or document why it is not, so `astro-primitives.md:17` agrees with `responsive-architecture.md`. This is a shared component change: it needs the styleguide check and the visual-regression harness.
6. **Procedural skills last** (`wordpress-to-emdash-content`, `emdash-site-setup`, `emdash-production-cutover`): remove duplication with `docs/` and between skills, and keep every safety rule. These skills are already strict; the gain is size, not behaviour.

Each step should carry the same before/after protocol as the pilot, on at least one weaker model.

## Method

- Word counts: whitespace tokens per Markdown file.
- Soft words per 1,000 words: *appropriate(ly), as needed, if/when/where needed, meaningful(ly), deliberate(ly), intentional(ly), suitable, reasonable/reasonably, sensible, carefully, thoughtful(ly), relevant, applicable, proper(ly), where/when useful*. These are only flags. A soft word inside a concrete rule (for example "deliberately excluded content" as a named migration outcome) is fine, so the examples below were read in context.
- Strict words per 1,000: *must, never, always, do not, don't*.
- "Why" markers per 1,000: *because, so that, otherwise, since, which means, prevent(s), to avoid*. This is a rough proxy for stated reasons.
- *material(ly)* is counted separately. It is the most frequent hedge in these skills (12× in the old workflow SKILL.md alone). It usually means "consequential", and the reader has to decide what counts.

The measurement script, eval protocol and every run's raw answer are in [skill-audit-2026-11-06/](skill-audit-2026-11-06/README.md). The numbers are measurements, not quality scores.

## Summary table (before the pilot)

| Rank | Skill | Kind | Words (all files) | SKILL.md words | Soft /1k | Strict /1k | Why /1k | Main problem |
| --- | --- | --- | ---: | ---: | ---: | ---: | ---: | --- |
| 1 | new-site-workflow | procedural + routing | 15,949 | 9,439 | 4.3 | 7.1 | 0.7 | Focus: 9,400-word SKILL.md loads whole; track choice is prose |
| 2 | astro-site-design | craft | 18,632 | 4,846 | 3.5 | 7.4 | 0.5 | Focus and density: utility catalogue inline in SKILL.md; few reasons |
| 3 | site-art-direction | craft | 12,808 | 2,935 | 4.0 | 5.2 | 1.0 | Choices written as lists, not decisions; surface paragraph repeated |
| 4 | wordpress-to-emdash-content | procedural | 8,161 | 4,310 | 2.9 | 10.2 | 1.5 | Size; one corrupted safety rule; overlap with `docs/wordpress-migration.md` |
| 5 | brilliant-site-design | craft tool | 6,054 | 1,722 | 5.3 | 5.9 | 0.7 | Trial-log narrative in references; highest soft rate |
| 6 | emdash-site-setup | procedural | 3,066 | 3,066 | 2.0 | 9.5 | 1.6 | Plugin table duplicated with the workflow |
| 7 | emdash-production-cutover | procedural / safety | 3,523 | 2,335 | 5.1 | 6.8 | 0.3 | Soft words in form-security rules |
| 8 | penpot-site-design | craft tool | 3,424 | 966 | 4.4 | 9.6 | 1.2 | Shared boilerplate with the other canvas skills |
| 9 | openpencil-site-design | craft tool | 3,487* | 1,236 | 4.3 | 7.7 | 0.9 | Same |
| 10 | opendesign-site-design | craft tool | 4,955 | 1,618 | 0.8 | 5.7 | 0.8 | Small; mostly fine |
| 11 | emdash-content-modeling | procedural + modeling | 4,110 | 1,946 | 0.7 | 6.8 | 1.0 | Already the model: explicit decision table |

\* excluding the bundled upstream files.

Shared boilerplate (test 4) is counted once here rather than per skill:

| Repeated block | Copies | Approx. words each | Where |
| --- | ---: | ---: | --- |
| *Engineering verification loop* (doctor → verify:fast → verify → build → audit:html) | 7 | 130 | `new-site-workflow`, `site-art-direction`, `astro-site-design`, `emdash-content-modeling`, `emdash-site-setup`, `emdash-production-cutover`, `wordpress-to-emdash-content` SKILL.md files; also root `AGENTS.md` and `CONTRIBUTING.md` |
| Design-surface paragraph (Brilliant / HTML default / OpenPencil / Penpot / optional OpenDesign) | 8 | 120–250 | root `AGENTS.md:68`, `profiles/static/project/AGENTS.md:51`, `docs/agent-documentation.md:164`, `site-art-direction/SKILL.md:96`, `site-art-direction/references/design-iteration.md:7`, `astro-site-design/SKILL.md:91`, old `new-site-workflow/SKILL.md:196` and `:200` |
| "An audit first produces an actionable recommended plan and meaningful choices…" | 3 | 40 | `penpot-site-design/SKILL.md:14`, `openpencil-site-design/SKILL.md:12`, `opendesign-site-design/SKILL.md:12` |
| EmDash plugin registry list (Eventual, LinguaDash) | 2 | 200 | `emdash-site-setup/SKILL.md:34–48`, old `new-site-workflow/SKILL.md:164–169` |
| Command-availability rule | 1 + 2 pointers | — | Already done right: owned by `new-site-workflow` (Start here); the two design skills point to it |

## Taste and craft guidance

Strictness and decision trees matter most here: the agent makes a choice each time, and the skill should narrow it.

### 2. astro-site-design — 4,846 words in SKILL.md (18,632 total)

- **Defect found by the trials.** `references/astro-primitives.md:17` describes `Card layout="horizontal"` with `max-width` container and viewport queries, contradicting the min-width rule in `responsive-architecture.md`.
- **Test 1 (decisions).** `SKILL.md:55` states the right ladder (intrinsic → container query → media query) as one sentence of prose; the reference repeated it as a numbered list without reasons. *Piloted:* `references/responsive-architecture.md` is now a three-row decision table with an "If…" column and a "Why" column. `SKILL.md:98–103` (the five-point rubric) is a good checklist already.
- **Test 2 (why).** 0.2 why-markers per 1,000 words in SKILL.md. Examples without reasons: `SKILL.md:63` "always pass `loading="eager" fetchpriority="high"` to above-the-fold hero" (the reason is LCP; one word would do); `SKILL.md:66` the View Transitions bullet lists 250 ms, 600 ms and 20 ms without saying what each protects against; `SKILL.md:57` "Avoid styling through IDs…" (the reason, specificity escalation, is implied).
- **Test 3 (soft).** `SKILL.md:48` "canonical/hreflang metadata where appropriate"; `SKILL.md:51` "when a shared rule or component is appropriate"; `SKILL.md:56` "OKLCH where suitable"; `SKILL.md:72` "progressive enhancement where practical"; `SKILL.md:74` "a usable non-JavaScript/content fallback as appropriate". Each can be replaced by the condition (for example "on every page with a translation").
- **Test 4 (every line).** `SKILL.md:8` repeats the optional-`DESIGN.md` and command-availability preamble that `site-art-direction/SKILL.md:8` also carries. `SKILL.md:121–132` is the shared verification loop.
- **Test 5 (focus).** `SKILL.md:59–67` are seven bullets of 100–250 words each that catalogue every Baseline utility (`.bento-grid`, `.stack-cards`, `data-filter-*`, ClientRouter, fonts API, Server Islands, Actions). They load on every presentation task, including a one-component change. **Proposed:** move them to `references/baseline-utilities.md` behind a "which utility family do I need" table; keep in SKILL.md only the rules that apply to every task.

### 3. site-art-direction — 2,935 words in SKILL.md (12,808 total)

- **Test 1.** `SKILL.md:77–80` hero specimen strategy is a mandatory choice written as three examples with sectors in parentheses. It already nearly works as a decision; make it a table: *if the offer is software/data → live-coded specimen; if multi-service studio → capability stage; if physical place/product → art-directed photography; if the brief fixes another treatment → record it*. Same for `SKILL.md:82` (header archetype) and `SKILL.md:48–52` (expressive range: "Choose a deliberate level for each dimension").
- **Test 2.** Good reasons exist: `SKILL.md:88` ("A centered hero… can all be correct when the content and identity justify them. Require a reason…") and `SKILL.md:147` (the logo-swap test). Missing: `SKILL.md:73` display tracking `-0.03em` to `-0.04em` and line-height `0.95–1.08` have no stated reason (large type looks loose at default tracking), so an agent cannot tell when a display face needs different values.
- **Test 3.** `SKILL.md:18` and `:20` "materially different"; `SKILL.md:48` "deliberate level"; `SKILL.md:94` "meaningful decision"; `SKILL.md:154` "Resolve material weaknesses". `references/brand-assets.md` has the highest soft rate of any craft reference (11.2/1k).
- **Test 4.** `SKILL.md:96` is a 250-word copy of the design-surface rule; `SKILL.md:8` the shared preamble; `SKILL.md:156–169` the verification loop. `references/design-iteration.md` is 4,406 words; its "Efficiency and honest evidence" section repeats caveats that appear in nearly every reference.
- **Test 5.** One job, mostly. `design-iteration.md` mixes surface choice, the HTML comparison recipe, review loops and Claude Design checks; a split into *surface choice* and *comparison/review recipe* would let the common HTML path load half as much.

### 5. brilliant-site-design — 1,722 words in SKILL.md (6,054 total)

- **Test 3.** Highest soft rate of the eleven (5.3/1k): `SKILL.md:49` "meaningful structural differences"; `SKILL.md:51` "after each meaningful batch"; `references/baseline-mapping-and-export.md:65` "Keep single-line labels intrinsic where appropriate"; `:11` "Use sampled constants deliberately".
- **Test 4.** `references/baseline-mapping-and-export.md` uses "trial" 13 times: findings are written as a log of what happened in one trial rather than as rules. Rewrite each as the rule plus its evidence in one clause, and move the trial record to `audit/`.
- **Test 1.** `SKILL.md:36` already has a knowledge-routing table. Keep that pattern.

### 8–10. penpot-, openpencil-, opendesign-site-design

Small and mostly concrete. Shared problems: the identical audit sentence in three files (see boilerplate table), "meaningful grid rhythm" in the rubric at `penpot-site-design/SKILL.md:32` and `openpencil-site-design/SKILL.md:38` (the rubric in `astro-site-design/SKILL.md:101` says what it means: no two consecutive equal three-column rows; reuse that wording), and "when useful" at `penpot-site-design/SKILL.md:16` and `openpencil-site-design/SKILL.md:14`. `openpencil-site-design/references/baseline-jsx-recipe.md` has 8.6 soft/1k ("intentionally", "deliberately owned collection").

## Procedural and policy guidance

Completeness and safety rules must stay intact here. The aim is less size and duplication, not fewer rules. All proposals below keep every gate, ownership rule and production safeguard.

### 1. new-site-workflow — 9,439 words in SKILL.md (15,949 total) — piloted

- **Test 5.** The whole file loaded for any workflow task, including a one-field change. Stage 7 cutover rules, the SSR performance checklist and the brownfield track list loaded when a user asked for a copy edit.
- **Test 1.** Track choice was spread over four places: `SKILL.md:25–30` (track list), `:79–91` (Express defaults and "assess complexity beyond the heuristic"), `:93–95` (Express section restating the thresholds) and `:327–329` (partial requests). No ordered decision.
- **Test 2.** 0.5 why per 1,000. Example: `SKILL.md:33` "Do not load every skill up front" without the reason.
- **Test 3.** *material/materially* 16 times, e.g. `:173` "unless they affect architecture", `:196` "only when they materially change the direction", `:206` "a material unresolved decision"; "suitable" at `:39`; "when needed" ×3.
- **Test 4.** The design-surface rule twice (`:196`, `:200`); the plugin list duplicated from `emdash-site-setup`; the verification loop; Express thresholds stated three times.

**Pilot (this branch).** SKILL.md is now a 2,485-word router: profile routing and the command-availability rule unchanged; a five-branch ordered track decision with reasons; a stage map table naming the reference, specialists and exit gate per stage; the art-direction gate kept in place; a short decision/question policy with reasons; a conditional-reference table; the partial-request and maintenance loop unchanged. The stage text moved **verbatim** into five references (`express-track.md`, `brief-platform-content.md`, `art-direction-and-calibration.md`, `build-verify-launch.md`, `decisions-and-release.md`). Only links, "above/below" pointers and one duplicate design-surface paragraph were changed in the moved text. Every selector, value, command, handoff prompt and **Gate** paragraph is preserved; the router's gate column is a summary and says that the reference wording governs.

Not done in this pilot: tightening soft words inside the moved text. That is a separate, reviewable diff once the structure is accepted.

### 4. wordpress-to-emdash-content — 4,310 words in SKILL.md (8,161 total)

- **Defect (fixed in this branch).** `SKILL.md:24`, the row-per-locale rule, had its code identifiers corrupted into control characters (`\t` and `\f`) — the field names `translation_group`, `translationOf`, `title_en`, `facilities_en` rendered as `ranslation_group`, `itle_en` and similar. This looks like backtick escapes processed by a shell. The rule is safety-critical (duplicate language fields break the editor and per-locale publishing).
- **Test 4.** Large overlap with `docs/wordpress-migration.md` (exporter install, WXR fallback, Elementor kit). Keep the procedure in one place and point to it.
- **Test 3.** `SKILL.md:58` "sensible defaults"; `references/forms.md:33` "a couple of suitable options"; `forms.md:163` "consent/retention metadata as needed".
- **Test 5.** `references/forms.md` (3,851 words) is already split out; it covers classification, providers, a native schema and code. A further build/review split is possible but low priority.

### 6. emdash-site-setup — 3,066 words

- **Test 1.** Already strong: `SKILL.md:24–29` hosting × sandbox table is the best decision table in the set, with the reason ("to avoid enabling unused sandbox infrastructure").
- **Test 4.** `SKILL.md:34–48` plugin registry table is the canonical copy; the workflow's copy now lives only in `brief-platform-content.md` and should become a pointer in step 2 of the follow-up plan.
- **Test 3.** `SKILL.md:12` "Confirm only choices that materially affect the project". `SKILL.md:108` "Replace the runtime adapter/database/storage deliberately".

### 7. emdash-production-cutover — 2,335 words in SKILL.md (3,523 total)

- **Test 3 in safety rules.** `references/contact-forms.md:20` "Add a suitable rate limit and/or server-verified challenge" — a security control with no value. Replace with a concrete default (for example N submissions per IP per window, with the provider's challenge) or a decision on who sets it. `contact-forms.md:72` "meaningful status codes"; `:90` "Deliberate configured behavior"; `SKILL.md:80` "as appropriate" in the rollback instruction.
- **Test 2.** 0.3 why per 1,000; the sequence (recovery before changing the auth origin) is correct but does not say why (a changed origin can invalidate passkeys and lock out the only admin). One sentence would let an agent handle an unlisted auth mode.
- Keep everything else: it is ordered, scoped and already refuses unsafe shortcuts.

### 11. emdash-content-modeling — 1,946 words in SKILL.md

The model for the others. `SKILL.md:20–31` is an explicit decision table (relation vs enum vs repeater vs blocks vs fixed fields vs rich text) with "when to use" conditions; soft rate 0.7/1k. Small improvement: the table has no "why" column; `references/schema-evolution-checklist.md` has the highest why rate in the set (4.8/1k) and shows the style.

## Pilot behaviour comparison

Protocol, frozen before edits: history-free subagents get the same prompt against two neutrally named fixtures containing root `AGENTS.md`, `README.md`, `package.json`, `docs/` and the eleven skills, at the base commit (*before*) or with this branch's skill changes (*after*). Workers plan only; they write an answer and a list of files read. Answers are scored against acceptance criteria written before any run.

Tasks:

- **T1 Express greenfield** — five-page, French-only site, developer-maintained, no canvas requested. Nine criteria: Express with the threshold reason; static profile and no CMS specialists; at most three consolidated checkpoints; Art Direction Record and `check:art-direction --require-record` before visual work; `/_styleguide/` calibration and record; HTML concepts by default with the three named alternatives once and two or three distinct directions; shared spacing with balanced density as a labelled default; `media:prepare` before adding photos; ends at verify + build with no unauthorized deployment.
- **T2 Migration audit** — bilingual Elementor WordPress site with events, sessions and venues and three browser editors; owner asks for an audit. Nine criteria: plan and decisions first, audit is not authorization; Standard track; EmDash recommended; Exporter ZIP plus private key with WXR fallback, public URL not sufficient; optional Elementor kit; content-candidate register; row-per-locale; Eventual considered first; release completion in the plan with deploy, content transfer and DNS separately authorized.
- **T3 Responsive card** (craft pilot) — one card in a grid, a sidebar and a full-width band. Seven criteria: container query with the reason; container on a wrapper or list item, not the card itself or only the grid; narrow default outside `@container`; named container; threshold content-derived; `minmax(0, 1fr)` or `min-inline-size: 0` and no fixed heights; review list including narrowest placement, widths around the switch, odd content and 400% zoom.

### Results

Criteria met (a partial counts ½). *Before* = base commit; *after* = this branch; *after (rev.)* = after the fix described below.

| Task | Model | Before | After | After (rev.) |
| --- | --- | ---: | ---: | ---: |
| T1 Express greenfield | Sonnet | 9 / 9 | 9 / 9 | — |
| T1 Express greenfield | Haiku | 9 / 9 | 9 / 9 | — |
| T2 Migration audit | Sonnet | 9 / 9 | 9 / 9 | — |
| T2 Migration audit | Haiku | 8 / 9 | 8.5 / 9 | — |
| T3 Responsive card | Sonnet | 7 / 7 | 7 / 7 | — |
| T3 Responsive card | Haiku | 7 / 7, 7 / 7 (2 trials) | **4.5 / 7** | 7 / 7, 7 / 7 (2 trials) |

What the trials show:

- **No regression from the workflow split** on either model, on the two workflow tasks. Both after-runs used the new track decision by name ("branch 4", "Standard rule applies on each count") and opened the stage reference for the stage they were planning. The Haiku T2 misses were the same on both variants: neither said outright that a public URL alone does not authorize a full import (B4 partial). The before-run also left commit/push out of release completion (B9 partial); the after-run included it, after reading `decisions-and-release.md`.
- **No measured improvement on these tasks either.** Sonnet scored at ceiling before the change, so these tasks cannot show a gain; Haiku was close to ceiling. The case for the split is size and focus (test 5) with behaviour held equal, not better answers on these three prompts.
- **Words loaded did not drop for whole-plan tasks.** T1 asks for the full plan, so the after-runs opened every stage reference: estimated skill words read rose from about 23,400 to 29,500 (Sonnet) and fell slightly from 26,000 to 24,700 (Haiku). On T2 the after-runs read 12,400 vs 15,700 (Sonnet) and 19,300 vs 13,700 (Haiku) skill words. These come from self-reported file lists and vary with what each worker chose to open. The saving the router is designed for is on a single-stage or scoped request, which these tasks did not test.
- **The craft rewrite caused a regression, which was then fixed.** The first after-version of `responsive-architecture.md` told the reader to "pick the lowest number that solves the problem". Haiku then chose intrinsic `flex-wrap` (row 1) for a card with two named arrangements and kept the container query only as a fallback, failing C1 and partly C2/C3. The fix states the boundary (two named arrangements belong in row 2) and gives the reason (a `flex-wrap` switch point is the sum of flex bases and gaps, not a tested width). Two fresh Haiku trials on the revised file chose the container query and passed 7/7, matching the two before-trials. Net: behaviour parity, and the reasons are now written down for the next unwritten case. The file grew from 806 to about 1,200 words to carry those reasons and the review checklist.
- **The trials found a further defect.** Haiku pointed out that `references/astro-primitives.md:17` documents the shipped `Card layout="horizontal"` as `@container (max-width: 32rem)` plus a viewport `@media (max-width: 40rem)` fallback. That is desktop-first, and it contradicts the reference's own rule to keep the narrow layout outside the query and enhance at `min-width`. It is component behaviour, so it is a follow-up, not part of this pilot.

One anomaly: a Haiku before-run tried to open `references/express-track.md`, which does not exist on the base commit, and said so. The likely cause is the worker's own guess at a file name; it did not change its answer.

## Limits

- One trial per task, variant and model. No statistical claim; a single miss or pass can be noise.
- Planning answers, not implementations. The trials show what the agent says it will do, not what it does on a real build.
- The grader is the agent that wrote the edits. Criteria were frozen first, but grading was not blind.
- Files-read lists and their order are self-reported by the worker, not instrumented, and words loaded are estimated from those lists.
- Only the Claude models available to this session were tested; behaviour under other agent runtimes that read `.agents/skills/` (for example Codex) is untested.
- Soft-word counts are lexical flags, not judgements; each cited example was read in context.
