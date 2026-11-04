# Font and token handoff rehearsal, 4 November 2026

This follow-up implements the [approved plan](../docs/font-and-token-followup-plan.md): font-source preflight in the existing design audit, an explicit selected-design-to-token recipe and a bounded optional delegation recipe. No client theme, content schema, root CSS/component, runtime dependency or production state changed.

## Font-source behavior

The design audit now checks literal owned font references before any candidate CSS or companion record/calibration write. It follows bounded local CSS imports, validates exact path casing and regular-file boundaries, checks font signature/container-header consistency, validates CSS face descriptors and reports mappings for all four typography roles. Parsed imported face declarations supplement the existing family-source hints, including faces outside `src/styles`. JSON exposes `fontLoading.preflight` and structured source diagnostics; text distinguishes static source observations from rendered-font proof.

System stacks and shared families remain valid. Existing mixed-case asset names are preserved; new owned names can follow the lowercase convention. Valid older font formats are advisory, as are unresolved package/remote/system-installed/dynamic sources. Declared-package metadata is inspected without executing configuration or scanning dependencies. Exact broken local references fail, including unsupported-format files whose existence cannot be established. Files are not renamed or re-encoded, and source archives are not scanned.

Review found and corrected case-sensitive CSS keyword handling, failure to carry imported font-face evidence into the legacy family check, JavaScript numeric coercion accepting invalid CSS weight values, and ambiguity between a bare local CSS filename and a declared package import. Regression fixtures cover these boundaries. The public CLI test proves a case error prevents CSS, art-direction and calibration writes, then proves a corrected imported face produces a read-only valid preview.

Header checks are not font decoding, internal weight/axis inspection, glyph-coverage testing or proof of actual use. The existing optional public-page browser evidence and native visual calibration remain necessary. Root neutral CSS has system-role mappings and an explicit unresolved package-import advisory; this is not a claim that package CSS was inspected.

## Selected-design-to-token rehearsal

`npm run rehearse:tokens` creates an agent-selected fictional HTML/CSS specimen and disposable CMS source copies with fresh seed data. It uses the installed dependencies through owned junctions, not an independent install. It does not operate an external design application or claim human design approval. The primary agent inspected the saved narrow canvas/native renders; their different composition and heading sizes remain intentional because this trial concerns three shared token relationships.

| Selected design value | Canonical token | Before → after observed on native route |
| --- | --- | --- |
| Forest action ink | `--color-action` | Blue → `oklch(37% 0.092 155)`, matching the selected canvas |
| Card corner radius | `--radius-card` | 12px → 18px at all three widths |
| Fluid card content spacing | `--spacing-content` | 16.5827 → 18.5827px at 390px; 19.7325 → 21.7325px at 768px; 24 → 26px at 1440px |

The original `clamp(1.125rem, calc(0.9583rem + 0.8333vi), 1.625rem)` expression was retained, rather than replaced by viewport samples. A missing source mapping and unknown target token were rejected before write; the preview preserved saved bytes. Exactly three theme tokens changed in the owned copy. Separate production builds supplied the before/after route observations. Native styleguide calibration ran before/after in development and is labeled accordingly.

The native radius, padding and action color matched the selected specimen at 390/768/1440px. Route copy, destinations, unrelated scoped tokens and five working-source hashes remained unchanged. Sampled heading glyphs used Segoe UI in canvas and native rendering; this is a system-font sample, not exhaustive font acceptance. No page runtime or console errors were recorded. Both owned servers/trees were stopped, dependency junctions unlinked and temporary trees removed. Raw evidence is local under `.emdash/visual/token-handoff-1793790578258/`; selected non-sensitive artifacts are copied to the chat artifact directory.

The trial does not establish full-page pixel equivalence, external-canvas roundtrip fidelity, semantic correctness of every possible mapping or a general importer. The documented workflow still requires review of the selected artifact, semantic role/scope, current CSS and intended consumers. CSS owns implemented token values.

## Coordination and release

The new delegation reference permits independent upstream planning/content work while shared contracts are settled, assigns one writer to shared files/instances/canvases and requires integrated acceptance after worker handoff. It adds no mandatory second agent or approval checkpoint. Content ownership and component reuse are explicitly independent decisions.

Helpers/tests and both workflow references ship through existing shared manifests with reviewed additive-adoption instructions. The optional browser rehearsal is maintainer-only and refuses CI. Release checks and the agreed feature-branch endpoint are recorded in the final plan outcome. Earlier broad visual-reference and favicon findings remain outside this follow-up; no reference images were changed.

Final verification passed: doctor, both modified-skill validators, 29 focused design/font/CLI tests, full root verification (326 unit + 156 lifecycle-rehearsal tests and typechecking), both independent generated-profile install/clean-install/verify/build/HTTP runs, and the final-code local token rehearsal. The fresh root build/release-artifact gate and HTML audit passed with nine HTML files and ten captured public SSR responses. Typechecking retains the existing clipboard deprecation hint. Source formatting and scoped diffs passed. No full visual-regression rerun was required for this tooling/documentation follow-up; actual visual acceptance is bounded to the synthetic canvas/native calibration and production comparisons recorded above. Release endpoint is a reviewed feature commit pushed to origin, with no website deployment or merge.
