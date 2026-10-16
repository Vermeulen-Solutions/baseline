import fs from 'node:fs';
import path from 'node:path';
import { within } from './audit-evidence.mjs';
import { inventoryFiles, safeKey } from './media-files.mjs';
import { isolatedProbe } from './media-probe.mjs';
import { argumentsOf, requireFact, bytesOf, noLinks, jsonOf, newDirectory, atomicJSON, writeJSON, sha256, isMain, failure } from './infrastructure-io.mjs';
import { ingestPrepared, localEmdashAdapter, stageR2Objects } from './media-ingest.mjs';

const text = value => value === undefined || value === null || typeof value === 'string' && value.length <= 4096;
export function mediaPlan({ source, sourceId, metadata, maxWidth }, { probe = isolatedProbe } = {}) {
  requireFact(typeof sourceId === 'string' && sourceId.length > 0 && sourceId.length <= 200, 'Explicit stable source ID required');
  if (maxWidth !== undefined) requireFact(Number.isInteger(maxWidth) && maxWidth >= 64 && maxWidth <= 10000, 'Invalid explicit resize profile');
  const inventory = inventoryFiles(source), root = noLinks(source);
  requireFact(!metadata || metadata.metadataVersion === 1 && Array.isArray(metadata.attachments) && metadata.attachments.length <= 10000, 'Unsupported attachment metadata adapter');
  const attachments = metadata?.attachments ?? [];
  for (const attachment of attachments) {
    requireFact(attachment && ['string', 'number'].includes(typeof attachment.id) && String(attachment.id).length < 200 && safeKey(attachment.file) && (!attachment.originalFile || safeKey(attachment.originalFile)) && (attachment.locale === undefined || typeof attachment.locale === 'string' && /^[a-zA-Z0-9-]{1,40}$/.test(attachment.locale)) && ['alt', 'caption', 'credit', 'sourceURL', 'provenance'].every(key => text(attachment[key])) && (!attachment.variants || Array.isArray(attachment.variants) && attachment.variants.every(variant => safeKey(variant.file) && ['crop', 'scaled', 'original', 'unknown'].includes(variant.kind))) && (!attachment.uses || Array.isArray(attachment.uses) && attachment.uses.every(text)) && (!attachment.aliases || Array.isArray(attachment.aliases) && attachment.aliases.every(text)), 'Malformed attachment metadata; no inferred captions/identities');
  }
  const entries = [];
  for (const file of inventory) {
    const owners = attachments.filter(attachment => attachment.file === file.key || attachment.originalFile === file.key || attachment.variants?.some(variant => variant.file === file.key));
    const probed = probe(path.join(root, file.key));
    for (const owner of owners.length ? owners : [null]) {
      const identity = sha256(JSON.stringify([sourceId, owner ? String(owner.id) : null, owner?.locale ?? null, file.key]));
      const variant = owner?.variants?.find(value => value.file === file.key);
      const knownRole = owner?.originalFile === file.key ? 'original' : variant?.kind ?? (owner?.file === file.key ? 'attachment-primary' : 'unknown');
      const originalPresent = owner?.originalFile ? inventory.some(value => value.key === owner.originalFile) : null;
      const metadataReady = owner && typeof owner.alt === 'string' && typeof owner.caption === 'string';
      const reviewedPassthrough = ['vector-review', 'document-review', 'video-review'].includes(probed.treatment) && owner?.passthroughSHA256 === file.sha256;
      const special = ['quarantine', 'vector-review', 'document-review', 'video-review'].includes(probed.treatment) && !reviewedPassthrough;
      const unused = variant && owner.usageComplete === true && variant.referenced === false;
      entries.push({ entryId: identity, attachmentId: owner ? String(owner.id) : null, locale: owner?.locale ?? null, source: { path: file.key, sha256: file.sha256, bytes: file.bytes, sourceURL: owner?.sourceURL ?? null, aliases: owner?.aliases ?? [] }, relationships: { role: knownRole, originalFile: owner?.originalFile ?? null, originalPresent, referenced: variant?.referenced ?? null, usageComplete: owner?.usageComplete === true }, metadata: { alt: owner?.alt ?? null, caption: owner?.caption ?? null, credit: owner?.credit ?? null, provenance: owner?.provenance ?? null, uses: owner?.uses ?? [] }, probe: probed, reviewedPassthrough, operation: unused ? 'archive-only' : !metadataReady || special ? 'quarantine' : 'ingest', reason: unused ? 'Explicit complete usage inventory marks this derivative unused; retain archive' : !metadataReady ? 'Attachment ownership/alt/caption missing; retain unknown' : special ? probed.treatment : originalPresent === false ? 'Original missing; retain surviving primary/crop without filename deletion' : 'Retain source identity and verified bytes', proposedStorageKey: `wp/${sha256(sourceId).slice(0, 16)}/${identity}/${file.sha256}.${probed.extension ?? 'bin'}` });
    }
  }
  requireFact(new Set(entries.map(entry => entry.entryId)).size === entries.length, 'Duplicate attachment identity/locale/variant metadata');
  const plan = { manifestVersion: 1, sourceId, sourceInventorySHA256: sha256(JSON.stringify(inventory)), metadataSHA256: sha256(JSON.stringify(metadata ?? null)), profile: { mode: maxWidth ? 'explicit-resize' : 'preserve', ...(maxWidth ? { maxWidth } : {}) }, entries, note: 'Read-only plan; original bytes retained, proposed keys are not actual CMS storage keys; no source deletion, network, DB writes or default remote action' };
  return { ...plan, planId: sha256(JSON.stringify(plan)) };
}
export function prepareMedia(plan, { source, out, resume = false }, { probe = isolatedProbe } = {}) {
  const root = noLinks(source), directory = resume ? noLinks(out) : newDirectory(out, { ignoredRoot: path.resolve('.emdash/backups') });
  requireFact(within(path.resolve('.emdash/backups'), directory) && !within(root, directory), 'Preparation must use ignored storage outside source');
  const planFile = path.join(directory, 'plan.json'), stateFile = path.join(directory, 'prepared.json');
  if (resume) requireFact(jsonOf(planFile).planId === plan.planId, 'Source/metadata/profile changed; resume refused');
  else writeJSON(planFile, plan);
  const lock = fs.openSync(path.join(directory, 'prepare.lock'), 'wx');
  try {
    const state = resume && fs.existsSync(stateFile) ? jsonOf(stateFile) : { preparedVersion: 1, planId: plan.planId, entries: [] };
    requireFact(state.preparedVersion === 1 && state.planId === plan.planId, 'Prepared journal mismatch');
    const next = [];
    for (const entry of plan.entries) {
      const bytes = bytesOf(path.join(root, entry.source.path), 32 * 1024 * 1024); requireFact(sha256(bytes) === entry.source.sha256, 'Source changed since plan');
      const archive = `originals/${entry.source.sha256}`; fs.mkdirSync(path.dirname(path.join(directory, archive)), { recursive: true });
      if (!fs.existsSync(path.join(directory, archive))) fs.writeFileSync(path.join(directory, archive), bytes, { flag: 'wx', mode: 0o400 });
      requireFact(sha256(bytesOf(path.join(directory, archive))) === entry.source.sha256, 'Original archive changed');
      const existing = state.entries.find(value => value.entryId === entry.entryId);
      if (existing) { requireFact(existing.outputPath === `prepared/${entry.entryId}.${entry.probe.extension ?? 'bin'}` && safeKey(existing.outputPath) && sha256(bytesOf(path.join(directory, existing.outputPath))) === existing.output.sha256, 'Prepared bytes changed'); next.push(existing); continue; }
      fs.mkdirSync(path.join(directory, 'prepared'), { recursive: true });
      const outputPath = `prepared/${entry.entryId}.${entry.probe.extension ?? 'bin'}`;
      let output;
      if (entry.operation === 'ingest' && !entry.reviewedPassthrough) output = probe(path.join(root, entry.source.path), { output: path.join(directory, outputPath), maxWidth: plan.profile.maxWidth });
      else { fs.copyFileSync(path.join(directory, archive), path.join(directory, outputPath), fs.constants.COPYFILE_EXCL); output = { ...entry.probe, sha256: entry.source.sha256, bytes: entry.source.bytes }; }
      requireFact(output.sha256 && fs.existsSync(path.join(directory, outputPath)), 'Preparation failed; original archived; inspect partial output before retry');
      next.push({ ...entry, archivePath: archive, outputPath, output }); state.entries = [...next, ...state.entries.filter(value => !next.some(entry => entry.entryId === value.entryId))]; atomicJSON(stateFile, state);
    }
    state.entries = next; atomicJSON(stateFile, state); return state;
  } finally { fs.closeSync(lock); fs.unlinkSync(path.join(directory, 'prepare.lock')); }
}
if (isMain(import.meta.url)) {
  try {
    const options = argumentsOf(process.argv.slice(2), ['--source', '--source-id', '--metadata', '--out', '--max-width', '--stage', '--url', '--adopt'], ['--prepare', '--resume', '--apply-local', '--dev-bypass', '--stage-r2']);
    const modes = ['prepare', 'apply-local', 'stage-r2'].filter(mode => options[mode]); requireFact(modes.length <= 1, 'Choose exactly one operation');
    requireFact(!options.resume || options.prepare, 'Resume requires explicit preparation');
    if (options['apply-local']) {
      requireFact(!options.source && !options.metadata && !options['max-width'] && !options.out, 'Apply-local consumes only the reviewed prepared stage');
      requireFact(options.stage && options.url, 'Apply-local requires explicit prepared stage and URL');
      const adapter = localEmdashAdapter({ url: options.url, token: process.env.EMDASH_TOKEN, devBypass: options['dev-bypass'] });
      const result = await ingestPrepared(options.stage, adapter, { adopt: options.adopt ? jsonOf(options.adopt) : {} }); console.log(JSON.stringify(result, null, 2)); process.exitCode = result.exitCode;
    } else if (options['stage-r2']) { requireFact(!options.url && !options['dev-bypass'] && !options.source && !options.metadata && !options.adopt, 'R2 staging consumes only the verified prepared stage'); console.log(JSON.stringify(stageR2Objects(options.stage, options.out), null, 2)); }
    else {
      requireFact(!options.stage && !options.url && !options.adopt && !options['dev-bypass'], 'Plan/preparation cannot include ingestion target flags');
      requireFact(options.source, 'Explicit source uploads directory required');
      const plan = mediaPlan({ source: options.source, sourceId: options['source-id'], metadata: options.metadata ? jsonOf(options.metadata) : undefined, ...(options['max-width'] ? { maxWidth: Number(options['max-width']) } : {}) });
      if (options.prepare) { const state = prepareMedia(plan, { source: options.source, out: options.out, resume: options.resume }); console.log(JSON.stringify({ status: 'prepared', planId: plan.planId, entries: state.entries.length })); }
      else if (options.out) { const out = newDirectory(options.out); writeJSON(path.join(out, 'manifest.json'), plan); console.log(JSON.stringify({ status: 'planned', planId: plan.planId, entries: plan.entries.length })); }
      else console.log(JSON.stringify(plan, null, 2));
    }
  } catch (error) { failure(error); }
}
