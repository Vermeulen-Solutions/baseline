import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import postcss from 'postcss';
import { inspectProject } from './inspect-project.mjs';

const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const normalized = value => process.platform === 'win32' ? value.toLowerCase() : value;
const inside = (root, file) => normalized(file) === normalized(root) || normalized(file).startsWith(normalized(root + path.sep));
function sourceFile(root, relative) {
  const file = path.resolve(root, relative);
  if (!inside(root, file)) throw Error('Source path escapes target');
  let current = path.parse(file).root;
  for (const part of file.slice(current.length).split(path.sep).filter(Boolean)) {
    current = path.join(current, part);
    if (fs.lstatSync(current).isSymbolicLink()) throw Error('Linked source paths are unsupported');
  }
  if (!fs.statSync(file).isFile() || fs.statSync(file).size > 1024 * 1024) throw Error('Source must be a bounded regular file');
  return fs.readFileSync(file);
}

export function canvasSource(directory, { styles = ['src/styles/global.css'], roles = {}, contextClass = '' } = {}) {
  if (!Array.isArray(styles) || !styles.length || styles.length > 10 || new Set(styles).size !== styles.length || styles.some(file => typeof file !== 'string' || !file.endsWith('.css')) || Object.keys(roles).length > 100 || Object.entries(roles).some(([key,value])=>!/^--[\w-]+$/.test(key)||typeof value!=='string'||!/^--[\w-]+$/.test(value)) || typeof contextClass !== 'string' || contextClass.length > 200 || contextClass && !/^[\w-]+(?: [\w-]+)*$/.test(contextClass)) throw Error('Invalid explicit CSS sources, role mapping or context class');
  const root = path.resolve(directory), inputs = styles.map(file => ({ path:file, sha256:hash(sourceFile(root,file)) }));
  const inspection = inspectProject(root), ast = postcss.root(), locations=new WeakMap();
  for (const file of styles) { const parsed=postcss.parse(sourceFile(root,file).toString('utf8'));parsed.walkDecls(decl=>locations.set(decl,file));ast.append(parsed.nodes); }
  const declarations = [];
  ast.walkAtRules('import', node => {
    if (!['"tailwindcss"', "'tailwindcss'"].includes(node.params.trim())) throw Error('Additional CSS imports require rendered-site sampling; this bounded kit does not resolve them');
    node.remove();
  });
  ast.walkAtRules('font-face', node => node.remove()); // Font availability is checked in the design tool, not inferred here.
  ast.walkDecls(decl => {
    if (decl.prop.startsWith('--')) declarations.push({ name: decl.prop, expression: decl.value, source:locations.get(decl), line: decl.source.start.line, context: decl.parent.selector ?? `@${decl.parent.name} ${decl.parent.params}` });
    if (!decl.prop.startsWith('--')) decl.remove();
  });
  if (!declarations.length || declarations.length > 1000) throw Error('Missing or excessive semantic token declarations');
  ast.walkAtRules('theme', node => {
    if (node.params.trim()) throw Error('Non-default @theme requires rendered-site sampling');
    const rule = postcss.rule({ selector: ':root' }); rule.append(node.nodes.map(child => child.clone()));
    const layer = postcss.atRule({ name: 'layer', params: 'theme' }); layer.append(rule); node.replaceWith(layer);
  });
  for (const component of inspection.components.filter(component => component.exists)) inputs.push({ path: component.source, sha256: hash(sourceFile(root, component.source)) });
  return { root, css: ast.toString(), declarations, inputs, components: inspection.components, roles, contextClass };
}

