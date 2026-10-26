# Penpot onboarding for Baseline

Choose a surface at the existing concept checkpoint: direct Astro/browser needs no design service; Penpot offers a shared cloud canvas; [OpenPencil is a local desktop alternative](openpencil-onboarding.md). One agent can complete any selected path. An optional second agent can design while the implementation agent later reads the same saved artifact. Neither setup changes Baseline's profile, runtime or content ownership. See the installed `penpot-site-design` skill and its portable brief/handoff templates.

## Hosted setup

If already connected, skip to the read-only check. Otherwise follow [Penpot's current MCP guide](https://help.penpot.app/mcp/): sign in, enable MCP Server in account settings → Integrations, generate/copy the private connection URL, add it to your agent's MCP client, open the intended file and use File → MCP Server → Connect. Keep that browser tab awake. Only one tab can be active for the connection; re-check the file/page when switching clients. A working MCP transport without an awake connected file cannot edit the canvas.

No local Penpot installation, hosted AI agent or additional model account is required for the remote MCP route; the chosen agent's own usage/cost still applies. Baseline makes no permanent free-tier quota guarantee for a third-party service. Consult current service terms for commercial limits rather than inferring them from a tool connection. The [develop source](https://github.com/penpot/penpot/tree/develop/mcp) includes local development instructions that can differ from the hosted release. Use those only for a deliberate local-server setup, not as a prerequisite for ordinary site work.

The remote URL contains a `userToken` credential. Keep it in private client configuration, never a tracked project config, prompt, screenshot, handoff or log. Examples below contain placeholders only. Do not paste the real URL into a shell command that will be recorded in history. The query credential is not an interchangeable `Authorization: Bearer` token. Do not change global settings automatically just to test a connection.

## Codex

Check the installed client's MCP settings/help. The current CLI supports `codex mcp add <name> --url <URL>`; a private TOML configuration avoids pasting a real URL into shell history:

```toml
# Private user config, NOT a file to commit to the site
[mcp_servers.penpot]
url = "https://design.penpot.app/mcp/stream?userToken=REPLACE_PRIVATELY"
```

Use the client's private config location/settings and restart or reconnect as its version requires. Do not invent environment interpolation for the URL. `--bearer-token-env-var` configures a bearer header and does not replace Penpot's query key. Check the [official Codex MCP documentation](https://developers.openai.com/codex/mcp/) for your installed surface; desktop/CLI settings may differ. Confirm actual Penpot tools are visible before claiming setup works.

## OpenCode

Check `opencode --version` and `opencode mcp add --help`; client schemas evolve. The installed 1.17.11 CLI observed during the trial supports `opencode mcp add penpot --url <URL>`, but this example is not permission to expose the real URL in shell history. Prefer its private user config and current schema. The [v1 documentation](https://dev.opencode.ai/docs/mcp-servers/) uses:

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

Set `PENPOT_MCP_URL` privately for that client process. OpenCode documents `{env:NAME}` substitution; do not use shell `${NAME}` syntax in JSON. The [v2 schema](https://opencode.ai/v2/docs/mcp-servers) instead nests entries under `mcp.servers` and uses `disabled` rather than `enabled`. Do not mix schemas. Inspect your installed version's schema/help before choosing one; Baseline does not ship a universal credential-bearing OpenCode config. Hosted Penpot's connection key does not require the client's OAuth flow. A schema check is not proof of a model executing the full workflow.

## Connection acceptance and recovery

Ask the agent: “Use `penpot-site-design`. Read the MCP overview/API, then report the current file/page names and IDs without changing anything.” Check the identity against the intended file, then authorize a small clearly named test board. Read its geometry/text back and inspect an exported render before continuing. Initialization and tool listing alone do not pass this test.

If the agent reports no heartbeat/suspended tab, focus the Penpot tab; reconnect its MCP panel if needed, then retry read-only identity. If the wrong file is active, stop writes and connect the intended file. If authentication fails, renew the key privately. A retry after a timed-out mutation must first inspect whether it already committed. Keep each batch small and preserve user objects.

## Design, review and optional agent switch

Give the design agent the portable brief plus Baseline's skill/mapping references, real copy/assets and source token expressions. Iterate representative desktop/mobile boards rather than asking for the entire site in one pass. Use the [official prompting guide](https://penpot.app/blog/penpot-ai-prompting-guide/) for role, constraints, bounded changes and review criteria. Preserve source `clamp()` expressions beside canvas samples; generic fixed-grid/React instructions are not Baseline's implementation contract.

If switching agents, finish the design batch and save a packet with target IDs, selected versus draft boards, approval evidence, dated renders, token expressions, native component mapping, responsive/states intent and open questions. Share repository/packet/design access through the user's chosen channel; do not send credentials. The next agent connects privately and re-reads the saved design. Same-agent work can use its existing context without creating a redundant packet. A cloud canvas saves design state, not the first agent's full conversation or a guarantee of lower token use.

Remote asset tools cannot access arbitrary local filesystem paths. Inspect the live export/import schemas and use approved remote assets or a deliberate local-server workflow when necessary. Generated markup still requires native Astro translation, `/_styleguide` calibration, real browser checks and the selected profile's content bindings. A board export is evidence, not deployable page code.
