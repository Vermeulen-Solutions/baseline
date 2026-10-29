import { argumentsOf, bytesOf, isMain, requireFact } from './infrastructure-io.mjs';
import { stripVTControlCharacters } from 'node:util';

export function checkAuthBuildLog(log) {
  requireFact(typeof log === 'string' && log.trim().length > 0, 'A complete successful build log is required');
  log = stripVTControlCharacters(log);
  requireFact(/\[build\]\s+Complete!/.test(log), 'Build completion marker missing; retain the full successful Astro 7.4 log');
  // Reject this specific functional warning, not unrelated size/deprecation warnings.
  requireFact(!/(?:Astro sessions are disabled|session[^\r\n]{0,120}(?:driver|store)[^\r\n]{0,120}(?:missing|not configured|unavailable|required|disabled)|(?:no|without|missing)[^\r\n]{0,60}session[^\r\n]{0,60}(?:driver|store)|Sign-in needs an Astro session driver)/i.test(log), 'Build reports a missing session driver; repair the supported adapter/session binding before owner setup');
}

async function jsonResponse(response) {
  requireFact(response.headers.get('content-type')?.includes('application/json'), 'Expected native JSON, not an Access/login/SPA response');
  const chunks = []; let size = 0;
  for await (const chunk of response.body) {
    size += chunk.length;
    requireFact(size <= 32768, 'Native probe response exceeds bound');
    chunks.push(chunk);
  }
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}

/** EmDash 1.3.0 only: no cookies, authorization, nonce or challenge are sent. */
export async function checkHostedAuth({ origin, version, buildLog, fetcher = fetch }) {
  requireFact(version === '1.3.0', 'Probe contract is verified only for EmDash 1.3.0; review the installed route before extending it');
  checkAuthBuildLog(buildLog);
  const url = new URL(origin);
  requireFact(url.protocol === 'https:' || (url.protocol === 'http:' && ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)), 'Use HTTPS, or HTTP only on loopback');
  requireFact(!url.username && !url.password && url.pathname === '/' && !url.search && !url.hash, 'Use an origin without credentials/path/query/fragment');
  const options = { redirect: 'manual', cache: 'no-store', credentials: 'omit', headers: { Accept: 'application/json' } };
  const status = await fetcher(new URL('/_emdash/api/setup/status', url), { ...options, signal: AbortSignal.timeout(10000) });
  const body = await jsonResponse(status);
  requireFact(status.status === 200 && body.success === true && typeof body.data?.needsSetup === 'boolean', 'Native setup status is unverified');
  // This route checks session presence before setup state and credential writes.
  // An empty body without a nonce cannot reach credential creation on 1.3.0.
  const probe = await fetcher(new URL('/_emdash/api/setup/admin/verify', url), {
    ...options, method: 'POST', headers: { ...options.headers, Origin: url.origin, 'Content-Type': 'application/json', 'X-EmDash-Request': '1' }, body: '{}', signal: AbortSignal.timeout(10000),
  });
  const result = await jsonResponse(probe);
  const expected = body.data.needsSetup ? ['INVALID_STATE'] : ['SETUP_COMPLETE'];
  requireFact(probe.status === 400 && result.success === false && expected.includes(result.error?.code), 'Session/authentication preflight failed or is unverified; do not hand off owner setup or reset accounts');
  return { status: 'passed', origin: url.origin, contract: 'emdash-1.3.0', setupLocked: !body.data.needsSetup, sessionGuardReached: true, scope: 'session presence and native validation only; owner passkey/login and session-store writes remain separate acceptance' };
}

if (isMain(import.meta.url)) {
  try {
    if (process.argv.length === 3 && process.argv[2] === '--help') console.log('Non-consuming native preflight: --url https://preview.example --emdash-version 1.3.0 --build-log <complete successful release log>. No credentials/cookies are sent; does not create a passkey, reset setup, or certify a successful session-store write.');
    else {
      const args = argumentsOf(process.argv.slice(2), ['--url', '--emdash-version', '--build-log']);
      requireFact(args.url && args['build-log'], 'URL and build log required');
      console.log(JSON.stringify(await checkHostedAuth({ origin: args.url, version: args['emdash-version'], buildLog: bytesOf(args['build-log'], 8 * 1024 * 1024).toString('utf8') }), null, 2));
    }
  } catch { console.error('Hosted sign-in is unverified. Check --help, complete build warnings, protected origin access and the installed native session contract. No credential was created.'); process.exitCode = 1; }
}
