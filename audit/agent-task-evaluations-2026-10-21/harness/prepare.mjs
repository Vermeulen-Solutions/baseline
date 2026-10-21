import fs from 'node:fs';
import path from 'node:path';
import { randomUUID, createHash, randomBytes } from 'node:crypto';
import { execFileSync, spawn } from 'node:child_process';
import { pathToFileURL } from 'node:url';

const root = process.cwd();
const evidence = path.join(root, 'audit/agent-task-evaluations-2026-10-21');
const control = path.join(root, '.emdash/checks/agent-task-evals');
const workspace = path.join('C:/dev', 'baseline-task-evals-20261021-' + randomUUID().slice(0, 8));
fs.mkdirSync(workspace);
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const writeJSON = (file, value) => { fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, JSON.stringify(value, null, 2) + '\n'); };
const npm = 'C:/Program Files/nodejs/node_modules/npm/bin/npm-cli.js';
const git = (cwd, ...args) => execFileSync('git', ['-C', cwd, ...args], { encoding: 'utf8', windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] }).trim();
function commit(cwd, message) { git(cwd, 'add', '.'); git(cwd, '-c', 'user.name=Baseline evaluation', '-c', 'user.email=evaluation@example.test', 'commit', '-qm', message); }
async function run(cwd, args, label, timeout = 600000) {
  const log = path.join(control, label + '.log'); fs.mkdirSync(path.dirname(log), { recursive: true });
  const fd = fs.openSync(log, 'w'); const started = Date.now();
  const code = await new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [npm, ...args], { cwd, windowsHide: true, env: { ...process.env, ASTRO_TELEMETRY_DISABLED: '1', CI: 'true' }, stdio: ['ignore', fd, fd] });
    const timer = setTimeout(() => { child.kill(); reject(Error(label + ' timed out')); }, timeout);
    child.once('error', error => { clearTimeout(timer); reject(error); });
    child.once('exit', code => { clearTimeout(timer); resolve(code); });
  });
  fs.closeSync(fd); if (code !== 0) throw Error(label + ' failed: ' + fs.readFileSync(log, 'utf8').slice(-2000));
  console.log(label + ' passed (' + ((Date.now() - started) / 1000).toFixed(1) + 's)');
}

const snapshot = path.join(workspace, 'source-snapshot'); fs.mkdirSync(snapshot);
const files = execFileSync('git', ['ls-files', '-z'], { cwd: root, encoding: 'utf8' }).split('\0').filter(Boolean);
const hashes = {};
for (const file of files) {
  if (file === '.mcp.json') continue;
  const from = path.join(root, file), to = path.join(snapshot, file);
  if (!fs.existsSync(from)) continue;
  const bytes = fs.readFileSync(from); fs.mkdirSync(path.dirname(to), { recursive: true }); fs.writeFileSync(to, bytes); hashes[file] = hash(bytes);
}
fs.copyFileSync(path.join(snapshot, '.mcp.example.json'), path.join(snapshot, '.mcp.json'));
git(snapshot, 'init', '--quiet'); commit(snapshot, 'Frozen current Baseline working-tree source for synthetic task evaluations');
writeJSON(path.join(evidence, 'source-receipt.json'), { capturedAt: new Date().toISOString(), originalHead: git(root, 'rev-parse', 'HEAD'), originalDirtyPaths: git(root, 'diff', '--name-only').split('\n'), snapshotCommit: git(snapshot, 'rev-parse', 'HEAD'), protocolSHA256: hash(fs.readFileSync(path.join(evidence, 'protocol.json'))), promptsSHA256: hash(fs.readFileSync(path.join(evidence, 'prompts.json'))), substitutions: { '.mcp.json': 'Replaced with docs-only .mcp.example.json; no original client configuration or credentials copied' }, excluded: ['untracked files', 'node_modules', 'working databases', '.env', 'uploads', 'build/cache output'], fileHashes: hashes });
const { initProfile } = await import(pathToFileURL(path.join(snapshot, 'scripts/init-profile.mjs')));
const baseStatic = path.join(workspace, 'fixture-static'), baseSveltia = path.join(workspace, 'fixture-sveltia');
const sharedPage = (title, body) => `---\nimport Base from '../layouts/Base.astro';\nimport Section from '../components/Section.astro';\nimport Container from '../components/Container.astro';\nimport Grid from '../components/Grid.astro';\nimport Card from '../components/Card.astro';\n---\n<Base title=${JSON.stringify(title)}><Section labelledBy="page-title"><Container><h1 id="page-title">${title}</h1>${body}</Container></Section></Base>\n`;
for (const [profile, directory] of [['static', baseStatic], ['static-sveltia', baseSveltia]]) {
  await initProfile({ profile, out: directory, sourceRoot: snapshot });
  git(directory, 'init', '--quiet'); commit(directory, 'Generated foundation');
  await run(directory, ['install', '--no-audit', '--no-fund'], profile + '-install');
  await run(directory, ['run', 'design:tokens', '--', '--init-client', '--lane', 'editorial-paper'], profile + '-design');
  await run(directory, ['run', 'check:art-direction', '--', '--require-record'], profile + '-gate');
  fs.writeFileSync(path.join(directory, 'src/config/site.ts'), `import type { MetadataSite } from '../lib/metadata';\nexport const site: MetadataSite & { navigation: { label: string; href: string }[] } = { title: 'Northline Studio', description: 'Practical project planning and useful conversations.', language: 'en', navigation: [{label:'Home',href:'/'},{label:'Services',href:'/services/'},{label:'About',href:'/about/'},{label:'Contact',href:'/contact/'},{label:'Posts',href:'/posts/'}] };\n`);
  fs.writeFileSync(path.join(directory, 'src/pages/index.astro'), sharedPage('Clear plans, useful conversations', `<p>Northline Studio helps small teams plan useful work.</p><h2 id="services-heading">Services</h2><Grid id="services-grid" aria-labelledby="services-heading"><Card title="Project briefs" description="Turn an initial conversation into a practical brief." href="/services/"/><Card title="Working sessions" description="Make room for useful decisions." href="/services/"/><Card title="Planning support" description="Keep the next steps manageable." href="/services/"/></Grid><h2 id="approach-heading">Our approach</h2><Grid id="approach-grid" aria-labelledby="approach-heading"><Card title="Listen" description="Start with the real situation."/><Card title="Clarify" description="Agree what matters next."/></Grid><a href="mailto:hello@northline.example.test">Discuss your project</a>`));
  fs.writeFileSync(path.join(directory, 'src/pages/about.astro'), sharedPage('About Northline Studio', `<p>We value clear thinking, practical advice and manageable next steps.</p><Grid id="about-grid"><Card title="Clarity" description="Useful language for real decisions."/><Card title="Care" description="Attention to the people doing the work."/></Grid>`));
  fs.writeFileSync(path.join(directory, 'src/pages/services.astro'), sharedPage('Services', '<p>Project briefs, working sessions and planning support.</p><a href="mailto:hello@northline.example.test">Discuss your project</a>'));
  fs.writeFileSync(path.join(directory, 'src/pages/contact.astro'), sharedPage('Contact Northline Studio', '<p>Tell us what you are planning.</p><a href="mailto:hello@northline.example.test">Discuss your project</a>'));
  fs.appendFileSync(path.join(directory, 'AGENTS.md'), '\n## Existing synthetic site decisions\nThis is a disposable local evaluation fixture. Developer-maintained English content; no external writes or deployment. The existing editorial-paper design and automatic-v2 spacing are established for this fixture. Existing routes and copy are authoritative. No real client approval is claimed.\n');
  await run(directory, ['run', 'design:tokens', '--', '--write-calibration'], profile + '-calibration');
  await run(directory, ['run', 'verify'], profile + '-verify');
  await run(directory, ['run', 'build'], profile + '-build');
  commit(directory, 'Established synthetic Northline site before maintenance tasks');
}

