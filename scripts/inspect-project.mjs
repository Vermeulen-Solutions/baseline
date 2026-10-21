import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import ts from 'typescript';

const commands = ['dev', 'doctor', 'verify:fast', 'verify', 'lint', 'check:css', 'check:art-direction', 'design:tokens', 'test', 'typecheck', 'build', 'audit:html', 'test:visual', 'mcp:token'];
const components = ['Section', 'Container', 'Grid', 'Card', 'RichText', 'ResponsiveImage'];
const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const assert = (condition, message) => { if (!condition) throw Error(message); };

// Never import target configuration, resolve target dependencies or follow links.
function reader(directory) {
  const root = path.resolve(directory);
  function locate(relative) {
    const file = path.resolve(root, relative);
    assert(file === root || file.startsWith(root + path.sep), 'Input escapes project root');
    const parsed = path.parse(file); let current = parsed.root;
    for (const part of file.slice(parsed.root.length).split(path.sep).filter(Boolean)) {
      current = path.join(current, part);
      try { assert(!fs.lstatSync(current).isSymbolicLink(), 'Linked inputs are unsupported'); }
      catch (error) { if (error.code === 'ENOENT') return null; throw error; }
    }
    return file;
  }
  assert(locate('.') && fs.statSync(root).isDirectory(), 'Project root must be an existing directory');
  const exists = relative => Boolean(locate(relative));
  const read = relative => {
    const file = locate(relative); if (!file) return null;
    const stat = fs.statSync(file);
    assert(stat.isFile() && stat.size <= 1024 * 1024, 'Input must be a bounded regular file');
    return fs.readFileSync(file, 'utf8');
  };
  return { root, locate, exists, read, json: relative => { const source = read(relative); return source === null ? null : JSON.parse(source); } };
}

const parse = (source, file = 'source.ts') => ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
function properties(node) {
  if (!node || !ts.isObjectLiteralExpression(node) || node.properties.some(p => !ts.isPropertyAssignment(p) || !p.name || ts.isComputedPropertyName(p.name))) return null;
  const entries = node.properties.map(p => [p.name.text, p.initializer]);
  return new Set(entries.map(([key]) => key)).size === entries.length ? Object.fromEntries(entries) : null;
}
function runtimeFacts(source) {
  const unknown = { output: 'unknown', adapter: 'unknown', database: 'unknown', storage: 'unknown', evidence: 'astro.config.mjs static AST; expressions are not evaluated' };
  if (source === null) return unknown;
  const ast = parse(source), imports = new Map();
  if (ast.parseDiagnostics.length) return unknown;
  for (const node of ast.statements) if (ts.isImportDeclaration(node) && ts.isStringLiteral(node.moduleSpecifier)) {
    const clause = node.importClause;
    if (clause?.name) imports.set(clause.name.text, { module: node.moduleSpecifier.text, exported: 'default' });
    if (clause?.namedBindings && ts.isNamedImports(clause.namedBindings)) for (const item of clause.namedBindings.elements) imports.set(item.name.text, { module: node.moduleSpecifier.text, exported: item.propertyName?.text ?? item.name.text });
  }
  function call(node, module, exported) { return node && ts.isCallExpression(node) && ts.isIdentifier(node.expression) && imports.get(node.expression.text)?.module === module && imports.get(node.expression.text)?.exported === exported; }
  const exported = ast.statements.filter(ts.isExportAssignment);
  const expression = exported.length === 1 ? exported[0].expression : null;
  if (!call(expression, 'astro/config', 'defineConfig')) return unknown;
  const config = properties(expression.arguments[0]); if (!config) return unknown;
  const result = { ...unknown };
  if (config.output && ts.isStringLiteral(config.output) && ['static', 'server'].includes(config.output.text)) result.output = config.output.text;
  if (!config.output) result.output = 'static (Astro default)';
  if (call(config.adapter, '@astrojs/node', 'default')) result.adapter = 'node';
  else if (call(config.adapter, '@astrojs/cloudflare', 'default')) result.adapter = 'cloudflare';
  else if (!config.adapter) result.adapter = 'none declared';
  if (config.integrations && ts.isArrayLiteralExpression(config.integrations)) {
    const cms = config.integrations.elements.filter(node => call(node, 'emdash/astro', 'default'));
    const options = cms.length === 1 ? properties(cms[0].arguments[0]) : null;
    if (options) {
      if (call(options.database, 'emdash/db', 'sqlite')) result.database = 'sqlite';
      if (call(options.database, 'emdash/db', 'd1')) result.database = 'd1';
      if (call(options.storage, 'emdash/astro', 'local')) result.storage = 'local';
      if (call(options.storage, 'emdash/astro', 'r2')) result.storage = 'r2';
    }
  }
  return result;
}

