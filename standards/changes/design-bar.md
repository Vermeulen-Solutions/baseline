---
bump: minor
platforms: [emdash, static]
areas: [tooling, skills, docs]
adoption: copy
visible: no
database: no
files: [scripts/check-art-direction.mjs, scripts/capture-routes.mjs, tests/reference-research.test.mjs, tests/capture-routes.test.mjs]
---

# Reference research: the concept bar judges the design, and captures survive other people's sites

Two trials with an owner's phone photographs stalled under the concept bar: every reviewer named the photographs as the ceiling, the chosen concept stayed one or two points under the references' median, and `check:art-direction` (run by `verify`) could then never pass on an honest site. The same research spent most of its time on captures that timed out, on cookie banners that cost good sites their score, and on a required prompt-library candidate that scores low by construction.

- The concept bar is set on the seven design lines: the chosen concept reaches the selected references' median on first screen, specificity, type, composition, craft, phone and fit together, and scores 2 or more on each. The photographs line is still scored and shown; under 2, it becomes the list of photographs to commission, and the design frames the photographs rather than stretching them.
- No candidate has to be a prompt, template or system. The first round of searches covers the same trade, a neighbouring trade and studio case studies; for a small trade the last two usually fill the selection.
- One fresh reviewer scores; a second moved scores by a point or two and doubled the cost.
- `capture:routes` waits for `load` and then up to 15 seconds for the network to settle, instead of failing on busy sites after 90 seconds; a full-page capture that takes over 45 seconds is skipped while its viewport frames are kept; a page behind a bot wall or one that does not load is reported as `SKIPPED` and the run goes on. `--decline-consent` answers a cookie banner with its reject or necessary-only button (French, English, German, Italian, Spanish, Dutch) before capturing.

## For sites

Copy the two scripts and their tests. A references file whose concept table was under the old bar only through the photographs line now passes.
