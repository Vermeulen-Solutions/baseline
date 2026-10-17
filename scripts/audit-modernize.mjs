import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import { readTarget, readJSON, normalizedHash, sha256, gitRead, canonicalOutput, within } from './audit-evidence.mjs';

class RecipeError extends Error {}

export const RECIPE = 'schema-budget-prebuild@1';
const helperHashes = {
  'scripts/check-schema-budget.mjs': '61b11cbff6f811012b9971d567f60c126d2984ad05fba9985b3c4af2d29ef1b9',
  'scripts/schema-column-budget.mjs': 'bcd92f121f6dca1a3997a28a36fab4157e5f0ab81f845ab9496621101cd8799b',
};
function workspace(root, allowedDirty = false) {
  const target = fs.realpathSync(path.resolve(root));
  if (fs.realpathSync(gitRead(target, 'rev-parse', '--show-toplevel')) !== target) throw new RecipeError('Recipe requires the repository root');
  const revision = gitRead(target, 'rev-parse', '--verify', 'HEAD');
  const branch = gitRead(target, 'symbolic-ref', '--short', 'HEAD');
  if (!/^[a-f0-9]{40,64}$/.test(revision) || ['main', 'master'].includes(branch)) throw new RecipeError('Use a committed disposable copy or feature branch');
  const dirty = gitRead(target, 'diff', '--name-only', 'HEAD', '--').split('\n').filter(Boolean);
  if (gitRead(target, 'diff', '--cached', '--name-only') || gitRead(target, 'ls-files', '--others', '--exclude-standard') || dirty.some(file => !allowedDirty || file !== 'package.json')) throw new RecipeError('Recipe preconditions changed: unexpected dirty/staged/untracked files');
  return { target, revision, branchSHA256: sha256(branch) };
}
function candidate(root) {
  const input = readJSON(root, 'package.json');
  const lock = readJSON(root, 'package-lock.json').data;
  if (!input.bytes || !input.data || !input.data.scripts || typeof input.data.scripts !== 'object' || Array.isArray(input.data.scripts)) throw new RecipeError('Readable package scripts required');
  if (!/^7\.\d+\.\d+$/.test(lock?.packages?.['node_modules/astro']?.version ?? '') || !/^1\.\d+\.\d+$/.test(lock?.packages?.['node_modules/emdash']?.version ?? '')) throw new RecipeError('Recipe v1 supports Astro 7.x / EmDash 1.x source profiles only');
  const scripts = input.data.scripts;
  if (scripts.build !== 'astro build' || scripts['check:schema-budget'] !== 'node scripts/check-schema-budget.mjs') throw new RecipeError('Recipe requires the supported build and schema commands');
  for (const [file, hash] of Object.entries(helperHashes)) {
    const source = readTarget(root, file).bytes;
    if (!source || normalizedHash(source) !== hash) throw new RecipeError('Schema helper differs from supported reviewed version');
  }
  const before = scripts.prebuild ?? null;
  if (before !== null && typeof before !== 'string') throw new RecipeError('Unsupported prebuild hook');
  const current = before === 'npm run check:schema-budget' || /^npm run check:schema-budget && (?:node scripts\/[A-Za-z0-9_/-]+\.mjs|npm run (?!build$|prebuild$)[A-Za-z0-9:_-]+)$/.test(before ?? '');
  // Preserve only one simple existing hook; do not guess shell parsing or rewrite complex chains.
  if (!current && before !== null && before !== '' && !/^(?:node scripts\/[A-Za-z0-9_/-]+\.mjs|npm run (?!build$|prebuild$)[A-Za-z0-9:_-]+)$/.test(before)) throw new RecipeError('Complex prebuild hook requires manual review; recipe refused');
  const after = current ? before : 'npm run check:schema-budget' + (before ? ' && ' + before : '');
  let bytes = input.bytes;
  if (!current) {
    const text = input.bytes.toString('utf8'), indent = text.match(/\n([\t ]+)"/)?.[1] ?? '  ';
    scripts.prebuild = after;
    let next = JSON.stringify(input.data, null, indent.slice(0, 8));
    if (text.endsWith('\n')) next += '\n';
    if (text.includes('\r\n')) next = next.replaceAll('\n', '\r\n');
    bytes = Buffer.from(next);
  }
  return { beforeBytes: input.bytes, afterBytes: bytes, prebuildBefore: before, prebuildAfter: after, current };
}
function planHash(plan) { const { planId, ...payload } = plan; return sha256(JSON.stringify(payload)); }
export function planModernization(root) {
  const state = workspace(root), update = candidate(state.target);
  const plan = { schemaVersion: 1, recipe: RECIPE, targetId: sha256(process.platform === 'win32' ? state.target.toLowerCase() : state.target), revision: state.revision, branchSHA256: state.branchSHA256, helperHashes, packageBeforeSHA256: sha256(update.beforeBytes), packageAfterSHA256: sha256(update.afterBytes), prebuildBefore: update.prebuildBefore, prebuildAfter: update.prebuildAfter, operation: update.current ? 'already-current' : 'change' };
  return { ...plan, planId: planHash(plan) };
}
export function writePlan(plan, directory, root) {
  const out = canonicalOutput(directory), target = fs.realpathSync(root);
  if (within(target, out) || fs.existsSync(out)) throw new RecipeError('Plan output must be a new directory outside the target');
  fs.mkdirSync(out, { recursive: true });
  fs.writeFileSync(path.join(out, 'plan.json'), JSON.stringify(plan, null, 2) + '\n', { flag: 'wx' });
  return path.join(out, 'plan.json');
}
function atomicWrite(file, bytes) {
  const temp = file + '.baseline-' + randomUUID();
  try { const mode = fs.existsSync(file) ? fs.statSync(file).mode : 0o600; fs.writeFileSync(temp, bytes, { flag: 'wx', mode }); fs.renameSync(temp, file); }
  finally { if (fs.existsSync(temp)) fs.unlinkSync(temp); }
}
function privateFile(file) {
  if (fs.lstatSync(file).isSymbolicLink() || !fs.statSync(file).isFile() || fs.statSync(file).size > 8 * 1024 * 1024) throw new RecipeError('Refused linked or oversized recipe artifact');
  return fs.readFileSync(file);
}
export function runModernization(root, planFile, { rollback = false } = {}) {
  const state = workspace(root, true), directory = canonicalOutput(path.dirname(planFile));
  if (within(state.target, directory) || path.basename(planFile) !== 'plan.json') throw new RecipeError('Recipe artifacts must be outside the target');
  const plan = JSON.parse(privateFile(path.join(directory, 'plan.json')));
  const targetId = sha256(process.platform === 'win32' ? state.target.toLowerCase() : state.target);
  if (plan.schemaVersion !== 1 || plan.recipe !== RECIPE || plan.planId !== planHash(plan) || plan.targetId !== targetId || plan.revision !== state.revision || plan.branchSHA256 !== state.branchSHA256 || JSON.stringify(plan.helperHashes) !== JSON.stringify(helperHashes)) throw new RecipeError('Plan identity/revision/preconditions mismatch');
  const update = candidate(state.target), currentHash = sha256(update.beforeBytes);
  const packageFile = path.join(state.target, 'package.json');
  if (plan.operation === 'already-current' && currentHash === plan.packageBeforeSHA256 && currentHash === plan.packageAfterSHA256) return { status: 'already-current', recipe: RECIPE, planId: plan.planId };
  const lock = path.join(directory, 'recipe.lock'), descriptor = fs.openSync(lock, 'wx');
  try {
    const backup = path.join(directory, 'package.before.json'), journal = path.join(directory, 'receipt.json');
    let receipt = fs.existsSync(journal) ? JSON.parse(privateFile(journal)) : null;
    if (receipt && (receipt.planId !== plan.planId || !['prepared', 'applied', 'rolled-back'].includes(receipt.status))) throw new RecipeError('Invalid recipe journal');
    const save = status => {
      receipt = { schemaVersion: 1, planId: plan.planId, recipe: RECIPE, revision: plan.revision, status, packageBeforeSHA256: plan.packageBeforeSHA256, packageAfterSHA256: plan.packageAfterSHA256 };
      atomicWrite(journal, JSON.stringify(receipt, null, 2) + '\n'); return receipt;
    };
    if (fs.existsSync(backup) && sha256(privateFile(backup)) !== plan.packageBeforeSHA256) throw new RecipeError('Recovery backup changed');
    if (rollback) {
      if (!receipt || !fs.existsSync(backup)) throw new RecipeError('No verified recovery journal and backup');
      if (currentHash === plan.packageBeforeSHA256) return save('rolled-back');
      if (currentHash !== plan.packageAfterSHA256) throw new RecipeError('Post-apply edits detected; rollback refused');
      atomicWrite(packageFile, privateFile(backup)); return save('rolled-back');
    }
    if (receipt && currentHash === plan.packageAfterSHA256 && fs.existsSync(backup)) return save('applied'); // Includes recovery after rename/journal interruption.
    if (currentHash !== plan.packageBeforeSHA256 || sha256(update.afterBytes) !== plan.packageAfterSHA256 || update.prebuildAfter !== plan.prebuildAfter || update.prebuildBefore !== plan.prebuildBefore) throw new RecipeError('Package changed since planning');
    if (!fs.existsSync(backup)) fs.writeFileSync(backup, update.beforeBytes, { flag: 'wx', mode: 0o600 });
    save('prepared');
    if (sha256(privateFile(packageFile)) !== currentHash) throw new RecipeError('Concurrent package edit detected');
    atomicWrite(packageFile, update.afterBytes);
    return save('applied');
  } finally { fs.closeSync(descriptor); fs.unlinkSync(lock); }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const args = {}; const names = { '--root': 'root', '--plan': 'directory', '--apply': 'apply', '--rollback': 'rollback', '--recipe': 'recipe' };
    for (let i = 2; i < process.argv.length; i++) { const name = names[process.argv[i]]; if (!name || !process.argv[i + 1] || process.argv[i + 1].startsWith('--') || Object.hasOwn(args, name)) throw new RecipeError('Invalid recipe arguments'); args[name] = process.argv[++i]; }
    if (!args.root || args.recipe && args.recipe !== RECIPE || args.apply && args.rollback || (args.apply || args.rollback) && args.directory) throw new RecipeError('Usage: audit:modernize -- --root <feature-branch-copy> [--recipe schema-budget-prebuild@1] [--plan <new-outside-directory> | --apply <plan.json> | --rollback <plan.json>]');
    if (args.apply || args.rollback) console.log(JSON.stringify(runModernization(args.root, args.apply ?? args.rollback, { rollback: Boolean(args.rollback) }), null, 2));
    else { const plan = planModernization(args.root); if (args.directory) { writePlan(plan, args.directory, args.root); console.log(JSON.stringify({ status: 'planned', planId: plan.planId, operation: plan.operation })); } else console.log(JSON.stringify(plan, null, 2)); }
  } catch (error) { console.error('Recipe refused: ' + (error instanceof RecipeError ? error.message : 'required evidence or artifact unavailable')); process.exitCode = 2; }
}