const trials = [];
for (const scenario of ['static-new', 'sveltia-field', 'cms-journal', 'regional-spacing', 'cold-resume']) {
  for (let attempt = 1; attempt <= 2; attempt++) {
    const id = scenario + '-' + attempt, trial = path.join(workspace, id); fs.mkdirSync(trial);
    const site = path.join(trial, 'site');
    if (scenario === 'static-new') git(trial, 'clone', '--quiet', '--no-hardlinks', snapshot, 'source');
    else {
      const source = scenario === 'cms-journal' ? snapshot : scenario === 'sveltia-field' ? baseSveltia : baseStatic;
      git(trial, 'clone', '--quiet', '--no-hardlinks', source, 'site');
    }
    trials.push({ id, scenario, attempt, directory: trial, site, source: scenario === 'static-new' ? path.join(trial, 'source') : null });
  }
}
writeJSON(path.join(control, 'state.json'), { workspace, snapshot, baseStatic, baseSveltia, trials });
console.log('Fixtures and trial repositories prepared: ' + workspace);
// Existing-site tasks begin with installed dependencies. Each site has its own installation/cache.
for (let at = 0; at < trials.length; at += 2) {
  await Promise.all(trials.slice(at, at + 2).filter(t => t.scenario !== 'static-new').map(async trial => {
    await run(trial.site, ['ci', '--no-audit', '--no-fund'], trial.id + '-ci');
    if (trial.scenario === 'cms-journal') {
      await run(trial.site, ['run', 'design:tokens', '--', '--init-client', '--lane', 'editorial-paper'], trial.id + '-design');
      const seedPath = path.join(trial.site, 'seed/seed.json'), seed = JSON.parse(fs.readFileSync(seedPath));
      seed.settings.title = 'Northline Studio';
      const block = text => [{ _type: 'block', _key: 'intro', style: 'normal', markDefs: [], children: [{ _type: 'span', _key: 'text', text, marks: [] }] }];
      seed.content.posts = [
        { id: 'eval-workshop-public', slug: 'planning-your-first-workshop', status: 'published', data: { title: 'Planning your first workshop', excerpt: 'Make the first conversation useful.', content: block('Start with a clear purpose and a manageable group.') } },
        { id: 'eval-workshop-draft', slug: 'unannounced-workshop', status: 'draft', data: { title: 'Unannounced workshop', excerpt: 'Private planning notes.', content: block('This draft must not be visible to anonymous visitors.') } }
      ];
      fs.writeFileSync(seedPath, JSON.stringify(seed, null, 2) + '\n');
      fs.writeFileSync(path.join(trial.site, '.env'), 'EMDASH_ENCRYPTION_KEY=emdash_enc_v1_' + randomBytes(32).toString('base64url') + '\n');
      commit(trial.site, 'Established synthetic CMS design and seed before journal request');
    }
    console.log('READY ' + trial.id);
  }));
}
writeJSON(path.join(control, 'ready.json'), { readyAt: new Date().toISOString(), workspace, trials: trials.map(t => t.id) });
console.log('All preparation complete.');
