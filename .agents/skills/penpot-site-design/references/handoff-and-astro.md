# Same-agent implementation and optional handoff

Same-agent work can proceed from reviewed boards and existing context. A handoff packet is useful when changing sessions/models, pausing substantial work or preserving a selected direction; it is not another mandatory design stage. Both arrangements use the same art-direction and browser acceptance gates.

Follow [the shared iteration loop](../../site-art-direction/references/design-iteration.md). Resolve composition in focused visual batches, then prove one representative route in Astro before rollout. Use an early browser spike only for a material feasibility uncertainty. Do not maintain the entire site in both surfaces throughout design, rebuild a component library for each edit, or produce a full handoff packet when a compact same-agent decision record is enough.

## Portable handoff

Use the adjacent asset template. Include file/page/board IDs, a non-secret file link if useful, dated render/revision, selected versus draft concepts, actual approval evidence, fixed/changeable brand rules, real copy/assets and source ownership, original CSS expressions plus canvas samples, layout/reading order, component mapping, interactions/accessibility states, acceptance evidence and unresolved questions. Never include the MCP connection URL/key. Give the receiving model repository/skill access or attach the brief and mapping; do not assume it saw this chat.

Finish a write batch before switching clients. The next session rechecks current file/page, reads boards by saved IDs, compares saved snapshot/packet to current state, then resumes the authorized scope. Do not depend on MCP `storage`, active selection, draft names alone or implicit user approval. If the file changed after acceptance, resolve the specific difference instead of silently implementing newer drafts. Test cold recovery with a fresh session; that establishes session portability, not quality across every model or subscription.

## Translate into Astro

1. Save/check the accepted Art Direction Record before public visual implementation, retaining existing scope exceptions for isolated concepts. Read actual installed component APIs and source token expressions.
2. Map boards to native `Section`, `Container`, `Grid`, `Sidebar`, `Cluster`, `Card` and semantic controls. Keep text editable, layouts intrinsic and media native. Canvas coordinates express relationships, not production absolute positioning. Do not import generated React wrappers or a new renderer merely for visual fidelity.
3. Keep source-owned copy, rich text, URLs, locale and CMS edit proxies authoritative. A changed label in a design is proposed editorial content until authorized. Preserve Eventual/plugin identities and deployment bindings where present; a seed is not a migration.
4. Calibrate actual production primitives on `/_styleguide`; record `audit/component-calibration.md`. Then implement a representative real route, compare browser and design, fix differences and only then roll out. Capture 390/768/1440 widths and route-specific states. A tested neutral specimen is not acceptance of unrelated client routes.
5. Verify layout/overflow/gutters, font metrics, image fit, keyboard/focus, targets, contrast, long content, missing media, motion/reduced motion and navigation. Exercise adopted sticky headers, reveals, surface controls and list/detail transitions. Preserve CMS edit/save/reload acceptance where affected. Run installed checks/build/audit commands, then agreed commit/push/deploy and live acceptance.

## What constitutes completion

Deliver the actionable findings/decisions, implemented scope, actual checks and evidence, remaining limits and release status. A polished Penpot board alone is a completed concept only when concept-only scope was requested. It is not a completed website. Tool setup alone is not a design pilot. A successful build alone is not browser verification. Never report another model's execution or user approval when only an agent's synthetic test selected a fixture.
