// Small local replay operator for issue #7. Fresh evaluators are dispatched by
// the operator after `prompt`; this command never calls a model or a hosted site.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { execFileSync, spawn } from 'node:child_process';
import { once } from 'node:events';
import http from 'node:http';
import { initProfile } from './init-profile.mjs';
import { argumentsOf, noLinks } from './infrastructure-io.mjs';
import { npmInvocation } from './process-runner.mjs';
import { availableLoopbackPort } from './loopback-port.mjs';
import { tokenOperation } from './create-mcp-token.mjs';
import { cleanEnv, commandPolicy, processResult, redact, runOperation } from './workflow-replay-runner.mjs';

const ROOT = fileURLToPath(new URL('../', import.meta.url));
const hash = value => createHash('sha256').update(value).digest('hex');
const write = (file, value) => fs.writeFileSync(file, JSON.stringify(value, null, 2) + '\n', { mode: 0o600 });
const git = (cwd, args) => execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
const contains = (root, target) => target === root || target.startsWith(root + path.sep);
export const SCENARIOS = Object.freeze({
  static: {
    profile: 'static',
    task: 'The services cards on the homepage feel too far apart. Reduce only the services grid gap by 25% at every viewport size, retaining responsive scaling. Keep other grids, global tokens, copy and navigation unchanged. Implement and verify using the established visual system.',
    criteria: ['Only the services grid relationship changes; global tokens, copy, navigation and reference grid are preserved.', 'Computed services/reference grid gap ratio is 0.75 at 600, 1000 and 1500 CSS pixels.', 'Applicable final verify, build and production isolation checks pass.'],
  },
  sveltia: {
    profile: 'static-sveltia',
    task: 'Editors need optional readingMinutes on posts: whole minutes from 1 through 60. Pair the typed content schema with the browser editor form. Show "N min read" on article detail only when supplied. Existing posts without a value must build and render normally. Preserve content and the visual system; verify valid boundaries and invalid inputs.',
    criteria: ['Optional integer form field has min 1, max 60 and whole-number input; schema matches without coercing numeric strings.', 'Real Astro builds render 1 and 60; reject 0, 61, 1.5 and numeric string "2" with field-specific validation.', 'Absent legacy value builds without a reading-time label; grader restores original content.', 'Global CSS, existing content, navigation and dependencies are preserved; applicable final gates pass.'],
  },
  cms: {
    profile: 'emdash',
    task: 'Create one owned draft in posts through live EmDash MCP using the runner. Title: "Planning a useful kickoff". Excerpt: "A short agenda for the first conversation." Body: "Agree the purpose, invite the people doing the work, and leave with clear next steps." Slug: kickoff-{{id}}. Keep unpublished, read it back, and explain the Contributor publishing and schema-access boundary. Do not change source, seed or settings.',
    criteria: ['MCP readback contains exact supplied text, assigned owner, slug and draft status.', 'Anonymous public route returns 404; no published version is created.', 'All tracked application, configuration, seed and settings sources remain byte-identical.', 'Independent final verify, build and HTML audit pass; temporary token is revoked and synthetic user disabled.'],
  },
  'older-profile': {
    profile: 'static',
    task: 'Pick up the workshop feature and update only HANDOFF.md with the established need, current implementation, remaining work and next concrete local action. Preserve supplied decisions and content. Continue authorized local preparation from available evidence without restarting customer discovery. This is a handoff task, not implementation. Do not deploy or claim tests or client acceptance occurred during your session.',
    criteria: ['Recover local team leads, English static scope, email registration workshops@northline.example.test and editorial/maintenance ownership.', 'Keep quarterly cadence assumed and launch date unapproved; workshops collection/content exist while workshop routes are missing.', 'Resolve stale CMS handoff and unselected fixed-spacing design against later decision evidence and actual source.', 'Missing docs/project-context.md and PROJECT.example.md do not block; no CMS dependencies or forced PROJECT.md adoption.', 'Only HANDOFF.md changes; art record, fluid CSS, supplied content and durable context remain identical; report actual checks only.'],
  },
});
export function sourceHashes(site) {
  return Object.fromEntries(git(site, ['ls-files', '-z']).split('\0').filter(Boolean).sort().map(file => [file, hash(fs.readFileSync(path.join(site, file)))]));
}
export function load(out) {
  const directory = noLinks(path.resolve(out));
  const state = JSON.parse(fs.readFileSync(path.join(directory, 'state.json')));
  if (state.out !== directory || state.owner !== JSON.parse(fs.readFileSync(path.join(directory, '.replay-owned.json'))).owner) throw Error('Unowned replay directory');
  return state;
}
export function trialOf(state, id) {
  const trial = state.trials.find(entry => entry.id === id);
  if (!trial || !contains(state.out, trial.directory) || trial.site !== path.join(trial.directory, 'site')) throw Error('Unknown or invalid trial');
  noLinks(trial.directory); noLinks(trial.site);
  return trial;
}
export function privateOf(trial) { return JSON.parse(fs.readFileSync(path.join(trial.directory, 'private.json'))); }
function saveTrial(state, trial) { Object.assign(state.trials.find(entry => entry.id === trial.id), trial); write(path.join(state.out, 'state.json'), state); }
function initializeGit(site) {
  git(site, ['init', '--quiet']); git(site, ['add', '.']);
  git(site, ['-c', 'user.name=Workflow fixture', '-c', 'user.email=workflow@example.invalid', '-c', 'core.hooksPath=NUL', 'commit', '--quiet', '-m', 'Frozen disposable workflow fixture']);
}
export async function npmLog(trial, args, label, extra = {}) {
  const invocation = npmInvocation(args);
  const result = await processResult(invocation.command, invocation.args, trial.site, { env: cleanEnv(extra) });
  const secrets = Object.values(extra), output = redact(result.stdout + result.stderr, secrets);
  fs.writeFileSync(path.join(trial.directory, label + '.log'), output);
  return { command: { executable: invocation.command, argv: [...invocation.args] }, exitCode: result.exitCode, signal: result.signal, kind: result.kind, stdoutBytes: result.stdoutBytes, stderrBytes: result.stderrBytes, capturedTail: Buffer.byteLength(result.stdout) < result.stdoutBytes || Buffer.byteLength(result.stderr) < result.stderrBytes, log: label + '.log' };
}
function copyCMS(site) {
  const omitted = [];
  for (const relative of git(ROOT, ['ls-files', '--cached', '--others', '--exclude-standard', '-z']).split('\0').filter(Boolean)) {
    // Evaluation answers and live client MCP configuration are not fixture input.
    if (relative === '.mcp.json' || relative.startsWith('.vscode/') || relative.startsWith('audit/') && !/^audit\/(?:design-gate-exceptions.json|component-calibration.md|visual-concepts\/)/.test(relative)) { omitted.push(relative); continue; }
    const from = noLinks(path.join(ROOT, relative));
    const to = path.join(site, relative); fs.mkdirSync(path.dirname(to), { recursive: true }); fs.copyFileSync(from, to);
  }
  return omitted;
}
async function decorate(trial) {
  const site = trial.site;
  const invocation = npmInvocation(['run', 'design:tokens', '--', '--init-client', '--lane', 'editorial-paper']);
  const result = await processResult(invocation.command, invocation.args, site);
  if (result.exitCode !== 0) throw Error('Fixture token initialization failed: ' + result.stderr + result.stdout);
  if (trial.scenario === 'static') {
    fs.writeFileSync(path.join(site, 'src/pages/index.astro'), `---
import Base from '../layouts/Base.astro';
import Section from '../components/Section.astro';
import Container from '../components/Container.astro';
import Grid from '../components/Grid.astro';
import Card from '../components/Card.astro';
---
<Base title="Useful conversations"><Section labelledBy="page-title"><Container>
<h1 id="page-title">Useful conversations</h1><p>Northline Studio helps small teams plan useful work.</p>
<h2 id="services-heading">Services</h2><Grid id="services-grid" aria-labelledby="services-heading"><Card title="Project briefs" description="Start with a practical brief."/><Card title="Working sessions" description="Make useful decisions."/></Grid>
<h2 id="approach-heading">Our approach</h2><Grid id="approach-grid" aria-labelledby="approach-heading"><Card title="Listen" description="Understand the situation."/><Card title="Clarify" description="Agree next steps."/></Grid>
</Container></Section></Base>\n`);
  }
  if (trial.scenario === 'older-profile') {
    const old = path.join(ROOT, 'audit/project-context-2026-10-21/inline/inputs');
    for (const file of ['HANDOFF.md', 'DESIGN.md', 'audit/brief-decision.md', 'src/content/workshops/clear-briefs.md']) {
      fs.mkdirSync(path.dirname(path.join(site, file)), { recursive: true }); fs.copyFileSync(path.join(old, file), path.join(site, file));
    }
    const brief = fs.readFileSync(path.join(old, 'AGENTS.md'), 'utf8').split('## Existing site brief')[1];
    fs.appendFileSync(path.join(site, 'AGENTS.md'), '\n## Existing site brief' + brief);
    const config = path.join(site, 'src/content.config.ts');
    fs.writeFileSync(config, fs.readFileSync(config, 'utf8').replace('export const collections = { posts };', `const workshops = defineCollection({ loader: glob({ base: './src/content/workshops', pattern: '**/*.md' }), schema: z.object({ title: z.string(), date: z.coerce.date(), draft: z.boolean().default(false) }) });\nexport const collections = { posts, workshops };`));
    for (const file of ['docs/project-context.md', 'PROJECT.example.md']) fs.rmSync(path.join(site, file), { force: true });
  }
}
export async function prepare(out, selected = 'all') {
  const destination = noLinks(path.resolve(out));
  if (contains(ROOT, destination) || contains(destination, ROOT) || fs.existsSync(destination) || !/^baseline-workflow-replay-/.test(path.basename(destination))) throw Error('Use a new sibling directory named baseline-workflow-replay-<name>; never an existing project.');
  const scenarios = selected === 'all' ? Object.keys(SCENARIOS) : [selected];
  if (scenarios.some(name => !SCENARIOS[name])) throw Error('Unknown scenario');
  fs.mkdirSync(destination, { recursive: true });
  const state = { schemaVersion: 1, owner: randomUUID(), out: destination, createdAt: new Date().toISOString(), sourceHead: git(ROOT, ['rev-parse', 'HEAD']), sourceDirty: Boolean(git(ROOT, ['status', '--porcelain'])), node: process.version, platform: process.platform, trials: [] };
  write(path.join(destination, '.replay-owned.json'), { owner: state.owner }); write(path.join(destination, 'state.json'), state);
  // Freeze all criteria and prompt templates before preparing or dispatching any arm.
  write(path.join(destination, 'protocol.json'), { frozenAt: new Date().toISOString(), scenarios: SCENARIOS, limits: ['One pair per scenario is exploratory.', 'Emitted bytes are not model tokens; model usage, cost and comparable elapsed time are unavailable.', 'Runner use is an instructed convention, not filesystem/process confinement.', 'No production data, browser editor login, hosted OAuth, D1 or R2 acceptance.'] });
  for (const scenario of scenarios) for (const arm of scenario === 'older-profile' ? ['source'] : ['source', 'inspect']) {
    const id = scenario + '-' + arm, directory = path.join(destination, id), site = path.join(directory, 'site');
    fs.mkdirSync(directory); const trial = { id, scenario, arm, directory, site, ready: false }; state.trials.push(trial); saveTrial(state, trial);
    console.log('Preparing ' + id);
    let omitted = [];
    if (scenario === 'cms') { fs.mkdirSync(site); omitted = copyCMS(site); }
    else await initProfile({ profile: SCENARIOS[scenario].profile, out: site });
    const install = await npmLog(trial, [scenario === 'cms' ? 'ci' : 'install', '--no-audit', '--no-fund'], 'install');
    write(path.join(directory, 'install.json'), install);
    if (install.exitCode !== 0) throw Error(id + ' independent install failed; see install.log');
    noLinks(path.join(site, 'node_modules'));
    if (scenario !== 'cms') await decorate(trial);
    initializeGit(site);
    const encryptionKey = 'emdash_enc_v1_' + randomBytes(32).toString('base64url');
    write(path.join(directory, 'private.json'), { encryptionKey });
    const pkg = JSON.parse(fs.readFileSync(path.join(site, 'package.json')));
    const receipt = { sourceHead: state.sourceHead, sourceDirty: state.sourceDirty, node: state.node, platform: state.platform, independentInstall: true, install, omitted, lockSHA256: hash(fs.readFileSync(path.join(site, 'package-lock.json'))), installed: Object.fromEntries(['astro', 'emdash', 'tailwindcss'].flatMap(name => { const file = path.join(site, 'node_modules', name, 'package.json'); return fs.existsSync(file) ? [[name, JSON.parse(fs.readFileSync(file)).version]] : []; })), policy: commandPolicy(pkg, arm), source: sourceHashes(site), preflight: [] };
    write(path.join(directory, 'receipt.json'), receipt);
    if (scenario === 'cms') {
      const server = await startCMS(trial, encryptionKey);
      try {
        const response = await fetch(server.origin + '/_emdash/api/setup/dev-bypass', { redirect: 'manual', signal: AbortSignal.timeout(60000) });
        if (response.status >= 400) throw Error('Disposable CMS setup failed: ' + response.status);
      } finally { await server.stop(); }
    }
    for (const name of scenario === 'cms' ? ['doctor', 'verify', 'build', 'audit:html'] : ['verify', 'build', 'check:dev-tools']) {
      console.log(id + ': preflight ' + name);
      if (!pkg.scripts[name]) throw Error('Required preflight unavailable: ' + name);
      const check = await npmLog(trial, ['run', name], 'preflight-' + name.replaceAll(':', '-'), { EMDASH_ENCRYPTION_KEY: encryptionKey });
      receipt.preflight.push(check); write(path.join(directory, 'receipt.json'), receipt);
      if (check.exitCode !== 0) throw Error(id + ' preflight failed: ' + name + '; dispatch refused.');
    }
    // Builds may refresh generated declarations. Freeze the actual dispatch tree.
    git(site, ['add', '.']); git(site, ['-c', 'user.name=Workflow fixture', '-c', 'user.email=workflow@example.invalid', 'commit', '--quiet', '--allow-empty', '-m', 'Green preflight dispatch tree']);
    receipt.source = sourceHashes(site); write(path.join(directory, 'receipt.json'), receipt);
    trial.ready = true; saveTrial(state, trial);
    fs.writeFileSync(path.join(directory, 'prompt.txt'), promptText(trial));
  }
  return state;
}
function promptText(trial) {
  const runner = fileURLToPath(import.meta.url);
  return `You are a fresh evaluator in a disposable Baseline fixture. Work only in ${trial.directory}; project ${trial.site}. Read AGENTS.md and README.md first, then applicable local skills. Preserve established art direction. Dependencies are independently installed; do not install dependencies, deploy, use external credentials, commit, spawn agents, inspect other trials, original source, parent history or controller files. No forced PROJECT.md adoption.\n\nUse this runner for discovery reads/searches and npm/MCP operations: node "${runner}" tool --out "${path.dirname(trial.directory)}" --trial ${trial.id} -- <action> <argv...>. Actions: read <relative-file...>; files [relative-directory...]; search <regex> [relative-path...]; run <npm-script> [args...]; mcp tools; mcp <tool-name> '<JSON>'. Direct file edits/apply_patch are permitted. Record unavoidable outside-runner discovery honestly. Runner is telemetry by convention, not enforced confinement.\n\n${trial.arm === 'inspect' ? 'Run baseline:inspect --json near the start, then read authoritative sources as needed.' : 'Use ordinary source discovery. Do not run baseline:inspect or read its implementation/report.'}\n\nTask: ${SCENARIOS[trial.scenario].task.replaceAll('{{id}}', trial.id)}\n\nRun relevant available checks. Write ${path.join(trial.directory, 'result.json')} with summary, changedFiles, checks [{command,result}], clarificationsNeeded, blockers, outsideRunnerReads, and for CMS created id/slug/status plus permission explanation. Report observed outcomes only. Finish with a short summary.\n`;
}
async function startCMS(trial, encryptionKey) {
  const port = await availableLoopbackPort(), origin = 'http://127.0.0.1:' + port;
  const fd = fs.openSync(path.join(trial.directory, 'cms-server.log'), 'a');
  const child = spawn(process.execPath, ['node_modules/astro/bin/astro.mjs', 'dev', '--host', '127.0.0.1', '--port', String(port)], { cwd: trial.site, env: cleanEnv({ EMDASH_ENCRYPTION_KEY: encryptionKey }), windowsHide: true, stdio: ['ignore', fd, fd] });
  const exited = once(child, 'exit');
  const stop = async () => { if (child.exitCode === null && child.signalCode === null) child.kill(); await exited; fs.closeSync(fd); };
  try {
    for (let attempt = 0; attempt < 180; attempt++) {
      if (child.exitCode !== null) throw Error('Disposable CMS exited before readiness');
      try { const response = await fetch(origin + '/', { signal: AbortSignal.timeout(2000) }); if (response.status < 500) return { origin, stop }; } catch {}
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    throw Error('Disposable CMS readiness timeout');
  } catch (error) { await stop(); throw error; }
}
async function serve(state, trial) {
  if (!trial.ready || trial.scenario !== 'cms') throw Error('Only green CMS trials can serve');
  const privateConfig = privateOf(trial), server = await startCMS(trial, privateConfig.encryptionKey);
  let control;
  try {
    if (!privateConfig.userId) {
      const require = createRequire(path.join(trial.site, 'package.json'));
      const { Kysely } = await import(pathToFileURL(require.resolve('kysely')));
      const { createDialect } = await import(pathToFileURL(require.resolve('emdash/db/sqlite')));
      const { createKyselyAdapter } = await import(pathToFileURL(require.resolve('@emdash-cms/auth/adapters/kysely')));
      const db = new Kysely({ dialect: createDialect({ url: 'file:' + path.join(trial.site, 'data.db').replaceAll('\\', '/') }) });
      try {
        const user = await createKyselyAdapter(db).createUser({ email: trial.id + '@example.invalid', name: 'Workflow Contributor', role: 20, emailVerified: true });
        const grant = tokenOperation({ db: path.join(trial.site, 'data.db'), user: user.id, preset: 'content-authoring', url: server.origin, 'expires-at': new Date(Date.now() + 86400000).toISOString(), apply: true });
        Object.assign(privateConfig, { userId: user.id, tokenId: grant.tokenId, token: grant.token });
      } finally { await db.destroy(); }
    }
    privateConfig.endpoint = server.origin + '/_emdash/api/mcp';
    const stopPath = '/' + randomUUID();
    let finish;
    const done = new Promise(resolve => { finish = resolve; });
    control = http.createServer((request, response) => { if (request.method !== 'POST' || request.url !== stopPath) { response.writeHead(404); response.end(); return; } response.end('stopping'); finish(); });
    control.listen(0, '127.0.0.1'); await once(control, 'listening');
    privateConfig.stopURL = 'http://127.0.0.1:' + control.address().port + stopPath;
    write(path.join(trial.directory, 'private.json'), privateConfig);
    write(path.join(trial.directory, 'server.json'), { status: 'running', origin: server.origin });
    console.log(trial.id + ' live MCP ready; scoped credentials remain private.');
    const interrupt = () => finish(); process.once('SIGINT', interrupt); process.once('SIGTERM', interrupt);
    try { await done; } finally { process.removeListener('SIGINT', interrupt); process.removeListener('SIGTERM', interrupt); }
  } finally { control?.closeAllConnections(); control?.close(); await server.stop(); write(path.join(trial.directory, 'server.json'), { status: 'stopped' }); }
}
async function cleanup(state) {
  const receipt = { completedAt: null, trials: [] };
  for (const entry of state.trials) {
    const trial = trialOf(state, entry.id), config = privateOf(trial);
    const row = { id: trial.id, tokenRevoked: null, userDisabled: null, serverStopped: true };
    if (config.tokenId) {
      tokenOperation({ db: path.join(trial.site, 'data.db'), user: config.userId, revoke: config.tokenId, apply: true }); row.tokenRevoked = true;
      const { DatabaseSync } = await import('node:sqlite'); const db = new DatabaseSync(path.join(trial.site, 'data.db'));
      try { db.prepare('UPDATE users SET disabled = 1 WHERE id = ?').run(config.userId); row.userDisabled = db.prepare('SELECT disabled FROM users WHERE id = ?').get(config.userId)?.disabled === 1; } finally { db.close(); }
    }
    if (fs.existsSync(path.join(trial.directory, 'server.json')) && JSON.parse(fs.readFileSync(path.join(trial.directory, 'server.json'))).status === 'running') {
      await fetch(config.stopURL, { method: 'POST', signal: AbortSignal.timeout(5000) });
      for (let i = 0; i < 50 && JSON.parse(fs.readFileSync(path.join(trial.directory, 'server.json'))).status !== 'stopped'; i++) await new Promise(resolve => setTimeout(resolve, 100));
      row.serverStopped = JSON.parse(fs.readFileSync(path.join(trial.directory, 'server.json'))).status === 'stopped';
      if (!row.serverStopped) throw Error('Owned server did not stop; retain fixture');
    }
    write(path.join(trial.directory, 'private.json'), { revoked: true }); receipt.trials.push(row);
  }
  receipt.completedAt = new Date().toISOString(); write(path.join(state.out, 'cleanup.json'), receipt); return receipt;
}
async function main() {
  const [action, ...values] = process.argv.slice(2), separator = values.indexOf('--');
  const args = argumentsOf(separator < 0 ? values : values.slice(0, separator), ['--out', '--scenario', '--trial'], ['--help']);
  if (!action || action === '--help' || args.help) { console.log('workflow-replay.mjs prepare --out <new-sibling-baseline-workflow-replay-name> [--scenario all|static|sveltia|cms|older-profile]\n  prompt|serve|snapshot --out <replay> --trial <id>\n  tool --out <replay> --trial <id> -- read|files|search|run|mcp <argv...>\n  cleanup --out <replay> (revoke/disable/stop only; export receipts before removing owned fixtures)'); return; }
  if (!args.out) throw Error('Explicit --out required');
  if (action === 'prepare') { await prepare(args.out, args.scenario); return; }
  const state = load(args.out);
  if (action === 'cleanup') { console.log(JSON.stringify(await cleanup(state), null, 2)); return; }
  const trial = trialOf(state, args.trial);
  if (action === 'snapshot') { write(path.join(trial.directory, 'after-source.json'), sourceHashes(trial.site)); console.log(git(trial.site, ['status', '--short'])); return; }
  if (!trial.ready) throw Error('Preflight is not green; dispatch refused');
  if (action === 'prompt') { console.log(fs.readFileSync(path.join(trial.directory, 'prompt.txt'), 'utf8')); return; }
  if (action === 'serve') { await serve(state, trial); return; }
  if (action === 'grade') { const { gradeTrial } = await import('./workflow-replay-grade.mjs'); const report = await gradeTrial(trial); console.log(JSON.stringify(report, null, 2)); if (report.status !== 'pass') process.exitCode = 1; return; }
  if (action === 'tool' && separator >= 0) {
    const [operation, ...argv] = values.slice(separator + 1);
    const result = await runOperation({ site: trial.site, arm: trial.arm, trace: path.join(trial.directory, 'trace.jsonl'), privateConfig: privateOf(trial), action: operation, argv });
    console.log(result.output); process.exitCode = result.record.exitCode ?? 1; return;
  }
  throw Error('Unsupported replay operation');
}
if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) main().catch(error => { console.error(redact(error.message)); process.exitCode = 1; });
