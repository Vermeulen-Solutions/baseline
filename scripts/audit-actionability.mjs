/** Classification is guidance, never authorization or proof of recipe eligibility. */
export function ruleActionability(rule) {
  if (rule.status === 'unverified') return 'verification_required';
  if (rule.id === 'schema-prebuild' && rule.remediation === 'schema-budget-prebuild@1') return 'bounded_recipe';
  if (rule.id.startsWith('design-system:')) return 'design_judgment';
  if (rule.id === 'physical-schema' && rule.status === 'fail') return 'review_required';
  if (['physical-schema', 'route-capture-evidence', 'editor-save-reload', 'visual-accessibility', 'upstream-currency'].includes(rule.id)) return 'verification_required';
  return 'review_required';
}

export function tokenDiagnostics(report) {
  return [
    ...report.errors.map((message, index) => ({ id: `token-check:${index + 1}`, status: 'fail', actionability: 'review_required', message })),
    ...report.fluid.tokens.flatMap(token => token.advisories.map(message => ({ id: `fluid:${token.name}`, status: 'advisory', actionability: 'design_judgment', message }))),
  ];
}
