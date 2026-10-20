import { pathToFileURL } from 'node:url';

export function assertSetupLocked(status, body) {
  if (status !== 200 || body?.success !== true || body?.data?.needsSetup !== false) {
    throw new Error('Setup lockdown is unverified: expected HTTP 200 and success/data.needsSetup=false. Keep setup paths protected.');
  }
}

export async function checkProductionSetup(origin, fetcher = fetch) {
  const url = new URL(origin);
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.pathname !== '/' || url.search || url.hash) {
    throw new Error('Use an HTTP(S) origin without credentials, path, query or fragment.');
  }
  const response = await fetcher(new URL('/_emdash/api/setup/status', url), {
    redirect: 'manual', cache: 'no-store', headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(10_000),
  });
  let body;
  if (response.status === 200 && response.headers.get('content-type')?.includes('application/json')) {
    body = await response.json();
  }
  assertSetupLocked(response.status, body);
  return { origin: url.origin, setupLocked: true };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    if (process.argv.length !== 4 || process.argv[2] !== '--url') throw new Error('Use --url https://canonical.example');
    console.log(JSON.stringify(await checkProductionSetup(process.argv[3])));
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
