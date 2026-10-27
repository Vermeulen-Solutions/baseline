# Optional OpenPencil Desktop Path

OpenPencil (`open-pencil/open-pencil`) provides a local desktop canvas for vector shapes, component nodes, and variable bindings saved in local `.fig` files. For new sites and major redesigns, choose between [OpenDesign](opendesign-onboarding.md), [OpenPencil](openpencil-onboarding.md), [Penpot](penpot-onboarding.md), or direct Astro in the browser. Use `openpencil-site-design` for concept iteration followed by representative Astro proofs.

Baseline supports two execution models: a single agent completing both design and implementation, or an **optional agent switch** where a design agent explores concepts in OpenPencil and an implementation agent translates the saved `.fig` design into Astro.

## Setup

Download OpenPencil Desktop from the [official releases](https://github.com/open-pencil/open-pencil/releases) and consult the [official MCP guide](https://openpencil.dev/programmable/mcp-server). Install the matching global MCP package outside the site runtime (e.g. `npm install -g @open-pencil/mcp@0.16.0`). Never add OpenPencil packages to a site's `package.json` or lockfile.

Open the desktop app with an active document. OpenPencil starts a local server on port 7600 when the matching global MCP package is installed. Register `openpencil-mcp` as a **stdio** server in your MCP client configuration using the path to the installed `dist/stdio.mjs`.

## Authoring and Translating Concepts

The installed `openpencil-site-design` skill bundles mechanics references and recipes. See [the concrete JSX/token recipe](../.agents/skills/openpencil-site-design/references/baseline-jsx-recipe.md) and [scoped review loop](../.agents/skills/openpencil-site-design/references/scoped-review.md). Follow these practices when authoring concepts:

1. **Tool Invocation & Schemas:** Use `get_codegen_prompt` when available. Note that OpenPencil's `render` tool accepts declarative scene JSX creating vector and component nodes, not browser DOM elements.
2. **Document Identification:** Call `list_documents` and verify the active `document_id` and `page_id` before creating or updating nodes.
3. **Layout Sizing:** Use native autolayout (flex/grid) with semantic variables. For wrapping headings, set width to Fill and height to auto-resize. Use fixed or max-width only where a strict measure is intentional.
4. **Review Trees and Renders:** Inspect both the node tree and exported renders at `1440×900` and `390×844`. Check `get_font_status` to ensure requested font families are available.
5. **Save Local Files:** Save concepts to a local `.fig` path. Reopen and verify that components, variables, and content load correctly.

## The Agent Switch & Handoff Workflow

When delegating design and coding to separate agents, use the portable templates in `openpencil-site-design` (`references/portable-brief-template.md` and `references/handoff-packet-template.md`):

1. **Design Agent Scope:** The design agent receives the brief and token rules, authors components in OpenPencil, iterates with visual feedback, and saves the verified `.fig` file.
2. **Preparing the Handoff Packet:** The design agent exports high-resolution preview images (`1440×900` and `390×844`) and prepares a handoff summary containing:
   - Target `.fig` file path and active page/node identifiers.
   - Selected concept direction and rationale.
   - Variable mappings to Baseline custom properties (`--color-*`, `--text-step-*`, `--spacing-*`).
   - Component-to-primitive mapping (`<Section>`, `<Container>`, `<Grid>`, `<Card>`).
   - Responsive layout behaviors across mobile and desktop.
3. **Implementation Agent Scope:** The implementation agent reads the saved `.fig` file and handoff summary, records the Art Direction Record in `AGENTS.md`, synchronizes tokens in `src/styles/global.css`, calibrates primitives on `/_styleguide`, and implements the Astro routes.

Single-agent workflows follow the same translation steps in a single continuous session.
