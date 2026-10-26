# Independent audit prompt

Copy the prompt below into a separate agent with access to the repository. This is a request for an independent opinion, not a claim that an independent review has already happened.

```markdown
Audit the Baseline design-workflow overhaul in C:\dev\emdash-baseline on codex/penpot-design-workflow against base commit 519a0fe97bf4dd2ebff9d07373dfda2bb6d8d180. Read AGENTS.md and CONTRIBUTING.md first. Use the actual final branch revision and report it. Do not modify files, designs, client/global configuration, CMS data or deployments during this audit.

User intent:
- An audit should yield an actionable follow-up plan and meaningful user choices, not merely a long report or unapproved implementation.
- Design must support direct Astro/browser, Penpot with one agent, optional sequential designer/implementation agents, and an explicitly chosen OpenPencil desktop alternative.
- Keep concrete CSS examples/selectors, named tools, precise checks and brief-led exceptions so weaker models have useful instructions. Do not replace specificity with vague advice or mandate every visual effect on every route.
- Penpot and another agent must remain optional. A complete site task needs calibration, actual browser verification and the agreed commit/push/applicable deployment, rather than stopping at code/build/report.

Inspect the full diff, docs/plans/design-iteration-and-penpot.md, docs/design-tool-comparison-2026-10-26.md, the new penpot-site-design skill/references/templates/metadata, onboarding guides, workflow/art-direction/Astro skills, root/static instructions, prompt library, manifests/inventory/updater and tests. Check for contradictory old routing or hidden onboarding prerequisites.

Evaluate:
1. Are surface choice and agent continuity genuinely independent? Are existing decisions reused, major concepts meaningfully reviewed, and small refinements kept within their accepted direction?
2. Is the Penpot skill discoverable and useful without loading every reference? Does it preserve original fluid CSS, contextual layout ownership, concrete 3-tier/4-voice/bento/action/motion recipes, actual native APIs and source/CMS ownership?
3. Are connection instructions accurate for current hosted Penpot and the installed Codex/OpenCode versions? Verify official docs, private credential handling, sleeping-tab recovery, one active tab, target identity and hosted/local limits. Do not request or expose test keys.
4. Does OpenPencil guidance distinguish the real project/version, app MCP versus an internal ACP agent, private local discovery, file roots, supported schemas, text wrapping, save/reopen and remapped IDs? Is the recommendation supported by evidence rather than hype?
5. Do static and static-sveltia receive the entire skill and linked resources without CMS/design runtime packages? Do older-site updates preserve bounded membership, local changes, provenance and recovery? Run meaningful distribution/sync checks, not tests that merely search prose.
6. Does the optional handoff work without a previous conversation/storage/active selection? Are draft versus approved state, actual approval evidence, token expressions, component mappings, responsive behavior and remaining questions explicit? A fresh session is not another model's execution.
7. Inspect practical evidence quality. Local raw artifacts are under C:\dev\baseline-design-tool-trial if available, including design-handoff.json, cold-handoff-evidence.json, openpencil-reopened-state.json, browser-layout.json and before/after renders. The saved .fig is in the testing user's Documents folder. Do not read private MCP discovery or auth configuration. If evidence is unavailable, mark that limit. Distinguish synthetic pilot acceptance from client acceptance, screenshot dimensions/scrollbar effects from genuine gutters, structural checks from rendered inspection and canvas output from production behavior.
8. Look for scope expansion, credential leaks, modified upstream mirrors, dropped specificity, broken links, installation side effects or unsupported claims. Source code/styles were intended to remain unchanged except update inventory logic and meaningful tests; question any unintended runtime change.

Start with the recommended follow-up plan, ordered by impact, and identify only consequential user decisions. Support each actionable finding with an exact path/line, reproduction/evidence and a concrete repair. Distinguish blocking defects, useful improvements and acceptable documented limitations. State what you verified yourself, what relied on prior evidence and what remains untested. Do not implement recommendations or declare the workflow universally proven by one neutral pilot.
```
