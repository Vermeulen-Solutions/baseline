import fs from 'node:fs/promises';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
const root = path.dirname(fileURLToPath(import.meta.url));
const source = path.join(root, 'source');
const baseline = 'C:/dev/emdash-baseline';
const npm = 'C:/Program Files/nodejs/node_modules/npm/bin/npm-cli.js';
const old = '2fc9774ba30a4d38defbf2ce92270628993d2750';
const released = '24ea16fa2144c8691605082aec0c36f18fd282e5';
const branch = 'codex/baseline-sync-rehearsal-20261018';
const cases = ['legacy-static', 'legacy-static-sveltia', 'canonical-static', 'canonical-static-sveltia'];
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const json = value => JSON.stringify(value, null, 2) + '\n';
async function read(where, file) { return fs.readFile(path.join(where, file)); }
async function write(where, file, bytes) { await fs.mkdir(path.dirname(path.join(where,file)), {recursive:true}); await fs.writeFile(path.join(where,file),bytes); }
async function command(cwd, command, args, log, allowedFailure = false) {
  console.log(`${path.basename(cwd)}: ${command === process.execPath ? 'node' : command} ${args.join(' ')}`);
  const result = spawnSync(command,args,{cwd,encoding:'utf8',timeout:600000,maxBuffer:30*1024*1024});
  if (log) await write(root,`receipts/${log}.log`, (result.stdout ?? '') + (result.stderr ?? ''));
  if (!allowedFailure) assert.equal(result.status,0,`${args.join(' ')}\n${result.error ?? ''}\n${result.stdout}\n${result.stderr}`);
  return result;
}
const git = (cwd,args,log) => command(cwd,'git',args,log);
const n = (cwd,args,log,fail) => command(cwd,process.execPath,[npm,...args],log,fail);
const record = `\n## Art Direction Record\n- **Aesthetic Lane:** Custom / existing brand — disposable update rehearsal retaining the neutral foundation with a denser blue action and softer cards.\n- **Narrative Metaphor:** A print workshop proof sheet; consistent white paper and blue ink keep comparison specimens readable, without decorative illustration.\n- **Typography Pairing:** Display: ui-sans-serif, Body: ui-sans-serif (system-served regular and bold weights).\n- **Token Physics:**\n  - Canvas: Existing near-white oklch paper canvas.\n  - Action/Accent: Dark blue oklch(41% 0.12 260) for accessible controls.\n  - Borders: Existing 1px borders with locally selected 0.875rem card radius.\n  - Spatial Density: Standard; preserve fluid spacing bounds.\n- **Site Anti-Patterns:** No decorative animations; no remote hero images; no CMS runtime.\n`;

