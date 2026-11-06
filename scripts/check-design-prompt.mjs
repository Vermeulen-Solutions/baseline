#!/usr/bin/env node
// Preflight for an external design prompt before it becomes a Baseline design.
//
//   npm run design:prompt-check -- prompt.md
//   npm run design:prompt-check -- - --fail-on p2        (stdin)
//   npm run design:prompt-check -- prompt.md --json
//
// An external prompt (open-design.ai/prompts, superdesign.dev, designprompts.dev, a client deck)
// is a brief, not a specification. Findings are review requirements, not proof of a violation:
//
//   P1  resolve before implementation — dependencies/role mapping, unverified proof,
//       explicit fabrication or an instruction to ignore accessibility.
//   P2  inspect deliberately — declared approvals/inspiration, responsive structure,
//       placeholder copy, motion safeguards and accessibility evidence.
//
// It reads text only: installed fonts, owner approval, factual accuracy and rendered behavior
// still need verification. English negation handling is deliberately bounded. Exit code is 1 when a finding reaches
// --fail-on (default p1), 0 otherwise, 2 for usage.
import { readFileSync } from 'node:fs';

const SEVERITY_ORDER = { p0: 0, p1: 1, p2: 2, none: 9 };

const RULES = [
  {
    id: 'webfont-dependency',
    severity: 'P1',
    pattern: /fonts\.googleapis\.com|@font-face|@import\s+url\([^)]*font|use\.typekit|fontshare|font-family:\s*['"][A-Z]/i,
    message: 'A font source needs checking against the installed, approved typography.',
    fix: 'Preserve approved faces and verify loading/licensing. For a new dependency, record the pairing decision; otherwise translate character through the existing type roles.',
  },
  {
    id: 'named-font-mandate',
    severity: 'P1',
    pattern: /\bMUST\b[^.\n]{0,80}\b(font|typeface|typography)\b|\b(font|typeface)\b[^.\n]{0,40}\bMUST\b/i,
    message: 'A font mandate needs checking against the project typography and available sources.',
    fix: 'Keep an approved installed pairing. Resolve a new font dependency explicitly, or translate weight, tracking, case and measure through the existing roles.',
  },
  {
    id: 'quoted-font-name',
    severity: 'P1',
    pattern: /\b(font|fonts|typeface|typography|headings?|body|labels?|mono)\b[^.\n]{0,60}['"][A-Z][A-Za-z0-9]+(?: [A-Z][A-Za-z0-9]+){0,2}['"]|['"][A-Z][A-Za-z0-9]+(?: [A-Z][A-Za-z0-9]+){0,2}['"][^.\n]{0,30}\b(font|typeface|mono|serif|sans)\b/i,
    message: 'A named family needs checking; prompt text cannot establish whether it is installed or approved.',
    fix: 'Preserve approved typography and run font preflight. If unavailable, record a dependency decision or translate its character with the existing roles.',
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
    pattern: /#(?:[0-9a-f]{8}|[0-9a-f]{6}|[0-9a-f]{4}|[0-9a-f]{3})\b|\b(?:rgba?|hsla?|oklch|oklab|lch|lab|color|color-mix)\(/i,
    message: 'Colour values need a semantic role map, including values offered only as inspiration.',
    fix: 'Name the role first (page, surface, elevated, text, muted, border, action, focus), then choose an OKLCH value for it once.',
  },
  {
    id: 'invented-proof',
    severity: 'P1',
    pattern: /\btestimonials?\b|\btrusted by\b|\b(customer|client|partner) logos?\b|\b5-star\b|\bfive-star\b|\brating\b|\bcase stud(y|ies)\b|\bportrait\b/i,
    message: 'A proof or identity reference needs a verified source and permitted use; this match does not establish fabrication.',
    fix: 'Check the owner/source evidence. Keep authentic permitted material; otherwise omit it or use honest project evidence. Never invent a quote, logo or portrait presented as real.',
  },
  {
    id: 'fabricated-proof',
    severity: 'P1',
    pattern: /\b(invent|fabricate|fake|make up)\b[^.\n]{0,80}\b(testimonials?|reviews?|clients?|customers?|logos?|ratings?|portraits?|team members?|metrics?)\b|\bAI[- ]generated\b[^.\n]{0,60}\b(?:testimonials?|reviews?|ratings?|team members?)\b|\bAI[- ]generated\b[^.\n]{0,40}\bportraits?\b[^.\n]{0,50}\b(?:as real|real (?:people|customers?|clients?|team)|as (?:customers?|clients?|team members?))\b/i,
    message: 'The prompt requests fabricated proof or identity material.',
    fix: 'Refuse fabricated evidence. Use verified real material or a clearly labelled illustration that makes no factual identity claim.',
  },
  {
    id: 'fixed-type-scale',
    severity: 'P2',
    pattern: /font-size:\s*\d+(?:\.\d+)?(px|rem|pt)\b|\b\d+(?:\.\d+)?rem\b[^.\n]{0,24}\b(heading|headline|hero|type|title)\b/i,
    message: 'A fixed type size needs a responsive role decision.',
    fix: 'Use the site type tokens and inspect reflow. Use a bounded fluid step where appropriate; a deliberate constant is not automatically invalid.',
  },
  {
    id: 'hardcoded-breakpoints',
    severity: 'P2',
    pattern: /@media[^{]{0,40}\d+px|\bbreakpoints?\b[^.\n]{0,70}\d+(?:\.\d+)?px/i,
    message: 'Breakpoint instructions need checking against actual layout changes.',
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
  {
    id: 'viewport-sizing',
    severity: 'P2',
    pattern: /\b(?:width\s*:\s*100(?:vw|vi)|height\s*:\s*100vh)\b/i,
    message: 'Viewport sizing can overflow the page or clip content on mobile.',
    fix: 'Check scrollbars, browser chrome and expanded content. Prefer container width and content-driven height; retain a viewport size only for an intentional bounded use.',
  },
  {
    id: 'absolute-layout',
    severity: 'P2',
    pattern: /\bposition\s*:\s*absolute\b|\babsolute positioning\b/i,
    message: 'Absolute positioning needs a content-flow review.',
    fix: 'Use Grid/Flexbox for document structure. Positioned decoration and deliberate overlaps can remain when reading order, long copy and reflow are verified.',
  },
  {
    id: 'placeholder-copy',
    severity: 'P2',
    pattern: /\blorem ipsum\b|\bplaceholder (?:body )?copy\b/i,
    message: 'Placeholder copy does not establish a representative content shape.',
    fix: 'Use real copy or clearly labelled editorial drafts with realistic lengths before direction selection; track missing content with its owner.',
  },
  {
    id: 'accessibility-override',
    severity: 'P1',
    pattern: /\b(?:ignore|skip|disable)\b[^.\n]{0,40}\b(?:accessibility|a11y|WCAG|reduced[- ]motion)\b|\b(?:accessibility|a11y|WCAG|reduced[- ]motion)\b[^.\n]{0,40}\b(?:out of scope|not required|unnecessary|ignore|disable)\b/i,
    message: 'The prompt asks to omit an accessibility safeguard.',
    fix: 'Refuse that instruction and retain keyboard/focus, measured contrast, reflow and reduced-motion acceptance. Keywords elsewhere do not establish compliance.',
  },
];

// Clause-local handling prevents "do not invent testimonials; add fake client logos"
// from suppressing the second instruction. This is not general negation parsing.
function clauses(line) {
  return line.split(/;|[.!?](?=\s|$)|\b(?:but|however)\b/i).map(part => part.trim()).filter(Boolean);
}

function prohibited(clause, matchIndex) {
  return /^\s*(?:[-*]\s*|\d+[.)]\s*)?(?:do not|don't|never|avoid|no|without)\b/i.test(clause.slice(0, matchIndex + 1));
}

function lineFinding(rule, line) {
  let severity;
  for (const clause of clauses(line)) {
    const match = rule.pattern.exec(clause);
    if (!match) continue;
    if (['invented-proof', 'fabricated-proof', 'motion-without-reduced', 'accessibility-override'].includes(rule.id) && prohibited(clause, match.index)) continue;
    let candidate = rule.severity;
    if (rule.id === 'literal-colours' && /\b(?:inspiration|reference|sample palette)\b/i.test(clause) && !/\b(?:must|exact|mandatory)\b/i.test(clause)) candidate = 'P2';
    if (['webfont-dependency', 'named-font-mandate', 'quoted-font-name', 'invented-proof'].includes(rule.id) && /\b(?:approved|owner[- ]supplied|already installed|self[- ]hosted|verified source)\b/i.test(clause)) candidate = 'P2';
    if (rule.id === 'invented-proof' && /\b(?:labelled|labeled)\b[^.\n]{0,30}\billustration\b/i.test(clause)) candidate = 'P2';
    if (!severity || SEVERITY_ORDER[candidate.toLowerCase()] < SEVERITY_ORDER[severity.toLowerCase()]) severity = candidate;
  }
  return severity;
}

/** Findings for one prompt, in line order. Pure: takes text, returns data. */
export function inspectPrompt(text) {
  const lines = text.split(/\r?\n/);
  const findings = [];
  for (const rule of RULES) {
    if (rule.absent) {
      const matched = rule.id === 'motion-without-reduced' ? lines.some(line => lineFinding(rule, line)) : rule.pattern.test(text);
      if (matched && !rule.absent.test(text)) {
        findings.push({ severity: rule.severity, id: rule.id, line: 0, excerpt: '', message: rule.message, fix: rule.fix });
      }
      continue;
    }
    lines.forEach((line, index) => {
      const severity = lineFinding(rule, line);
      if (!severity) return;
      findings.push({
        severity,
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
    if (findings.length === 0) console.log('\nNo text signals found. Verify project fit, sources and rendered behavior; this is not design approval.');
  }
  if (!ok) process.exitCode = 1;
}

const invokedDirectly = process.argv[1] && /check-design-prompt\.mjs$/.test(process.argv[1].replace(/\\/g, '/'));
if (invokedDirectly) {
  try { main(); }
  catch (error) { console.error(`design:prompt-check: ${error.message}`); process.exitCode = 2; }
}
