import ts from 'typescript';

const unwrap = node => { while (node && ts.isParenthesizedExpression(node)) node = node.expression; return node; };
const string = node => node && ts.isStringLiteralLike(unwrap(node)) ? unwrap(node).text : null;
function property(node, key) {
  node = unwrap(node);
  if (!node || !ts.isObjectLiteralExpression(node) || node.properties.some(p => ts.isSpreadAssignment(p) || !p.name || ts.isComputedPropertyName(p.name))) return { state: 'unknown' };
  const matches = node.properties.filter(p => p.name && (ts.isIdentifier(p.name) ? p.name.text : string(p.name)) === key);
  if (!matches.length) return { state: 'absent' };
  if (matches.length !== 1 || !ts.isPropertyAssignment(matches[0])) return { state: 'unknown' };
  return { state: 'value', node: unwrap(matches[0].initializer) };
}

/** Parse selected config fields only. Never import/evaluate target code or emit raw config. */
export function configCapabilities(source, runtime = 'node-sqlite') {
  if (!source) return { status: 'unverified' };
  const ast = ts.createSourceFile('astro.config.mjs', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS);
  if (ast.parseDiagnostics.length) return { status: 'unverified' };
  const bindings = new Map();
  for (const statement of ast.statements) if (ts.isImportDeclaration(statement) && string(statement.moduleSpecifier)) {
    const module = string(statement.moduleSpecifier), clause = statement.importClause;
    if (clause?.name) bindings.set(clause.name.text, [module, 'default']);
    if (clause?.namedBindings && ts.isNamedImports(clause.namedBindings)) for (const element of clause.namedBindings.elements) bindings.set(element.name.text, [module, element.propertyName?.text ?? element.name.text]);
  }
  const called = (node, module, name = 'default') => {
    node = unwrap(node);
    return Boolean(node && ts.isCallExpression(node) && ts.isIdentifier(node.expression) && JSON.stringify(bindings.get(node.expression.text)) === JSON.stringify([module, name]));
  };
  const resolveBranches = node => {
    node = unwrap(node);
    if (!node) return [];
    if (ts.isConditionalExpression(node)) return [unwrap(node.whenTrue), unwrap(node.whenFalse)];
    return [node];
  };
  const exports = ast.statements.filter(ts.isExportAssignment);
  if (exports.length !== 1 || !called(exports[0].expression, 'astro/config', 'defineConfig')) return { status: 'unverified' };
  const config = exports[0].expression.arguments[0];
  if (property(config, 'output').state === 'unknown') return { status: 'unverified' };
  const output = string(property(config, 'output').node);
  const adapter = property(config, 'adapter');
  let adapterKind = adapter.state === 'absent' ? 'absent' : 'unknown';
  let mode = null;
  const adapterBranches = adapter.state === 'value' ? resolveBranches(adapter.node) : [];
  for (const aNode of adapterBranches) {
    if (called(aNode, '@astrojs/node')) {
      if (runtime === 'node-sqlite' || adapterKind === 'unknown') {
        adapterKind = 'node';
        mode = string(property(aNode.arguments?.[0], 'mode')?.node);
      }
    }
    if (called(aNode, '@astrojs/cloudflare')) {
      if (runtime === 'cloudflare-d1-r2' || adapterKind === 'unknown') {
        adapterKind = 'cloudflare';
      }
    }
  }
  const integrations = property(config, 'integrations');
  const list = integrations.node && ts.isArrayLiteralExpression(integrations.node) ? integrations.node.elements : null;
  const dynamic = !list || list.some(node => !ts.isCallExpression(unwrap(node)));
  const cms = list?.filter(node => called(node, 'emdash/astro')) ?? [];
  const cmsConfig = cms.length === 1 ? cms[0].arguments[0] : null;
  const database = property(cmsConfig, 'database'), storage = property(cmsConfig, 'storage');
  let sqlite = false, d1 = false;
  const dbBranches = database.state === 'value' ? resolveBranches(database.node) : [];
  for (const dbNode of dbBranches) {
    if (called(dbNode, 'emdash/db', 'sqlite')) sqlite = true;
    if (called(dbNode, '@emdash-cms/cloudflare', 'd1') || called(dbNode, 'emdash/cloudflare', 'd1')) d1 = true;
  }
  let local = false, r2 = false;
  const storageBranches = storage.state === 'value' ? resolveBranches(storage.node) : [];
  for (const sNode of storageBranches) {
    if (called(sNode, 'emdash/astro', 'local')) local = true;
    if (called(sNode, '@emdash-cms/cloudflare', 'r2') || called(sNode, 'emdash/cloudflare', 'r2')) r2 = true;
  }
  const react = list?.some(node => called(node, '@astrojs/react')) ?? false;
  const cache = property(config, 'cache'), i18n = property(config, 'i18n');
  let localePolicy = i18n.state === 'absent' ? 'absent' : 'unknown';
  if (i18n.state === 'value') {
    const defaultLocale = string(property(i18n.node, 'defaultLocale').node);
    const locales = property(i18n.node, 'locales').node;
    const codes = locales && ts.isArrayLiteralExpression(locales) ? locales.elements.map(string) : [];
    const prefix = property(property(i18n.node, 'routing').node, 'prefixDefaultLocale').node;
    if (defaultLocale && codes.length && codes.every(code => code && /^[a-z]{2,3}(?:-[A-Za-z0-9]{2,8})*$/.test(code)) && codes.includes(defaultLocale)) localePolicy = prefix?.kind === ts.SyntaxKind.FalseKeyword ? 'unprefixed-default' : prefix?.kind === ts.SyntaxKind.TrueKeyword ? 'prefixed-default' : 'unknown';
  }
  return { status: 'observed-static', output: ['server', 'static'].includes(output) ? output : 'unknown', adapter: adapterKind, nodeMode: mode === 'standalone' ? mode : 'unknown', integrationsDynamic: dynamic, emdash: cms.length === 1, react, sqlite, d1, r2, localStorage: local, cache: cache.state === 'absent' ? 'absent' : 'configured-or-dynamic', i18n: localePolicy };
}

