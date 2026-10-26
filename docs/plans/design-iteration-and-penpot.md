# Design iteration and Penpot implementation plan

## Outcome and scope

Implement a concrete Baseline design workflow with two independent choices: design surface (direct Astro/browser or Penpot) and agent continuity (same agent or an optional handoff). Neither Penpot nor a second agent becomes a prerequisite. Preserve the explicit typography, surface, layout, action and motion recipes already in the maintained skills. Use the existing art-direction, calibration, content-ownership and release gates.

This is starter workflow/tooling work on `codex/penpot-design-workflow`, starting at `519a0fe`. It does not redesign the starter, provision a service, import CMS content, change production data or deploy a client site. The user authorized practical tests in the open Penpot file named “Baseline test”; keep test writes in clearly named owned pages/boards, confirm file identity first and preserve existing objects. Commit and push the verified starter changes. A site deployment is inapplicable to this template-only release.

## 1. Decision flow and user control

At the existing design/concept checkpoint for a new site/substantial overhaul, recommend canvas-led iteration and offer OpenPencil, Penpot and direct Astro/browser as first-class paths. Reuse a working user-preferred canvas and follow `site-art-direction/references/design-iteration.md`: focused representative concepts, direction selection, a native Astro proof, then rollout. Canvas comfort motivates this recommendation; relative speed and token savings remain unmeasured. Retain named external alternatives when explicitly preferred. Reuse settled preferences. Small refinements continue in the accepted world without restarting concept discovery or requiring a tool choice. New sites and substantial redesigns develop two or three materially different representative concepts before broad route assembly.

Ask about another agent only when the user wants that split. Same-agent design and implementation are a complete supported path. Switching agents is an optional handoff operation, not a mandatory stage, extra subscription or automatic subagent launch. Different agents can work sequentially on the same approved design artifact; do not assume simultaneous writers are safe.

| Path | Design work | Review | Implementation |
| --- | --- | --- | --- |
| Direct Astro, same agent | Isolated native concepts/real component variants | Browser comparison and selected direction | Existing Astro components and CMS/file bindings |
| Penpot, same agent | Connected agent edits the selected Penpot file | Canvas/structural/visual checks, approved board IDs | Same agent translates through Baseline's Astro skill |
| Penpot, optional other agent | A portable Baseline brief guides the chosen design agent | User approves named boards and records decisions | A fresh session/agent reads the packet and Penpot state, then implements |

## 2. New Baseline-owned skill

Create `.agents/skills/penpot-site-design/SKILL.md` and `.agents/skills/openpencil-site-design/SKILL.md`, Codex discovery metadata and focused references for connection/API, Baseline mapping and design iteration, and optional handoff/Astro translation. Add portable brief and acceptance/handoff templates. These skills trigger for Penpot or OpenPencil work in a Baseline site; they do not take ownership of CMS schemas, deployment, generic plugin installation or all frontend work.

The skill must contain concrete examples, not just cross-links. Map Penpot variables/components to actual `Section`, `Container`, `Grid`, `Sidebar`, `Card` APIs and `.btn` variants; retain four typography roles, three surface tiers, `7/5` or `8/4` bento pacing, hairline rules, 1440/390 frames and meaningful interaction states. Use actual source values and fonts rather than neutral tokens on an existing branded site. Preserve fluid CSS expressions and contextual spacing ownership; a canvas measurement at one width is a sample, not a replacement token definition.

Keep source CSS authoritative for implemented values, AGENTS.md authoritative for approved direction, and CMS/file content authoritative for editorial facts. Penpot holds proposals and approved visual references. Briefs and handoff packets are derived exchange artifacts, not a second permanent token store. Read existing project decisions instead of forcing PROJECT.md, a new design schema, Style Dictionary or another renderer.

Use official Penpot API documentation and actual registered tool schemas. Review the linked community skill for implementation lessons without importing its generic React/fixed-grid defaults or changing upstream mirrors. Cite sources; record source versions/observation dates honestly. No claim that the develop branch exactly matches the hosted server.

## 3. Penpot onboarding

Document an already-connected fast path and the hosted onboarding path: enable MCP in Penpot account integrations, create/copy the private MCP connection URL, configure the chosen client using its real supported format, open the intended file, connect its plugin, run a read-only smoke check, confirm file/page identity, then attempt a small reversible design operation. Keep the Penpot tab awake. Explain one active MCP tab/current-page targeting, remote asset/export limits and sequential client handoffs.

