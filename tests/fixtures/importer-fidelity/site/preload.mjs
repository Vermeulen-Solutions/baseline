// Child-only synthetic transport. Production DNS/SSRF code is not changed.
// Logical public URLs exercise the real validators; all actual I/O is loopback.
const original = globalThis.fetch;
const fixture = new URL(process.env.IMPORTER_PROTOCOL_ORIGIN);
const cms = new URL(process.env.IMPORTER_CMS_ORIGIN);
globalThis.fetch = async (input, init) => {
  const url = new URL(input instanceof Request ? input.url : input);
  if (url.origin === 'https://cloudflare-dns.com' && url.pathname === '/dns-query' && url.searchParams.get('name') === 'wordpress.example.test') {
    return Response.json({ Status: 0, Answer: url.searchParams.get('type') === 'AAAA' ? [] : [{ type: 1, data: '93.184.216.34' }] });
  }
  if (url.origin === 'https://wordpress.example.test') {
    const rewritten = new URL(url.pathname + url.search, fixture);
    return original(input instanceof Request ? new Request(rewritten, input) : rewritten, init);
  }
  if ([fixture.origin, cms.origin].includes(url.origin) || ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname) && url.port === cms.port) return original(input, init);
  throw Error('Importer rehearsal refused undeclared network origin: ' + url.origin);
};