export function capabilityRules(source, runtime, add) {
  const facts = configCapabilities(source, runtime);
  const evidence = ['astro.config.mjs'];
  const unknown = facts.status !== 'observed-static';
  add('capability:server', unknown || facts.output === 'unknown' ? 'unverified' : facts.output === 'server' ? 'pass' : 'fail', 'EmDash server output', unknown ? 'Unsupported/dynamic config; not evaluated' : facts.output, { evidence });
  const adapterUnknown = unknown || facts.adapter === 'unknown' || (facts.adapter === 'node' && facts.nodeMode === 'unknown');
  add('capability:adapter', adapterUnknown ? 'unverified' : facts.adapter === (runtime === 'node-sqlite' ? 'node' : 'cloudflare') ? 'pass' : 'fail', 'Adapter matches requested runtime; standalone for Node', adapterUnknown ? 'Not statically established' : facts.adapter, { evidence });
  add('capability:cms', unknown || facts.integrationsDynamic ? 'unverified' : facts.emdash && facts.react ? 'pass' : 'fail', 'EmDash and React integration calls', unknown ? 'Not statically established' : { emdash: facts.emdash, react: facts.react, dynamic: facts.integrationsDynamic }, { evidence });
  if (runtime === 'cloudflare-d1-r2') {
    add('capability:storage', unknown || facts.integrationsDynamic ? 'unverified' : facts.d1 && facts.r2 ? 'pass' : 'unverified', 'Explicit supported database/storage wiring', !unknown && facts.d1 && facts.r2 ? { d1: facts.d1, r2: facts.r2 } : 'Named remote storage and delivery not verified', { evidence });
  } else {
    add('capability:storage', runtime !== 'node-sqlite' || unknown || facts.integrationsDynamic ? 'unverified' : facts.sqlite && facts.localStorage ? 'pass' : 'unverified', 'Explicit supported database/storage wiring', !unknown && runtime === 'node-sqlite' ? { sqlite: facts.sqlite, local: facts.localStorage } : 'Named remote storage and delivery not verified', { evidence });
  }
  add('capability:i18n', unknown || facts.i18n === 'unknown' ? 'unverified' : facts.i18n === 'absent' ? 'not-applicable' : facts.i18n === 'prefixed-default' ? 'fail' : 'pass', 'If configured, default locale unprefixed for EmDash admin', unknown ? 'Not statically established' : facts.i18n, { evidence });
  add('capability:cache-hints', unknown ? 'unverified' : facts.cache === 'absent' ? 'not-applicable' : 'unverified', 'If cache configured, runtime evidence for every query hint', unknown ? 'Not statically established' : facts.cache, { required: !unknown && facts.cache !== 'absent', evidence, confidence: 'bounded-static' });
  return facts;
}