/** Local inert CSS harness: no target JS/config, imports, font loads or network. Manual command only. */
export async function sampleCanvasTokens(source, rootFontPx = 16) {
  const { chromium } = await import('@playwright/test');
  const browser = await chromium.launch({ channel: 'chromium', headless: true });
  try {
    const context = await browser.newContext({ deviceScaleFactor: 1, colorScheme: 'light' });
    await context.route('**/*', route => route.abort());
    const page = await context.newPage(), samples = [];
    for (const width of [390, 1440]) {
      await page.setViewportSize({ width, height: width === 390 ? 844 : 900 });
      await page.goto('about:blank');
      samples.push(await page.evaluate(({ css, names, width, rootFontPx, contextClass }) => {
        const style = document.createElement('style'); style.textContent = css; document.head.append(style);
        document.documentElement.style.fontSize = rootFontPx + 'px';
        document.documentElement.style.writingMode = 'horizontal-tb';
        document.body.className = contextClass;
        const probe = document.createElement('span'); document.body.append(probe);
        const canvas = document.createElement('canvas'); canvas.width = canvas.height = 1;
        const ctx = canvas.getContext('2d', { colorSpace: 'srgb', willReadFrequently: true });
        const tokens = [];
        for (const {name, sourceName} of names) {
          const expression = getComputedStyle(probe).getPropertyValue(sourceName).trim();
          const token = { name, sourceName, resolvedExpression: expression, status: 'unresolved' };
          if (name.startsWith('--font-')) {
            if (expression && CSS.supports('font-family', expression)) Object.assign(token, { status: 'resolved', type: 'font', value: expression });
          }
          else if (expression && (name.startsWith('--color-') || name === '--surface-glass')) {
            probe.style.color = 'var(' + sourceName + ')';
            document.body.style.color = 'rgb(1, 2, 3)'; const a = getComputedStyle(probe).color;
            document.body.style.color = 'rgb(4, 5, 6)'; const b = getComputedStyle(probe).color;
            if (a === b && CSS.supports('color', a)) {
              ctx.clearRect(0, 0, 1, 1); ctx.fillStyle = a; ctx.fillRect(0, 0, 1, 1);
              const rgba = [...ctx.getImageData(0, 0, 1, 1).data];
              Object.assign(token, { status: 'resolved', type: 'color', value: rgba.map(value => value / 255), computedColor: a });
            }
            probe.style.removeProperty('color'); document.body.style.removeProperty('color');
          } else if (expression && !/%|cq(?:w|h|i|b|min|max)\b|\b(?:auto|inherit|initial|unset|revert)\b/i.test(expression) && CSS.supports('margin-left', expression)) {
            probe.style.cssText = 'position:absolute;display:block;width:0;padding:0;border:0;margin:0;margin-left:var(' + sourceName + ')';
            const value = getComputedStyle(probe).marginLeft;
            if (/^-?[\d.]+px$/.test(value) && Number.isFinite(parseFloat(value))) Object.assign(token, { status: 'resolved', type: 'length', value: parseFloat(value) });
            probe.style.cssText = '';
          }
          tokens.push(token);
        }
        return { width, height: width === 390 ? 844 : 900, rootFontPx, writingMode: 'horizontal-tb', surface: 'default', tokens };
      }, { css: source.css, names: [...new Set([...source.declarations.map(decl => decl.name), ...Object.keys(source.roles)])].map(name=>({name,sourceName:source.roles[name]??name})), width, rootFontPx, contextClass:source.contextClass }));
    }
    return { browserVersion: browser.version(), samples };
  } finally { await browser.close(); }
}

