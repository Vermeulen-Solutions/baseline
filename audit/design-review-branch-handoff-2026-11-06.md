# Design-review branch wrap-up — 6 November 2026

Quick audit of `codex/design-review-surfaces` against fetched `origin/main` (`f5a6785`), with merge base `89d3e11810a0df05ef3bbe35672c25c90abc3584`. The reviewed branch had seven implementation commits through `bebd9c0`, 46 maintained implementation/instruction/distribution files and 213 evidence files. This pass reviewed the functional changes, policy/distribution consistency and evidence boundaries; it did not replay all app trials or re-review every historical image. The evidence files total roughly 27 MB together with the maintained changes.

## Corrections

- The prompt checker treated a leading prohibition as applying to a later action joined with `and`. Consequently `Do not ignore accessibility and disable reduced motion` returned no finding, and a prohibited-proof sentence could hide an explicit request for fake logos. Bounded action-clause splitting now reviews those later commands independently. Regression cases cover proof, motion, accessibility, mixed palette mandates and a still-negated noun list. This remains a conservative English heuristic, not a general language parser.
- System-font-ban messaging could conflict with the branch's preservation of approved custom typography. The message/fix and adaptation guidance now preserve the approved pairing; an approval declaration in the same clause remains a review finding rather than an automatic P1 conflict. Fallback/dependency decisions still require real project evidence.
- A touched documentation page retained a pre-existing broken link to local role-acceptance notes. It now identifies those notes as unbundled historical evidence rather than presenting an unusable link.

## Checks and limits

Fifty-four targeted tests passed across `design-prompt-check`, `platform-profiles`, `skill-sync`, `baseline-sync` and `profile-delivery`. Docs formatting and changed-file whitespace checks passed. A local-link scan covered the changed maintained Markdown pages. The prior implementation tip `bebd9c0` passed [CI run 42296886072](https://github.com/Vermeulen-Solutions/baseline/actions/runs/42296886072); that is prior-tip evidence, not the audit-fix commit's CI. Normal commit hooks also apply. Full site/profile and live design-app rehearsals were not repeated, per the requested quick scope.

The read-only merge-tree check against current main was clean and retained main's `minimatch`/`zod` overrides. The branch itself predates those main changes: assess the actual merge result, not a two-tip diff that would misleadingly resemble their removal. No merge, dependency update or production change was performed. No additional merge blocker was identified in this bounded pass; an independent review remains requested.

## Prompt for the independent reviewer

```text
Independently review codex/design-review-surfaces in Vermeulen-Solutions/baseline, fix concrete blockers, then merge it to main when ready. This is Baseline starter maintenance. Read AGENTS.md and CONTRIBUTING.md first. Use an isolated checkout/worktree; preserve C:/dev/emdash-baseline, its current branch, local .claude state, databases and untracked work. The existing review worktree is C:/dev/emdash-baseline-design-review.

Fetch origin, resolve the branch HEAD and origin/main, and review origin/main...HEAD plus the intended merge result before merging. Give an independent review; do not treat the author's audit or passing tests as proof of correctness. Keep this focused: inspect code, distribution and policy first, reuse existing evidence/CI, and rerun broader or live-app workflows only for a concrete unresolved risk or required merge check. Do not deploy, publish designs, close issues or post issue comments.

Scope and intended behavior:
- HTML/browser concepts default when no canvas is requested. Explicitly present Brilliant, OpenPencil and Penpot; preserve settled preferences. Brilliant is recommended only for a requested editable canvas without a settled tool. All surfaces retain structurally distinct side-by-side concepts and an Astro proof.
- Brilliant work belongs in one named project. The adapter documents tested native components, modes, overrides, copy/undo limits and exports. HTML recreation was imperfect; native film MP4 was rendered, but live in-canvas playback remains unverified. No comparative model-token/speed advantage was measured.
- External-prompt adaptation preserves brand/type commitments and real proof. Check the regex findings, severities, bounded negation and CLI behavior; approval keywords cannot authenticate evidence.
- New asset, illustration, screen-reader and optional visitor-research references belong to existing skills. The scoped SVG policy must not mutate the Impeccable mirror. Charts/3D/video are brief-dependent options. No actual reader session or participant study was claimed.
- Review fresh-profile distribution and legacy adoption separately: new sites ship the complete guidance; existing sync must preserve membership, local edits and provenance. No design app/runtime dependency should become mandatory.

Start with scripts/check-design-prompt.mjs, scripts/skill-sync.mjs, scripts/sync-baseline.mjs, their changed tests, profiles/manifests/shared.json, root/static AGENTS and maintained skill references. Follow links into the Brilliant reports and catalogue/asset studies as needed. Treat audit exports/receipts as bounded evidence, not production output or vendor API authority. See audit/design-review-branch-handoff-2026-11-06.md for the author's quick-audit fixes and checks, then verify them independently.

Current main has dependency overrides from f5a6785 that are absent from this older branch tip. A normal merge-tree check retained them; preserve those main changes and recheck the actual merge result. Check CI for the exact reviewed HEAD.

Report actionable findings with severity and file:line. Fix concrete blockers on the branch, run appropriate regression checks, and reassess; do not implement speculative improvements or repeat the whole design workflow. Once no blockers remain and required checks for the exact candidate pass, merge through the repository's normal process and push main. Preserve branch protections and main's unrelated changes; never force-push. Stop only for an unresolved consequential decision or a merge restriction you cannot satisfy. Finish with findings/fixes, verification, remaining limits and the merged commit/PR identity, or the concrete reason merging remains blocked.
```
