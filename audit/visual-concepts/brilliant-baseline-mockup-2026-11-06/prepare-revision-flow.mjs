// Evidence-only native repair: make the revised hero and surrounding page flow.
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.dirname(fileURLToPath(import.meta.url));
const maps = JSON.parse(await fs.readFile(path.join(root, 'revision-map.json'), 'utf8'));
const values = new Map();
const v = number => {
  const value = Number(number.toFixed(3));
  const key = 'flow.v' + String(value).replace('-', 'minus').replace('.', '_');
  values.set(key, value);
  return '$' + key;
};
const z = v(0);
const rows = ['```bl', 'file("Native reconstruction.bl")', '// revised copy before native flow repair'];
const find = (node, predicate) => predicate(node) ? node : node.children.map(child => find(child, predicate)).find(Boolean);
for (const width of [1440, 390]) {
  const m = maps[width];
  const tree = JSON.parse(await fs.readFile(path.join(root, `native-source-tree-${width}.json`), 'utf8'));
  const source = JSON.parse(await fs.readFile(path.join(root, `source-sample-${width}.json`), 'utf8'));
  const shell = find(tree, n => n.ref === m.shell);
  const main = find(tree, n => n.ref === m.main);
  const left = find(tree, n => n.ref === m.left);
  const deck = find(tree, n => n.ref === m.deck);
  const actions = find(tree, n => n.ref === m.actions);
  const meta = find(tree, n => n.ref === m.meta);
  const sourceGrid = source.nodes.find(n => n.classes === 'wrap hero__grid');
  const gridGap = parseFloat(sourceGrid.styles['column-gap']);
  rows.push(`#${m.root} al(v,x(c),g(${z}),pad(${v(width === 1440 ? 20 : 8)})) s(${width},hug) f[($color.page)] clip`);
  rows.push(`#${m.shell} al(v,x(s),g(${z}),pad(${v(1)})) s(fill,hug) clip`);
  rows.push(`#${m.shell}-grid abs`);
  for (const child of shell.children.filter(n => n.name.startsWith('glow '))) rows.push(`#${child.ref} abs`);
  rows.push(`#${m.main} al(v,x(s),g(${z}),pad(${z})) s(fill,hug)`);
  for (let i = 1; i < main.children.length; i++) {
    const before = main.children[i - 1], after = main.children[i];
    const gap = after.y - before.y - before.h;
    if (gap > 0.5) rows.push(`fr s(fill,${Number(gap.toFixed(3))}) before(#${after.ref}) "Preserved section separation" #flow-gap-${width}-${i}`);
  }
  rows.push(`#${m.hero} al(v,x(c),g(${z}),pad(${v(m.heroStyle.padding[0])},${z},${v(m.heroStyle.padding[2])},${z})) s(fill,hug)`);
  rows.push(`#${m.grid} al(${width === 1440 ? 'h' : 'v'},x(s),y(s),g(${v(gridGap)}),pad(${z})) s(${Number(m.gridW.toFixed(3))},hug)`);
  rows.push(`#${m.left} al(v,x(s),g(${z}),pad(${z})) s(${Number(m.leftW.toFixed(3))},hug)`);
  let previousEnd = 0;
  for (const child of left.children) {
    const gap = Math.max(0, child.y - previousEnd);
    const wrapper = 'flow-' + child.ref;
    rows.push(`al(v,x(s),g(${z}),pad(${v(gap)},${z},${z},${z})) s(fill,hug) parent(#${m.left}) "Preserved hero spacing" #${wrapper}`);
    rows.push(`#${child.ref} parent(#${wrapper})`);
    previousEnd = child.y + child.h;
  }
  rows.push(`#${m.head} al(v,x(s),g(${z}),pad(${z})) s(fill,hug)`);
  rows.push(`#${m.head}-text s(fill,hug)`);
  rows.push(`#${m.deck} al(v,x(s),g(${z}),pad(${z})) s(${Number(deck.w.toFixed(3))},hug)`);
  rows.push(`#${m.deck}-text s(fill,hug)`);
  rows.push(`#${m.actions} al(h,x(s),y(c),wrap,g(${v(12)}),pad(${z})) s(fill,hug)`);
  for (const child of actions.children) {
    rows.push(`#${child.ref} al(h,x(c),y(c),g(${z}),pad(${v(14.6)},${v(23.4)})) s(hug,hug)`);
    rows.push(`#${child.ref}-text s(hug,hug)`);
  }
  rows.push(`#${m.cta}-text`, '  spans[("Build with Baseline",link("#cta"))]');
  rows.push(`#${m.meta} al(h,x(s),y(c),wrap,g(${v(22.4)},8),pad(${v(18.6)},${z},${z},${z})) s(fill,hug)`);
  for (const child of meta.children) {
    rows.push(`#${child.ref} al(v,x(s),g(${z}),pad(${z})) s(hug,hug)`);
    rows.push(`#${child.ref}-text s(hug,hug)`);
  }
}
rows.push('```');
const ds = ['```ds', 'file("Styles/default.ds")', ...[...values].map(([key, value]) => `${key}: ${value}`), '```'];
await fs.writeFile(path.join(root, 'revision-flow-authoring.txt'), [...ds, ...rows].join('\n') + '\n');
console.log(JSON.stringify({rows: rows.length, sampledSpacingTokens: values.size}));