if (process.argv[2] === 'prepare') {
  await git(source,['config','core.autocrlf','false']);
  await git(source,['remote','set-url','origin','https://github.com/Vermeulen-Solutions/baseline.git']);
  for (const [prefix,commit] of [['legacy',old],['canonical',released]]) {
    await git(source,['checkout','--detach',commit]);
    assert.equal((await git(source,['status','--porcelain'])).stdout,'');
    for (const profile of ['static','static-sveltia']) {
      const name = `${prefix}-${profile}`;
      const site=path.join(root,name);
      try { await fs.stat(path.join(site,'.git')); }
      catch(error) {
        if(error.code !== 'ENOENT') throw error;
        await n(source,['run','init:profile','--','--profile',profile,'--out',site],`${name}/generation`);
        await git(site,['init']); await git(site,['config','core.autocrlf','false']);
        await git(site,['add','.']); await git(site,['commit','-m','chore: record immutable generated foundation']);
      }
      const config = JSON.parse(await read(site,'baseline.config.json'));
      assert.equal(config.source.commit,commit);
      await write(root,`receipts/${name}/original-provenance.json`,json(config));
      await write(root,`receipts/${name}/original-managed.json`,await read(site,'.baseline/managed-files.json'));
      await fs.appendFile(path.join(site,'AGENTS.md'),record);
      await n(site,['run','check:art-direction','--','--require-record'],`${name}/pre-edit-design-gate`);
      let css=String(await read(site,'src/styles/global.css'));
      assert.ok(css.includes('--radius-card: 0.75rem;'));
      css=css.replace('--radius-card: 0.75rem;','--radius-card: 0.875rem;').replace('--color-action: oklch(43% 0.14 250);','--color-action: oklch(41% 0.12 260);');
      await write(site,'src/styles/global.css',css);
      let component=String(await read(site,'src/components/Container.astro'));
      assert.ok(component.includes('<div\n'));
      component=component.replace('<div\n','<div\n\tdata-brand-container="rehearsal"\n');
      await write(site,'src/components/Container.astro',component);
      await write(root,`receipts/${name}/local-global.css`,css);
      await write(root,`receipts/${name}/local-Container.astro`,component);
      await write(root,`receipts/${name}/protected-before.json`,json(await protectedHashes(site)));
    }
  }
  await git(source,['checkout','-b',branch,released]);
  for (const [file,from,to] of [
    ['src/styles/global.css','--radius-card: 0.75rem;','--radius-card: 0.625rem;'],
    ['src/components/Container.astro','interface Props {','interface Props {\n\tid?: string;'],
    ['src/components/Section.astro','spacing?: "content" | "section";','spacing?: "content" | "section" | "none";'],
  ]) { const text=String(await read(source,file)); assert.ok(text.includes(from)); await write(source,file,text.replace(from,to)); }
  let container=String(await read(source,'src/components/Container.astro'));
  container=container.replace('const { width =','const { id, width =').replace('<div\n','<div\n\tid={id}\n');
  await write(source,'src/components/Container.astro',container);
  let section=String(await read(source,'src/components/Section.astro'));
  section=section.replace('<style>','<style>\n\t.section--none {\n\t\tpadding-block: 0;\n\t}\n');
  await write(source,'src/components/Section.astro',section);
  const exceptions=JSON.parse(await read(source,'audit/design-gate-exceptions.json'));
  for (const file of ['src/styles/global.css','src/components/Container.astro','src/components/Section.astro']) {
    const entry=exceptions.find(e=>e.path===file); assert.ok(entry);
    entry.sha256=sha(String(await read(source,file)).replaceAll('\r\n','\n'));
    entry.reason='Isolated upstream sync rehearsal candidate, not a release: exercise token and component conflicts plus a clean optional spacing update.';
  }
  await write(source,'audit/design-gate-exceptions.json',json(exceptions));
  await git(source,['add','src/styles/global.css','src/components/Container.astro','src/components/Section.astro','audit/design-gate-exceptions.json']);
  await git(source,['commit','-m','test(platform): publish isolated shared update rehearsal candidate']);
  const candidate=(await git(source,['rev-parse','HEAD'])).stdout.trim();
  await write(root,'commits.json',json({old,released,candidate,branch,cases}));
  await git(source,['push','origin',`HEAD:refs/heads/${branch}`],'candidate-push');
  console.log(json({old,released,candidate,branch,cases}));
}

async function protectedHashes(site) {
  const inventory=JSON.parse(await read(site,'.baseline/managed-files.json'));
  const result={};
  for(const [file,entry] of Object.entries(inventory.files)) {
    if(file === 'audit/design-gate-exceptions.json') continue;
    if (!['shared','client-calibrated'].includes(entry.ownership) || /^(src\/pages\/|src\/content\/|src\/config\/|public\/admin\/)/.test(file) || ['package.json','src/layouts/Base.astro','baseline.config.json'].includes(file)) result[file]=sha(await read(site,file));
  }
  result['baseline.config.json']=sha(await read(site,'baseline.config.json'));
  return result;
}
async function protectedExpected(name) {
  const result=JSON.parse(await read(root,`receipts/${name}/protected-before.json`));
  delete result['audit/design-gate-exceptions.json'];
  return result;
}
async function exists(file) { try { await fs.stat(file); return true; } catch(e) { if(e.code!=='ENOENT') throw e; return false; } }

