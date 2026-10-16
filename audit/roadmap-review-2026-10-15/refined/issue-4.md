# DESIGN.md interoperability without competing design authorities

## Outcome and decision
Adopt an optional, version-pinned DESIGN.md bridge for client sites and tool experiments. Keep the mandatory Art Direction Record in AGENTS.md and the existing check:art-direction gate. Do not fabricate a client design record for this neutral starter.

The Google Labs format and CLI exist, but the specification is alpha. OpenDesign consumes DESIGN.md; that does not prove identical token schemas, lossless round trips or universally configured MCP tools. This session exposes no Stitch tool. Capability discovery and an actual exchange test are prerequisites to claiming a connector works.

## Authority and synchronization contract
- AGENTS.md: project policy, direction decision/status, five-field record and links to evidence.
- src/styles/global.css plus component styles: authoritative shipped values and behavior, including Tailwind @theme namespaces, ordinary semantic aliases, clamp()/vi scales and contextual overrides.
- DESIGN.md: documented intent and an explicit mapping of the implemented system for external tools. Its frontmatter is normative within that document, not permission to override shipped CSS or the project gate.
- A deliberate redesign may begin as a provisional DESIGN.md proposal; it becomes effective only through reviewed source changes and direction-record reconciliation. Resolve disagreement explicitly; never silently pick whichever file was read last.
- First implementation is a curated one-way documentation/export path with drift checks for mapped tokens. No automatic bidirectional token rewriting, stylesheet replacement or browser-settings persistence.

## Deliverables
1. docs/design-interchange.md with the decision, pinned spec revision and CLI version, authority map, provider-neutral concept workflow and a neutral example under audit/visual-concepts/.
2. An opt-in validation command using a lockfile-pinned @google/design.md package if the spike succeeds. Use the designmd binary alias for Windows compatibility. Run lint before export; successful export alone does not establish lint success. No unpinned npx latest in CI.
3. A mapping table for actual source token names to supported DESIGN.md keys and export limitations. Use current schema properties such as typography.<role>.fontFamily/fontSize/fontWeight, not the original RFC's invented font-display/h1.size shape. Preserve semantic names without assuming YAML dictionaries are structurally identical to @theme.
4. Document unsupported or lossy cases: semantic aliases, var(), clamp()/calc()/vi, OKLCH/color-mix, inherited surface treatments, shadow/motion/focus tokens, font weights and conditional responsive overrides. Probe the pinned validator/exporter; preserve unsupported information in linked prose/mapping evidence or a documented sidecar, not silently converted fixed values.
5. Optional tool evaluation: representative desktop/mobile concept using real content shapes, supplied assets and provenance; record exported artifacts, tool/version/access, token losses and manual fixes. Generated markup is design evidence, not CMS-ready Astro. Keep EmDash ownership and native image integration in the implementation skills.
6. Update new-site-workflow/site-art-direction/astro-site-design routing without modifying upstream Impeccable. The workflow already includes a concept pass; refine that stage instead of claiming no pre-code exploration exists.

## Experiment boundaries
A local reference/prototype path must work without Stitch/OpenDesign accounts. Test one available external exchange; mark any inaccessible provider unverified rather than making it a build dependency or claiming compatibility. Do not require every project to connect external tools. Extracted legacy values are observations requiring review, not automatically approved art direction. Protect existing DESIGN.md files and authored rationale; propose a diff/merge.

#6 can later propose documentation export using this mapping. Its CSS export remains authoritative for calibration until that extra format has round-trip evidence.

## Acceptance criteria
- [ ] ADR/runbook records optional adoption and a single unambiguous authority/merge policy; existing art-direction gate behavior is unchanged.
- [ ] Pinned validator accepts a representative neutral example and rejects malformed typography/unresolved references in fixture tests.
- [ ] Mapping/round-trip evidence covers at least one fluid expression, semantic alias, OKLCH value, contextual surface and font weight; losses are explicit.
- [ ] Export cannot overwrite global.css or erase authored rationale; absent DESIGN.md does not fail an otherwise valid starter build.
- [ ] Local concept workflow succeeds without external accounts. At least one available external exchange is recorded, or external compatibility remains explicitly deferred/unverified.
- [ ] No client palette/identity, invented theme modes or new production runtime dependency is imposed.

## Dependencies
#1 supplies visual workflow/ownership policy. #3 records the pinned tooling capability; #5 displays actual CSS rather than making DESIGN.md a runtime source. Does not block the initial styleguide or HUD grid.

## Sources
[Google Labs format/CLI and alpha status](https://github.com/google-labs-code/design.md) · [spec](https://github.com/google-labs-code/design.md/blob/main/docs/spec.md) · [OpenDesign](https://github.com/nexu-io/open-design) · pinned Impeccable 4.3.1 document reference.
