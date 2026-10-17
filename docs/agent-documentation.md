# AI Agent & Harness Configuration

Baseline is engineered to be **completely agent- and harness-agnostic**. It does not lock you into any proprietary IDE, agent runtime, or cloud service. 

Whether you pair-program with **Claude Code**, **OpenAI Codex**, **Google Antigravity**, **OpenCode / OMP**, **Hermes**, **Cursor**, **Windsurf**, **Aider**, or a custom local LLM runner, Baseline provides the open, standard protocol files they all understand:

1. **Universal Instructions (`AGENTS.md`):** The single source of truth for repository rules, architectural boundaries, component APIs, and verification standards.
2. **Open Skill Specification (`.agents/skills/`):** Standard `SKILL.md` files (YAML frontmatter + markdown instructions) covering site discovery, art direction, component quarantine, and CMS modeling.
3. **Model Context Protocol (MCP):** Open JSON-RPC standard for live framework documentation, community `DESIGN.md` systems, UI component sourcing, visual prototyping, and site content management (see [`.mcp.example.json`](../.mcp.example.json)).
4. **Deterministic Shell Tooling:** Standard npm commands (`npm run ...`) runnable in any bash, PowerShell, or automated execution environment.

---

## Harness Integration Quick-Reference

| Agent / Harness | Instruction File | Skills / Rules Directory | MCP Configuration |
| :--- | :--- | :--- | :--- |
| **Claude Code** | `AGENTS.md` (or symlink to `CLAUDE.md`) | `.claude/skills/` or `.agents/skills/` | `.mcp.json` |
| **OpenAI Codex** | `AGENTS.md` | `.codex/config.toml` | `.codex/config.toml` |
| **Google Antigravity** | `AGENTS.md` | `.agents/skills/` & `.agent/rules/` | `~/.gemini/antigravity/mcp_config.json` |
| **OpenCode / OMP** | `AGENTS.md` | `.agents/skills/` | `.mcp.json` |
| **Hermes / Local LLMs** | `AGENTS.md` (as system prompt) | `.agents/skills/` | Standard stdio / SSE MCP |
| **Cursor / Windsurf** | `AGENTS.md` | `.cursor/rules/` | `.cursor/mcp.json` |
| **Aider** | `AGENTS.md` (`--read AGENTS.md`) | Terminal CLI tools | CLI execution |

---

## 1. Connecting Official Documentation via MCP

Allow your coding assistant to consult live, up-to-date Astro and EmDash documentation without hallucinating deprecated APIs. 

### Standard Project Configuration (`.mcp.json` / Cursor / Claude Code / OpenCode):
Copy [`.mcp.example.json`](../.mcp.example.json) to `.mcp.json` in your project root, or add the documentation servers:

```json
{
  "mcpServers": {
    "astro-docs": {
      "type": "http",
      "url": "https://mcp.docs.astro.build/mcp"
    },
    "emdash-docs": {
      "type": "http",
      "url": "https://docs.emdashcms.com/mcp"
    }
  }
}
```

### Google Antigravity Configuration:
Antigravity uses user-level configuration in `~/.gemini/antigravity/mcp_config.json`. Add the two servers above to your `mcpServers` object and refresh in Manage MCPs.

### OpenAI Codex Configuration:
Project connections live in `.codex/config.toml`:
```toml
[mcp.astro-docs]
url = "https://mcp.docs.astro.build/mcp"

[mcp.emdash-docs]
url = "https://docs.emdashcms.com/mcp"
```

Verify the connection by running:
```sh
npm run check:docs-mcp
```

---

## 2. Optional Design & UI Superpowers via MCP

During **Stage 4 (Art Direction)** and **Stage 4.5 (Component Quarantine)**, connecting optional design MCPs unlocks a major leap in visual quality while keeping your workflow 100% code-first (no manual Figma drawing required):

| MCP / Reference Tool | Role in Baseline Workflow | Tier / Access |
| :--- | :--- | :--- |
| **[designmd.ai MCP](https://designmd.ai/mcp)** (`designmd-mcp`) | Search, browse, and download 420+ community `DESIGN.md` design systems ([designmd.ai/explore](https://designmd.ai/explore)) directly into `audit/visual-concepts/` or Google Stitch. | Free (Search requires no key; free key for download) |
| **21st.dev MCP** (`@21st-dev/magic`) | Search, inspect, and fetch high-craft Tailwind component blueprints and micro-interactions directly into `/_styleguide` for zero-JS Astro transmutation. | Free / Open Registry |
| **Google Stitch / OpenDesign** | Generate visual screen mockups from prompts and consume/emit `DESIGN.md` token files (`audit/visual-concepts/`). | Free / Built-in |
| **Nicelydone MCP / Refero.design** | Inspect real-world web and SaaS UX screens, user flows, filter bars, and onboarding patterns during discovery. | Freemium / Web |
| **Official Figma MCP** *(Optional)* | Inspect layers and layout tokens if a client happens to hand off an existing Figma file. | Free |

### Enabling `designmd-mcp`, `21st-dev`, and `nicelydone` in `.mcp.json`:

```json
{
  "mcpServers": {
    "designmd": {
      "command": "npx",
      "args": ["-y", "designmd-mcp"],
      "env": {
        "DESIGNMD_API_KEY": "dk_your-key-here"
      }
    },
    "21st-dev": {
      "command": "npx",
      "args": ["-y", "@21st-dev/magic@latest"],
      "env": {
        "API_KEY": "<YOUR_21ST_DEV_API_KEY>"
      }
    },
    "nicelydone": {
      "type": "http",
      "url": "https://mcp.nicelydone.club/mcp",
      "headers": {
        "Authorization": "Bearer <YOUR_NICELYDONE_API_KEY>"
      }
    }
  }
}
```

> [!TIP]
> **Graceful Fallback & Binary Guard:**
> - All design MCPs are strictly optional. When entering Stage 4, your agent will briefly offer these paths—you can skip them in one second and work entirely in code using Baseline's curated Aesthetic Lanes (`npm run design:tokens`) and live Vite HMR on `/_styleguide`.
> - Baseline pins `@google/design.md@0.4.0` locally (`npm run design:check`) for offline frontmatter token linting. Always use `npx -y designmd-mcp` (or `npx --package=designmd designmd ...`) for the [designmd.ai](https://designmd.ai/explore) community registry so you do not overwrite the local `@google/design.md` binary. See [AI-Native Visual Design & DESIGN.md Interchange](design-interchange.md).

---

## 3. Site-Level EmDash CMS MCP Setup

To allow your coding assistant to directly create, inspect, and update content, media, and taxonomies via EmDash's built-in MCP server (`/_emdash/api/mcp`), generate a Personal Access Token:

```bash
npm run mcp:token
# Or specify a custom agent name or target URL:
npm run mcp:token -- --name="Agent Assistant" --url="http://localhost:4321"
# Or generate SQL for Cloudflare D1:
npm run mcp:token -- --d1=my-site-db
```

The script registers the token in `_emdash_api_tokens` and prints the exact configuration block ready to paste into your harness's MCP settings.

---

## 4. Starting a Task With Any Agent

When starting a new site or major feature, instruct your agent:

> *"Read AGENTS.md. For new sites, follow new-site-workflow in .agents/skills/ and record an Art Direction Record in AGENTS.md before writing visual styles under src/."*

Because all verification commands (`npm run check:schema-budget`, `npm run typecheck`, `npm run test:visual`) are standard npm scripts, any agent with terminal execution capabilities can run them in a tight feedback loop to verify its own work.
