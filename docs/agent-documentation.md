# AI Agent & Harness Configuration

Baseline is engineered to be **completely agent- and harness-agnostic**. It does not lock you into any proprietary IDE, agent runtime, or cloud service. 

Whether you pair-program with **Claude Code**, **OpenAI Codex**, **Google Antigravity**, **OpenCode / OMP**, **Hermes**, **Cursor**, **Windsurf**, **Aider**, or a custom local LLM runner, Baseline provides the open, standard protocol files they all understand:

1. **Universal Instructions (`AGENTS.md`):** The single source of truth for repository rules, architectural boundaries, component APIs, and verification standards.
2. **Open Skill Specification (`.agents/skills/`):** Standard `SKILL.md` files (YAML frontmatter + markdown instructions) covering site discovery, art direction, component quarantine, and CMS modeling.
3. **Model Context Protocol (MCP):** Open JSON-RPC standard for documentation lookup and site content management.
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
Add this to `.mcp.json` in your project root or user configuration:

```json
{
  "mcpServers": {
    "astro-docs": {
      "serverUrl": "https://mcp.docs.astro.build/mcp"
    },
    "emdash-docs": {
      "serverUrl": "https://docs.emdashcms.com/mcp"
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

## 2. Site-Level EmDash CMS MCP Setup

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

## 3. Starting a Task With Any Agent

When starting a new site or major feature, instruct your agent:

> *"Read AGENTS.md. For new sites, follow new-site-workflow in .agents/skills/ and record an Art Direction Record in AGENTS.md before writing visual styles under src/."*

Because all verification commands (`npm run check:schema-budget`, `npm run typecheck`, `npm run test:visual`) are standard npm scripts, any agent with terminal execution capabilities can run them in a tight feedback loop to verify its own work.
