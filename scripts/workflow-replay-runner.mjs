// Bounded telemetry convention for local workflow trials; not a security sandbox.
import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { spawn } from 'node:child_process';
import { execFileSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { availableLoopbackPort } from './loopback-port.mjs';
import { npmInvocation } from './process-runner.mjs';

export const COMMANDS = Object.freeze(['doctor', 'verify:fast', 'verify', 'build', 'audit:html', 'check:dev-tools', 'check:art-direction', 'design:tokens', 'test', 'test:unit', 'test:design', 'typecheck', 'baseline:inspect']);
export function commandPolicy(pkg, arm) {
  const known = COMMANDS.map(name => {
    const supported = Object.hasOwn(pkg.scripts ?? {}, name), allowed = supported && !(name === 'baseline:inspect' && arm === 'source');
    return { name, supported, allowed, status: !supported ? 'not-installed' : !allowed ? 'withheld-for-source-arm' : 'allowed' };
  });
  return [...known, ...Object.keys(pkg.scripts ?? {}).filter(name => !COMMANDS.includes(name)).sort().map(name => ({ name, supported: true, allowed: false, status: 'outside-bounded-policy' }))];
}
export function redact(value, secrets = []) {
  let text = String(value);
  for (const secret of secrets.filter(Boolean)) text = text.replaceAll(secret, '[REDACTED]');
  return text.replace(/\b(?:ec_pat_|emdash_enc_v1_)[A-Za-z0-9_-]+/g, '[REDACTED]').replace(/(Bearer\s+)\S+/gi, '$1[REDACTED]');
}
export function bounded(value, limit = 24000) {
  const bytes = Buffer.from(value); let end = Math.min(bytes.length, limit);
  while (end > 0 && end < bytes.length && (bytes[end] & 0xc0) === 0x80) end--;
  const output = bytes.subarray(0, end).toString('utf8');
  return { text: output, bytes: bytes.length, emittedBytes: Buffer.byteLength(output), truncated: bytes.length > limit };
}
export function cleanEnv(extra = {}) {
  const env = Object.fromEntries(Object.entries(process.env).filter(([name]) => /^(PATH|PATHEXT|SYSTEMROOT|WINDIR|COMSPEC|TEMP|TMP|HOME|USERPROFILE|LOCALAPPDATA|APPDATA)$/i.test(name)));
  return { ...env, ASTRO_TELEMETRY_DISABLED: '1', ...extra };
}
export async function processResult(command, argv, cwd, { env = cleanEnv(), timeout = 900000, redactions = [] } = {}) {
  return new Promise(resolve => {
    const child = spawn(command, [...argv], { cwd, env, shell: false, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
    let stdout = Buffer.alloc(0), stderr = Buffer.alloc(0), timedOut = false;
    // Capture a bounded tail for long verification logs, counting every byte.
    const safeRedactions = redactions.filter(value => typeof value === 'string' && value.length > 0);
    const byteLimit = 2000000, overlap = Math.max(0, ...safeRedactions.map(value => Buffer.byteLength(value))) + 8;
    let stdoutBytes = 0, stderrBytes = 0;
    const append = (current, chunk) => Buffer.concat([current, chunk]).subarray(-(byteLimit + overlap));
    const decode = buffer => {
      let text = buffer.toString('utf8');
      text = redact(text, safeRedactions);
      let bytes = Buffer.from(text), start = Math.max(0, bytes.length - byteLimit);
      while (start < bytes.length && (bytes[start] & 0xc0) === 0x80) start++;
      if (start < bytes.length) { const lead = bytes[start], needed = lead < 0x80 ? 1 : lead < 0xe0 ? 2 : lead < 0xf0 ? 3 : 4; if (bytes.length - start < needed) start++; }
      bytes = bytes.subarray(start);
      return bytes.toString('utf8');
    };
    child.stdout.on('data', data => { stdoutBytes += data.length; stdout = append(stdout, data); });
    child.stderr.on('data', data => { stderrBytes += data.length; stderr = append(stderr, data); });
    const timer = setTimeout(() => { timedOut = true; child.kill(); }, timeout);
    child.once('error', error => { clearTimeout(timer); resolve({ exitCode: null, signal: null, kind: 'process-error', stdout: decode(stdout), stderr: redact(error.message, redactions), stdoutBytes, stderrBytes, stdoutCapturedTail: stdoutBytes > byteLimit, stderrCapturedTail: stderrBytes > byteLimit }); });
    child.once('close', (exitCode, signal) => { clearTimeout(timer); resolve({ exitCode, signal, kind: timedOut ? 'timeout' : 'process', stdout: decode(stdout), stderr: decode(stderr), stdoutBytes, stderrBytes, stdoutCapturedTail: stdoutBytes > byteLimit, stderrCapturedTail: stderrBytes > byteLimit }); });
  });
}
export async function mcpResult(endpoint, token, operation, args, request = fetch) {
  let target; try { target = new URL(endpoint); } catch { return { exitCode: 2, kind: 'endpoint-error', error: 'Malformed MCP endpoint' }; }
  if (!['http:', 'https:'].includes(target.protocol) || !['127.0.0.1', 'localhost', '[::1]'].includes(target.hostname) || target.username || target.password) return { exitCode: 2, kind: 'endpoint-error', error: 'Replay MCP accepts loopback endpoints only' };
  let response;
  try {
    response = await request(endpoint, { method: 'POST', redirect: 'manual', headers: { authorization: 'Bearer ' + token, 'content-type': 'application/json', accept: 'application/json, text/event-stream' }, body: JSON.stringify({ jsonrpc: '2.0', id: randomUUID(), method: operation === 'tools/list' ? 'tools/list' : 'tools/call', params: operation === 'tools/list' ? {} : { name: operation, arguments: args } }), signal: AbortSignal.timeout(30000) });
  } catch (error) { return { exitCode: 1, kind: 'transport-error', error: error.message }; }
  let raw;
  try {
    const reader = response.body?.getReader();
    if (!reader) raw = await response.text();
    else { const chunks = []; let size = 0; while (true) { const item = await reader.read(); if (item.done) break; size += item.value.byteLength; if (size > 1000000) { await reader.cancel(); return { exitCode: 1, http: response.status, kind: 'response-too-large', observedBytes: size, limitBytes: 1000000 }; } chunks.push(item.value); } raw = Buffer.concat(chunks.map(chunk => Buffer.from(chunk))).toString('utf8'); }
  } catch (error) { return { exitCode: 1, http: response.status, kind: 'transport-error', error: error.message }; }
  if (!response.ok) return { exitCode: 1, http: response.status, kind: 'http-error', body: raw };
  let envelope;
  try {
    const data = raw.split(/\r?\n/).filter(line => line.startsWith('data:')).map(line => line.slice(5).trim()).join('\n');
    envelope = JSON.parse(data || raw);
    if (!envelope || (!envelope.error && !envelope.result)) throw Error('Missing JSON-RPC result');
  } catch { return { exitCode: 1, http: response.status, kind: 'protocol-error', error: 'Invalid JSON-RPC response' }; }
  const kind = envelope.error ? 'jsonrpc-error' : envelope.result.isError ? 'mcp-tool-error' : 'mcp-result';
  return { exitCode: kind === 'mcp-result' ? 0 : 1, http: response.status, kind, envelope };
}
const PRIVATE_PART = /^(?:\.git|\.env(?:$|\.)|\.npmrc$|\.netrc$|\.ssh$|\.emdash$|node_modules$|dist$|uploads$|\.mcp(?:$|\.)|\.vscode$|private(?:\.json)?$|server\.json$|.*workflow-replay.*)$/i;
const PRIVATE_FILE = /^(?:result\.json$|acceptance\.json$|receipt\.json$|protocol\.json$|dispatch\.json$|closure\.json$|cleanup\.json$|trace\.jsonl$|.*private.*\.json$|preview-host-state\.json$|runner-private\.json$|.*\.log$|.*\.db$|.*\.sqlite.*$|.*\.jsonl$|.*\.pem$|.*\.key$|.*\.p12$|.*\.pfx$)/i;
export function discoveryPathAllowed(relative) {
  if (typeof relative !== 'string' || !relative || path.isAbsolute(relative) || relative.includes('\\')) return false;
  const parts = relative.split('/');
  return !parts.some(part => !part || part === '..' || part === '.' || PRIVATE_PART.test(part)) && !PRIVATE_FILE.test(parts.at(-1)) && !/^docs\/(?:workflow-replay|.*workflow-replay)/i.test(relative) && !/^audit\/(?:workflow-replay|.*workflow-replay)/i.test(relative) && !/^scripts\/workflow-(?:replay|preview)/i.test(relative) && !/^tests\/workflow-replay/i.test(relative);
}
function readable(site, relative) {
  if (!discoveryPathAllowed(relative)) throw Error('Unsupported or private discovery path');
  const file = path.resolve(site, relative);
  let current = site;
  for (const part of relative.split('/')) { current = path.join(current, part); if (fs.lstatSync(current).isSymbolicLink()) throw Error('Linked paths are refused'); }
  return file;
}
export function inventory(site, directory = '', { maxFiles = 5000 } = {}) {
  const result = []; let visited = 0, partial = false;
  const walk = relativeDir => {
    const base = relativeDir ? readable(site, relativeDir) : site;
    for (const entry of fs.readdirSync(base, { withFileTypes: true })) {
      if (++visited > 50000) { partial = true; return; }
      if (entry.isSymbolicLink() || PRIVATE_PART.test(entry.name)) continue;
      const relative = relativeDir ? relativeDir + '/' + entry.name : entry.name;
      if (!discoveryPathAllowed(relative)) continue;
      if (entry.isDirectory()) walk(relative);
      else if (/\.(?:md|json|mjs|js|ts|tsx|astro|css|yml|yaml|toml)$/.test(relative)) { result.push(relative); if (result.length >= maxFiles) { partial = true; return; } }
      if (partial) return;
    }
  };
  walk(directory);
  return { files: result.sort(), partial, visited };
}
export async function previewOperation(site, trialDirectory, argv) {
  const [command] = argv, privateFile = path.join(trialDirectory, 'preview-private.json'), publicFile = path.join(trialDirectory, 'preview.json');
  if (!trialDirectory || !['start', 'status', 'stop'].includes(command)) throw Error('Unsupported preview operation');
  let state = fs.existsSync(privateFile) ? JSON.parse(fs.readFileSync(privateFile, 'utf8')) : null;
  if (command === 'start') {
    if (state?.status === 'running') throw Error('Owned preview already running');
    if (!fs.existsSync(path.join(site, 'dist', 'index.html'))) throw Error('Build the assigned static fixture before preview');
    const currentStatus = () => { try { return execFileSync('git', ['status', '--porcelain'], { cwd: site, encoding: 'utf8' }); } catch { throw Error('Preview requires a Git-owned fixture'); } };
    const built = fs.existsSync(path.join(trialDirectory, 'runner-private.json')) ? JSON.parse(fs.readFileSync(path.join(trialDirectory, 'runner-private.json'), 'utf8')).lastBuild : null;
    if (!built || built.gitStatus !== currentStatus()) throw Error('A successful current build is required before preview');
    const previewPort = await availableLoopbackPort(), controlPort = await availableLoopbackPort(), token = randomBytes(24).toString('base64url'), stateFile = path.join(trialDirectory, 'preview-host-state.json');
    fs.rmSync(stateFile, { force: true });
    const host = fileURLToPath(new URL('./workflow-preview-host.mjs', import.meta.url));
    const child = spawn(process.execPath, [host, site, String(previewPort), String(controlPort), token, stateFile], { detached: true, shell: false, windowsHide: true, stdio: 'ignore' }); child.unref();
    const startedAt = Date.now();
    while (Date.now() - startedAt < 70000) {
      if (fs.existsSync(stateFile)) { const ready = JSON.parse(fs.readFileSync(stateFile, 'utf8')); if (!ready.ready) throw Error(ready.error || 'Preview failed readiness'); state = { status: 'running', url: `http://127.0.0.1:${previewPort}`, control: `http://127.0.0.1:${controlPort}`, token, pid: ready.pid, startedAt: new Date().toISOString(), buildStatus: built.gitStatus }; fs.writeFileSync(privateFile, JSON.stringify(state)); fs.writeFileSync(publicFile, JSON.stringify({ status: 'running', url: state.url, startedAt: state.startedAt })); return { exitCode: 0, kind: 'preview', url: state.url, readiness: 'ready' }; }
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    throw Error('Preview readiness timeout; owned host is recorded at ' + stateFile);
  }
  if (!state) throw Error('No owned preview capability exists');
  const response = await fetch(state.control + '/' + (command === 'stop' ? 'stop' : 'status'), { method: command === 'stop' ? 'POST' : 'GET', headers: { authorization: 'Bearer ' + state.token }, signal: AbortSignal.timeout(5000), redirect: 'manual' });
  if (!response.ok) throw Error('Owned preview control returned HTTP ' + response.status);
  const body = command === 'status' ? await response.json() : null;
  if (command === 'stop') {
    state.status = 'stopped'; state.stoppedAt = new Date().toISOString();
    const control = state.control, token = state.token;
    delete state.token; delete state.control;
    fs.writeFileSync(privateFile, JSON.stringify(state)); fs.writeFileSync(publicFile, JSON.stringify({ status: 'stopped', stoppedAt: state.stoppedAt }));
    const stoppedAt = Date.now() + 7000;
    while (Date.now() < stoppedAt) {
      try { await fetch(control + '/status', { headers: { authorization: 'Bearer ' + token }, signal: AbortSignal.timeout(500), redirect: 'manual' }); }
      catch { break; }
      await new Promise(resolve => setTimeout(resolve, 50));
    }
  }
  return { exitCode: body?.alive === false ? 1 : 0, kind: 'preview', status: command === 'stop' ? 'stopped' : body?.alive ? 'running' : 'exited', childExit: body?.childExit };
}
export async function runOperation({ site, trialDirectory, arm, trace, privateConfig = {}, action, argv, execute = processResult }) {
  const id = randomUUID(), identity = Object.freeze({ action, argv: Object.freeze([...argv]) });
  const secrets = [privateConfig.token, privateConfig.encryptionKey];
  const append = record => fs.appendFileSync(trace, JSON.stringify(record) + '\n', { mode: 0o600 });
  append({ event: 'request', id, at: new Date().toISOString(), ...JSON.parse(redact(JSON.stringify(identity), secrets)) });
  let result;
  try {
    if (action === 'run') {
      const [name, ...args] = identity.argv;
      const pkg = JSON.parse(fs.readFileSync(path.join(site, 'package.json'))), policy = commandPolicy(pkg, arm).find(entry => entry.name === name);
      if (policy?.status === 'outside-bounded-policy') result = { exitCode: 2, kind: 'outside-bounded-policy', requested: identity.argv, stdout: `Installed command is outside bounded policy: ${name}` };
      else if (!policy && Object.hasOwn(pkg.scripts ?? {}, name)) result = { exitCode: 2, kind: 'outside-bounded-policy', requested: identity.argv, stdout: `Installed command is outside bounded policy: ${name}` };
      else if (!policy?.supported) result = { exitCode: 2, kind: 'unsupported-command', requested: identity.argv, stdout: `Command is not installed: ${name}. Installed bounded policy: ${JSON.stringify(commandPolicy(pkg, arm))}` };
      else if (!policy.allowed) result = { exitCode: 2, kind: 'withheld-command', stdout: `${name} is withheld in the source-discovery arm.` };
      else {
        const invocation = npmInvocation(['run', name, ...(args.length ? ['--', ...args] : [])]);
        const heavy = ['verify', 'verify:fast', 'build', 'audit:html'].includes(name), lockPath = trialDirectory && path.join(trialDirectory, '.heavy-command-lock.json'), lockId = randomUUID();
        if (heavy && lockPath && fs.existsSync(lockPath)) {
          const current = JSON.parse(fs.readFileSync(lockPath, 'utf8'));
          if (Date.now() - Date.parse(current.startedAt) < 20 * 60 * 1000) result = { exitCode: 2, kind: 'busy', activeOperation: current.name, startedAt: current.startedAt, stdout: `Busy: ${current.name} is already running in this trial.` };
          else fs.rmSync(lockPath, { force: true });
        }
        if (!result) {
          if (heavy && lockPath) { const fd = fs.openSync(lockPath, 'wx', 0o600); fs.writeFileSync(fd, JSON.stringify({ id: lockId, name, startedAt: new Date().toISOString(), pid: process.pid })); fs.closeSync(fd); }
          try { result = await execute(invocation.command, [...invocation.args], site, { env: cleanEnv(privateConfig.encryptionKey ? { EMDASH_ENCRYPTION_KEY: privateConfig.encryptionKey } : {}), redactions: secrets }); result.executed = true; }
          finally { if (heavy && lockPath && fs.existsSync(lockPath)) { try { if (JSON.parse(fs.readFileSync(lockPath, 'utf8')).id === lockId) fs.rmSync(lockPath, { force: true }); } catch {} } }
        }
        if (result.kind === 'busy') { result.executed = false; result.requestedCommand = { executable: invocation.command, argv: [...invocation.args] }; }
        else result.command = { executable: invocation.command, argv: [...invocation.args] };
        if (name === 'build' && result.exitCode === 0 && trialDirectory) {
          const runnerFile = path.join(trialDirectory, 'runner-private.json'), state = fs.existsSync(runnerFile) ? JSON.parse(fs.readFileSync(runnerFile, 'utf8')) : {};
          state.lastBuild = { at: new Date().toISOString(), gitStatus: execFileSync('git', ['status', '--porcelain'], { cwd: site, encoding: 'utf8' }) }; fs.writeFileSync(runnerFile, JSON.stringify(state));
        }
      }
    } else if (action === 'capabilities') {
      const pkg = JSON.parse(fs.readFileSync(path.join(site, 'package.json')));
      result = { exitCode: 0, kind: 'capabilities', requested: identity.argv, policy: commandPolicy(pkg, arm), operations: { mcp: Boolean(privateConfig.endpoint && privateConfig.token), preview: Boolean(pkg.scripts?.build && fs.existsSync(path.join(site, 'astro.config.mjs'))), artifact: true } };
    } else if (action === 'preview') {
      result = await previewOperation(site, trialDirectory, identity.argv);
    } else if (action === 'artifact') {
      let total = 0;
      result = { exitCode: 0, kind: 'artifact', stdout: identity.argv.map(relative => {
        if (path.isAbsolute(relative) || relative.includes('\\') || relative.split('/').some(part => !part || part === '.' || part === '..') || !/\.(?:html|css|json)$/i.test(relative)) throw Error('Artifact path/type is outside bounded static output policy');
        const root = path.resolve(site, 'dist'), file = path.resolve(root, relative); if (!file.startsWith(root + path.sep)) throw Error('Artifact path escapes dist');
        let current = root; if (fs.lstatSync(root).isSymbolicLink()) throw Error('Artifact root is linked');
        for (const part of relative.split('/')) { current = path.join(current, part); if (fs.lstatSync(current).isSymbolicLink()) throw Error('Linked artifacts are refused'); }
        const stat = fs.statSync(file); if (!stat.isFile() || stat.size > 300000) throw Error('Artifact is not a bounded regular file'); total += stat.size; if (total > 1000000) throw Error('Artifact total byte limit exceeded');
        return `--- ${relative} (${stat.size} bytes) ---\n` + fs.readFileSync(file, 'utf8');
      }).join('\n') };
    } else if (action === 'mcp') {
      if (!privateConfig.endpoint || !privateConfig.token) throw Error('MCP is unavailable for this trial');
      const [name, second, ...remaining] = identity.argv;
      const requestedTool = name === 'tools' && second && !second.startsWith('{') ? second : null;
      const json = requestedTool ? remaining[0] ?? '{}' : second ?? '{}';
      result = await mcpResult(privateConfig.endpoint, privateConfig.token, name === 'tools' ? 'tools/list' : name, JSON.parse(name === 'tools' ? '{}' : json));
      if (name === 'tools' && requestedTool) {
        const tools = result.envelope?.result?.tools;
        if (!Array.isArray(tools)) result = { exitCode: 1, kind: 'protocol-error', error: 'MCP tools/list omitted a tools array' };
        else {
          const match = tools.find(item => item.name === requestedTool);
          result = match ? { exitCode: result.exitCode, kind: result.kind, tool: match } : { exitCode: 1, kind: 'tool-not-found', requestedTool, available: tools.map(item => item.name) };
        }
      }
      result.stdout = JSON.stringify(result.envelope ?? result.tool ?? result);
      delete result.envelope;
    } else if (action === 'read') {
      if (identity.argv.length > 50) throw Error('Read accepts at most 50 files per request');
      let total = 0;
      result = { exitCode: 0, kind: 'discovery', stdout: identity.argv.map(relative => {
        const file = readable(site, relative), stat = fs.statSync(file);
        if (!stat.isFile() || stat.size > 256000) throw Error('Input is not a bounded regular file');
        total += stat.size; if (total > 1000000) throw Error('Discovery total byte limit exceeded');
        return relative + '\n' + fs.readFileSync(file, 'utf8');
      }).join('\n') };
    } else if (action === 'files' || action === 'search') {
      const listing = inventory(site), files = listing.files, [pattern, ...paths] = identity.argv;
      for (const prefix of (action === 'search' ? paths : identity.argv)) if (!discoveryPathAllowed(prefix.replace(/\/$/, '') + '/x')) throw Error('Unsupported discovery path');
      if (action === 'search' && (pattern.length > 512 || paths.length > 50)) throw Error('Search pattern/path limit exceeded');
      const selected = files.filter(file => !(action === 'search' ? paths : identity.argv).length || (action === 'search' ? paths : identity.argv).some(prefix => file === prefix || file.startsWith(prefix.replace(/\/$/, '') + '/')));
      const regex = action === 'search' ? new RegExp(pattern, 'i') : null;
      let consumed = 0, resultBytes = 0, partial = listing.partial, rows = [];
      for (const file of selected) {
        const stat = fs.statSync(readable(site, file)); consumed += stat.size;
        if (stat.size > 256000 || consumed > 4000000) { partial = true; break; }
        if (regex) for (const [i, line] of fs.readFileSync(path.join(site, file), 'utf8').split(/\r?\n/).entries()) if (regex.test(line)) { const row = `${file}:${i + 1}:${line}`; resultBytes += Buffer.byteLength(row); if (rows.length >= 500 || resultBytes > 250000) { partial = true; break; } rows.push(row); }
        if (partial && rows.length >= 500) break;
      }
      const body = regex ? rows.join('\n') : selected.join('\n');
      result = { exitCode: 0, kind: 'discovery', partial, visited: listing.visited, searchedFiles: Math.min(selected.length, files.length), stdout: body + (partial ? '\n[Partial discovery: configured inventory, file, byte, or result limit reached.]' : '') };
    } else throw Error('Unsupported action');
  } catch (error) { result = { exitCode: 2, kind: 'runner-error', stderr: error.message }; }
  const display = result.stdout ?? result.error ?? JSON.stringify(Object.fromEntries(Object.entries(result).filter(([key]) => !['stdout', 'stderr'].includes(key))));
  const stdout = bounded(redact(display, secrets));
  const stderr = bounded(redact(result.stderr ?? '', secrets));
  const { stdout: ignoredOut, stderr: ignoredErr, ...details } = result;
  const record = { event: 'result', id, at: new Date().toISOString(), ...JSON.parse(redact(JSON.stringify(details), secrets)), stdout: { ...stdout, rawObservedBytes: result.stdoutBytes ?? null, retainedRedactedBytes: stdout.bytes, returnedPayloadBytes: stdout.emittedBytes, capturedTail: result.stdoutCapturedTail ?? ((result.stdoutBytes ?? stdout.bytes) > Buffer.byteLength(result.stdout ?? '')) }, stderr: { ...stderr, rawObservedBytes: result.stderrBytes ?? null, retainedRedactedBytes: stderr.bytes, returnedPayloadBytes: stderr.emittedBytes, capturedTail: result.stderrCapturedTail ?? ((result.stderrBytes ?? stderr.bytes) > Buffer.byteLength(result.stderr ?? '')) } };
  append(record);
  return { record, output: stdout.text + (stderr.text ? '\n' + stderr.text : '') + (stdout.truncated || stderr.truncated ? '\n[Output truncated; byte counts recorded.]' : '') };
}
