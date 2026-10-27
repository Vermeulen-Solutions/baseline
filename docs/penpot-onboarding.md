# Penpot Onboarding for Baseline

Penpot offers a collaborative cloud design canvas accessible in the browser, making it ideal for client reviews and shared inspection. For new sites and major redesigns, choose between [OpenDesign](opendesign-onboarding.md), [OpenPencil](openpencil-onboarding.md), [Penpot](penpot-onboarding.md), or direct Astro in the browser. Use `penpot-site-design` for concept iteration followed by representative Astro proofs.

Baseline supports two execution models: a single agent completing both design and implementation, or an **optional agent switch** where a design agent explores concepts in Penpot and an implementation agent translates the saved design into Astro.

## Hosted Setup

Follow [Penpot's MCP guide](https://help.penpot.app/mcp/): sign in to your Penpot account, enable MCP Server in account settings (Integrations), generate a connection URL, add it to your agent's MCP configuration, open the target file in Penpot, and connect via **File -> MCP Server -> Connect**. Keep that browser tab active during editing: Penpot requires an active tab to handle incoming MCP commands.

The connection URL includes a private `userToken`. Keep it in private client configuration rather than committing credentials to repository files.

### Codex Configuration

Add the connection to your private client settings (e.g. `~/.codex/config.toml`):

```toml
[mcp_servers.penpot]
url = "https://design.penpot.app/mcp/stream?userToken=YOUR_PRIVATE_TOKEN"
```

### OpenCode Configuration

Check `opencode --version` and use the schema for that major version in your private client config. OpenCode v1 places servers directly under `mcp`:

```json
{
  "mcp": {
    "penpot": {
      "type": "remote",
      "url": "{env:PENPOT_MCP_URL}",
      "enabled": true,
      "oauth": false
    }
  }
}
```

OpenCode v2 places servers under `mcp.servers`; connections start automatically unless `disabled` is true:

```json
{
  "mcp": {
    "servers": {
      "penpot": {
        "type": "remote",
        "url": "{env:PENPOT_MCP_URL}",
        "oauth": false
      }
    }
  }
}
```

Store `PENPOT_MCP_URL` in your private environment for that process. Both versions support `{env:NAME}` substitution; shell `${NAME}` syntax is not expanded in JSON. Penpot uses the URL's query key rather than OpenCode's OAuth flow. See the official [v1](https://docs.opencode.ai/docs/mcp-servers/) and [v2](https://opencode.ai/v2/docs/mcp-servers) configuration guides. Reconnect and read the intended file/page to verify the actual connection.

## Connection Verification and Recovery

1. **Verify Connection:** Ask the agent to use `penpot-site-design` to read the active file and page names before modifying boards.
2. **Reconnecting Inactive Tabs:** If the connection drops or the browser tab suspends, focus the Penpot tab, reconnect via **File -> MCP Server -> Connect**, and re-run the identity check.
3. **Iterative Board Design:** Author representative desktop (`1440×900`) and mobile (`390×844`) boards with visual feedback rather than attempting full-site mockups in one pass.

For expired keys, a wrong target file or an uncertain timed-out edit, use the [connection and recovery reference](../.agents/skills/penpot-site-design/references/connection-and-api.md). Inspect saved state before retrying a mutation.

## The Agent Switch & Handoff Workflow

Use the shared [portable design brief](../.agents/skills/penpot-site-design/assets/design-brief.md) and [design handoff](../.agents/skills/penpot-site-design/assets/design-handoff.md) when delegating work between design and coding agents:

1. **Design Agent Scope:** The design agent receives the brief and token rules, authors bounded desktop and mobile boards in Penpot, and captures exports for review.
2. **Preparing the Handoff Packet:** When a direction is approved, the design agent prepares a structured handoff packet containing:
   - Target file, page, and board identifiers.
   - Selected direction vs. draft concepts.
   - Design token mappings to Baseline custom properties (`--color-*`, `--text-step-*`, `--spacing-*`).
   - Component-to-primitive mapping (`<Section>`, `<Container>`, `<Grid>`, `<Card>`).
   - Responsive and state intent (mobile drawer, hover states, dark surface variants).
   - High-resolution exported board images for visual comparison.
3. **Implementation Agent Scope:** The implementation agent reads the saved Penpot file and handoff packet, records the Art Direction Record in `AGENTS.md`, synchronizes `src/styles/global.css` (`npm run design:tokens`), calibrates components on `/_styleguide`, and implements the production Astro routes.

Single-agent workflows follow the same translation steps in a single continuous session without requiring a formal packet file.
