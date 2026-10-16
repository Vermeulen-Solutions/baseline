# Framework documentation connections

Codex project connections are in `.codex/config.toml`. VS Code and Cursor use their existing MCP configuration files. Trust the project and reload/restart the client if its server inventory has not refreshed. Verify an actual Astro and EmDash documentation query before reporting the connection as working.

During each new-site setup, configure these required documentation connections for both Codex and Google Antigravity, preserving existing servers. Ask both clients to perform an Astro and an EmDash documentation lookup. `npm run check:docs-mcp` proves the server endpoints answer real queries; it does not prove either client's inventory has refreshed. CMS content-management MCP is separate and requires that site's authorization.

Google Antigravity currently documents user-level configuration in `~/.gemini/antigravity/mcp_config.json`, not automatic project-level MCP inheritance. Preserve existing servers and merge:

```json
{
  "mcpServers": {
    "astro-docs": { "serverUrl": "https://mcp.docs.astro.build/mcp" },
    "emdash-docs": { "serverUrl": "https://docs.emdashcms.com/mcp" }
  }
}
```

Click Refresh in Manage MCPs, enable the servers if required, and ask each for a documentation lookup. Repository rules live in `.agent/rules/framework-docs.md`; user-level connections do not travel with a cloned repository.

## Site-level EmDash MCP setup

To enable AI assistants to manage content, media, and taxonomies directly via EmDash's built-in MCP server (`/_emdash/api/mcp`), generate a Personal Access Token:

```bash
npm run mcp:token
# or specify a custom agent name or target URL:
npm run mcp:token -- --name="Antigravity MCP" --url="https://my-site.example"
# or output SQL for Cloudflare D1:
npm run mcp:token -- --d1=my-site-db
```

The script registers the token in `_emdash_api_tokens` and prints the exact configuration block ready to paste into `.mcp.json`, Cursor, or `mcp_config.json`.

Sources: [Astro AI tooling](https://docs.astro.build/en/guides/build-with-ai/), [Codex MCP](https://developers.openai.com/codex/mcp/), [EmDash MCP](https://docs.emdashcms.com/reference/mcp-server/). Current instructions must be checked against installed framework/client versions.
