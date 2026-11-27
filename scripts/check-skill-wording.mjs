// Checks the wording of Baseline's own skills and agent instructions (docs/skill-writing.md says why).
//
//   npm run check:skills             fail on a finding that is not recorded as known debt
//   npm run check:skills -- --list   also list the known debt
//   npm run check:skills -- --json   machine-readable report
//
// Rules:
//   judgment-branch  a branch the agent settles by its own judgment ("when possible", "if needed",
//                    "ideally"). Agents settle these towards the cheaper path, so the step stops
//                    happening. Name the fact that decides it, make the step required, or drop it.
//   shouting         a capitalised command (MUST, NEVER, ALWAYS, CRITICAL). Recent models over-apply
//                    it; say the rule plainly and give the reason.
//   skill-length     a SKILL.md over 500 lines.
//   description      a SKILL.md without a description, longer than 1024 characters, or written in the
//                    first or second person.
//   rule-home        a row of the rule-home table in docs/skill-writing.md (section 6) that points at
//                    nothing: its file is gone, the quoted words are no longer in it, or a script or
//                    finding it names does not exist. Each rule has one home, and the table is how a
//                    reader finds it; a pointer that has rotted sends them to the wrong place.
//
// Text in code spans and fenced blocks is not read, so a phrase quoted as an example belongs in
// backticks. A line that must keep a phrase carries `<!-- wording-ok: <reason> -->`. Findings that
// predate the check are listed in audit/skill-wording-debt.json; an entry that no longer matches
// fails, so the list only shrinks.
import { readFileSync, readdirSync, existsSync, lstatSync } from 'node:fs';
import { join, relative } from 'node:path';
import { createHash } from 'node:crypto';
import { pathToFileURL } from 'node:url';

export const DEBT_FILE = 'audit/skill-wording-debt.json';
// Vendored skills keep their authors' wording; Baseline only checks what it writes.
const VENDORED = new Set(['impeccable', 'building-emdash-site', 'creating-plugins', 'emdash-cli', 'upgrading-emdash']);
const INSTRUCTION_FILES = ['AGENTS.md', 'CLAUDE.md', 'profiles/static/project/AGENTS.md'];

