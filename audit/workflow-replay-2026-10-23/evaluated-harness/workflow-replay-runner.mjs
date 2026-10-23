// Bounded telemetry convention for local workflow trials; not a security sandbox.
import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { spawn } from 'node:child_process';
import { npmInvocation } from './process-runner.mjs';

export const COMMANDS = Object.freeze(['doctor', 'verify:fast', 'verify', 'build', 'audit:html', 'check:dev-tools', 'check:art-direction', 'design:tokens', 'test', 'test:unit', 'test:design', 'typecheck', 'baseline:inspect']);
export function commandPolicy(pkg, arm) {
  return COMMANDS.map(name => ({ name, supported: Object.hasOwn(pkg.scripts ?? {}, name), allowed: Object.hasOwn(pkg.scripts ?? {}, name) && !(name === 'baseline:inspect' && arm === 'source') }));
}
export function redact(value, secrets = []) {
  let text = String(value);
  for (const secret of secrets.filter(Boolean)) text = text.replaceAll(secret, '[REDACTED]');
  return text.replace(/\b(?:ec_pat_|emdash_enc_v1_)[A-Za-z0-9_-]+/g, '[REDACTED]').replace(/(Bearer\s+)\S+/gi, '$1[REDACTED]');
}
export function bounded(value, limit = 24000) {
  const bytes = Buffer.from(value), output = bytes.subarray(0, limit).toString('utf8');
  return { text: output, bytes: bytes.length, emittedBytes: Buffer.byteLength(output), truncated: bytes.length > limit };
}
export function cleanEnv(extra = {}) {
  const env = Object.fromEntries(Object.entries(process.env).filter(([name]) => /^(PATH|PATHEXT|SYSTEMROOT|WINDIR|COMSPEC|TEMP|TMP|HOME|USERPROFILE|LOCALAPPDATA|APPDATA)$/i.test(name)));
  return { ...env, ASTRO_TELEMETRY_DISABLED: '1', ...extra };
}
export async function processResult(command, argv, cwd, { env = cleanEnv(), timeout = 900000 } = {}) {
  return new Promise(resolve => {
    const child = spawn(command, [...argv], { cwd, env, shell: false, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
    let stdout = '', stderr = '', timedOut = false;
    // Capture a bounded tail for long verification logs, counting every byte.
    let stdoutBytes = 0, stderrBytes = 0;
    child.stdout.on('data', data => { stdoutBytes += data.length; stdout = (stdout + data).slice(-2000000); });
    child.stderr.on('data', data => { stderrBytes += data.length; stderr = (stderr + data).slice(-2000000); });
    const timer = setTimeout(() => { timedOut = true; child.kill(); }, timeout);
    child.once('error', error => { clearTimeout(timer); resolve({ exitCode: null, signal: null, kind: 'process-error', stdout, stderr: error.message, stdoutBytes, stderrBytes }); });
    child.once('close', (exitCode, signal) => { clearTimeout(timer); resolve({ exitCode, signal, kind: timedOut ? 'timeout' : 'process', stdout, stderr, stdoutBytes, stderrBytes }); });
  });
}
export async function mcpResult(endpoint, token, operation, args, request = fetch) {
  let response;
  try {
    response = await request(endpoint, { method: 'POST', headers: { authorization: 'Bearer ' + token, 'content-type': 'application/json', accept: 'application/json, text/event-stream' }, body: JSON.stringify({ jsonrpc: '2.0', id: randomUUID(), method: operation === 'tools/list' ? 'tools/list' : 'tools/call', params: operation === 'tools/list' ? {} : { name: operation, arguments: args } }), signal: AbortSignal.timeout(30000) });
  } catch (error) { return { exitCode: 1, kind: 'transport-error', error: error.message }; }
  let raw;
  try { raw = await response.text(); } catch (error) { return { exitCode: 1, http: response.status, kind: 'transport-error', error: error.message }; }
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
function readable(site, relative) {
  if (path.isAbsolute(relative) || relative.includes('\\') || relative.split('/').some(part => !part || part === '..' || part === '.' || /^(?:\.git|\.env|\.emdash|node_modules|dist|uploads|\.mcp|\.vscode)/.test(part)) || /\.(?:db|sqlite|log|jsonl)(?:$|-)/i.test(relative)) throw Error('Unsupported discovery path');
  const file = path.resolve(site, relative);
  let current = site;
  for (const part of relative.split('/')) { current = path.join(current, part); if (fs.lstatSync(current).isSymbolicLink()) throw Error('Linked paths are refused'); }
  return file;
}
function inventory(site, directory = '') {
  const result = [];
  for (const entry of fs.readdirSync(directory ? readable(site, directory) : site, { withFileTypes: true })) {
    if (entry.isSymbolicLink() || /^(?:\.|node_modules$|dist|uploads$)/.test(entry.name) && entry.name !== '.agents') continue;
    const relative = directory ? directory + '/' + entry.name : entry.name;
    if (entry.isDirectory()) result.push(...inventory(site, relative));
    else if (/\.(?:md|json|mjs|js|ts|tsx|astro|css|yml|yaml|toml)$/.test(relative)) result.push(relative);
  }
  return result.sort();
}
export async function runOperation({ site, arm, trace, privateConfig = {}, action, argv, execute = processResult }) {
  const id = randomUUID(), identity = Object.freeze({ action, argv: Object.freeze([...argv]) });
  const secrets = [privateConfig.token, privateConfig.encryptionKey];
  const append = record => fs.appendFileSync(trace, JSON.stringify(record) + '\n', { mode: 0o600 });
  append({ event: 'request', id, at: new Date().toISOString(), ...JSON.parse(redact(JSON.stringify(identity), secrets)) });
  let result;
  try {
    if (action === 'run') {
      const [name, ...args] = identity.argv;
      const policy = commandPolicy(JSON.parse(fs.readFileSync(path.join(site, 'package.json'))), arm).find(entry => entry.name === name);
      if (!policy?.supported) result = { exitCode: 2, kind: 'unsupported-command', stdout: `Unsupported command: ${name}. Installed bounded policy: ${JSON.stringify(commandPolicy(JSON.parse(fs.readFileSync(path.join(site, 'package.json'))), arm))}` };
      else if (!policy.allowed) result = { exitCode: 2, kind: 'withheld-command', stdout: `${name} is withheld in the source-discovery arm.` };
      else {
        const invocation = npmInvocation(['run', name, ...(args.length ? ['--', ...args] : [])]);
        result = await execute(invocation.command, [...invocation.args], site, { env: cleanEnv(privateConfig.encryptionKey ? { EMDASH_ENCRYPTION_KEY: privateConfig.encryptionKey } : {}) });
        result.command = { executable: invocation.command, argv: [...invocation.args] };
      }
    } else if (action === 'mcp') {
      if (!privateConfig.endpoint || !privateConfig.token) throw Error('MCP is unavailable for this trial');
      const [name, json = '{}'] = identity.argv;
      result = await mcpResult(privateConfig.endpoint, privateConfig.token, name === 'tools' ? 'tools/list' : name, JSON.parse(json));
      result.stdout = JSON.stringify(result.envelope ?? result);
      delete result.envelope;
    } else if (action === 'read') {
      result = { exitCode: 0, kind: 'discovery', stdout: identity.argv.map(relative => {
        const file = readable(site, relative), stat = fs.statSync(file);
        if (!stat.isFile() || stat.size > 512000) throw Error('Input is not a bounded regular file');
        return relative + '\n' + fs.readFileSync(file, 'utf8');
      }).join('\n') };
    } else if (action === 'files' || action === 'search') {
      const files = inventory(site), [pattern, ...paths] = identity.argv;
      const selected = files.filter(file => !(action === 'search' ? paths : identity.argv).length || (action === 'search' ? paths : identity.argv).some(prefix => file === prefix || file.startsWith(prefix.replace(/\/$/, '') + '/')));
      const regex = action === 'search' ? new RegExp(pattern, 'i') : null;
      result = { exitCode: 0, kind: 'discovery', stdout: regex ? selected.flatMap(file => fs.readFileSync(readable(site, file), 'utf8').split(/\r?\n/).flatMap((line, i) => regex.test(line) ? [`${file}:${i + 1}:${line}`] : [])).join('\n') : selected.join('\n') };
    } else throw Error('Unsupported action');
  } catch (error) { result = { exitCode: 2, kind: 'runner-error', stderr: error.message }; }
  const stdout = bounded(redact(result.stdout ?? result.error ?? '', secrets));
  const stderr = bounded(redact(result.stderr ?? '', secrets));
  const { stdout: ignoredOut, stderr: ignoredErr, ...details } = result;
  const record = { event: 'result', id, at: new Date().toISOString(), ...JSON.parse(redact(JSON.stringify(details), secrets)), stdout: { ...stdout, capturedTail: (result.stdoutBytes ?? stdout.bytes) > Buffer.byteLength(result.stdout ?? '') }, stderr: { ...stderr, capturedTail: (result.stderrBytes ?? stderr.bytes) > Buffer.byteLength(result.stderr ?? '') } };
  append(record);
  return { record, output: stdout.text + (stderr.text ? '\n' + stderr.text : '') + (stdout.truncated || stderr.truncated ? '\n[Output truncated; byte counts recorded.]' : '') };
}
