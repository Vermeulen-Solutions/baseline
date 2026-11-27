// Where standards change notes live and which repository paths reach sites.
//
// Node built-ins only: scripts/dependency-note.mjs imports this inside Renovate's own clone, where
// node_modules is not installed. scripts/standards-changes.mjs re-exports both names.

export const CHANGES_DIR = 'standards/changes';

// Paths whose changes reach sites: distributed source, skills, tools, profiles, dependencies and
// guidance. Tests, audit evidence, plans, CI and the notes themselves do not.
const SHIPPED = [/^\.agents\/skills\//, /^src\//, /^scripts\//, /^profiles\//, /^seed\//, /^public\//, /^docs\/(?!plans\/)/, /^package(-lock)?\.json$/, /^astro\.config\.mjs$/, /^AGENTS\.md$/, /^\.emdash\/(upstream-skills|impeccable-source|site-skills)\.json$/];
export const isShipped = file => SHIPPED.some(rule => rule.test(file));
