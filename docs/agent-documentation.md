# AI Agent & Harness Configuration

Baseline keeps repository instructions, skills and npm commands independent of a particular agent harness. Instruction discovery, skill discovery and MCP configuration still depend on the tool and version you use.

Whether you use Claude Code, OpenAI Codex, Cursor, OpenCode, Windsurf, Antigravity, OMP, Hermes, Aider or another assistant, the maintained project sources are:

1. **Repository Instructions (`AGENTS.md`):** Repository rules, architectural boundaries and verification standards. Ask your assistant to read this file if its harness does not load it automatically.
2. **Project Skills (`.agents/skills/`):** `SKILL.md` files and references covering site discovery, art direction, component quarantine and CMS modeling. Use native skill discovery where supported; otherwise explicitly read the applicable skill and its relevant references.
3. **Model Context Protocol (MCP):** Open JSON-RPC standard for live framework documentation, community `DESIGN.md` systems, UI component sourcing, visual prototyping, and site content management (see [`.mcp.example.json`](../.mcp.example.json)).
4. **Deterministic Shell Tooling:** Standard npm commands (`npm run ...`) runnable in any bash, PowerShell, or automated execution environment.

For optional installed-project discovery, use `npm run baseline:inspect -- --json` after installing dependencies. It reports source-derived facts and paths without executing project configuration. See [scope and limits](project-inspection.md); it does not replace repository instructions, skills or verification.

---

## Harness Integration Quick-Reference

| Agent / Harness | Repository instructions | Skill discovery | MCP configuration |
| :--- | :--- | :--- | :--- |
| **OpenAI Codex** | `AGENTS.md` | `.agents/skills/` | `.codex/config.toml`, under `mcp_servers` |
| **Claude Code** | Supported versions load `AGENTS.md` when no project `CLAUDE.md` takes precedence; see below | Native project skills use `.claude/skills/`; explicitly read Baseline's `.agents/skills/` when needed | Project `.mcp.json` |
| **Cursor** | `AGENTS.md` | `.agents/skills/` or `.cursor/skills/` | Project `.cursor/mcp.json` |
| **OpenCode** | `AGENTS.md` | `.agents/skills/` or `.opencode/skills/` | `opencode.json` / `opencode.jsonc`, under `mcp` |

For Claude Code versions before native `AGENTS.md` support, or projects already using `CLAUDE.md`, add `@AGENTS.md` to that file so the shared instructions remain included. Prefer that import over a Windows symlink. Keep Baseline's skills canonical in `.agents/skills/`; reading a skill explicitly does not require creating a second managed copy.

Other harnesses need their own configuration. For example, Windsurf/Cascade exposes **Open MCP config file** in its MCP settings; it does not use Cursor's project path. Use the installed tool's settings and documentation for Antigravity, OMP, Hermes and other clients rather than assuming another client's JSON is accepted. Aider can explicitly include instructions with `--read AGENTS.md`.

