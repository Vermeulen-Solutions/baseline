import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import { join } from 'node:path';

export function validateRecord(markdown) {
  // A schema example inside a fenced block does not count as a decision.
  let fence = null;
  const prose = markdown.split(/\r?\n/).filter(line => {
    const marker = line.match(/^\s*(`{3,}|~{3,})/);
    if (marker) {
      if (!fence) fence = marker[1];
      else if (marker[1][0] === fence[0] && marker[1].length >= fence.length) fence = null;
      return false;
    }
    return !fence;
  }).join('\n');
  const sections = [...prose.matchAll(/^## Art Direction Record\s*\r?$/gm)];
  if (sections.length !== 1) return ['Expected exactly one real ## Art Direction Record section.'];
  const section = prose.slice(sections[0].index + sections[0][0].length).split(/^## /m)[0];
  const errors = [];
  const field = name => {
    const matches = [...section.matchAll(new RegExp(`^\\s*- \\*\\*${name}:\\*\\*[ \t]*(.*)$`, 'gm'))];
    const value = matches[0]?.[1]?.trim() ?? '';
    if (matches.length !== 1 || !value || /\[[^\]]*\]|\b(?:TBD|TODO|placeholder|to be decided)\b/i.test(value)) {
      errors.push(`${name} must have one concrete, non-placeholder value.`);
    }
    return value;
  };
  const lane = field('Aesthetic Lane');
  if (!/^(Technical Systems|Product-Led Minimalism|Editorial Paper|Luminous Futurism)(?:\s*[—:;-].+)?$/.test(lane)
      && !/^Custom \/ existing brand\s*[—:;-]\s*\S.+$/.test(lane)) {
    errors.push('Aesthetic Lane must name a reference lane, or Custom / existing brand with a rationale.');
  }
  field('Narrative Metaphor');
  const type = field('Typography Pairing');
  if (!/Display:\s*\S.+?[,;]\s*Body:\s*\S/i.test(type)) errors.push('Typography Pairing must name Display and Body families.');
  // Token Physics has nested fields instead of a scalar value.
  const physics = [...section.matchAll(/^\s*- \*\*Token Physics:\*\*\s*$/gm)];
  if (physics.length !== 1) errors.push('Expected one Token Physics block.');
  const physicsBlock = physics.length === 1 ? section.slice(physics[0].index + physics[0][0].length).split(/^\s*- \*\*/m)[0] : '';
  for (const name of ['Canvas', 'Action/Accent', 'Borders', 'Spatial Density']) {
    const matches = [...physicsBlock.matchAll(new RegExp(`^ +[-] ${name}:[ \\t]*(.*)$`, 'gm'))];
    if (matches.length !== 1 || !matches[0][1].trim() || /\[|\b(?:TBD|TODO|placeholder)\b/i.test(matches[0][1])) errors.push(`Token Physics needs a concrete ${name}.`);
  }
  const anti = field('Site Anti-Patterns').split(';').map(value => value.trim()).filter(Boolean);
  if (anti.length < 2 || anti.length > 3) errors.push('Site Anti-Patterns needs two or three concrete items separated by semicolons.');
  return errors;
}

export function validateCssAlignment(markdown, css) {
  if (!css) return [];
  const laneMatch = String(markdown ?? '').match(/^\s*- \*\*Aesthetic Lane:\*\*[ \t]*(Technical Systems|Product-Led Minimalism|Editorial Paper|Luminous Futurism)\b/m);
  if (!laneMatch) return [];
  const isUntouchedNeutralPage = /--color-page\s*:\s*oklch\(\s*99%\s+0\.004\s+250\s*\)/i.test(css);
  const isUntouchedNeutralAction = /--color-action\s*:\s*oklch\(\s*43%\s+0\.14\s+250\s*\)/i.test(css);
  if (isUntouchedNeutralPage && isUntouchedNeutralAction) {
    const slug = laneMatch[1].toLowerCase().replace(/[^a-z0-9]+/g, '-');
    return [`src/styles/global.css still has the untouched neutral starter palette while AGENTS.md declares "${laneMatch[1]}". Run: npm run design:tokens -- --lane ${slug} --write`];
  }
  return [];
}

export function isVisualPath(file) {
  return /^(src|public)\//.test(file.replaceAll('\\', '/'));
}

export function matchesException(file, content, exceptions) {
  const entry = exceptions.find(item => item.path === file);
  return Boolean(entry?.reason?.trim() && entry.sha256 === createHash('sha256').update(String(content).replaceAll('\r\n', '\n')).digest('hex'));
}

export function matchesDeletionException(file, previousContent, exceptions) {
  return exceptions.some(item => item.path === file && item.deleted === true)
    && matchesException(file, previousContent, exceptions);
}

function main() {
  const args = process.argv.slice(2);
  const baseIndex = args.indexOf('--base');
  const base = baseIndex >= 0 ? args[baseIndex + 1] : 'HEAD';
  if (!base || base.startsWith('-')) throw new Error('--base requires a Git revision.');
  const git = (...gitArgs) => execFileSync('git', gitArgs, { encoding: 'utf8' }).split('\0').filter(Boolean);
  if (args.includes('--changed') && !args.includes('--require-record')) {
    let gitReady = true;
    try { execFileSync('git', ['rev-parse', '--verify', base], { stdio: 'pipe' }); }
    catch (error) {
      if (baseIndex >= 0) throw error;
      gitReady = false;
    }
    const walk = directory => existsSync(directory) ? readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
      const file = join(directory, entry.name).replaceAll('\\', '/');
      if (entry.isSymbolicLink()) throw new Error('Visual source may not be symlinked: ' + file);
      return entry.isDirectory() ? walk(file) : [file];
    }) : [];
    // Fresh generated projects have no Git history yet. Check every visual file
    // against exact starter exceptions rather than silently skipping the gate.
    const changed = [...new Set(gitReady ? [
      ...git('diff', '--relative', '--name-only', '-z', base, '--', '.'),
      ...git('ls-files', '--others', '--exclude-standard', '-z', '--', '.'),
    ] : [...walk('src'), ...walk('public')])].filter(isVisualPath);
    if (!changed.length) { console.log('Art direction gate: no visual source changes.'); return; }
    const exceptionsPath = 'audit/design-gate-exceptions.json';
    const exceptions = existsSync(exceptionsPath) ? JSON.parse(readFileSync(exceptionsPath, 'utf8')) : [];
    const uncovered = changed.filter(file => {
      if (existsSync(file)) return !matchesException(file, readFileSync(file), exceptions);
      try {
        const previous = execFileSync('git', ['show', `${base}:${file}`], { encoding: 'utf8' });
        return !matchesDeletionException(file, previous, exceptions);
      } catch { return true; }
    });
    if (!uncovered.length) { console.log('Art direction gate: exact infrastructure exceptions cover these changes.'); return; }
    console.log(`Art direction gate: checking record for ${uncovered.join(', ')}`);
  }
  const agentsMd = readFileSync('AGENTS.md', 'utf8');
  const css = existsSync('src/styles/global.css') ? readFileSync('src/styles/global.css', 'utf8') : null;
  const errors = [...validateRecord(agentsMd), ...validateCssAlignment(agentsMd, css)];
  if (errors.length) { console.error(errors.join('\n')); process.exitCode = 1; }
  else {
    console.log('Art direction record is structurally valid.');
    console.log('👉 Next Step (Stage 4.5): Audit tokens with npm run design:tokens, calibrate building blocks on /_styleguide, and record findings in audit/component-calibration.md before implementing pages.');
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try { main(); } catch (error) { console.error(error.message); process.exitCode = 1; }
}