if (process.argv[2] === 'sync') {
  const commits=JSON.parse(await read(root,'commits.json'));
  for(const name of cases) {
    const site=path.join(root,name);
    if(name.startsWith('legacy-')) {
      if(!await exists(path.join(site,`.baseline/updates/${released}/stage.json`))) await n(site,['run','sync:baseline','--','--ref',released],`${name}/rename-stage`);
      const stage=JSON.parse(await read(site,`.baseline/updates/${released}/stage.json`));
      assert.deepEqual(stage.entries.map(e=>e.target),['scripts/sync-baseline.mjs']);
      assert.equal(stage.entries[0].conflict,false);
      if(!await exists(path.join(root,`receipts/${name}/rename-apply.log`))) await n(site,['run','sync:baseline','--','--apply',released],`${name}/rename-apply`);
      await write(root,`receipts/${name}/rename-stage.json`,json(stage));
    }
    if(!await exists(path.join(site,`.baseline/updates/${commits.candidate}/stage.json`))) await n(site,['run','sync:baseline','--','--ref',commits.candidate],`${name}/design-stage`);
    const stage=JSON.parse(await read(site,`.baseline/updates/${commits.candidate}/stage.json`));
    assert.deepEqual(stage.entries.map(e=>e.target).sort(),['src/components/Container.astro','src/components/Section.astro','src/styles/global.css']);
    assert.deepEqual(stage.entries.filter(e=>e.conflict).map(e=>e.target).sort(),['src/components/Container.astro','src/styles/global.css']);
    for (const entry of stage.entries) {
      if(!await exists(path.join(root,`receipts/${name}/design-apply.log`))) assert.equal(sha(await read(site,entry.target)),entry.currentHash);
      assert.equal(sha(await read(source,entry.source)),entry.incomingHash);
      const original=JSON.parse(await read(root,`receipts/${name}/original-managed.json`));
      assert.equal(entry.baseHash,original.files[entry.target].sha256);
    }
    await write(root,`receipts/${name}/design-stage.json`,json(stage));
    for (const entry of stage.entries) {
      await write(root,`receipts/${name}/incoming/${entry.target}`,await read(site,`.baseline/updates/${commits.candidate}/files/${entry.target}`));
      if(entry.conflict) await command(site,'git',['diff','--no-index',entry.target,`.baseline/updates/${commits.candidate}/files/${entry.target}`],`${name}/${path.basename(entry.target)}-proposal`,true);
    }
    if(!await exists(path.join(root,`receipts/${name}/design-apply.log`))) await n(site,['run','sync:baseline','--','--apply',commits.candidate],`${name}/design-apply`);
    const after=JSON.parse(await read(site,'.baseline/managed-files.json'));
    assert.deepEqual(after.lastSync.applied,['src/components/Section.astro']);
    assert.deepEqual(after.lastSync.conflicts.sort(),['src/components/Container.astro','src/styles/global.css']);
    assert.equal(sha(await read(site,'src/styles/global.css')),sha(await read(root,`receipts/${name}/local-global.css`)));
    assert.equal(sha(await read(site,'src/components/Container.astro')),sha(await read(root,`receipts/${name}/local-Container.astro`)));
    assert.equal(sha(await read(site,'src/components/Section.astro')),sha(await read(source,'src/components/Section.astro')));
    assert.deepEqual(await protectedHashes(site),await protectedExpected(name));
    assert.deepEqual(Object.keys(after.files),Object.keys(JSON.parse(await read(root,`receipts/${name}/original-managed.json`)).files));
    await write(root,`receipts/${name}/managed-after.json`,json(after));
    console.log(`${name}: clean update applied; two local files preserved; proposals and provenance verified`);
  }
}

if (process.argv[2] === 'verify') {
  const requested=process.argv[3] ? [process.argv[3]] : cases;
  for(const name of requested) {
    assert.ok(cases.includes(name)); const site=path.join(root,name);
    await n(site,['install','--no-audit','--no-fund'],`${name}/install`);
    const lockHash=sha(await read(site,'package-lock.json'));
    await n(site,['ci','--no-audit','--no-fund'],`${name}/ci`);
    for(const script of ['verify','build','check:dev-tools','fixtures:build']) await n(site,['run',script],`${name}/${script.replaceAll(':','-')}`);
    await command(baseline,process.execPath,['tests/static-pilot.integration.mjs','--root',site,'--browser'],`${name}/http-browser`);
    const lock=JSON.parse(await read(site,'package-lock.json'));
    const forbiddenPackages=Object.keys(lock.packages).filter(file=>/(?:^|\/)(?:@emdash-cms|emdash|[^/]*sqlite[^/]*|libsql|@libsql|react|react-dom)(?:\/|$)/i.test(file));
    assert.deepEqual(forbiddenPackages,[]);
    for(const file of ['seed','data.db','src/live.config.ts','dist/server','scripts/check-schema-budget.mjs','scripts/sync-emdash-skills.mjs','.agents/skills/building-emdash-site','.agents/skills/creating-plugins','.agents/skills/emdash-cli']) await assert.rejects(fs.stat(path.join(site,file)),{code:'ENOENT'});
    assert.deepEqual((await fs.readdir(path.join(site,'.agents/skills'))).sort(),['astro-site-design','impeccable','new-site-workflow','site-art-direction']);
    assert.equal(sha(await read(site,'package-lock.json')),lockHash);
    assert.deepEqual(await protectedHashes(site),await protectedExpected(name));
    await write(root,`receipts/${name}/verification.json`,json({name,passed:true,independentInstall:true,cleanInstall:true,node:process.version,lockfileSHA256:lockHash,packageCount:Object.keys(lock.packages).length,forbiddenPackages,verify:true,production:true,fixtures:true,httpAndBrowser:true,viewports:[390,768,1440],protectedFilesUnchanged:true,skills:await fs.readdir(path.join(site,'.agents/skills'))}));
    console.log(`${name}: complete verification passed`);
  }
}