Checked against official documentation on 21 October 2026: [Codex MCP](https://learn.chatgpt.com/docs/extend/mcp?surface=cli), [Codex skills](https://developers.openai.com/codex/skills/), [Claude instructions](https://code.claude.com/docs/en/memory#agentsmd), [Claude skills](https://code.claude.com/docs/en/skills), [Cursor rules](https://cursor.com/docs/context/rules), [Cursor skills](https://cursor.com/docs/skills), [Cursor MCP](https://cursor.com/help/customization/mcp), [OpenCode rules](https://docs.opencode.ai/docs/rules/), [OpenCode skills](https://docs.opencode.ai/docs/skills/), [OpenCode MCP](https://docs.opencode.ai/docs/mcp-servers/), [Cascade MCP settings](https://docs.windsurf.com/windsurf/cascade/mcp). These are documented setup paths, not a claim that every client/version has been exercised locally.

---

## 1. Connecting Official Documentation via MCP

Allow your coding assistant to consult live, up-to-date Astro and EmDash documentation without hallucinating deprecated APIs.

### Claude Code and Cursor:

The root [`.mcp.example.json`](../.mcp.example.json) contains only the two public documentation servers. Generated static projects include only Astro documentation; they do not need EmDash tools. For Claude Code, merge the entries into project `.mcp.json`. For Cursor, merge them into `.cursor/mcp.json`. Preserve existing settings; do not overwrite a configured file. Other clients may require a different schema, as shown below.

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

### OpenAI Codex Configuration:
Merge project connections into `.codex/config.toml` (project configuration must be trusted by Codex):

```toml
[mcp_servers.astro-docs]
url = "https://mcp.docs.astro.build/mcp"

[mcp_servers.emdash-docs]
url = "https://docs.emdashcms.com/mcp"
```

### OpenCode Configuration:

Merge these entries into `opencode.json` or `opencode.jsonc`. Its `mcp` object and `remote` transport value differ from the `mcpServers` / `http` example:

```json
{
  "mcp": {
    "astro-docs": {
      "type": "remote",
      "url": "https://mcp.docs.astro.build/mcp"
    },
    "emdash-docs": {
      "type": "remote",
      "url": "https://docs.emdashcms.com/mcp"
    }
  }
}
```

Omit `emdash-docs` for static profiles. In every client, inspect its MCP server/tool list and make a documentation search to verify the actual connection. In Codex, `codex mcp list` shows registered servers; a successful tool call verifies availability.

On the root EmDash foundation, this additional command probes the public documentation servers directly:

```sh
npm run check:docs-mcp
```

It does not load or validate your agent's configuration and cannot establish that your client has registered either server. Generated static projects do not include this command. On Windows PowerShell use `npm.cmd` / `npx.cmd` for npm examples in this guide.

---

## 2. Optional Design & UI Superpowers via MCP

During **Stage 4 (Art Direction)** and **Stage 4.5 (Component Quarantine)**, connecting optional design MCPs supports canvas-led visual iteration, community design systems, and high-craft component blueprints while preserving native CSS tokens and real browser verification:

| MCP / Reference Tool | Role in Baseline Workflow | Tier / Access |
| :--- | :--- | :--- |
| **[OpenPencil Desktop MCP](openpencil-onboarding.md)** (`@open-pencil/mcp`) | Local desktop canvas (`open-pencil/open-pencil`) and `.fig` file iteration via `openpencil-site-design` and declarative scene JSX. | Free / Local Desktop |
| **[Penpot MCP](penpot-onboarding.md)** (`penpot-site-design`) | Shared cloud design canvas for browser review and cross-machine handoff via `penpot-site-design`. | Free / Cloud or Self-Hosted |
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
> **Optional external tools:** - All design MCPs are optional and absent from the default example. At the Stage 4 concept checkpoint for a new site or substantial overhaul, recommend canvas-led iteration once (offering **OpenPencil**, **Penpot**, and **direct Astro/browser** explicitly), reuse settled preferences and working connections, and skip the checkpoint for small refinements. Local lane/token tooling and `/_styleguide` remain available without adding external services. - Baseline ships no `DESIGN.md` validator or exporter. Reading design references needs no package installation. If a specific exchange requires validation/export, select and review that external tool separately. Google's `@google/design.md` and the community registry's `designmd` package are different tools, despite their shared binary name. See [AI-Native Visual Design & DESIGN.md Interchange](design-interchange.md).

---

## 3. Site-Level EmDash CMS MCP Setup

Connect your MCP client's supported OAuth flow to `/_emdash/api/mcp`, sign in as the intended existing account and keep only the scopes needed for its task. EmDash checks both scopes and the account's role. Personal access tokens can also be created and revoked in **Admin → Users → API tokens**. Use these supported interfaces for hosted sites and D1. See the [MCP authentication and scope contract](https://docs.emdashcms.com/reference/mcp-server/).

For a local Node/SQLite instance, the compatibility helper below supports explicit account selection, a read-only plan, finite expiry and owner-bound revocation. It still accesses EmDash 1.3's token table directly: PAT creation is an admin UI route rather than a supported public REST operation in this version. Do not use this fallback to mutate production databases; follow the runtime's recovery procedure before any authorized production mutation.

```bash
# Help only; does not open or create a database:
npm run mcp:token -- --help
# Inspect the proposed read-only grants for an existing account:
npm run mcp:token -- --db data.db --user editor@example.test --preset read-only --url http://localhost:4321
# Create only after reviewing that plan; use the actual origin printed by Astro:
npm run mcp:token -- --db data.db --user editor@example.test --preset read-only --url http://localhost:4321 --apply
# Plan revocation, then repeat with --apply to revoke exactly this owner's token:
npm run mcp:token -- --db data.db --user editor@example.test --revoke TOKEN_ID
```

| Preset | Grants | Minimum existing role |
| --- | --- | --- |
| `read-only` (default) | Content, media, schema and settings reads | Editor |
| `content-authoring` | Content and media reads/writes | Contributor |
| `setup` | Core content/media/schema/settings writes, taxonomy and menu management | Admin |

Presets never grant `admin`, plugin-tool or site-transfer scopes. `setup` is explicit elevated access. For narrower or advanced grants, use `--scopes` with an exact comma-separated list instead of `--preset`; invalid scopes and grants beyond the chosen account's role are rejected rather than silently expanded or clamped. For example, a Subscriber can hold `--scopes content:read,media:read`. In EmDash 1.3, `content:write` also grants taxonomy/menu writes for compatibility; publication, owned-content limits and draft visibility still follow the account role. A read-only token for an administrator may therefore read drafts.

Draft read access is also broader than edit ownership: a Contributor can read another user's draft while being unable to edit it or publish their own draft. The authoring preset therefore does not isolate private drafts by owner. Use a Subscriber with the narrower read scopes above when access should cover only published content. These boundaries were exercised through live MCP in the [local role acceptance](../audit/autonomous-evaluation-2026-10-21/roles.md).

No account is selected or created automatically. `--db` must name an existing, non-linked local file; `--user` must resolve to one existing account. Without `--apply`, the helper opens the database read-only and returns a JSON plan with no secret. Creation returns the token once in JSON, its ID, owner, exact grants and expiry; only its hash is stored in the database. Expiry defaults to 30 days; override it with `--expires-at <future-ISO-timestamp>`. Keep the token in private client settings using the client schema above; do not commit the creation output. The legacy `--d1` SQL path is removed. Static profiles have no EmDash MCP endpoint.

---

## 4. Starting a Task With Any Agent

When starting a new site or major feature, instruct your agent:

> *"Read AGENTS.md and the installed profile/tooling. For a new site, follow new-site-workflow in .agents/skills/. Complete the requested local build and verification, report stage handoffs, and continue authorized work. Ask only for consequential missing decisions or external actions not already authorized. Record approved versus assumed choices, save the Art Direction Record and pass its gate before visual implementation, and calibrate on /_styleguide before broad page assembly."*

Run the verification commands actually installed in `package.json`. Root CMS checks and Windows screenshot baselines are not automatically available in generated static projects. Report observed results and leave unperformed browser/editor/deployment acceptance pending; a passing build does not establish user approval or a live launch.