const required = ['--color-page','--color-surface','--color-text','--color-action','--color-on-action','--color-border','--spacing-container','--spacing-content','--spacing-grid','--text-step-0','--text-step-1','--text-step-2','--radius-card','--radius-control'];
export function canvasPayload(source, sample) {
  const prefix = `site${sample.width}`, values = Object.fromEntries(sample.tokens.map(token => [token.name, token]));
  const missing = required.filter(name => values[name]?.status !== 'resolved' || values[name]?.type !== (name.startsWith('--color-') ? 'color' : 'length') || values[name]?.type === 'length' && values[name].value < 0);
  const group = {}, fontMappings = {};
  for (const token of sample.tokens.filter(token => token.status === 'resolved' && token.type !== 'font')) {
    const name = token.name.slice(2), sourceName=token.sourceName??token.name, expression = source.declarations.filter(decl => decl.name === sourceName);
    group[name] = { $type: token.type === 'color' ? 'color' : 'dimension', $value: token.type === 'color' ? { colorSpace: 'srgb', components: token.value.slice(0,3), alpha: token.value[3] } : { value: token.value, unit: 'px' }, $description: JSON.stringify({ sourceName, sourceDeclarations: expression, width: sample.width, rootFontPx: sample.rootFontPx }), $extensions: { 'dev.openpencil': { codeSyntax: { WEB: `var(${sourceName})` }, ...(token.type === 'length' ? { unit: 'px', expression: expression.length === 1 ? expression[0].expression : token.resolvedExpression } : {}) } } };
  }
  const fonts = role => {
    const token = values[`--font-${role}`];
    const stack = token?.status === 'resolved' && token.type === 'font' ? token.value : '';
    if (!stack) { missing.push(`--font-${role}`); return ''; }
    const first = postcss.list.comma(stack)[0].trim().replace(/^['"]|['"]$/g, '');
    const mapped = { 'ui-sans-serif':'Arial', 'system-ui':'Arial', 'sans-serif':'Arial', 'ui-monospace':'Consolas', monospace:'Consolas', serif:'Georgia' }[first] ?? first;
    fontMappings[role] = { sourceStack: stack, canvasRequest: mapped, genericSampleSubstitution: first !== mapped, availability: 'Check get_font_status; no fonts installed or certified by this command' };
    return JSON.stringify(mapped);
  };
  const body = fonts('body'), display = fonts('display'), accent = fonts('accent'), mono = fonts('mono');
  const v = name => `designVar(${JSON.stringify(prefix+'/'+name)})`;
  const card = `Canvas kit ${sample.width}/Card`, action = `Canvas kit ${sample.width}/Action`;
  const jsx = missing.length ? null : `<Frame name="Canvas kit ${sample.width}/Specimen" w={${sample.width}} h="hug" flex="col" p={${v('spacing-container')}} gap={${v('spacing-content')}} bg={${v('color-page')}}>
  <Text name="Telemetry" w="fill" textAutoResize="height" font={${mono}} size={12} color={${v('color-text')}}>SOURCE-DERIVED / DESIGN REVIEW</Text>
  <Text name="Display" w="fill" textAutoResize="height" font={${display}} size={${v('text-step-2')}} weight={700} color={${v('color-text')}}>Room for useful ideas</Text>
  <Text name="Accent" w="fill" textAutoResize="height" font={${accent}} size={${v('text-step-1')}} italic color={${v('color-text')}}>Your visual identity, carried through.</Text>
  <Component name=${JSON.stringify(card)} w="fill" h="hug" flex="col" p={${v('spacing-content')}} gap={${v('spacing-content')}} rounded={${v('radius-card')}} bg={${v('color-surface')}} stroke={${v('color-border')}} strokeWidth={1} properties={[{id:'title',name:'Title',type:'TEXT',defaultValue:'A short starting title'},{id:'meta',name:'ShowMetadata',type:'BOOLEAN',defaultValue:'true'}]}>
    <Text name="Title" w="fill" textAutoResize="height" font={${display}} size={${v('text-step-1')}} weight={700} color={${v('color-text')}} propertyRefs={[{propertyId:'title',field:'TEXT'}]}>A short starting title</Text>
    <Text name="Metadata" w="fill" textAutoResize="height" font={${mono}} size={14} color={${v('color-text')}} propertyRefs={[{propertyId:'meta',field:'VISIBLE'}]}>26 OCT / 18:30</Text>
    <Text name="Body" w="fill" textAutoResize="height" font={${body}} size={${v('text-step-0')}} color={${v('color-text')}}>A component calibrated from the installed site, with source expressions retained.</Text>
  </Component>
  <Instance name="Long-copy instance" of=${JSON.stringify(card)} w="fill" Title="A much longer community announcement title that must wrap naturally without clipping the content below" ShowMetadata={false} />
  <ComponentSet name=${JSON.stringify(action)} flex="col" gap={${v('spacing-content')}}>
${['Primary','Secondary','Ghost'].map(kind => `    <Component name="Kind=${kind}" w={240} h={48} flex="row" items="center" justify="center" rounded={${v('radius-control')}} bg={${v(kind === 'Primary' ? 'color-action' : kind === 'Secondary' ? 'color-surface' : 'color-page')}}${kind === 'Secondary' ? ` stroke={${v('color-border')}} strokeWidth={1}` : ''}><Text font={${body}} size={16} color={${v(kind === 'Primary' ? 'color-on-action' : 'color-text')}}>${kind} action</Text></Component>`).join('\n')}
  </ComponentSet>
</Frame>\n`;
  return { tokens: { $extensions: { 'dev.openpencil': { collection: `Baseline source kit ${sample.width}`, mode:'Default', default:true } }, [prefix]: group }, jsx, missing, fontMappings };
}

export async function generateCanvasKit({ root = '.', out, rootFontPx = 16, styles, roles={}, contextClass='', mappingSHA256=null, sampler = sampleCanvasTokens } = {}) {
  if (!out || !Number.isFinite(rootFontPx) || rootFontPx <= 0 || rootFontPx > 128) throw Error('Use --out <new-external-directory> and a finite root size in (0,128]');
  const destination = path.resolve(out), target = path.resolve(root);
  if (fs.existsSync(destination)) throw Error('Output already exists');
  const parent = fs.realpathSync(path.dirname(destination));
  if (normalized(parent) !== normalized(path.dirname(destination)) || inside(target, destination) || inside(fs.realpathSync(target), destination)) throw Error('Output must be outside the target without linked parents');
  const source = canvasSource(target,{styles,roles,contextClass}), sampled = await sampler(source, rootFontPx);
  const files = new Map(), payloads = sampled.samples.map(sample => ({ sample, ...canvasPayload(source,sample) }));
  for (const payload of payloads) {
    files.set(`${payload.sample.width}.tokens.json`,JSON.stringify(payload.tokens,null,2)+'\n');
    if (payload.jsx) files.set(`${payload.sample.width}.jsx`,payload.jsx);
  }
  const report = { schemaVersion:1, generatorSHA256:hash(fs.readFileSync(new URL(import.meta.url))), sourceInputs:source.inputs, roles, contextClass, mappingSHA256, components:source.components, browserVersion:sampled.browserVersion, samples:payloads.map(({sample,missing,fontMappings}) => ({...sample,missing,fontMappings,sceneReady:!missing.length})), limits:['Inert explicit local styles/default-surface samples; no target JS/config, CSS imports, font-face loads or network executed.', 'Root size, context class, role mapping and horizontal writing mode are explicit sampling assumptions, not inferred site acceptance.', 'sRGB colors are eight-bit browser samples; original expressions and source hashes are retained.', 'Canvas masters are semantic previews, not executable Astro components. Reuse accepted art direction and verify actual fonts, states and route/browser behavior.', 'Source-derived artifacts are a one-way scratch bootstrap, not a second token authority or authorization to overwrite existing canvas objects.'] };
  files.set('canvas-kit.json',JSON.stringify(report,null,2)+'\n');
  for (const input of source.inputs) if (hash(sourceFile(target,input.path)) !== input.sha256) throw Error('Source changed during sampling; output refused');
  fs.mkdirSync(destination);
  const written=[];
  try { for (const [name,content] of files) { fs.writeFileSync(path.join(destination,name),content,{flag:'wx'}); written.push(name); } }
  catch (error) { for(const name of written) fs.unlinkSync(path.join(destination,name)); if(!fs.readdirSync(destination).length) fs.rmdirSync(destination); throw error; }
  return report;
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  try {
    const options = {}, flags = { '--root':'root','--out':'out','--root-font-px':'rootFontPx','--map':'map','--context-class':'contextClass' };
    const args=process.argv.slice(2);
    for(let i=0;i<args.length;i++){
      if(args[i]==='--css'&&args[i+1]){(options.styles??=[]).push(args[++i]);continue;}
      const key=flags[args[i]];if(!key||!args[i+1]||Object.hasOwn(options,key))throw Error('Usage: node scripts/canvas-kit.mjs [--root <site>] --out <new-external-directory> [--root-font-px <number>] [--css <relative-css>] [--map <role-map.json>] [--context-class <classes>]');options[key]=key==='rootFontPx'?Number(args[++i]):args[++i];
    }
    if(options.map){const file=path.resolve(options.map),bytes=sourceFile(path.dirname(file),path.basename(file));options.roles=JSON.parse(bytes.toString('utf8'));options.mappingSHA256=hash(bytes);delete options.map;}
    const report=await generateCanvasKit(options);
    console.log(JSON.stringify({schemaVersion:report.schemaVersion,samples:report.samples.map(({width,sceneReady,missing})=>({width,sceneReady,missing}))},null,2));
    if(report.samples.some(sample=>!sample.sceneReady))process.exitCode=1;
  } catch(error){console.error(error.message);process.exitCode=2;}
}