Check installed client support instead of presenting a fabricated universal JSON configuration. Document Codex and OpenCode separately, using placeholders and private user configuration. Keep tokens out of tracked `.mcp.json`, examples, command output, screenshots, receipts and URLs passed to web-search tools. Prefer environment/private client storage where the client actually supports it; do not invent URL environment interpolation. Use an ephemeral in-memory connection for this session's supplied temporary key. Do not change global MCP configuration merely to run tests.

Offer local MCP as an advanced alternative when controlled local asset access is needed. Distinguish stable user documentation from develop-source examples. No automatic account creation, key rotation, plugin marketplace installation or repeated setup when the existing connection works. If activation requires a user action, ask for that exact action while continuing independent implementation.

## 4. Workflow integration and distribution

Update `new-site-workflow`, `site-art-direction`, `astro-site-design`, root/static instructions and the prompt library so the surface choice and optional handoff are consistent. Add concrete starter prompts for direct Astro, Penpot same-agent, Penpot separate-agent and implementation from an approved design. Preserve the audit → plan → selection → implementation → verification → applicable release policy.

Ship the new skill in the shared manifest for static and static-sveltia and in the root EmDash template. Update the maintained-skill synchronization inventory, schema/contract declarations where required and distribution tests. Existing installed sites retain bounded reviewed updates: document explicit adoption of added membership rather than silently expanding a managed static receipt or fabricating provenance. Do not add Penpot runtime packages, a server dependency or credentials to generated sites.

## 5. Practical acceptance

The user additionally requested an OpenPencil desktop comparison. Use the official `open-pencil/open-pencil` distribution and matching app/MCP release, preserving its upstream skill rather than confusing it with commercial Pencil or unrelated similarly named projects. Run the same neutral brief, desktop/mobile composition, concrete edit, readback/render, save/reopen or fresh-session recovery and Astro translation criteria. Record setup friction and observed capability limits separately from visual outcomes. Do not select a default based on GitHub popularity or inferred model costs. Automatic approval review blocked the install command; the user performed the installation and opened a blank document instead. No bypass was attempted.

| Test | Observable result |
| --- | --- |
| Onboarding and target identity | Hosted MCP initialization/tool listing and read-only context succeed; active file is “Baseline test”; no credential printed or persisted |
| Penpot same-agent | Create a clearly owned neutral desktop/mobile composition and component states using source-derived Baseline tokens; inspect structure and rendered output; iterate one specific detail and verify the change |
| Session handoff | Save a compact packet with approved-vs-draft status, identifiers, token expressions, component mapping and open questions; use a fresh MCP client/session to recover it without the first session's in-memory storage |
| Direct Astro | Render a neutral native concept using actual Baseline primitives in an isolated generated project; demonstrate a concrete iteration and check narrow/intermediate/wide layouts without requiring Penpot |
| Penpot → Astro | Implement the neutral approved/test design in that isolated project, preserve token relationships and responsive intent, compare the browser render and verify working semantics |
| Production isolation | Concept/fixture artifacts are excluded from a normal generated release; no Penpot secret, remote-design fixture or test-only route leaks into deployable output |
| Distribution | Both static profiles receive complete skill/templates/references with no CMS dependency leakage; reviewed skill-update behavior remains intact |

Use synthetic copy and existing eligible assets or code-native geometry, not real client content. Record file/API/image/browser evidence separately from static checks. Test-only self-selection of a fixture must be labeled synthetic; it is not user approval of a client design. A fresh transport/session is a cold-handoff test, not proof of a different model's design ability or subscription accounting. Do not claim OpenCode/Gemini execution unless actually run.

Keep detailed raw evidence outside Git. Record failures, repairs and actual limits in a maintained acceptance report. Preserve existing user designs; leave the owned test boards discoverable for review unless the user requests removal.

## 6. Verification and delivery

Run doctor before installation, targeted meaningful distribution/preservation tests and skill validation during implementation, then full verify/build/HTML audit/production isolation and independent generated-profile checks with source fixed. Test new behavior rather than matching prose phrases. Use rendered browser checks for the native pilot and visual/structural checks for Penpot. Detect secret-bearing artifacts before staging; no real credential belongs in a test fixture.

