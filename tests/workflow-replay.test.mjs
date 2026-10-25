import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { commandPolicy, runOperation, mcpResult, processResult, cleanEnv, inventory } from '../scripts/workflow-replay-runner.mjs';
import { prepare, validateDispatch, sourceHashes, sourceInputs, archiveReplay, isPublicEvidence } from '../scripts/workflow-replay.mjs';
import { sourceChangeAllowed, captureCmsBaseline, compareCmsBaseline, hasUnapprovedLaunchDate } from '../scripts/workflow-replay-grade.mjs';
import { execFileSync } from 'node:child_process';

async function fixture(run) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'workflow-runner-'));
  try {
    fs.writeFileSync(path.join(directory, 'package.json'), JSON.stringify({ scripts: { doctor: 'node doctor.mjs', verify: 'node verify.mjs', 'audit:html': 'node audit.mjs', 'check:dev-tools': 'node dev.mjs', 'baseline:inspect': 'node inspect.mjs' } }));
    await run(directory);
  } finally { fs.rmSync(directory, { recursive: true, force: true }); }
}
test('installed bounded commands include the previously withheld gates and report missing commands', () => {
  const policies = commandPolicy({ scripts: { doctor: '', 'audit:html': '', 'check:dev-tools': '', 'baseline:inspect': '' } }, 'source');
  for (const name of ['doctor', 'audit:html', 'check:dev-tools']) assert.deepEqual(policies.find(entry => entry.name === name), { name, supported: true, allowed: true, status: 'allowed' });
  assert.equal(policies.find(entry => entry.name === 'verify').supported, false);
  assert.equal(policies.find(entry => entry.name === 'baseline:inspect').allowed, false);
  assert.equal(commandPolicy({ scripts: { 'baseline:inspect': '' } }, 'inspect').find(entry => entry.name === 'baseline:inspect').allowed, true);
  assert.equal(commandPolicy({ scripts: { custom: '' } }, 'inspect').find(entry => entry.name === 'custom').status, 'outside-bounded-policy');
});
test('trace retains immutable npm script/argv, failure status, output bounds and redaction', async () => fixture(async site => {
  const trace = path.join(site, 'trace.jsonl'), argv = ['verify', '--some-flag', 'two words'];
  let actual;
  const result = await runOperation({ site, arm: 'source', trace, privateConfig: { token: 'private-value' }, action: 'run', argv, execute: async (executable, args) => {
    actual = { executable, args: [...args] }; args.shift();
    return { exitCode: 19, signal: null, kind: 'process', stdout: 'private-value ' + 'x'.repeat(25000), stderr: 'Bearer ec_pat_something-secret' };
  } });
  assert.deepEqual(argv, ['verify', '--some-flag', 'two words']);
  const [request, response] = fs.readFileSync(trace, 'utf8').trim().split('\n').map(JSON.parse);
  assert.deepEqual(request.argv, argv); assert.equal(request.action, 'run'); assert.equal(request.id, response.id);
  assert.deepEqual(actual.args.slice(-5), ['run', 'verify', '--', '--some-flag', 'two words']);
  assert.deepEqual(response.command.argv.slice(-5), ['run', 'verify', '--', '--some-flag', 'two words']);
  assert.equal(response.exitCode, 19); assert.equal(response.stdout.truncated, true); assert.ok(response.stdout.bytes > response.stdout.emittedBytes);
  assert.ok(!fs.readFileSync(trace, 'utf8').includes('private-value')); assert.ok(!result.output.includes('ec_pat_'));
}));
test('unsupported and intentionally withheld commands are distinct and never execute', async () => fixture(async site => {
  const common = { site, arm: 'source', trace: path.join(site, 'trace.jsonl'), execute: () => assert.fail('must not execute') };
  assert.equal((await runOperation({ ...common, action: 'run', argv: ['missing'] })).record.kind, 'unsupported-command');
  assert.equal((await runOperation({ ...common, action: 'run', argv: ['baseline:inspect', '--json'] })).record.kind, 'withheld-command');
  fs.writeFileSync(path.join(site, 'package.json'), JSON.stringify({ scripts: { custom: 'echo unsafe' } }));
  assert.equal((await runOperation({ ...common, action: 'run', argv: ['custom'] })).record.kind, 'outside-bounded-policy');
}));
test('MCP transport, HTTP, protocol, JSON-RPC and tool failures remain distinguishable', async () => {
  const request = raw => async () => new Response(raw, { status: 200 });
  assert.equal((await mcpResult('http://127.0.0.1', 'secret', 'content_get', {}, async () => { throw Error('offline'); })).kind, 'transport-error');
  assert.equal((await mcpResult('http://127.0.0.1', 'secret', 'content_get', {}, async () => new Response('denied', { status: 401 }))).kind, 'http-error');
  assert.equal((await mcpResult('http://127.0.0.1', 'secret', 'content_get', {}, request('<html>bad'))).kind, 'protocol-error');
  assert.equal((await mcpResult('http://127.0.0.1', 'secret', 'content_get', {}, request('{"error":{"code":-32601}}'))).kind, 'jsonrpc-error');
  const tool = await mcpResult('http://127.0.0.1', 'secret', 'content_get', {}, request('{"result":{"isError":true,"content":[]}}'));
  assert.equal(tool.kind, 'mcp-tool-error'); assert.equal(tool.exitCode, 1);
  const success = await mcpResult('http://127.0.0.1', 'secret', 'tools/list', {}, request('event: message\ndata: {"result":{"tools":[]}}\n\n'));
  assert.equal(success.kind, 'mcp-result'); assert.equal(success.exitCode, 0);
});
test('MCP never sends a credential to an external host or follows redirects', async () => {
  const refused = await mcpResult('https://example.com/mcp', 'secret', 'tools/list', {}, () => assert.fail('external request'));
  assert.equal(refused.kind, 'endpoint-error');
  const redirect = await mcpResult('http://127.0.0.1/mcp', 'secret', 'tools/list', {}, async (url, options) => { assert.equal(options.redirect, 'manual'); return new Response(null, { status: 302 }); });
  assert.equal(redirect.kind, 'http-error'); assert.equal(redirect.http, 302);
});
test('dispatch requires every applicable green command and unchanged source', () => {
  const source = { 'package.json': 'abc' };
  const preflight = ['verify', 'build', 'check:dev-tools'].map(name => ({ command: { argv: ['npm-cli.js', 'run', name] }, exitCode: 0, signal: null, kind: 'process' }));
  assert.doesNotThrow(() => validateDispatch({ source, preflight }, 'static', source));
  assert.throws(() => validateDispatch({ source, preflight }, 'cms', source), /doctor/);
  assert.throws(() => validateDispatch({ source, preflight: preflight.slice(1) }, 'static', source), /verify/);
  assert.throws(() => validateDispatch({ source, preflight: [{ ...preflight[0], exitCode: 1 }, ...preflight.slice(1)] }, 'static', source), /verify/);
  assert.throws(() => validateDispatch({ source, preflight }, 'static', { 'package.json': 'changed' }), /source changed/);
});
test('source preservation maps include added files and deleted tracked sources', async () => fixture(async site => {
  const git = argv => execFileSync('git', argv, { cwd: site, stdio: 'ignore' });
  git(['init', '--quiet']); git(['add', 'package.json']);
  const before = sourceHashes(site); assert.deepEqual(sourceInputs(site), before);
  fs.writeFileSync(path.join(site, 'new.md'), 'new artifact'); fs.unlinkSync(path.join(site, 'package.json'));
  const after = sourceHashes(site); assert.equal(after['package.json'], null); assert.ok(after['new.md']); assert.ok(before['package.json']);
  assert.deepEqual(sourceInputs(site), after);
  fs.writeFileSync(path.join(site, '.mcp.json'), 'private configuration');
  assert.deepEqual(sourceInputs(site), after, 'private inputs stay excluded');
  fs.writeFileSync(path.join(site, 'package.json'), 'restored source');
  assert.notDeepEqual(sourceInputs(site), after, 'restoring a deleted tracked input invalidates its frozen map');
}));
test('CMS baseline hashes every seeded content record plus menus and settings, allowing only the owned draft', async () => {
  const state = { posts: [{ id: 'existing', title: 'Before' }], menus: [{ id: 'main', items: ['home'] }], settings: { title: 'Fixture' } };
  const request = async (_url, options) => {
    const body = JSON.parse(options.body), name = body.params.name;
    let value;
    if (body.method === 'tools/list') value = { tools: ['content_list', 'content_get', 'menu_list', 'settings_get'].map(name => ({ name, inputSchema: { type: 'object', properties: {} } })) };
    else if (name === 'content_list') value = { items: state[body.params.arguments.collection].map(row => ({ id: row.id })) };
    else if (name === 'content_get') value = { item: state[body.params.arguments.collection].find(row => row.id === body.params.arguments.id) };
    else if (name === 'menu_list') value = state.menus;
    else if (name === 'settings_get') value = state.settings;
    else assert.fail(name);
    return new Response(JSON.stringify({ result: body.method === 'tools/list' ? value : { structuredContent: value } }), { status: 200 });
  };
  const before = await captureCmsBaseline('http://127.0.0.1/mcp', 'observer', ['posts'], request);
  state.posts.push({ id: 'owned', title: 'New draft' });
  const result = await compareCmsBaseline(before, 'http://127.0.0.1/mcp', 'observer', 'owned', request);
  assert.equal(result.onlyAdded.id, 'owned'); assert.equal(result.settingsUnchanged, true);
  state.settings.title = 'Changed';
  await assert.rejects(compareCmsBaseline(before, 'http://127.0.0.1/mcp', 'observer', 'owned', request), /settings changed/);
});
test('real process status and capture-tail counts are observable; environment excludes credentials', async () => {
  const result = await processResult(process.execPath, ['-e', 'process.stdout.write("x".repeat(2100000));process.stderr.write("failure");process.exitCode=7'], process.cwd());
  assert.equal(result.exitCode, 7); assert.equal(result.stdoutBytes, 2100000); assert.equal(result.stdout.length, 2000000); assert.equal(result.stderr, 'failure');
  assert.equal(cleanEnv().EMDASH_TOKEN, undefined); assert.equal(cleanEnv().SITE_URL, undefined);
});
test('process capture redacts credentials that cross stream chunks and the retained-tail boundary', async () => {
  const secret = 'ec_pat_boundary-secret-value';
  const code = `process.stdout.write("x".repeat(1999997));process.stdout.write("ec_pat_boundary-");process.stdout.write("secret-value");process.stdout.write("y".repeat(150));`;
  const result = await processResult(process.execPath, ['-e', code], process.cwd(), { redactions: [secret] });
  assert.equal(result.stdoutCapturedTail, true); assert.ok(result.stdoutBytes > 2000000); assert.doesNotMatch(result.stdout, /ec_pat_boundary-secret-value/); assert.match(result.stdout, /\[REDACTED\]/);
});
test('optional redactions and nested discovery inventories work on Windows trials', async () => fixture(async site => {
  const result = await processResult(process.execPath, ['-e', 'process.stdout.write("ok")'], site, { redactions: [undefined, ''] });
  assert.equal(result.exitCode, 0); assert.equal(result.stdout, 'ok');
  fs.mkdirSync(path.join(site, 'nested', 'deeper'), { recursive: true }); fs.writeFileSync(path.join(site, 'nested', 'deeper', 'readme.md'), 'readable');
  assert.deepEqual(inventory(site).files, ['nested/deeper/readme.md', 'package.json']);
}));
test('unapproved launch-date review accepts clear negative wording and rejects approved dates', () => {
  assert.equal(hasUnapprovedLaunchDate('There is no approved launch date.'), true);
  assert.equal(hasUnapprovedLaunchDate('The launch date is not approved.'), true);
  assert.equal(hasUnapprovedLaunchDate('No payment flow, external deployment, or launch date is approved.'), true);
  assert.equal(hasUnapprovedLaunchDate('No launch date, payment flow or external deployment is approved.'), true);
  assert.equal(hasUnapprovedLaunchDate('The approved launch date is October 1.'), false);
});
test('discovery refuses credentials, traversal and linked inputs without relaxing infrastructure guards', async () => fixture(async site => {
  const common = { site, arm: 'source', trace: path.join(site, 'trace.jsonl'), action: 'read' };
  fs.writeFileSync(path.join(site, '.env'), 'SECRET=must-not-leak');
  for (const file of ['.env', '../package.json', 'data.db', '.mcp.json']) assert.equal((await runOperation({ ...common, argv: [file] })).record.exitCode, 2);
  fs.mkdirSync(path.join(site, 'actual')); fs.writeFileSync(path.join(site, 'actual/readme.md'), 'text');
  fs.symlinkSync(path.join(site, 'actual'), path.join(site, 'linked'), process.platform === 'win32' ? 'junction' : 'dir');
  assert.equal((await runOperation({ ...common, argv: ['linked/readme.md'] })).record.exitCode, 2);
  assert.ok(!fs.readFileSync(common.trace, 'utf8').includes('must-not-leak'));
}));
test('shared discovery policy hides operator, credential and replay paths', async () => fixture(async site => {
  const trace = path.join(site, 'trace.jsonl');
  fs.mkdirSync(path.join(site, 'docs')); fs.writeFileSync(path.join(site, 'docs/workflow-replay.md'), 'operator plan');
  fs.writeFileSync(path.join(site, '.npmrc'), 'token=private'); fs.writeFileSync(path.join(site, 'visible.md'), 'visible');
  for (const file of ['.npmrc', 'docs/workflow-replay.md', 'scripts/workflow-replay.mjs', 'tests/workflow-replay.test.mjs']) assert.equal((await runOperation({ site, arm: 'inspect', trace, action: 'read', argv: [file] })).record.exitCode, 2, file);
  const files = await runOperation({ site, arm: 'inspect', trace, action: 'files', argv: [] });
  assert.match(files.output, /visible.md/); assert.doesNotMatch(files.output, /workflow-replay|\.npmrc/);
}));
test('discovery output respects UTF-8 byte ceilings', async () => fixture(async site => {
  const trace = path.join(site, 'trace.jsonl'); fs.writeFileSync(path.join(site, 'visible.md'), '🙂'.repeat(70000));
  const result = await runOperation({ site, arm: 'inspect', trace, action: 'read', argv: ['visible.md'] });
  const record = JSON.parse(fs.readFileSync(trace, 'utf8').trim().split('\n').at(-1));
  assert.ok(record.stdout.emittedBytes <= 24000); assert.doesNotMatch(result.output, /�/);
}));
test('bounded artifact reads accept static HTML and reject traversal and server files', async () => fixture(async site => {
  const trial = fs.mkdtempSync(path.join(os.tmpdir(), 'workflow-artifact-')), dist = path.join(site, 'dist'); fs.mkdirSync(dist); fs.writeFileSync(path.join(dist, 'index.html'), '<main>ok</main>');
  const trace = path.join(site, 'trace.jsonl'), common = { site, arm: 'source', trace, action: 'artifact', trialDirectory: trial };
  const good = await runOperation({ ...common, argv: ['index.html'] }); assert.equal(good.record.kind, 'artifact'); assert.match(good.output, /<main>ok<\/main>/);
  assert.equal((await runOperation({ ...common, argv: ['../package.json'] })).record.kind, 'runner-error');
  assert.equal((await runOperation({ ...common, argv: ['server.mjs'] })).record.kind, 'runner-error');
  fs.rmSync(trial, { recursive: true, force: true });
}));
test('capabilities are returned to workers and preview cannot start before a build', async () => fixture(async site => {
  const trial = fs.mkdtempSync(path.join(os.tmpdir(), 'workflow-preview-')), trace = path.join(site, 'trace.jsonl');
  fs.writeFileSync(path.join(site, 'package.json'), JSON.stringify({ scripts: { build: 'node build.mjs', custom: 'echo unsafe' } }));
  const common = { site, trialDirectory: trial, arm: 'inspect', trace };
  const capabilities = await runOperation({ ...common, action: 'capabilities', argv: [] });
  assert.match(capabilities.output, /outside-bounded-policy/); assert.match(capabilities.output, /preview/);
  fs.mkdirSync(path.join(site, 'dist')); fs.writeFileSync(path.join(site, 'dist/index.html'), 'built');
  const preview = await runOperation({ ...common, action: 'preview', argv: ['start'] }); assert.equal(preview.record.kind, 'runner-error'); assert.match(preview.output, /successful current build/);
  fs.rmSync(trial, { recursive: true, force: true });
}));
test('owned loopback preview starts, reports status and stops its child', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'workflow-preview-owned-')), site = path.join(root, 'site'), trial = path.join(root, 'trial'), trace = path.join(root, 'trace.jsonl'); let started = false;
  try {
    fs.mkdirSync(path.join(site, 'node_modules', 'astro', 'bin'), { recursive: true }); fs.mkdirSync(path.join(site, 'dist'), { recursive: true }); fs.mkdirSync(trial, { recursive: true });
    fs.writeFileSync(path.join(site, 'package.json'), JSON.stringify({ scripts: { build: 'node build.mjs' } }));
    fs.writeFileSync(path.join(site, 'dist', 'index.html'), '<main>preview</main>');
    fs.writeFileSync(path.join(site, 'node_modules', 'astro', 'bin', 'astro.mjs'), `import http from 'node:http'; const i=process.argv.indexOf('--port'); const port=Number(process.argv[i+1]); http.createServer((q,s)=>{s.writeHead(200,{'content-type':'text/html'});s.end('<main>preview</main>')}).listen(port,'127.0.0.1');`);
    const git = args => execFileSync('git', args, { cwd: site, stdio: 'ignore' }); git(['init', '--quiet']); git(['add', '.']); git(['-c', 'user.name=Replay', '-c', 'user.email=Replay@example.invalid', 'commit', '--quiet', '-m', 'fixture']);
    const built = execFileSync('git', ['status', '--porcelain'], { cwd: site, encoding: 'utf8' }); fs.writeFileSync(path.join(trial, 'runner-private.json'), JSON.stringify({ lastBuild: { gitStatus: built } }));
    const start = await runOperation({ site, trialDirectory: trial, arm: 'inspect', trace, action: 'preview', argv: ['start'] }); assert.equal(start.record.kind, 'preview'); started = true;
    const status = await runOperation({ site, trialDirectory: trial, arm: 'inspect', trace, action: 'preview', argv: ['status'] }); assert.equal(status.record.status, 'running');
    const stop = await runOperation({ site, trialDirectory: trial, arm: 'inspect', trace, action: 'preview', argv: ['stop'] }); assert.equal(stop.record.status, 'stopped'); started = false;
  } finally {
    if (started) { try { await runOperation({ site, trialDirectory: trial, arm: 'inspect', trace, action: 'preview', argv: ['stop'] }); } catch {} }
    fs.rmSync(root, { recursive: true, force: true });
  }
});
test('public archive allowlist excludes private runtime state', () => {
  assert.equal(isPublicEvidence('receipt.json'), true); assert.equal(isPublicEvidence('trace.jsonl'), true);
  assert.equal(isPublicEvidence('install-d2127628-d030-43aa-a612-2f523ba361b7.json'), true);
  for (const file of ['private.json', 'server.json', 'preview-private.json', 'cms-server.log', 'data.db']) assert.equal(isPublicEvidence(file), false, file);
});
test('Sveltia source policy accepts a focused helper regardless of its basename', () => {
  assert.equal(sourceChangeAllowed('sveltia', 'src/lib/reading-duration.ts'), true);
  assert.equal(sourceChangeAllowed('sveltia', 'tests/reading-duration.test.mjs'), true);
  assert.equal(sourceChangeAllowed('sveltia', 'src/styles/global.css'), false);
});
test('archive redacts private values and derives blockers from missing evidence', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'workflow-archive-root-')), run = path.join(root, 'run'), trialDir = path.join(run, 'static-source'), site = path.join(trialDir, 'site'), dest = path.join(root, 'audit', 'workflow-replay-closeout');
  try {
    fs.mkdirSync(site, { recursive: true }); fs.mkdirSync(path.join(root, 'audit'), { recursive: true });
    fs.writeFileSync(path.join(trialDir, 'receipt.json'), JSON.stringify({ preflight: [{ exitCode: 0 }], harness: { x: 'frozen' }, source: {} }));
    fs.writeFileSync(path.join(trialDir, 'private.json'), JSON.stringify({ token: 'ec_pat_private-value', encryptionKey: 'emdash_enc_v1_private-value' }));
    fs.writeFileSync(path.join(trialDir, 'result.json'), JSON.stringify({ summary: 'done ec_pat_private-value' }));
    const state = { owner: 'owner', out: run, trials: [{ id: 'static-source', scenario: 'static', directory: trialDir, site, ready: true }] };
    fs.writeFileSync(path.join(trialDir, 'unclassified.txt'), 'unexpected'); assert.throws(() => archiveReplay(state, dest, { repositoryRoot: root }), /unclassified trial file/); fs.rmSync(path.join(trialDir, 'unclassified.txt'));
    const { closure } = archiveReplay(state, dest, { repositoryRoot: root });
    assert.equal(closure.readyToClose, false); assert.ok(closure.blockers.length);
    assert.doesNotThrow(() => archiveReplay(state, dest, { repositoryRoot: root }));
    fs.writeFileSync(path.join(trialDir, 'receipt.json'), JSON.stringify({ preflight: [{ exitCode: 1 }], harness: { x: 'changed' } }));
    assert.throws(() => archiveReplay(state, dest, { repositoryRoot: root }), /replacement of frozen evidence/);
    const exported = fs.readFileSync(path.join(dest, 'static-source', 'result.json'), 'utf8'); assert.doesNotMatch(exported, /ec_pat_private-value|emdash_enc_v1_private-value/); assert.match(exported, /\[REDACTED\]/);
    assert.equal(fs.existsSync(path.join(dest, 'static-source', 'private.json')), false);
  } finally { fs.rmSync(root, { recursive: true, force: true }); }
});
test('replay preparation refuses existing projects before any mutation', async () => fixture(async site => {
  const before = fs.readFileSync(path.join(site, 'package.json'));
  await assert.rejects(prepare(site), /new sibling directory/);
  assert.deepEqual(fs.readFileSync(path.join(site, 'package.json')), before);
}));
