#!/usr/bin/env node
// Preflight for an external design prompt before it becomes a Baseline design.
//
//   npm run design:prompt-check -- prompt.md
//   npm run design:prompt-check -- - --fail-on p2        (stdin)
//   npm run design:prompt-check -- prompt.md --json
//
// An external prompt (open-design.ai/prompts, superdesign.dev, designprompts.dev, a client deck)
// is a brief, not a specification. This reports the parts that conflict with Baseline's contracts
// before any of them reach a token file, a component or a stylesheet:
//
//   P1  ready to conflict — webfonts as a dependency, literal colours that skip the role map,
//       invented proof (testimonials, logos, ratings), or an explicit ban on system fonts.
//   P2  needs a decision — fixed type sizes, hard-coded breakpoints, motion with no
//       reduced-motion branch, or a prompt that never mentions contrast at all.
//
// It reads text; it does not style anything and it never blocks on judgement. A P1 means "map this
// onto a role or refuse it", not "the prompt is bad". Exit code is 1 when a finding reaches
// --fail-on (default p1), 0 otherwise, 2 for usage.
import { readFileSync } from 'node:fs';

const SEVERITY_ORDER = { p0: 0, p1: 1, p2: 2, none: 9 };

const RULES = [
  {
    id: 'webfont-dependency',
    severity: 'P1',
    pattern: /fonts\.googleapis\.com|@font-face|@import\s+url\([^)]*font|use\.typekit|fontshare|font-family:\s*['"][A-Z]/i,
    message: 'A webfont becomes a runtime dependency and a font-preflight decision.',
    fix: 'Use the site stacks (--font-display, --font-body, --font-mono). Carry character with weight, tracking and case. A real pairing is a recorded decision, not a prompt line.',
  },
  {
    id: 'named-font-mandate',
    severity: 'P1',
    pattern: /\bMUST\b[^.\n]{0,80}\b(font|typeface|typography)\b|\b(font|typeface)\b[^.\n]{0,40}\bMUST\b/i,
    message: 'A mandated font name cannot be satisfied by the starter without adding it.',
    fix: 'Translate the character, not the file: weight, tracking, case and measure. Record a pairing only if the owner approves the dependency.',
  },
  {
    id: 'quoted-font-name',
    severity: 'P1',
    pattern: /\b(font|fonts|typeface|typography|headings?|body|labels?|mono)\b[^.\n]{0,60}['"][A-Z][A-Za-z0-9]+(?: [A-Z][A-Za-z0-9]+){0,2}['"]|['"][A-Z][A-Za-z0-9]+(?: [A-Z][A-Za-z0-9]+){0,2}['"][^.\n]{0,30}\b(font|typeface|mono|serif|sans)\b/i,
    message: 'A quoted font name asks for a family the starter does not ship.',
    fix: 'Keep the site stacks and translate the character (weight, tracking, case). If the owner wants the real pairing, record the dependency decision first.',
  },
  {
    id: 'system-font-ban',
    severity: 'P1',
    pattern: /MUST NOT use (standard )?system fonts|no system fonts/i,
    message: 'This bans the families Baseline ships with.',
    fix: 'Treat it as a request for a stronger voice, not a ban. Decide the pairing explicitly and record it in the Art Direction Record.',
  },
  {
    id: 'literal-colours',
    severity: 'P1',
    pattern: /#[0-9a-f]{3,8}\b|\brgba?\(|\bhsla?\(/i,
    message: 'Literal colours bypass the semantic role map.',
    fix: 'Name the role first (page, surface, elevated, text, muted, border, action, focus), then choose an OKLCH value for it once.',
  },
  {
    id: 'invented-proof',
    severity: 'P1',
    pattern: /\btestimonials?\b|\btrusted by\b|\b(customer|client|partner) logos?\b|\b5-star\b|\bfive-star\b|\brating\b|\bcase stud(y|ies)\b|\bportrait\b/i,
    message: 'Proof that must come from the owner, not from a prompt.',
    fix: 'Replace with material the project actually produced: real work, real numbers, a verification receipt. Never invent a quote, logo or portrait.',
  },
  {
    id: 'fixed-type-scale',
    severity: 'P2',
    pattern: /font-size:\s*\d+(?:\.\d+)?(px|rem|pt)\b|\b\d+(?:\.\d+)?rem\b[^.\n]{0,24}\b(heading|headline|hero|type|title)\b/i,
    message: 'A fixed type size will not hold between 320 px and a wide screen.',
    fix: 'Use a fluid step: clamp(min, preferred, max) in the token block, then reference the token.',
  },
  {
    id: 'hardcoded-breakpoints',
    severity: 'P2',
    pattern: /@media[^{]{0,40}\d+px/i,
    message: 'Pixel breakpoints duplicate what fluid tokens already handle.',
    fix: 'Prefer fluid values and container queries. Keep a media query only where the layout genuinely changes shape.',
  },
  {
    id: 'motion-without-reduced',
    severity: 'P2',
    pattern: /\b(animations?|keyframes?|transitions?|float(?:ing|s)?|parallax|marquee)\b/i,
    absent: /prefers-reduced-motion/i,
    message: 'Motion is specified but the reduced-motion branch is not.',
    fix: 'Every animation needs a prefers-reduced-motion twin before it ships.',
  },
  {
    id: 'contrast-unstated',
    severity: 'P2',
    pattern: /[\s\S]/,
    absent: /\b(WCAG|accessib\w*|a11y|focus-visible|focus visible|contrast ratio|\d+(?:\.\d+)?:1)\b/i,
    message: 'The prompt never mentions contrast, focus or accessibility.',
    fix: 'Measure text against its composed background and state the target (4.5:1 body, 3:1 large). Do not infer readability from a hex pair.',
  },
];

/** Findings for one prompt, in line order. Pure: takes text, returns data. */
export function inspectPrompt(text) {
  const lines = text.split(/\r?\n/);
  const findings = [];
  for (const rule of RULES) {
    if (rule.absent) {
      if (rule.pattern.test(text) && !rule.absent.test(text)) {
        findings.push({ severity: rule.severity, id: rule.id, line: 0, excerpt: '', message: rule.message, fix: rule.fix });
      }
      continue;
    }
    lines.forEach((line, index) => {
      const match = rule.pattern.exec(line);
      if (!match) return;
      findings.push({
        severity: rule.severity,
        id: rule.id,
        line: index + 1,
        excerpt: line.trim().slice(0, 120),
        message: rule.message,
        fix: rule.fix,
      });
    });
  }
  const rank = { P0: 0, P1: 1, P2: 2 };
  const lineKey = finding => (finding.line === 0 ? Number.MAX_SAFE_INTEGER : finding.line);
  return findings.sort((left, right) => lineKey(left) - lineKey(right) || rank[left.severity] - rank[right.severity]);
}

export function summarize(findings) {
  return {
    p0: findings.filter(finding => finding.severity === 'P0').length,
    p1: findings.filter(finding => finding.severity === 'P1').length,
    p2: findings.filter(finding => finding.severity === 'P2').length,
  };
}

export function parseArgs(argv) {
  const out = { failOn: 'p1', json: false, file: null };
  for (let i = 0; i < argv.length; i++) {
    const flag = argv[i];
    const value = () => {
      const next = argv[++i];
      if (next === undefined) throw Error('Missing value for ' + flag);
      return next;
    };
    if (flag === '--help' || flag === '-h') out.help = true;
    else if (flag === '--json') out.json = true;
    else if (flag === '--fail-on') out.failOn = value().toLowerCase();
    else if (flag.startsWith('--')) throw Error('Unknown option: ' + flag);
    else if (out.file) throw Error('Only one prompt file at a time');
    else out.file = flag;
  }
  if (out.help) return out;
  if (!out.file) throw Error('Give a prompt file, or - for stdin');
  if (!(out.failOn in SEVERITY_ORDER)) throw Error('--fail-on must be p0, p1, p2 or none');
  return out;
}

/** True when any finding is at or above the threshold. */
export function exceedsThreshold(findings, failOn) {
  if (failOn === 'none') return false;
  const limit = SEVERITY_ORDER[failOn];
  return findings.some(finding => SEVERITY_ORDER[finding.severity.toLowerCase()] <= limit);
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    console.log('Usage: npm run design:prompt-check -- <prompt.md|-> [--fail-on p0|p1|p2|none] [--json]');
    return;
  }
  const text = options.file === '-' ? readFileSync(0, 'utf8') : readFileSync(options.file, 'utf8');
  const findings = inspectPrompt(text);
  const counts = summarize(findings);
  const ok = !exceedsThreshold(findings, options.failOn);

  if (options.json) {
    console.log(JSON.stringify({ ok, file: options.file === '-' ? 'stdin' : options.file, failOn: options.failOn, counts, findings }, null, 2));
  } else {
    console.log(`Design prompt preflight: ${options.file === '-' ? 'stdin' : options.file}`);
    console.log(`${counts.p0} P0 · ${counts.p1} P1 · ${counts.p2} P2 · failing at ${options.failOn}`);
    for (const finding of findings) {
      const where = finding.line ? `line ${finding.line}` : 'whole prompt';
      console.log(`\n${finding.severity}  ${finding.id}  (${where})`);
      if (finding.excerpt) console.log(`  ${finding.excerpt}`);
      console.log(`  ${finding.message}`);
      console.log(`  Fix: ${finding.fix}`);
    }
    if (findings.length === 0) console.log('\nNothing to translate. Check the roles and proof anyway.');
  }
  if (!ok) process.exitCode = 1;
}

const invokedDirectly = process.argv[1] && /check-design-prompt\.mjs$/.test(process.argv[1].replace(/\\/g, '/'));
if (invokedDirectly) {
  try { main(); }
  catch (error) { console.error(`design:prompt-check: ${error.message}`); process.exitCode = 2; }
}