Deliver the implementation, tested path matrix, practical evidence and named remaining gaps. Commit and push the verified branch. Write a standalone second-opinion audit prompt covering workflow coherence, concrete design guidance, onboarding/client compatibility, optionality, security, distribution/update behavior, evidence quality and potential regressions. The requested independent audit is a prompt for another agent, not an invented independent review verdict.

## Execution register

| Deliverable | Status | Acceptance record |
| --- | --- | --- |
| Detailed plan and path decisions | Written | This document; implementation authorized by user |
| Baseline-owned Penpot skill and templates | Implemented | Skill metadata validation; native token/flex/component pilot |
| Onboarding and source/API review | Tested | Hosted Penpot and desktop OpenPencil connected; Codex/OpenCode help and official sources inspected |
| Workflow routing and profile/update integration | Implemented | Targeted distribution/staging tests; historical/current static sync compatibility |
| Penpot same-agent/cold-handoff pilot | Passed within synthetic scope | Fresh session recovered full boards/text/token binding; comparison report records limits |
| OpenPencil desktop comparison | Passed within synthetic scope | Real desktop edits/exports; saved .fig reopened with variables/components/content and remapped IDs |
| Direct Astro/browser and translation pilot | Passed within synthetic scope | Independent generated site; native primitives; 390/768/1440 captures, overflow/gutters and disclosure/focus checks |
| Final verification, commit/push and audit prompt | Complete; branch history records release | 336 tests; Astro 53 files clean; release build, HTML/production isolation and both independent generated profiles passed; audit prompt ready; release branch `codex/penpot-design-workflow` |

See [the practical comparison and acceptance limits](../design-tool-comparison-2026-10-26.md) and [the independent audit prompt](design-workflow-second-opinion-prompt.md). Raw captures, source bridge, cold-session evidence and command logs remain outside Git in `C:/dev/baseline-design-tool-trial/`. The temporary hosted key and local MCP discovery credential are excluded.

## Final verification record

The final optimization pass follows the user's preference for a design-tool review experience: canvas-led iteration is recommended for new sites/substantial overhauls, with OpenPencil, Penpot and direct Astro offered explicitly and prior choices reused. The canonical loop now lives in `site-art-direction/references/design-iteration.md` and ships to both static profiles. It limits early work to representative concepts and focused edits, carries one selected direction into an Astro proof, and avoids duplicate full sites/libraries or unnecessary same-agent handoff paperwork. Concrete CSS recipes, browser acceptance and applicable release steps remain. Comparative speed/token savings are still unmeasured; the recommendation reflects user experience and task fit, not a new benchmark result. The independent audit prompt includes these final decisions.

This optimization pass separately passed doctor critical checks, verify:fast, full verify (185 unit + 151 rehearsal; Astro 53 files clean), a fresh release build followed by HTML audit (9 files/10 SSR responses), both independent generated-profile rehearsals, skill validation, linked-resource distribution assertions and docs/diff checks. Its logs use the `final-pass-` prefix in the private evidence directory. The earlier canvas/browser pilot remains the rendered evidence; this guidance-only pass did not repeat that pilot or add a timed/model benchmark.

`doctor` passed critical checks before implementation/installation. `verify:fast` passed during edits. The final `verify` passed **185 unit + 151 rehearsal = 336 tests**, up from 333 at the starting revision, and Astro checked 53 files with no errors, warnings or hints. The release `build` passed with its existing bundle-size advisory; `audit:html` passed 9 HTML files and 10 public SSR responses. `check:dev-tools` passed development/fixture behavior, fixture-release rejection and clean production GET/HEAD isolation. The isolated Astro translation pilot separately passed type checking (36 files clean) and a real build including `/study/`.

Both `static` and `static-sveltia` passed the final `test:profiles -- --keep` run: independent install and clean install, verification, production build, fixture build, HTTP/metadata/native-composition checks and no database packages. The generic profile harness reports browser tests “not requested”; the separate hands-on pilot browser evidence above supplies the actual rendered test, not a fabricated profile-harness browser result. Skill validation, targeted distribution/conflict/legacy-membership checks, docs formatting and `git diff --check` passed. No application dependency, client theme, content binding or deployment configuration changed; template delivery is commit/push on the named branch, not a client deployment.
