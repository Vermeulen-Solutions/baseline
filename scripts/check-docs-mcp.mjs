// Read-only transport check; no client configuration or CMS content is changed.
import fs from 'node:fs/promises';
const endpoints = ['https://mcp.docs.astro.build/mcp', 'https://docs.emdashcms.com/mcp'];
const results = [];
for (const endpoint of endpoints) {
  let session;
  const call = async (method, params, id = 1) => {
    const response = await fetch(endpoint, { method: 'POST', headers: {
      'Content-Type': 'application/json', Accept: 'application/json, text/event-stream',
      ...(session ? { 'Mcp-Session-Id': session } : {}),
    }, body: JSON.stringify({ jsonrpc: '2.0', ...(id === null ? {} : { id }), method, params }), signal: AbortSignal.timeout(60000) });
    session = response.headers.get('mcp-session-id') || session;
    const body = await response.text();
    if (!response.ok) throw new Error(`${response.status}: ${body.slice(0, 300)}`);
    if (!body) return {};
    return response.headers.get('content-type')?.includes('text/event-stream')
      ? JSON.parse(body.split('\n').filter(line => line.startsWith('data: ')).at(-1).slice(6))
      : JSON.parse(body);
  };
  const init = await call('initialize', { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'starter-docs-check', version: '1.0' } });
  await call('notifications/initialized', {}, null);
  const inventory = await call('tools/list', {}, 2);
  const tool = inventory.result.tools.find(tool => /search|ask/i.test(tool.name));
  const args = {};
  for (const [key, property] of Object.entries(tool.inputSchema.properties || {})) {
    if (property.type === 'string' && (tool.inputSchema.required?.includes(key) || /query|question/i.test(key))) {
      args[key] = endpoint.includes('astro') ? 'Astro getImage responsive images with Cloudflare Images binding' : 'EmDash Astro image optimization and storage-backed image endpoint';
    }
  }
  const answer = await call('tools/call', { name: tool.name, arguments: args }, 3);
  const sources = new Set();
  for (const block of answer.result?.content || []) {
    if (block.type !== 'text') continue;
    try {
      for (const item of JSON.parse(block.text).search_results || []) if (item.source_url) sources.add(item.source_url);
    } catch {
      for (const item of block.text.matchAll(/source="([^"]+)"/g)) sources.add(item[1]);
    }
  }
  results.push({ endpoint, server: init.result.serverInfo, tool: tool.name, arguments: args, isError: answer.result?.isError === true, sources: [...sources] });
  console.log(JSON.stringify(results.at(-1)));
}
await fs.mkdir('audit/native-images-starter-20261005', { recursive: true });
await fs.writeFile('audit/native-images-starter-20261005/docs-mcp-check.json', JSON.stringify(results, null, 2) + '\n');
