import { STATES, contractDigest, declarations, coverageOf, resultOf, reportScopeNotice, validateManifest, validateObservations, validateMigrationReport } from '../standards/schemas/migration-acceptance.mjs';

export function migrationReport(manifest, observations = null, { scope = 'full', runId, generatedAt, verifyArtifact = () => false, collected = false } = {}) {
  if (validateManifest(manifest).length || !['url', 'full'].includes(scope)) throw Error('Invalid migration manifest or scope');
  if (observations && validateObservations(observations, manifest).length) throw Error('Invalid or mismatched observations');
  const observed = new Map((observations?.checks ?? []).map(check => [check.id, check]));
  const checks = declarations(manifest, scope).map(declaration => {
    let status = 'unverified', reason = 'No valid evidence supplied for this declaration.', observedValue = null, evidence = [];
    if (declaration.category === 'url' && declaration.id.endsWith(':excluded')) { status = 'not-applicable'; reason = 'Explicit manifest exclusion; retained in URL coverage.'; }
    else if (scope === 'url' && declaration.category !== 'url') { status = 'not-applicable'; reason = 'Outside URL-only scope; content/editor parity is not certified.'; }
    else {
      const fact = observed.get(declaration.id);
      if (fact) {
        let verified = false;
        try { verified = fact.evidence.every(verifyArtifact); } catch { verified = false; }
        if (verified) { status = fact.status; reason = fact.reason; observedValue = fact.observed; evidence = fact.evidence; }
        else reason = 'Supplied evidence is missing, changed, linked, escaping or over bounds.';
        if (status === 'not-applicable' || declaration.required && status === 'advisory') { status = 'unverified'; reason = 'An observation cannot waive applicability or downgrade required evidence.'; }
      }
    }
    return { ...declaration, status, reason, observed: observedValue, evidence };
  });
  const report = {
    reportVersion: manifest.manifestVersion, toolVersion: `migration-acceptance/${manifest.manifestVersion}`, run: { id: runId, generatedAt }, scope,
    ...(manifest.manifestVersion >= 2 ? { scopeNotice: reportScopeNotice(scope) } : {}),
    mode: observations ? collected && manifest.manifestVersion >= 2 ? 'http-collected' : 'supplied-observations' : 'none',
    binding: { manifestId: manifest.id, manifestSHA256: contractDigest(manifest), sourceCaptureSHA256: manifest.sourceCapture.sha256, targetRevision: manifest.targetRevision, sourceOrigin: manifest.sourceOrigin, targetOrigin: manifest.targetOrigin, productionOrigin: manifest.productionOrigin },
    observationsSHA256: observations ? contractDigest(observations) : null,
    ...(manifest.manifestVersion === 3 ? { content: scope === 'full' ? observations?.content ?? null : null } : {}),
    coverage: coverageOf(manifest, checks), checks, ...resultOf(checks),
  };
  if (validateMigrationReport(report, manifest).length) throw Error('Generated report violates migration contract');
  return report;
}

const cell = value => String(value).replace(/[&<>|`\r\n]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '|': '&#124;', '`': '&#96;', '\r': ' ', '\n': ' ' })[char]);
export function migrationMarkdown(report) {
  const lines = [
    '# Migration acceptance report', '',
    `Scope: **${report.scope}**. Result: **${report.result}**. Exit: **${report.exitCode}**.`, '',
    'Evaluates hash-checked observations; producer and HTTP collection details are retained in the evidence artifacts. Content/editor parity needs separate evidence. Supplied observations are attestations; integrity alone does not prove their truth or completeness.', '',
    ...(report.mode === 'http-collected' ? ['Mode: live bounded HTTP collection. No credentialed CMS reads, editor or provider acceptance actions were performed.', ''] : []),
    ...(report.scope === 'url' ? ['Content and editor parity are outside this result; provider acceptance was not assessed.', ''] : []),
    ...(report.scopeNotice ? [report.scopeNotice, ''] : []),
    `Manifest: \`${report.binding.manifestSHA256}\`. Target revision: ${cell(report.binding.targetRevision)}.`, '',
    `URLs: ${report.coverage.urls.total}; retained ${report.coverage.urls.retained}, redirected ${report.coverage.urls.redirected}, removed ${report.coverage.urls.removed}, excluded ${report.coverage.urls.excluded}.`, '',
    `Checks: ${STATES.map(state => `${state} ${report.coverage.checks[state]}`).join(', ')}.`, '',
    ...(report.content ? [
      'Offline content reconciliation (counts only; no editorial values or entity IDs):', '',
      '| Inventory | Type | Locale | Status | Count |', '| --- | --- | --- | --- | --- |',
      ...['source', 'target', 'expectedTarget'].flatMap(side => report.content[side].map(c => `| ${side} | ${cell(c.entityType ?? 'unknown')} | ${cell(c.locale ?? 'unknown')} | ${cell(c.status ?? 'unknown')} | ${c.total} |`)), '',
      ...report.content.findings.map(f => `- ${f.state}: ${f.code} (${f.count}).`), '',
    ] : []),
    '| Check | Category | Required in scope | State | Reason |', '| --- | --- | --- | --- | --- |',
    ...report.checks.map(check => `| ${cell(check.id)} | ${check.category} | ${check.required ? 'yes' : 'no'} | ${check.status} | ${cell(check.reason)} |`), '',
    'This is a local report, not an automatic publication-safe summary. Review and sanitize URLs, identifiers and reasons before sharing.', '',
  ];
  return lines.join('\n');
}
