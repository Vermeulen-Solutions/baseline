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
import { cleanEnv, commandPolicy, mcpResult, processResult, redact, runOperation } from './workflow-replay-runner.mjs';

const ROOT = fileURLToPath(new URL('../', import.meta.url));
const hash = value => createHash('sha256').update(value).digest('hex');
function write(file, value) {
  const temporary = file + '.tmp-' + randomUUID(); fs.writeFileSync(temporary, JSON.stringify(value, null, 2) + '\n', { mode: 0o600 });
  try { fs.renameSync(temporary, file); } catch (error) { fs.rmSync(temporary, { force: true }); throw error; }
}
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
    task: 'Pick up the workshop feature and update only HANDOFF.md with the established need, current implementation, remaining work and next concrete local action. Preserve supplied decisions and content. Continue authorized local preparation from available evidence without restarting customer discovery. This is a handoff task, not implementation. Do not deploy, claim unperformed checks or invent client acceptance.',
    criteria: ['Recover local team leads, English static scope, email registration workshops@northline.example.test and editorial/maintenance ownership.', 'Keep quarterly cadence assumed and launch date unapproved; workshops collection/content exist while workshop routes are missing.', 'Resolve stale CMS handoff and unselected fixed-spacing design against later decision evidence and actual source.', 'Missing docs/project-context.md and PROJECT.example.md do not block; no CMS dependencies or forced PROJECT.md adoption.', 'Only HANDOFF.md changes; art record, fluid CSS, supplied content and durable context remain identical; report actual checks only.'],
  },
});
export function sourceHashes(site) {
  return Object.fromEntries(git(site, ['ls-files', '--cached', '--others', '--exclude-standard', '-z']).split('\0').filter(Boolean).sort().map(file => {
    const target = noLinks(path.join(site, file));
    return [file, fs.existsSync(target) ? hash(fs.readFileSync(target)) : null];
  }));
}
const HARNESS_FILES = ['workflow-replay.mjs', 'workflow-replay-runner.mjs', 'workflow-replay-grade.mjs', 'workflow-preview-host.mjs'];
export function harnessHashes() { return Object.fromEntries(HARNESS_FILES.map(file => [file, hash(fs.readFileSync(path.join(ROOT, 'scripts', file)))])); }
export function sourceInputs(repositoryRoot = ROOT) {
  const files = git(repositoryRoot, ['ls-files', '--cached', '--others', '--exclude-standard', '-z']).split('\0').filter(Boolean).filter(file => file !== '.mcp.json' && !file.startsWith('.vscode/') && !file.startsWith('.emdash/') && !file.startsWith('node_modules/') && !file.startsWith('audit/workflow-replay-'));
  // Track deletions explicitly, as sourceHashes does, so a dirty-source freeze can
  // include a retired file and still detect its later restoration or removal.
  return Object.fromEntries(files.sort().map(file => { const target = noLinks(path.join(repositoryRoot, file)); return [file, fs.existsSync(target) ? hash(fs.readFileSync(target)) : null]; }));
}
function assertInputsFrozen(state) {
  const current = sourceInputs();
  if (JSON.stringify(current) !== JSON.stringify(state.sourceInputs)) throw Error('source-input-changed: repository inputs changed after protocol freeze');
}
function protocolDigest(protocol) { const copy = { ...protocol }; delete copy.sha256; return hash(JSON.stringify(copy)); }
function validateRuntimeIdentity(receipt, trial, protocol) {
  if (protocolDigest(protocol) !== protocol.sha256 || receipt.protocolSHA256 !== protocol.sha256) throw Error('harness-changed: frozen protocol hash does not validate');
  if (receipt.node !== process.version) throw Error('runtime-changed: Node version differs from preflight');
  if (hash(fs.readFileSync(path.join(trial.site, 'package-lock.json'))) !== receipt.lockSHA256) throw Error('lock-changed: fixture package-lock differs from preflight');
  noLinks(path.join(trial.site, 'node_modules'));
  const pkg = JSON.parse(fs.readFileSync(path.join(trial.site, 'package.json'), 'utf8')), current = installedVersions(trial.site, pkg);
  if (JSON.stringify(current) !== JSON.stringify(receipt.installed)) throw Error('installed-version-changed: fixture packages differ from preflight');
}
export const requiredChecks = scenario => scenario === 'cms' ? ['doctor', 'verify', 'build', 'audit:html'] : ['verify', 'build', 'check:dev-tools'];
function installedVersions(site, pkg) {
  const declared = { ...(pkg.dependencies ?? {}), ...(pkg.devDependencies ?? {}) };
  return Object.fromEntries(Object.keys(declared).sort().flatMap(name => { const file = path.join(site, 'node_modules', name, 'package.json'); return fs.existsSync(file) ? [[name, JSON.parse(fs.readFileSync(file)).version]] : []; }));
}
export function validateDispatch(receipt, scenario, currentSource) {
  for (const name of requiredChecks(scenario)) {
    const check = receipt.preflight.find(entry => entry.command?.argv?.indexOf('run') > 0 && entry.command.argv.at(entry.command.argv.indexOf('run') + 1) === name);
    if (!check || check.exitCode !== 0 || check.signal || check.kind !== 'process') throw Error('Preflight is not green: ' + name);
  }
  if (JSON.stringify(receipt.source) !== JSON.stringify(currentSource)) throw Error('Fixture source changed after green preflight; prepare a fresh replay.');
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
  const result = await processResult(invocation.command, invocation.args, trial.site, { env: cleanEnv(extra), redactions: Object.values(extra) });
  const secrets = Object.values(extra), output = redact(result.stdout + result.stderr, secrets);
  const attemptId = randomUUID(), log = `${label}-${attemptId}.log`, attempt = `${label}-${attemptId}.json`;
  fs.writeFileSync(path.join(trial.directory, log), output);
  write(path.join(trial.directory, attempt), { attemptId, requestedArgv: args, command: { executable: invocation.command, argv: [...invocation.args] }, exitCode: result.exitCode, signal: result.signal, kind: result.kind, stdoutBytes: result.stdoutBytes, stderrBytes: result.stderrBytes, capturedTail: Buffer.byteLength(result.stdout) < result.stdoutBytes || Buffer.byteLength(result.stderr) < result.stderrBytes, log });
  return { attemptId, command: { executable: invocation.command, argv: [...invocation.args] }, exitCode: result.exitCode, signal: result.signal, kind: result.kind, stdoutBytes: result.stdoutBytes, stderrBytes: result.stderrBytes, capturedTail: Buffer.byteLength(result.stdout) < result.stdoutBytes || Buffer.byteLength(result.stderr) < result.stderrBytes, log, attempt };
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
  const calibration = path.join(site, 'audit/component-calibration.md');
  if (fs.existsSync(calibration)) {
    const note = fs.readFileSync(calibration, 'utf8'), digest = note.match(/^- \*\*LF SHA-256:\*\* `([a-f0-9]{64})`$/m)?.[1];
    const normalized = note.replace(/^- \*\*Source stylesheet:\*\* `[^`]*`$/m, '- **Source stylesheet:** `src/styles/global.css`');
    if (!digest || normalized === note && !/^- \*\*Source stylesheet:\*\* `src\/styles\/global\.css`$/m.test(note) || normalized.match(/^- \*\*LF SHA-256:\*\* `([a-f0-9]{64})`$/m)?.[1] !== digest) throw Error('Calibration note path/digest normalization failed');
    fs.writeFileSync(calibration, normalized);
  }
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
  const inputs = sourceInputs();
  const state = { schemaVersion: 2, lifecycle: 'active', owner: randomUUID(), out: destination, createdAt: new Date().toISOString(), sourceHead: git(ROOT, ['rev-parse', 'HEAD']), sourceDirty: Boolean(git(ROOT, ['status', '--porcelain'])), sourceInputs: inputs, node: process.version, platform: process.platform, trials: [] };
  write(path.join(destination, '.replay-owned.json'), { owner: state.owner }); write(path.join(destination, 'state.json'), state);
  // Freeze all criteria and prompt templates before preparing or dispatching any arm.
  const protocol = { schemaVersion: 2, frozenAt: new Date().toISOString(), scenarios: SCENARIOS, criteriaIds: Object.fromEntries(Object.entries(SCENARIOS).map(([name, value]) => [name, value.criteria.map((_, i) => `${name}-${String(i + 1).padStart(2, '0')}`)])), sourcePolicy: { static: ['src/pages/index.astro'], sveltia: ['schema', 'article', 'editor-form', 'focused-helper-or-test-or-doc'], cms: [], 'older-profile': ['HANDOFF.md'] }, sourceInputs: inputs, harness: harnessHashes(), limits: ['One pair per scenario is exploratory.', 'Emitted bytes are not model tokens; model usage, cost and comparable elapsed time are unavailable.', 'Runner use is an instructed convention, not filesystem/process confinement.', 'No production data, browser editor login, hosted OAuth, D1 or R2 acceptance.'] };
  protocol.sha256 = hash(JSON.stringify(protocol)); write(path.join(destination, 'protocol.json'), protocol); state.protocolSHA256 = protocol.sha256; write(path.join(destination, 'state.json'), state);
  for (const scenario of scenarios) for (const arm of scenario === 'older-profile' ? ['source'] : ['source', 'inspect']) {
    assertInputsFrozen(state);
    const id = scenario + '-' + arm, directory = path.join(destination, id), site = path.join(directory, 'site');
    fs.mkdirSync(directory); const trial = { id, scenario, arm, directory, site, ready: false }; state.trials.push(trial); saveTrial(state, trial);
    console.log('Preparing ' + id);
    let omitted = [];
    if (scenario === 'cms') { fs.mkdirSync(site); omitted = copyCMS(site); }
    else await initProfile({ profile: SCENARIOS[scenario].profile, out: site });
    let installMode = scenario === 'cms' || arm === 'inspect' ? 'ci' : 'install', canonicalLock = null;
    if (scenario !== 'cms' && arm === 'inspect') {
      const sourceTrial = state.trials.find(item => item.scenario === scenario && item.arm === 'source');
      if (!sourceTrial) throw Error('Pair source arm must establish its lock before inspection arm');
      if (!fs.readFileSync(path.join(sourceTrial.site, 'package.json')).equals(fs.readFileSync(path.join(site, 'package.json')))) throw Error('Pair package manifests differ before independent install');
      canonicalLock = path.join(state.out, `canonical-lock-${scenario}.json`);
      fs.copyFileSync(path.join(sourceTrial.site, 'package-lock.json'), canonicalLock);
      fs.copyFileSync(canonicalLock, path.join(site, 'package-lock.json'));
    }
    const install = await npmLog(trial, [installMode, '--no-audit', '--no-fund'], 'install');
    write(path.join(directory, 'install.json'), install);
    if (install.exitCode !== 0) throw Error(id + ' independent install failed; see install.log');
    if (scenario !== 'cms' && arm === 'source') { canonicalLock = path.join(state.out, `canonical-lock-${scenario}.json`); fs.copyFileSync(path.join(site, 'package-lock.json'), canonicalLock); }
    noLinks(path.join(site, 'node_modules'));
    if (scenario !== 'cms') await decorate(trial);
    initializeGit(site);
    const encryptionKey = 'emdash_enc_v1_' + randomBytes(32).toString('base64url');
    write(path.join(directory, 'private.json'), { encryptionKey });
    const pkg = JSON.parse(fs.readFileSync(path.join(site, 'package.json')));
    const receipt = { sourceHead: state.sourceHead, sourceDirty: state.sourceDirty, sourceInputsSHA256: hash(JSON.stringify(inputs)), protocolSHA256: protocol.sha256, node: state.node, platform: process.platform, independentInstall: true, installMode, canonicalLock: canonicalLock ? path.basename(canonicalLock) : null, install, omitted, harness: harnessHashes(), lockSHA256: hash(fs.readFileSync(path.join(site, 'package-lock.json'))), installed: installedVersions(site, pkg), policy: commandPolicy(pkg, arm), source: sourceHashes(site), preflight: [] };
    write(path.join(directory, 'receipt.json'), receipt);
    if (scenario === 'cms') {
      const server = await startCMS(trial, encryptionKey);
      try {
        const response = await fetch(server.origin + '/_emdash/api/setup/dev-bypass', { redirect: 'manual', signal: AbortSignal.timeout(60000) });
        if (response.status >= 400) throw Error('Disposable CMS setup failed: ' + response.status);
      } finally { await server.stop(); }
    }
    for (const name of requiredChecks(scenario)) {
      console.log(id + ': preflight ' + name);
      if (!pkg.scripts[name]) throw Error('Required preflight unavailable: ' + name);
      const check = await npmLog(trial, ['run', name], 'preflight-' + name.replaceAll(':', '-'), { EMDASH_ENCRYPTION_KEY: encryptionKey });
      receipt.preflight.push(check); write(path.join(directory, 'receipt.json'), receipt);
      if (check.exitCode !== 0) throw Error(id + ' preflight failed: ' + name + '; dispatch refused.');
    }
    if (scenario === 'static') {
      const { captureStaticObservations } = await import('./workflow-replay-grade.mjs');
      write(path.join(directory, 'baseline-observations.json'), await captureStaticObservations(path.join(site, 'dist')));
    }
    // Builds may refresh generated declarations. Freeze the actual dispatch tree.
    git(site, ['add', '.']); git(site, ['-c', 'user.name=Workflow fixture', '-c', 'user.email=workflow@example.invalid', 'commit', '--quiet', '--allow-empty', '-m', 'Green preflight dispatch tree']);
    receipt.source = sourceHashes(site); write(path.join(directory, 'receipt.json'), receipt);
    trial.ready = scenario === 'older-profile'; saveTrial(state, trial);
    fs.writeFileSync(path.join(directory, 'prompt.txt'), promptText(trial));
  }
  for (const scenario of scenarios.filter(name => name !== 'older-profile')) {
    const pair = state.trials.filter(trial => trial.scenario === scenario);
    if (pair.length !== 2) throw Error(`Pair incomplete: ${scenario}`);
    const first = JSON.parse(fs.readFileSync(path.join(pair[0].directory, 'receipt.json'))), second = JSON.parse(fs.readFileSync(path.join(pair[1].directory, 'receipt.json')));
    const keys = [...new Set([...Object.keys(first.source), ...Object.keys(second.source)])].sort();
    const differences = keys.filter(file => first.source[file] !== second.source[file]);
    const equivalent = differences.length === 0 && first.lockSHA256 === second.lockSHA256 && JSON.stringify(first.installed) === JSON.stringify(second.installed) && first.node === second.node && first.harness && JSON.stringify(first.harness) === JSON.stringify(second.harness);
    const pairReceipt = { scenario, trials: pair.map(trial => trial.id), equivalent, differences, lockHashes: pair.map((_, index) => index ? second.lockSHA256 : first.lockSHA256), installed: pair.map((_, index) => index ? second.installed : first.installed), harness: first.harness };
    write(path.join(destination, `pair-${scenario}.json`), pairReceipt);
    if (!equivalent) throw Error(`pair-equivalence-failed: ${scenario}; ${differences.slice(0, 10).join(', ')}`);
    for (const trial of pair) { trial.ready = true; saveTrial(state, trial); }
  }
  return state;
}
function promptText(trial) {
  const runner = fileURLToPath(import.meta.url);
  return `You are a fresh evaluator in a disposable Baseline fixture. Work only in ${trial.directory}; project ${trial.site}. Read AGENTS.md and README.md first, then applicable local skills. Preserve established art direction. Dependencies are independently installed; do not install dependencies, deploy, use external credentials, commit, spawn agents, inspect other trials, original source, parent history or controller files. No forced PROJECT.md adoption.\n\nUse this runner for discovery reads/searches and npm/MCP operations: node "${runner}" tool --out "${path.dirname(trial.directory)}" --trial ${trial.id} -- <action> <argv...>. Actions: read <relative-file...>; files [relative-directory...]; search <regex> [relative-path...]; run <npm-script> [args...]; capabilities; mcp tools [tool-name]; mcp <tool-name> '<JSON>'; preview start|status|stop; artifact <relative-dist-html-css-json...>. Direct file edits/apply_patch are permitted. Build before preview; use only this assigned loopback preview. Record browser/web observations outside this runner honestly. Runner is telemetry by convention, not enforced confinement.\n\n${trial.arm === 'inspect' ? 'Run baseline:inspect --json near the start, then read authoritative sources as needed.' : 'Use ordinary source discovery. Do not run baseline:inspect or read its implementation/report.'}\n\nTask: ${SCENARIOS[trial.scenario].task.replaceAll('{{id}}', trial.id)}\n\nRun relevant available checks. Write ${path.join(trial.directory, 'result.json')} with summary, changedFiles, checks [{command,result}], clarificationsNeeded, blockers, outsideRunnerReads, and for CMS created id/slug/status plus permission explanation. Report observed outcomes only. Finish with a short summary.\n`;
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
    if (!privateConfig.userId || !privateConfig.observerUserId) {
      const require = createRequire(path.join(trial.site, 'package.json'));
      const { Kysely } = await import(pathToFileURL(require.resolve('kysely')));
      const { createDialect } = await import(pathToFileURL(require.resolve('emdash/db/sqlite')));
      const { createKyselyAdapter } = await import(pathToFileURL(require.resolve('@emdash-cms/auth/adapters/kysely')));
      const db = new Kysely({ dialect: createDialect({ url: 'file:' + path.join(trial.site, 'data.db').replaceAll('\\', '/') }) });
      try {
        const adapter = createKyselyAdapter(db);
        if (!privateConfig.observerUserId) {
          const observer = await adapter.createUser({ email: trial.id + '-observer@example.invalid', name: 'Workflow Read-only Observer', role: 40, emailVerified: true });
          privateConfig.observerUserId = observer.id;
          write(path.join(trial.directory, 'private.json'), privateConfig);
        }
        if (!privateConfig.observerTokenId) {
          const observerGrant = tokenOperation({ db: path.join(trial.site, 'data.db'), user: privateConfig.observerUserId, scopes: 'content:read,settings:read', name: 'Replay read-only baseline observer', url: server.origin, 'expires-at': new Date(Date.now() + 86400000).toISOString(), apply: true });
          privateConfig.observerTokenId = observerGrant.tokenId; privateConfig.observerToken = observerGrant.token;
          write(path.join(trial.directory, 'private.json'), privateConfig);
        }
        privateConfig.endpoint = server.origin + '/_emdash/api/mcp';
        const { captureCmsBaseline } = await import('./workflow-replay-grade.mjs');
        const collections = JSON.parse(fs.readFileSync(path.join(trial.site, 'seed/seed.json'), 'utf8')).collections.map(collection => collection.slug);
        write(path.join(trial.directory, 'baseline-cms.json'), await captureCmsBaseline(privateConfig.endpoint, privateConfig.observerToken, collections));
        if (!privateConfig.userId) {
          const user = await adapter.createUser({ email: trial.id + '@example.invalid', name: 'Workflow Contributor', role: 20, emailVerified: true });
          privateConfig.userId = user.id;
          write(path.join(trial.directory, 'private.json'), privateConfig);
        }
        if (!privateConfig.tokenId) {
          const grant = tokenOperation({ db: path.join(trial.site, 'data.db'), user: privateConfig.userId, preset: 'content-authoring', url: server.origin, 'expires-at': new Date(Date.now() + 86400000).toISOString(), apply: true });
          Object.assign(privateConfig, { tokenId: grant.tokenId, token: grant.token });
          write(path.join(trial.directory, 'private.json'), privateConfig);
        }
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
  const file = path.join(state.out, 'cleanup.json');
  const receipt = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : { startedAt: new Date().toISOString(), completedAt: null, trials: [] };
  for (const entry of state.trials) {
    const trial = trialOf(state, entry.id), configPath = path.join(entry.directory, 'private.json'); let config = {};
    try { if (fs.existsSync(configPath)) config = privateOf(trial); else throw Error('private metadata missing'); }
    catch (error) { }
    let row = receipt.trials.find(item => item.id === trial.id);
    if (!row) { row = { id: trial.id, steps: {}, status: 'pending' }; receipt.trials.push(row); }
    if (!fs.existsSync(configPath)) row.metadata = { status: 'unknown', detail: 'private metadata missing' };
    const persist = () => write(file, receipt);
    const step = async (name, action) => {
      if (['pass', 'not-applicable'].includes(row.steps[name]?.status)) return;
      try { const evidence = await action(); row.steps[name] = { status: evidence === 'not-applicable' ? 'not-applicable' : 'pass', evidence }; }
      catch (error) { row.steps[name] = { status: 'fail', error: redact(error.message, [config.token, config.encryptionKey]) }; }
      persist();
    };
    const serverFile = path.join(trial.directory, 'server.json'), serverState = fs.existsSync(serverFile) ? JSON.parse(fs.readFileSync(serverFile, 'utf8')) : { status: 'stopped' };
    await step('grant-revocation', async () => {
      if (trial.scenario !== 'cms') return 'not-applicable';
      if (!config.tokenId && !config.userId) return 'not-applicable';
      if (!config.tokenId || !config.userId) throw Error('Owned grant/user identity unavailable; reconciliation required');
      tokenOperation({ db: path.join(trial.site, 'data.db'), user: config.userId, revoke: config.tokenId, apply: true }); return { tokenId: config.tokenId };
    });
    await step('observer-grant-revocation', async () => {
      if (trial.scenario !== 'cms') return 'not-applicable';
      if (!config.observerTokenId && !config.observerUserId) return 'not-applicable';
      if (!config.observerTokenId || !config.observerUserId) throw Error('Owned observer grant/user identity unavailable; reconciliation required');
      tokenOperation({ db: path.join(trial.site, 'data.db'), user: config.observerUserId, revoke: config.observerTokenId, apply: true }); return { tokenId: config.observerTokenId, scopes: ['content:read', 'settings:read'] };
    });
    await step('live-revocation-check', async () => {
      if (trial.scenario !== 'cms') return 'not-applicable';
      if (serverState.status !== 'running') return { unavailable: 'owned app already stopped; live HTTP status not observed' };
      if (!config.endpoint) throw Error('Live endpoint missing');
      const checks = [];
      if (config.token) checks.push({ identity: 'worker', result: await mcpResult(config.endpoint, config.token, 'content_list', { collection: 'posts' }) });
      if (config.observerToken) checks.push({ identity: 'observer', result: await mcpResult(config.endpoint, config.observerToken, 'settings_get', {}) });
      if (!checks.length) return { unavailable: 'no credential was issued before setup stopped' };
      for (const check of checks) if (check.result.http !== 401) throw Error(`Expected revoked ${check.identity} credential HTTP 401; observed ${String(check.result.http)}`);
      return Object.fromEntries(checks.map(check => [check.identity + 'HTTP', 401]));
    });
    await step('user-disable', async () => {
      if (trial.scenario !== 'cms') return 'not-applicable';
      if (!config.userId && !config.tokenId) return 'not-applicable';
      if (!config.userId || !fs.existsSync(path.join(trial.site, 'data.db'))) throw Error('Owned synthetic user identity or database unavailable');
      const { DatabaseSync } = await import('node:sqlite'), db = new DatabaseSync(path.join(trial.site, 'data.db'));
      try { db.prepare('UPDATE users SET disabled = 1 WHERE id = ?').run(config.userId); const disabled = db.prepare('SELECT disabled FROM users WHERE id = ?').get(config.userId)?.disabled === 1; if (!disabled) throw Error('Owned user remains enabled'); return { disabled }; } finally { db.close(); }
    });
    await step('observer-user-disable', async () => {
      if (trial.scenario !== 'cms') return 'not-applicable';
      if (!config.observerUserId && !config.observerTokenId) return 'not-applicable';
      if (!config.observerUserId || !fs.existsSync(path.join(trial.site, 'data.db'))) throw Error('Owned observer identity or database unavailable');
      const { DatabaseSync } = await import('node:sqlite'), db = new DatabaseSync(path.join(trial.site, 'data.db'));
      try { db.prepare('UPDATE users SET disabled = 1 WHERE id = ?').run(config.observerUserId); const disabled = db.prepare('SELECT disabled FROM users WHERE id = ?').get(config.observerUserId)?.disabled === 1; if (!disabled) throw Error('Owned observer remains enabled'); return { disabled }; } finally { db.close(); }
    });
    await step('owned-server-stop', async () => {
      if (serverState.status !== 'running') return { stopped: true, alreadyStopped: true };
      if (!config.stopURL) throw Error('Owned stop capability missing');
      await fetch(config.stopURL, { method: 'POST', signal: AbortSignal.timeout(5000) });
      for (let i = 0; i < 50 && JSON.parse(fs.readFileSync(serverFile, 'utf8')).status !== 'stopped'; i++) await new Promise(resolve => setTimeout(resolve, 100));
      if (JSON.parse(fs.readFileSync(serverFile, 'utf8')).status !== 'stopped') throw Error('Owned server did not stop'); return { stopped: true };
    });
    await step('owned-preview-stop', async () => {
      const previewFile = path.join(trial.directory, 'preview-private.json'); if (!fs.existsSync(previewFile)) return 'not-applicable';
      const preview = JSON.parse(fs.readFileSync(previewFile, 'utf8'));
      if (preview.status === 'stopped') return { stopped: true, alreadyStopped: true };
      if (!preview.control || !preview.token) throw Error('Owned preview stop capability missing');
      const response = await fetch(preview.control + '/stop', { method: 'POST', headers: { authorization: 'Bearer ' + preview.token }, signal: AbortSignal.timeout(5000), redirect: 'manual' });
      if (!response.ok) throw Error('Owned preview stop returned HTTP ' + response.status);
      preview.status = 'stopped'; preview.stoppedAt = new Date().toISOString(); delete preview.token; delete preview.control; write(previewFile, preview);
      const publicPreview = path.join(trial.directory, 'preview.json'); write(publicPreview, { status: 'stopped', stoppedAt: preview.stoppedAt }); return { stopped: true };
    });
    row.status = row.metadata?.status === 'unknown' || Object.values(row.steps).some(item => item.status === 'fail') ? 'needs-reconciliation' : 'pass';
    if (row.status === 'pass') write(configPath, { revoked: true, cleanedAt: new Date().toISOString() });
    persist();
  }
  const complete = receipt.trials.length === state.trials.length && receipt.trials.every(row => row.status === 'pass');
  receipt.completedAt = complete ? new Date().toISOString() : null; receipt.status = complete ? 'pass' : 'needs-reconciliation';
  write(file, receipt); if (complete) { state.lifecycle = 'cleaned'; state.cleanedAt = receipt.completedAt; write(path.join(state.out, 'state.json'), state); }
  return receipt;
}
export function isPublicEvidence(relative) {
  if (/^(?:protocol\.json|pair-[a-z-]+\.json|dispatch\.json|repository-checks\.json|operator-review\.json|fixture-removal\.json|old-residual-resolution\.json|closure\.json|manifest\.json)$/.test(relative)) return true;
  const file = relative.split('/').at(-1);
  return /^(?:receipt|install|baseline-observations|baseline-cms|cms-after|acceptance|review|result|after-source|source-changes|preview)\.json$/.test(file) || /^install-[0-9a-f-]{36}\.json$/i.test(file) || /^(?:preflight|grade)-[^/]+-[0-9a-f-]{36}\.json$/i.test(file) || /^(?:prompt\.txt|trace\.jsonl|changes\.patch)$/.test(file) || /^(?:install|preflight-[^/]+|grade-[^/]+)-[0-9a-f-]+\.log$/i.test(file);
}
function isPrivateRuntimeFile(relative) {
  const file = relative.split('/').at(-1);
  return /^(?:private\.json|server\.json|preview-private\.json|preview-host-state\.json|runner-private\.json|\.heavy-command-lock\.json|cms-server\.log)$/.test(file) || /^(?:install|preflight-[^/]+|grade-[^/]+)-[0-9a-f-]+\.log$/i.test(file);
}
function publicValue(value, secrets, root) {
  if (Array.isArray(value)) return value.map(item => publicValue(item, secrets, root));
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).filter(([key]) => !/(?:token|password|secret|stopurl|cookie|encryptionkey)/i.test(key)).map(([key, item]) => [key, publicValue(item, secrets, root)]));
  if (typeof value === 'string') return redact(value.replaceAll(root, '[fixture-root]'), secrets);
  return value;
}
function traceCompleteness(file) {
  if (!fs.existsSync(file)) return { complete: false, requests: 0, results: 0, unmatched: [] };
  const rows = fs.readFileSync(file, 'utf8').split(/\r?\n/).filter(Boolean).map(line => JSON.parse(line)), requests = new Set(), results = new Set();
  for (const row of rows) { if (row.event === 'request') requests.add(row.id); if (row.event === 'result') results.add(row.id); }
  const incomplete = [...requests].filter(id => !results.has(id)), unexpected = [...results].filter(id => !requests.has(id));
  const missingNpmIdentity = [...requests].filter(id => { const request = rows.find(row => row.event === 'request' && row.id === id), result = rows.find(row => row.event === 'result' && row.id === id); return request?.action === 'run' && result?.executed !== false && (!result?.command?.executable || !Array.isArray(result.command.argv)); });
  return { complete: incomplete.length === 0 && unexpected.length === 0 && missingNpmIdentity.length === 0, requests: requests.size, results: results.size, unmatched: incomplete, orphanResults: unexpected, missingNpmIdentity };
}
function validReview(file, scenario) {
  if (!fs.existsSync(file)) return false;
  try {
    const review = JSON.parse(fs.readFileSync(file, 'utf8')), checks = review.checks;
    if (!Array.isArray(checks) || !checks.length || checks.some(item => !item.criterion || !['pass', 'fail'].includes(item.verdict) || !item.evidence?.path || !item.evidence?.lines || !['human', 'agent'].includes(item.reviewerKind) || !Object.hasOwn(item, 'limitations'))) return false;
    if (checks.some(item => item.verdict !== 'pass')) return false;
    if (scenario === 'cms') return ['cms-permission-explanation', 'cms-schema-scope-denial'].every(id => checks.some(item => item.criterion === id));
    if (scenario === 'older-profile') return ['older-profile-01', 'older-profile-02', 'older-profile-03', 'older-profile-04', 'older-profile-05'].every(id => checks.some(item => item.criterion === id));
    return true;
  } catch { return false; }
}
function deriveClosure(state, destination) {
  const blockers = [], trials = [];
  if (JSON.stringify(sourceInputs()) !== JSON.stringify(state.sourceInputs)) blockers.push('frozen repository source inputs changed during replay');
  const protocolFile = path.join(state.out, 'protocol.json'); if (!fs.existsSync(protocolFile) || protocolDigest(JSON.parse(fs.readFileSync(protocolFile, 'utf8'))) !== state.protocolSHA256) blockers.push('frozen protocol hash is missing or invalid');
  for (const trial of state.trials) {
    const dir = fs.existsSync(trial.directory) ? trial.directory : path.join(destination, trial.id), receipt = fs.existsSync(path.join(dir, 'receipt.json')) ? JSON.parse(fs.readFileSync(path.join(dir, 'receipt.json'), 'utf8')) : {}, acceptance = fs.existsSync(path.join(dir, 'acceptance.json')) ? JSON.parse(fs.readFileSync(path.join(dir, 'acceptance.json'), 'utf8')) : {}, trace = traceCompleteness(path.join(dir, 'trace.jsonl'));
    const pairFile = path.join(state.out, `pair-${trial.scenario}.json`), pair = trial.scenario === 'older-profile' || !fs.existsSync(pairFile) ? null : JSON.parse(fs.readFileSync(pairFile, 'utf8'));
    if (!trial.ready || receipt.preflight?.some(item => item.exitCode !== 0) || !receipt.preflight?.length) blockers.push(`${trial.id}: missing/failed applicable preflight`);
    if (trial.scenario !== 'older-profile' && !pair) blockers.push(`${trial.id}: pair equivalence receipt missing`);
    if (pair && !pair.equivalent) blockers.push(`${trial.id}: pair is not source/toolchain equivalent`);
    if (!receipt.harness || JSON.stringify(receipt.harness) !== JSON.stringify(harnessHashes())) blockers.push(`${trial.id}: frozen harness identity mismatch`);
    if (!state.sourceInputs || receipt.sourceInputsSHA256 !== hash(JSON.stringify(state.sourceInputs)) || receipt.protocolSHA256 !== state.protocolSHA256) blockers.push(`${trial.id}: source/protocol receipt does not match frozen run`);
    if (!trace.complete || trace.requests !== trace.results) blockers.push(`${trial.id}: incomplete runner trace`);
    const changesFile = path.join(dir, 'source-changes.json');
    if (!fs.existsSync(changesFile)) blockers.push(`${trial.id}: changed source contents and deletion map missing`);
    else { const changes = JSON.parse(fs.readFileSync(changesFile, 'utf8')); if (changes.files.some(item => item.status === 'present' && (typeof item.content !== 'string' || hash(Buffer.from(item.content, 'utf8')) !== item.afterSHA256) || !['present', 'deleted'].includes(item.status))) blockers.push(`${trial.id}: source change contents are incomplete or do not match hashes`); }
    if (!acceptance.status || acceptance.mechanicalStatus !== 'pass' || acceptance.checks?.some(item => item.status !== 'pass')) blockers.push(`${trial.id}: independent mechanical grade missing or failed`);
    const reviewValid = ['cms', 'older-profile'].includes(trial.scenario) ? validReview(path.join(dir, 'review.json'), trial.scenario) : true;
    if (!reviewValid) blockers.push(`${trial.id}: required independent semantic review missing, incomplete or failed`);
    if (!fs.existsSync(path.join(dir, 'result.json'))) blockers.push(`${trial.id}: worker result artifact missing`);
    else { try { const result = JSON.parse(fs.readFileSync(path.join(dir, 'result.json'), 'utf8')); if (typeof result.summary !== 'string' || !Array.isArray(result.changedFiles) || !Array.isArray(result.checks) || !Array.isArray(result.outsideRunnerReads)) blockers.push(`${trial.id}: worker result is incomplete`); } catch { blockers.push(`${trial.id}: worker result is malformed`); } }
    trials.push({ id: trial.id, ready: Boolean(trial.ready), mechanicalStatus: acceptance.mechanicalStatus ?? 'missing', reviewStatus: reviewValid ? 'pass' : acceptance.reviewStatus ?? 'missing', trace, pairEquivalent: pair?.equivalent ?? true });
  }
  if (state.trials.length !== 7) blockers.push(`expected seven planned trials; found ${state.trials.length}`);
  const dispatchFile = path.join(state.out, 'dispatch.json');
  if (!fs.existsSync(dispatchFile)) blockers.push('fresh history-free dispatch records missing');
  else {
    const dispatch = JSON.parse(fs.readFileSync(dispatchFile, 'utf8')), entries = dispatch.trials ?? [];
    if (entries.length !== 7 || state.trials.some(trial => { const item = entries.find(entry => entry.id === trial.id), dir = fs.existsSync(trial.directory) ? trial.directory : path.join(destination, trial.id), prompt = fs.existsSync(path.join(dir, 'prompt.txt')) ? fs.readFileSync(path.join(dir, 'prompt.txt')) : null; return !item || !item.sessionId || item.freshHistoryFree !== true || item.correctiveHints !== false || !prompt || item.promptSHA256 !== hash(prompt); })) blockers.push('dispatch session, history/hint declaration or prompt hash is incomplete');
  }
  const cleanupReceipt = fs.existsSync(path.join(state.out, 'cleanup.json')) ? JSON.parse(fs.readFileSync(path.join(state.out, 'cleanup.json'), 'utf8')) : null;
  if (cleanupReceipt?.status !== 'pass' || state.trials.some(trial => { const row = cleanupReceipt?.trials?.find(item => item.id === trial.id); return !row || row.status !== 'pass' || Object.values(row.steps ?? {}).some(step => !['pass', 'not-applicable'].includes(step.status)); })) blockers.push('new fixture cleanup is incomplete');
  const removal = fs.existsSync(path.join(state.out, 'fixture-removal.json')) ? JSON.parse(fs.readFileSync(path.join(state.out, 'fixture-removal.json'), 'utf8')) : null;
  if (removal?.removed !== true || state.trials.some(trial => fs.existsSync(trial.directory)) || removal?.trials?.length !== state.trials.length || removal?.trials?.some(row => row.removed !== true || fs.existsSync(row.path))) blockers.push('new fixture removal is not verified');
  const old = fs.existsSync(path.join(state.out, 'old-residual-resolution.json')) ? JSON.parse(fs.readFileSync(path.join(state.out, 'old-residual-resolution.json'), 'utf8')) : null;
  if (old?.removed !== true || fs.existsSync('C:\\dev\\baseline-workflow-replay-20261023')) blockers.push('retained fixture from 2026-10-23 has no verified removal receipt');
  const repositoryChecks = fs.existsSync(path.join(state.out, 'repository-checks.json')) ? JSON.parse(fs.readFileSync(path.join(state.out, 'repository-checks.json'), 'utf8')) : null;
  const requiredRepository = ['doctor', 'verify:fast', 'verify', 'build', 'audit:html', 'git diff --check'];
  if (!repositoryChecks || repositoryChecks.status !== 'pass' || requiredRepository.some(name => !repositoryChecks.checks?.some(check => check.command === name && check.exitCode === 0))) blockers.push('final repository verification/build/HTML receipts missing or failed');
  const manifest = fs.existsSync(path.join(destination, 'manifest.json')) ? JSON.parse(fs.readFileSync(path.join(destination, 'manifest.json'), 'utf8')) : null;
  if (!manifest || manifest.status !== 'final' || manifest.privacyStatus !== 'pass') blockers.push('final public archive privacy/completeness validation missing');
  return { schemaVersion: 1, generatedAt: new Date().toISOString(), runId: path.basename(state.out), readyToClose: blockers.length === 0, blockers, trials };
}
export function archiveReplay(state, destination, { repositoryRoot = ROOT } = {}) {
  const dest = noLinks(path.resolve(destination));
  if (!contains(path.join(repositoryRoot, 'audit'), dest) || dest === path.join(repositoryRoot, 'audit')) throw Error('Archive destination must be within audit/');
  if (fs.existsSync(dest)) { const marker = path.join(dest, '.replay-archive-owned.json'); if (!fs.existsSync(marker) || JSON.parse(fs.readFileSync(marker, 'utf8')).owner !== state.owner) throw Error('Archive destination is not owned by this replay'); }
  else { fs.mkdirSync(dest, { recursive: true }); write(path.join(dest, '.replay-archive-owned.json'), { owner: state.owner, run: path.basename(state.out) }); }
  const copied = [], secrets = [];
  for (const trial of state.trials) { try { const config = privateOf(trial); secrets.push(config.token, config.encryptionKey, config.stopURL); } catch {} }
  const sourceFiles = [];
  for (const relative of ['protocol.json', 'cleanup.json', ...fs.readdirSync(state.out).filter(name => /^(?:pair|canonical-lock)-[a-z-]+\.json$/.test(name)), 'dispatch.json', 'repository-checks.json', 'operator-review.json', 'fixture-removal.json', 'old-residual-resolution.json']) if (fs.existsSync(path.join(state.out, relative))) sourceFiles.push(relative);
  const rootAllowed = new Set(['.replay-owned.json', 'state.json', 'protocol.json', 'cleanup.json', 'dispatch.json', 'repository-checks.json', 'operator-review.json', 'fixture-removal.json', 'old-residual-resolution.json', 'closure.json', ...state.trials.map(trial => trial.id), ...fs.readdirSync(state.out).filter(name => /^(?:pair|canonical-lock)-[a-z-]+\.json$/.test(name))]);
  for (const name of fs.readdirSync(state.out)) if (!rootAllowed.has(name)) throw Error('Archive refuses unexpected run-root path: ' + name);
  for (const trial of state.trials) {
    if (!fs.existsSync(trial.directory)) { if (!fs.existsSync(path.join(dest, trial.id, 'receipt.json'))) throw Error('Archived evidence missing for removed trial: ' + trial.id); continue; }
    const queue = [trial.directory];
    while (queue.length) for (const entry of fs.readdirSync(queue.pop(), { withFileTypes: true })) {
      if (entry.isSymbolicLink()) throw Error('Archive refuses linked inputs');
      const absolute = path.join(entry.parentPath ?? trial.directory, entry.name);
      const relTrial = path.relative(trial.directory, absolute).replaceAll('\\', '/');
      if (entry.isDirectory()) { if (relTrial === 'site') continue; throw Error('Archive refuses unexpected trial directory: ' + `${trial.id}/${relTrial}`); }
      if (isPublicEvidence(relTrial)) sourceFiles.push(`${trial.id}/${relTrial}`);
      else if (!isPrivateRuntimeFile(relTrial)) throw Error('Archive refuses unclassified trial file: ' + `${trial.id}/${relTrial}`);
    }
  }
  for (const source of [...new Set(sourceFiles)].sort()) {
    const [trialId, ...rest] = source.split('/'), from = trialId && state.trials.some(item => item.id === trialId) ? path.join(state.out, trialId, ...rest) : path.join(state.out, source);
    const relativeOut = trialId && state.trials.some(item => item.id === trialId) ? path.join(trialId, ...rest) : source;
    const stat = fs.lstatSync(from); if (!stat.isFile() || stat.isSymbolicLink()) throw Error('Archive accepts regular files only: ' + source);
    const bytes = fs.readFileSync(from), text = bytes.toString('utf8');
    let output = text;
    if (/\.json$/.test(source)) { try { output = JSON.stringify(publicValue(JSON.parse(text), secrets.filter(Boolean), state.out), null, 2) + '\n'; } catch { throw Error('Malformed JSON cannot be archived: ' + source); } }
    else output = redact(text.replaceAll(state.out, '[fixture-root]'), secrets.filter(Boolean));
    if (/(?:ec_pat_|emdash_enc_v1_|Bearer\s+\S{16,}|stopURL|encryptionKey|tokenId)/i.test(output)) throw Error('Archive privacy check rejected credential-like content: ' + source);
    const target = path.join(dest, relativeOut); fs.mkdirSync(path.dirname(target), { recursive: true });
    if (fs.existsSync(target)) { if (!fs.readFileSync(target).equals(Buffer.from(output))) { if (!/^(?:cleanup\.json|fixture-removal\.json|old-residual-resolution\.json|repository-checks\.json|operator-review\.json|review\.json|acceptance\.json)$/.test(path.basename(relativeOut))) throw Error('Archive refuses replacement of frozen evidence: ' + relativeOut); fs.writeFileSync(target, output); } }
    else fs.writeFileSync(target, output);
    copied.push({ path: relativeOut.replaceAll('\\', '/'), sha256: hash(Buffer.from(output)), bytes: Buffer.byteLength(output) });
  }
  const cleanup = fs.existsSync(path.join(state.out, 'cleanup.json')) ? JSON.parse(fs.readFileSync(path.join(state.out, 'cleanup.json'), 'utf8')) : null;
  const fixtureRemoval = fs.existsSync(path.join(state.out, 'fixture-removal.json')) ? JSON.parse(fs.readFileSync(path.join(state.out, 'fixture-removal.json'), 'utf8')) : null;
  const oldRemoval = fs.existsSync(path.join(state.out, 'old-residual-resolution.json')) ? JSON.parse(fs.readFileSync(path.join(state.out, 'old-residual-resolution.json'), 'utf8')) : null;
  const repositoryChecks = fs.existsSync(path.join(state.out, 'repository-checks.json')) ? JSON.parse(fs.readFileSync(path.join(state.out, 'repository-checks.json'), 'utf8')) : null;
  const removalsPass = fixtureRemoval?.removed === true && oldRemoval?.removed === true;
  const reviewsPass = state.trials.filter(t => ['cms', 'older-profile'].includes(t.scenario)).every(t => { const dir = fs.existsSync(t.directory) ? t.directory : path.join(dest, t.id); return validReview(path.join(dir, 'review.json'), t.scenario); });
  const priorFiles = fs.existsSync(path.join(dest, 'manifest.json')) ? JSON.parse(fs.readFileSync(path.join(dest, 'manifest.json'), 'utf8')).files ?? [] : [];
  const manifestFiles = new Map(priorFiles.map(item => [item.path, item])); for (const item of copied) manifestFiles.set(item.path, item);
  const manifest = { schemaVersion: 1, status: cleanup?.status === 'pass' && removalsPass && reviewsPass && repositoryChecks?.status === 'pass' ? 'final' : 'provisional', privacyStatus: 'pass', sourceRun: path.basename(state.out), files: [...manifestFiles.values()].sort((a, b) => a.path.localeCompare(b.path)), createdAt: new Date().toISOString() };
  write(path.join(dest, 'manifest.json'), manifest);
  const closure = deriveClosure(state, dest); write(path.join(dest, 'closure.json'), closure); write(path.join(state.out, 'closure.json'), closure);
  return { manifest, closure };
}
async function main() {
  const [action, ...values] = process.argv.slice(2), separator = values.indexOf('--');
  const args = argumentsOf(separator < 0 ? values : values.slice(0, separator), ['--out', '--scenario', '--trial', '--dest'], ['--help']);
  if (!action || action === '--help' || args.help) { console.log('workflow-replay.mjs prepare --out <new-sibling-baseline-workflow-replay-name> [--scenario all|static|sveltia|cms|older-profile]\n  prompt|serve|snapshot|grade --out <replay> --trial <id>\n  tool --out <replay> --trial <id> -- capabilities|read|files|search|run|mcp|preview|artifact <argv...>\n  cleanup --out <replay>\n  archive --out <replay> --dest <new-owned-directory-within-audit>'); return; }
  if (!args.out) throw Error('Explicit --out required');
  if (action === 'prepare') { await prepare(args.out, args.scenario); return; }
  const state = load(args.out);
  if (action === 'archive') { if (!args.dest) throw Error('Explicit --dest required'); console.log(JSON.stringify(archiveReplay(state, args.dest), null, 2)); return; }
  if (state.lifecycle === 'cleaned' && ['prompt', 'serve', 'tool'].includes(action)) throw Error('terminal-run: cleaned replay cannot be served, dispatched, or provisioned');
  if (action === 'cleanup') { console.log(JSON.stringify(await cleanup(state), null, 2)); return; }
  const trial = trialOf(state, args.trial);
  if (action === 'snapshot') { write(path.join(trial.directory, 'after-source.json'), sourceHashes(trial.site)); console.log(git(trial.site, ['status', '--short'])); return; }
  if (!trial.ready) throw Error('Preflight is not green; dispatch refused');
  if (action === 'prompt') { assertInputsFrozen(state); const protocol = JSON.parse(fs.readFileSync(path.join(state.out, 'protocol.json'))), receipt = JSON.parse(fs.readFileSync(path.join(trial.directory, 'receipt.json'))); if (protocol.sha256 !== state.protocolSHA256 || JSON.stringify(receipt.harness) !== JSON.stringify(harnessHashes())) throw Error('harness-changed: frozen protocol or evaluator harness differs'); validateRuntimeIdentity(receipt, trial, protocol); if (trial.scenario !== 'older-profile' && JSON.parse(fs.readFileSync(path.join(state.out, `pair-${trial.scenario}.json`))).equivalent !== true) throw Error('pair-equivalence-failed: no dispatch allowed'); validateDispatch(receipt, trial.scenario, sourceHashes(trial.site)); console.log(fs.readFileSync(path.join(trial.directory, 'prompt.txt'), 'utf8')); return; }
  if (action === 'serve') { await serve(state, trial); return; }
  if (action === 'grade') { assertInputsFrozen(state); const receipt = JSON.parse(fs.readFileSync(path.join(trial.directory, 'receipt.json'))); if (JSON.stringify(receipt.harness) !== JSON.stringify(harnessHashes())) throw Error('harness-changed: grader differs from frozen run'); const { gradeTrial } = await import('./workflow-replay-grade.mjs'); const report = await gradeTrial(trial); console.log(JSON.stringify(report, null, 2)); if (report.status !== 'pass') process.exitCode = 1; return; }
  if (action === 'tool' && separator >= 0) {
    const [operation, ...argv] = values.slice(separator + 1);
    assertInputsFrozen(state);
    const receipt = JSON.parse(fs.readFileSync(path.join(trial.directory, 'receipt.json'))); if (JSON.stringify(receipt.harness) !== JSON.stringify(harnessHashes())) throw Error('harness-changed: runner differs from frozen run');
    const result = await runOperation({ site: trial.site, trialDirectory: trial.directory, arm: trial.arm, trace: path.join(trial.directory, 'trace.jsonl'), privateConfig: privateOf(trial), action: operation, argv });
    console.log(result.output); process.exitCode = result.record.exitCode ?? 1; return;
  }
  throw Error('Unsupported replay operation');
}
if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) main().catch(error => { console.error(redact(error.message)); process.exitCode = 1; });
