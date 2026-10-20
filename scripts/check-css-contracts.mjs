import { inspectSourceTree } from './css-contracts.mjs';

const report = inspectSourceTree();
for (const issue of report.issues) console.error(`${issue.file}:${issue.line}: ${issue.message}`);
console.log(`CSS contracts: ${report.issues.length ? 'FAIL' : 'PASS'}; ${report.files} source inputs.`);
if(report.issues.length)process.exitCode=1;
