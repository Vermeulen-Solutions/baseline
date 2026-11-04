# Discovery and content-planning pilot

Date: 4 November 2026. Scope: reusable workflow guidance plus one synthetic planning rehearsal. No application routes, CMS records, seeds, site tokens, runtime dependencies or production systems changed. The reviewed branch is `codex/discovery-content-planning`; release scope is commit and push, with no site deployment.

## Recommendation and implementation

Use adaptive discovery within the existing delivery stages, then connect the strategic synthesis to priority page briefs, actual copy, section arguments and content acceptance. Keep the existing document ownership, profile boundaries, design gate, component calibration and browser/editor acceptance. The implementation adds a focused workflow reference, expands the optional project template, aligns workflow/design guidance and kickoff prompts, and ships the reference through the shared skill manifest. Existing sites adopt the reference together with its callers through reviewed maintenance; their brief, content and accepted design are retained.

## Exercise and evidence boundaries

A fresh subagent received only a supplied fictional chair-repair brief, the updated optional template and the discovery/content reference, without the preceding chat or an intended headline/composition. The brief supplied the audience, service scope, starting price, enquiry stages, a demonstration method and publication restrictions. It left strategy wording to the agent and contact/form delivery unresolved. The requested output was two complete copy drafts, priority page briefs and a standalone grayscale composition, not a complete site. The selected direct HTML concept remained outside the repository under an isolated `audit/visual-concepts/` path.

Raw/generated artifacts were reviewed in an isolated temporary folder and delivered outside this repository in a local pilot package. They include the supplied brief, exact template/reference snapshots, copy, composition, HTML concept, screenshots, check runner, receipts and integrity manifests. They are not distributed as starter content. This record contains only synthetic/generalized observations. Input snapshots remain unchanged even after the later guidance clarifications described below.

## Observed results

| Intended behavior | Observed evidence | Assessment |
| --- | --- | --- |
| Reuse supplied answers and choose useful depth | The agent selected core discovery and continued drafting without replaying intake. It left missing contact/delivery details with their owners. | Met for this complete supplied brief; live interview behavior untested. |
| Choose the representative route by journey | The service page was selected because suitability, scoped cost and photo review versus inspection were the central uncertainties. | Met; selection was reasoned rather than homepage-first. |
| Create actual copy as well as planning tables | Complete Home and service-page drafts accompanied briefs/section arguments for four planned routes. Editorial evidence annotations were separate from public prose. | Met; the other two routes received briefs only, as scoped. |
| Let evidence change composition | The agent used the supplied demonstration method rather than a testimonial/logo/metric strip, and explained price before the longer method section. | Met; the composition followed the argument and available material. |
| Preserve claim and publication limits | Private praise was absent from public drafts; the demonstration was not presented as a customer result. Starting-price inclusions, inspection/quote limits and the absence of a completion promise remained explicit. | Met in manual review against the synthetic sources. |
| Keep operation and acceptance honest | Planned enquiry links were identified as unimplemented. No live form, booking, payment, research or publication was simulated. | Met within planning scope; delivery/recovery needs real implementation acceptance. |

The parent reviewed the complete copy and composition and visually inspected narrow/wide full-page screenshots. The agent's existing local headless browser runner checked 320, 375, 720 and 1440 pixel widths offline: no horizontal overflow, overhanging elements, page errors or console errors; one H1 and seven ordered sections; no scripts, forms or external assets; skip-link keyboard entry; one-to-three process columns and one-to-two enquiry columns. The four recorded requests were local file loads. Primary action hrefs matched the planned enquiry route; those missing routes were not claimed to work. Source input hashes matched their original manifest.

## Friction and narrow refinements

The first run identified ambiguity between a page brief and its complete customer-facing prose. The optional template now explicitly says that the brief accompanies the full draft and that editorial claim/source notes stay separate. It also distinguishes a known destination route from an unresolved delivery endpoint, so planning can proceed without implying working submission.

The parent needed to clarify the isolated concept directory during the exercise. The reference now states the optional `audit/visual-concepts/` convention and asks for clear labels on draft material and planned destination pages. This preserves the existing concept exception and does not waive the real site's art-direction or calibration requirements.

These are targeted clarifications supported by the observed exercise, not a new mandatory artifact or checkpoint. The independent generation used the original updated snapshots; the three subsequent wording clarifications did not receive a second independent generation trial. Structural/distribution checks do not establish equivalent model behavior.

## Source and artifact identity

Base revision: `91b6239f62801e0b1539a3e2aa0740b76c2b10ba`. SHA-256 identities below bind the evaluated artifacts and final maintained guidance; maintained Markdown hashes normalize line endings to LF. Raw artifact hashes match the delivered package's manifest.

| Item | SHA-256 |
| --- | --- |
| Supplied fictional brief | `95bc75a85e6f9378e3d59e43cb4f17e831969143b76d5e932b26bc556dae7831` |
| Evaluated template snapshot | `8eb014083b64b5c558f1109bea5c0f3ff02533ca7800911175aaa88517626d4d` |
| Evaluated reference snapshot | `f6a30777132f0d3a95be0d0d8f0e623e4b350462e21b72a18195d65e476c8bfe` |
| Produced copy | `65e17324f3501a4abd382a1cd2493ad7ba255e1561e2d26d566e35dc1387e267` |
| Produced composition plan | `2519006e32c1929d2c901de6f91a7aa16ec3b6f2b274d7c0f47dedd1459c00d3` |
| HTML concept | `3e27e2c0be31f789a70bf36abf59d1ca54b4b0405096bf3b2986584992d4fa12` |
| Final `PROJECT.example.md` | `b3ece6c069a65dc02626483a5d749fc9b3d0cefdae686f52cb62f9c426df8339` |
| Final discovery/content reference | `8631a09519894467952e1ed3d254e3d1e4bd4f5bf0ce1e7e43d72f05d12ac66d` |

## Acceptance limits and next use

Final repository verification after the wording refinements passed on Windows with Node 24.21.0: `doctor`, `verify:fast`, `verify` (300 unit plus 156 rehearsal tests; typecheck zero errors/warnings and one existing deprecated-copy hint), `build`, and `audit:html` (9 emitted HTML files plus 10 representative linked public responses). The build retains its existing large-chunk warning. Three edited skill entry points passed the skill validator. `test:profiles` passed independent install/clean-install, verify, production/fixture builds and HTTP checks for both generated profiles. The final changes add no application visual source or client scripts, so no root screenshot baseline was updated. The HTML audit's representative capture is not acceptance of all 224 runtime route patterns.

This single rehearsal demonstrates supplied-brief-to-copy/composition behavior. It does not test an incomplete live interview, conflicting stakeholders, a public-information service, another model/runtime, actual user comprehension, final visual design, accessibility conformance, CMS editing, working form delivery or commercial performance. The grayscale concept is not a production-ready site, a calibrated component system or an accepted Art Direction Record. No speed or token-efficiency comparison was measured.

Use the guidance on the next authorized real project, recording whether questions are repeated and whether the synthesis materially changes copy and composition. Additional interview or information-service trials can be scoped when useful; they are not new prerequisites for ordinary site work. A hypothetical post-launch business review still needs real baseline/target evidence and an owner, without automatic analytics or monitoring.