function declaredProps(source) {
  const frontmatter = source.replace(/^\uFEFF/, '').match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
  if (!frontmatter) return { status: 'unresolved', props: [] };
  const ast = parse(frontmatter[1]), props = [], inheritedTypes = [];
  if (ast.parseDiagnostics.length) return { status: 'unresolved', props: [] };
  function members(node) {
    if (ts.isTypeLiteralNode(node) || ts.isInterfaceDeclaration(node)) {
      for (const member of node.members) if (ts.isPropertySignature(member) && member.name && !ts.isComputedPropertyName(member.name)) props.push({ name: member.name.text, optional: Boolean(member.questionToken), type: member.type?.getText(ast).slice(0, 400) ?? 'unknown' });
    } else if (ts.isIntersectionTypeNode(node)) node.types.forEach(members);
    else inheritedTypes.push(node.getText(ast).slice(0, 400));
  }
  const declarations = ast.statements.filter(node => (ts.isInterfaceDeclaration(node) || ts.isTypeAliasDeclaration(node)) && node.name.text === 'Props');
  for (const node of declarations) {
    if (ts.isTypeAliasDeclaration(node)) members(node.type);
    else { members(node); for (const clause of node.heritageClauses ?? []) for (const type of clause.types) inheritedTypes.push(type.getText(ast).slice(0, 400)); }
  }
  return { status: declarations.length === 1 ? 'declared-only' : 'unresolved', props, inheritedTypes };
}

export function inspectProject(directory = process.cwd()) {
  const io = reader(directory), pkg = io.json('package.json');
  assert(object(pkg), 'A package.json object is required');
  const receipt = io.json('baseline.config.json');
  let profile = { id: 'unknown', foundation: 'unknown', declaredRuntime: null, evidence: 'No installed profile receipt or EmDash dependency' };
  if (io.exists('baseline.config.json')) {
    assert(object(receipt) && receipt.schemaVersion === 1 && ['static', 'static-sveltia', 'emdash'].includes(receipt.platformProfile), 'Invalid installed profile receipt');
    const cms = receipt.platformProfile === 'emdash';
    assert(receipt.foundation === (cms ? 'emdash' : 'static') && (cms ? ['node-sqlite', 'cloudflare-d1-r2'].includes(receipt.runtime) : receipt.runtime === 'static'), 'Profile foundation/runtime mismatch');
    profile = { id: receipt.platformProfile, foundation: receipt.foundation, declaredRuntime: receipt.runtime, evidence: 'baseline.config.json declarations; not deployment verification' };
  } else if (typeof pkg.dependencies?.emdash === 'string') profile = { id: 'emdash', foundation: 'emdash', declaredRuntime: null, evidence: 'package.json dependency; no installed profile receipt' };
  const entries = {
    instructions: ['AGENTS.md', 'README.md'],
    configuration: ['baseline.config.json', 'astro.config.mjs'],
    design: ['src/styles/global.css', 'src/layouts/Base.astro', 'src/layouts/SiteShell.astro', 'audit/component-calibration.md', 'docs/design-framework.md', 'docs/native-composition.md'],
    content: profile.foundation === 'emdash' ? ['src/live.config.ts', 'seed/seed.json'] : ['src/content.config.ts', 'src/content', 'src/config/site.ts'],
    editor: profile.id === 'static-sveltia' ? ['public/admin/config.yml', 'public/admin/index.html'] : [],
  };
  const skillsRoot = io.locate('.agents/skills'), skills = [];
  if (skillsRoot) {
    const children = fs.readdirSync(skillsRoot); assert(children.length <= 100, 'Skill inventory exceeds pilot bound');
    for (const name of children.sort()) if (io.exists(`.agents/skills/${name}/SKILL.md`)) skills.push({ name, source: `.agents/skills/${name}/SKILL.md` });
  }
  return {
    schemaVersion: 1, profile, runtime: runtimeFacts(io.read('astro.config.mjs')),
    commands: Object.fromEntries(commands.map(name => [name, { available: typeof pkg.scripts?.[name] === 'string', command: typeof pkg.scripts?.[name] === 'string' ? `npm run ${name}` : null }])),
    entrypoints: Object.fromEntries(Object.entries(entries).map(([group, files]) => [group, files.map(source => ({ source, exists: io.exists(source) }))])),
    skills,
    components: components.map(name => { const source = `src/components/${name}.astro`, text = io.read(source); return { name, source, exists: text !== null, ...(text === null ? { status: 'missing', props: [] } : declaredProps(text)) }; }),
    limits: ['Read-only source observations, not health, deployment, content or design certification.', 'Configuration expressions, inherited/imported props, slots and component relationships require source review.', 'Commands are available script names, not executed checks. Seed files describe initial content, not the live CMS.', 'Six-component pilot; no claim of measured agent performance improvement.'],
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  try {
    let root = process.cwd(), json = false; const seen = new Set();
    for (let i = 2; i < process.argv.length; i++) {
      const flag = process.argv[i]; assert(!seen.has(flag), 'Duplicate argument'); seen.add(flag);
      if (flag === '--json') json = true;
      else if (flag === '--root') { root = process.argv[++i]; assert(root && !root.startsWith('--'), 'Missing root'); }
      else throw Error('Unknown argument');
    }
    const report = inspectProject(root);
    console.log(json ? JSON.stringify(report, null, 2) : [`Profile: ${report.profile.id} (${report.profile.evidence})`, `Runtime observations: ${JSON.stringify(report.runtime)}`, `Commands: ${Object.values(report.commands).filter(item => item.available).map(item => item.command).join(', ')}`, `Skills: ${report.skills.map(skill => skill.name).join(', ')}`, 'Use --json for source entry points and declared component props.', ...report.limits].join('\n'));
  } catch { console.error('Project inspection failed: input is missing, linked, oversized, invalid or unsupported.'); process.exitCode = 1; }
}
