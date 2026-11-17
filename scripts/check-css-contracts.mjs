import { inspectGuardrailTree, inspectSourceTree } from './css-contracts.mjs';

const args = new Set(process.argv.slice(2));
const report = inspectSourceTree();
for (const issue of report.issues) console.error(`${issue.file}:${issue.line}: ${issue.message}`);
console.log(`CSS contracts: ${report.issues.length ? 'FAIL' : 'PASS'}; ${report.files} source inputs.`);
if(report.issues.length)process.exitCode=1;

// Token guardrails are advisory: they list default Tailwind vocabulary and raw values where a
// token would do. --guardrails prints every finding; --strict-guardrails also fails on them.
const { findings } = inspectGuardrailTree();
const counts = Object.entries(findings.reduce((all, item) => ({ ...all, [item.rule]: (all[item.rule] || 0) + 1 }), {}));
const strict = args.has('--strict-guardrails');
console.log(`Token guardrails (${strict ? 'strict' : 'advisory'}): ${findings.length ? `${findings.length} findings (${counts.map(([rule, count]) => `${rule} ${count}`).join(', ')})` : 'none'}.`);
const shown = args.has('--guardrails') || strict ? findings : findings.slice(0, 10);
for (const item of shown) console.log(`  ${item.file}:${item.line}: [${item.rule}] ${item.message}`);
if (shown.length < findings.length) console.log(`  … ${findings.length - shown.length} more: npm run check:css -- --guardrails. Record a reviewed exception with a "token-exempt: <reason>" comment.`);
if (strict && findings.length) process.exitCode = 1;