const JUDGMENT = new RegExp([
  String.raw`\b(?:when|if|where|wherever|whenever)\s+(?:possible|practical|practicable|feasible|appropriate|sensible|useful|helpful|relevant|warranted|desired|desirable|convenient)\b`,
  String.raw`\b(?:when|if|where)\s+it\s+(?:helps|makes sense|seems useful)\b`,
  String.raw`\b(?:as|if|when)\s+(?:needed|necessary|appropriate)\b`,
  String.raw`\b(?:ideally|preferably|optionally)\b`,
  String.raw`\bif\s+in\s+doubt\b`,
  String.raw`\b(?:time\s+permitting|if\s+time\s+allows)\b`,
  String.raw`\bat\s+your\s+discretion\b`,
  String.raw`\bfeel\s+free\b`,
  String.raw`\bif\s+you\s+(?:like|wish|prefer)\b`,
].join('|'), 'giu');
const SHOUTING = /\b(?:MUST(?: NOT)?|NEVER|ALWAYS|CRITICAL|IMPORTANT|REQUIRED|DO NOT|DON'T)\b/gu;
const ALLOW = /<!--\s*wording-ok:\s*\S[^>]*-->/u;

// The prose of a Markdown file, line by line, with fenced blocks, code spans and comments blanked
// (line numbers are kept so findings point at the source).
export function proseLines(markdown) {
  const lines = markdown.replaceAll('\r\n', '\n').split('\n');
  let fence = null;
  let frontmatter = lines[0]?.trim() === '---';
  return lines.map((line, index) => {
    if (frontmatter) {
      if (index > 0 && line.trim() === '---') frontmatter = false;
      return { number: index + 1, text: '', raw: line };
    }
    const opening = line.match(/^\s*(`{3,}|~{3,})/u);
    if (fence) {
      if (opening && opening[1][0] === fence[0] && opening[1].length >= fence.length) fence = null;
      return { number: index + 1, text: '', raw: line };
    }
    if (opening) { fence = opening[1]; return { number: index + 1, text: '', raw: line }; }
    const text = line.replace(/<!--.*?-->/gu, ' ').replace(/(`+)[^`]*?\1/gu, ' ');
    return { number: index + 1, text, raw: line };
  });
}

const lineKey = (raw) => createHash('sha256').update(raw.trim().replace(/\s+/gu, ' ')).digest('hex').slice(0, 12);

export function frontmatterOf(markdown) {
  const match = markdown.replaceAll('\r\n', '\n').match(/^---\n([\s\S]*?)\n---/u);
  if (!match) return null;
  const description = match[1].match(/^description:\s*(?:>-?|\|-?)?\s*\n?([\s\S]*?)(?=\n[a-z-]+:|$)/mu);
  return { description: description ? description[1].replace(/\s+/gu, ' ').replace(/^["']|["']$/gu, '').trim() : null };
}

export function checkMarkdown(file, markdown) {
  const findings = [];
  for (const { number, text, raw } of proseLines(markdown)) {
    if (!text.trim() || ALLOW.test(raw)) continue;
    for (const [rule, pattern] of [['judgment-branch', JUDGMENT], ['shouting', SHOUTING]]) {
      for (const match of text.matchAll(pattern)) {
        findings.push({ file, line: number, rule, match: match[0], key: lineKey(raw) });
      }
    }
  }
  if (/(^|\/)SKILL\.md$/u.test(file)) {
    const count = markdown.replaceAll('\r\n', '\n').replace(/\n$/u, '').split('\n').length;
    if (count > 500) findings.push({ file, line: 1, rule: 'skill-length', match: `${count} lines`, key: 'length' });
    const meta = frontmatterOf(markdown);
    const description = meta?.description;
    if (!description) findings.push({ file, line: 1, rule: 'description', match: 'missing', key: 'description' });
    else if (description.length > 1024) findings.push({ file, line: 1, rule: 'description', match: `${description.length} characters`, key: 'description' });
    else if (/^(?:I|I'm|I'll|We|You|Your)\b/u.test(description)) findings.push({ file, line: 1, rule: 'description', match: description.split(/\s+/u).slice(0, 3).join(' '), key: 'description' });
  }
  return findings;
}

export function skillFiles(root) {
  const files = [];
  const base = join(root, '.agents/skills');
  const walk = (directory) => {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const path = join(directory, entry.name);
      if (entry.isSymbolicLink()) continue;
      if (entry.isDirectory()) { if (entry.name !== 'upstream') walk(path); }
      else if (entry.name.endsWith('.md')) files.push(relative(root, path).replaceAll('\\', '/'));
    }
  };
  if (existsSync(base)) {
    for (const skill of readdirSync(base, { withFileTypes: true })) {
      if (!skill.isDirectory() || VENDORED.has(skill.name)) continue;
      const directory = join(base, skill.name);
      if (existsSync(join(directory, 'SKILL.md'))) files.push(relative(root, join(directory, 'SKILL.md')).replaceAll('\\', '/'));
      if (existsSync(join(directory, 'references')) && lstatSync(join(directory, 'references')).isDirectory()) walk(join(directory, 'references'));
    }
  }
  for (const file of INSTRUCTION_FILES) if (existsSync(join(root, file))) files.push(file);
  return files.sort();
}

const debtId = (finding) => `${finding.file}|${finding.rule}|${finding.match.toLowerCase()}|${finding.key}`;

export function checkTree(root, debtEntries = []) {
  const findings = skillFiles(root).flatMap((file) => checkMarkdown(file, readFileSync(join(root, file), 'utf8')));
  const debt = new Map();
  for (const entry of debtEntries) debt.set(debtId(entry), (debt.get(debtId(entry)) ?? 0) + 1);
  const remaining = new Map(debt);
  const known = [], fresh = [];
  for (const finding of findings) {
    const id = debtId(finding);
    if ((remaining.get(id) ?? 0) > 0) { remaining.set(id, remaining.get(id) - 1); known.push(finding); }
    else fresh.push(finding);
  }
  const stale = [...remaining].filter(([, count]) => count > 0).map(([id]) => id);
  return { findings, known, fresh, stale };
}

export const RULE_HOMES_FILE = 'docs/skill-writing.md';
const RULE_HOMES_HEADING = /^## .*Each rule has one home/mu;

/**
 * The rows of the rule-home table: | rule | `file` › "quoted words" | `script:name` `finding-name` |.
 * Reads the first table after the section heading; a row whose home cell has no file and quote is reported.
 */
export function ruleHomeRows(markdown) {
  const lines = markdown.replaceAll('\r\n', '\n').split('\n');
  const start = lines.findIndex((line) => RULE_HOMES_HEADING.test(line));
  if (start === -1) return [];
  const rows = [];
  let inTable = false;
  for (let index = start + 1; index < lines.length; index++) {
    const line = lines[index];
    if (/^## /u.test(line)) break;
    if (!line.startsWith('|')) { if (inTable) break; continue; }
    inTable = true;
    const cells = line.split('|').slice(1, -1).map((cell) => cell.trim());
    if (cells.length < 3 || /^-+$/u.test(cells[0].replaceAll(' ', '')) || cells[0] === 'Rule') continue;
    const home = cells[1].match(/`([^`]+)`\s*›\s*"([^"]+)"/u);
    rows.push({ line: index + 1, rule: cells[0], file: home?.[1] ?? null, words: home?.[2] ?? null, names: [...cells[2].matchAll(/`([^`]+)`/gu)].map((match) => match[1]) });
  }
  return rows;
}

/**
 * Findings for rows that point at nothing: `lookup.text(file)` gives a file's text or null,
 * `lookup.script(name)` says whether package.json has the script, `lookup.finding(name)` whether a
 * script under scripts/ holds the finding name as a string.
 */
export function ruleHomeFindings(markdown, lookup, file = RULE_HOMES_FILE) {
  const findings = [];
  const add = (row, match) => findings.push({ file, line: row.line, rule: 'rule-home', match, key: 'rule-home' });
  for (const row of ruleHomeRows(markdown)) {
    if (!row.file) { add(row, `${row.rule}: no home given as \`file\` › "words"`); continue; }
    const text = lookup.text(row.file);
    if (text === null) add(row, `${row.file} does not exist`);
    else if (!text.includes(row.words)) add(row, `${row.file} no longer contains "${row.words}"`);
    for (const name of row.names) {
      if (name.includes(':') ? !lookup.script(name) : !lookup.finding(name)) add(row, `${name} is not ${name.includes(':') ? 'a script in package.json' : 'a finding name in scripts/'}`);
    }
  }
  return findings;
}

/** The rule-home findings of a checkout. */
export function checkRuleHomes(root) {
  const source = join(root, RULE_HOMES_FILE);
  if (!existsSync(source)) return [];
  const scripts = existsSync(join(root, 'package.json')) ? JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')).scripts ?? {} : {};
  const scriptDir = join(root, 'scripts');
  const sources = existsSync(scriptDir) ? readdirSync(scriptDir).filter((name) => name.endsWith('.mjs')).map((name) => readFileSync(join(scriptDir, name), 'utf8')) : [];
  return ruleHomeFindings(readFileSync(source, 'utf8'), {
    text: (file) => (existsSync(join(root, file)) ? readFileSync(join(root, file), 'utf8') : null),
    script: (name) => Object.hasOwn(scripts, name),
    finding: (name) => sources.some((text) => text.includes(`'${name}'`) || text.includes(`"${name}"`)),
  });
}

const ADVICE = {
  'rule-home': 'point the row at where the rule now lives, or at the new name (docs/skill-writing.md, section 6)',
  'judgment-branch': 'name the fact that decides it, make the step required, or drop it',
  shouting: 'say it plainly and give the reason',
  'skill-length': 'move detail into references/ and keep SKILL.md under 500 lines',
  description: 'write a third-person description of up to 1024 characters: what the skill does and when to use it',
};

function main() {
  const args = process.argv.slice(2);
  const root = process.cwd();
  const debtFile = join(root, DEBT_FILE);
  const debt = existsSync(debtFile) ? JSON.parse(readFileSync(debtFile, 'utf8')).entries ?? [] : [];
  const result = checkTree(root, debt);
  // Rows of the rule-home table that point at nothing are new findings; they are never recorded as debt.
  const homes = checkRuleHomes(root);
  result.findings.push(...homes);
  result.fresh.push(...homes);
  if (args.includes('--json')) { console.log(JSON.stringify(result, null, 2)); process.exitCode = result.fresh.length || result.stale.length ? 1 : 0; return; }
  const show = (finding) => `  ${finding.file}:${finding.line}  ${finding.rule}  "${finding.match}": ${ADVICE[finding.rule]}`;
  if (args.includes('--list') && result.known.length) console.log(`Known debt (${DEBT_FILE}):\n${result.known.map(show).join('\n')}`);
  if (result.fresh.length) console.log(`Skill wording: ${result.fresh.length} new finding(s):\n${result.fresh.map(show).join('\n')}\nSee docs/skill-writing.md. A line that must keep the phrase carries <!-- wording-ok: <reason> -->.`);
  if (result.stale.length) console.log(`Skill wording: ${result.stale.length} debt entr(y/ies) no longer match; remove them from ${DEBT_FILE}:\n${result.stale.map((id) => '  ' + id).join('\n')}`);
  if (result.fresh.length || result.stale.length) { process.exitCode = 1; return; }
  console.log(`Skill wording: no new findings (${result.known.length} known debt in ${DEBT_FILE}).`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
