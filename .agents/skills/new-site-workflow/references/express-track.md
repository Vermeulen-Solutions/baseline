# Express track

Read this when the track decision in `SKILL.md` selects Express. Express runs the same stages, specialists and CLI gates as Standard; it only consolidates open decisions into up to three checkpoints. The decision and question policy is in [decisions-and-release.md](decisions-and-release.md).

## Express defaults

Present the defaults below briefly at the checkpoint they belong to and record approved versus assumed decisions in the established context home; keep the selected visual direction and density with the Art Direction Record in `AGENTS.md`. Defaults are revisable, not approval claims:

- Recommend `static` when developers/agents own file edits. Ask about editing needs before selecting a browser CMS or relational platform; record the selected profile.
- Use the brief/content language as a labeled assumption. Resolve ambiguity or extra locales before committing to URL/schema structure.
- For a new site, compare two or three structurally distinct directions side by side at the concept checkpoint, as `AGENTS.md` and Stage 4 require, and say which one you recommend from the brief and why; preserve supplied identity in all of them. Express shortens the decision around the comparison, not the comparison itself, because a single direction gives the owner nothing to choose against. A small refinement of an accepted direction needs no new comparison. Explain lane names in everyday terms.
- Use **shared layout spacing** and calibrate density from the brief/reference; assume **balanced** density when no cue exists. Explain that the gaps adapt to screen size and remain locally adjustable. Do not ask users to opt into a CSS policy. Ask about compact/balanced/spacious feel only if it affects an unresolved visual decision.
- Compose native primitives, editorial flow and progressive enhancement. Add browser JavaScript only for a required interaction. No third-party tracking by default; discuss it when measurement is requested.
- Use real supplied content or explicitly marked local drafts. Identify the owner of missing material; do not publish filler or assume draft/legal approval.
- Keep all verification gates and honest evidence. A local verified build is the delivery default until deployment is authorized; deferred manual/editor acceptance stays recorded.

Assess complexity beyond the `<= 6` route / `<= 3` collection / single-locale heuristic: count route archetypes separately from repeated entries and consider migrations, roles, relationships, integrations, authentication/payments and translation. Move to Standard when these warrant it and explain why. Express consolidates decisions; it does not waive modeling, quality or editor acceptance.

## Checkpoints

Execute the same specialist skills and CLI gates as Standard (`check:art-direction`, `design:tokens`, `audit/component-calibration.md`, `verify`) with **up to three consolidated checkpoints**, using the decision policy and defaults above. Each stage reference still governs its stage: read it when the checkpoint reaches that stage.

1. **Checkpoint A (Stages 1–3 — Brief, Platform & Content Schema):**
   - Document the brief and route rationale in the established context home, choose the Platform Profile in Stage 2, then follow its Stage 3 content branch. Link the actual route inventory. On static profiles define native Zod schemas and routes; only EmDash uses CMS specialists and the SQL budget.
   - **Checkpoint A Handoff Prompt:**
     > **Express Checkpoint A Complete: Brief, Platform & Content Schema Ready**
     > - **Platform Profile & Hosting:** [static / static-sveltia / emdash; chosen host]
     > - **Collections & Routes:** [List collections and routes]
     >
     > Next is **Checkpoint B (Stages 4–4.5: Art Direction & Component Calibration)**.
     > **Visual direction:** [Recommend one direction from the brief in plain language, with its density and shared spacing defaults; judged references and the side-by-side comparison of two or three directions follow at Checkpoint B. References are found by the agent; ask only for identity information that changes the direction.]
     > - **Look and feel:** [For example: clear and restrained, warm and editorial, or bold and technical; connect the recommendation to this site's audience.]
     > - **Spacing:** Shared responsive defaults, with [brief-led density; balanced if unspecified] and [any deliberate layout exceptions].
     > - **Missing input:** [Ask only an unresolved brand/reference or density question; otherwise record the recommendation/assumption and continue.]

   Include the **Layout spacing choice** explanation from [art-direction-and-calibration.md](art-direction-and-calibration.md#layout-spacing-choice-standard-and-express) in this same handoff. Express uses shared defaults unless the brief or user calls for custom spacing; do not add a separate technical question or checkpoint.

2. **Checkpoint B (Stages 4–4.5 — Art Direction & `/_styleguide` Calibration):**
   - For a new site or a significant redesign, first run the required [reference research](../../site-art-direction/references/reference-research.md) (at least eight candidates captured and scored, at least three selected above the bar) and the [world](../../site-art-direction/references/world-building.md) (inventory, source object, kit, decisions), then the concept comparison from Stage 4 in [art-direction-and-calibration.md](art-direction-and-calibration.md): two or three structurally distinct directions side by side, with your recommendation, and one selected before tokens are written. Skip it only for a small refinement of an accepted direction.
   - Then run `npm run design:tokens -- --init-client --lane <lane>` (or `--seed-accent <hex>`). `--init-client` applies the lane, saves the tokens, writes the record and the calibration table and prunes the starter exceptions in one step; on a site that already has its own tokens, use `--lane <lane> --write --write-record --write-calibration` instead so nothing is pruned. Refine `## Art Direction Record` in `AGENTS.md` and tokens in `src/styles/global.css`, pass `npm run check:art-direction -- --require-record`, and calibrate primitives on `/_styleguide` (`audit/component-calibration.md`).
   - **Checkpoint B Handoff Prompt:**
     > **Express Checkpoint B Complete: Art Direction & `/_styleguide` Calibrated**
     > - **Art Direction Gate:** [Actual command and result; the saved record and passing gate do not imply user approval.]
     > - **Contrast, tokens and specimens:** [Report the actual checks, results and unresolved limitations; automated checks are not accessibility certification.]
     >
     > Next is **Checkpoint C (Stages 5–6: Full Route Assembly, Impeccable Critique & Verification)**.
     > [Continue authorized implementation; offer the preview for inspection without requiring a continuation reply.]

3. **Checkpoint C (Stages 5–6 — Route Implementation, Critique & Full Verification):**
   - Implement public routes using the selected profile (native `getStaticPaths()`/`render()` for static; `<Base content={{...}}>` + `{...entry.edit.*}` for EmDash), run the Impeccable passes in [impeccable-passes.md](impeccable-passes.md) (`critique` per representative page with a persisted snapshot, two rounds at most, the refine commands its findings call for, then `polish`; `audit` per route family), then run the Stage 6 checks in [build-verify-launch.md](build-verify-launch.md): `npm run verify`, `npm run build` and `npm run check:dev-tools` on every profile, `npm run check:quality` and `npm run audit:ui` against the served build, plus `npm run audit:html` against that fresh build on EmDash and `npm run search:index` with its browser acceptance when search was chosen at Checkpoint A. Report the Stage 6 handoff with actual acceptance and any remaining launch work.
