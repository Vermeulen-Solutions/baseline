import fs from 'node:fs';
const schema = JSON.parse(fs.readFileSync(new URL('../standards/site-audit-report.schema.json', import.meta.url), 'utf8'));
function checkVocabulary(rule) {
  const supported = ['$schema', '$id', 'title', '$defs', '$ref', 'type', 'const', 'enum', 'pattern', 'minimum', 'minItems', 'required', 'properties', 'additionalProperties', 'items'];
  if (Object.keys(rule).some(key => !supported.includes(key))) throw Error('Unsupported report schema keyword');
  for (const child of Object.values(rule.properties ?? {})) checkVocabulary(child);
  for (const child of Object.values(rule.$defs ?? {})) checkVocabulary(child);
  if (rule.items) checkVocabulary(rule.items);
}
checkVocabulary(schema);
const kind = value => value === null ? 'null' : Array.isArray(value) ? 'array' : typeof value === 'number' && Number.isInteger(value) ? 'integer' : typeof value;

/** Validator for the deliberately bounded schema vocabulary in the shipped report contract. */
export function validateReport(report) {
  const errors = [];
  function check(rule, value, at) {
    if (rule.$ref) return check(schema.$defs[rule.$ref.replace('#/$defs/', '')], value, at);
    if (Object.hasOwn(rule, 'const') && value !== rule.const) errors.push(at + ': const');
    if (rule.enum && !rule.enum.includes(value)) errors.push(at + ': enum');
    const type = kind(value);
    if (rule.type && ![rule.type].flat().includes(type)) { errors.push(at + ': type'); return; }
    if (type === 'string' && rule.pattern && !new RegExp(rule.pattern).test(value)) errors.push(at + ': pattern');
    if (type === 'integer' && rule.minimum !== undefined && value < rule.minimum) errors.push(at + ': minimum');
    if (type === 'array') { if (value.length < (rule.minItems ?? 0)) errors.push(at + ': minItems'); if (rule.items) value.forEach((item, i) => check(rule.items, item, `${at}/${i}`)); }
    if (type === 'object') {
      for (const key of rule.required ?? []) if (!Object.hasOwn(value, key)) errors.push(`${at}/${key}: required`);
      for (const [key, item] of Object.entries(value)) { if (Object.hasOwn(rule.properties ?? {}, key)) check(rule.properties[key], item, at + '/' + key); else if (rule.additionalProperties === false) errors.push(at + ': unknown property'); }
    }
  }
  // Reject non-JSON values even inside the flexible observed-facts object.
  const seen = new Set();
  function json(value, depth = 0) {
    if (depth > 30 || typeof value === 'number' && !Number.isFinite(value) || ['undefined', 'function', 'symbol', 'bigint'].includes(typeof value)) throw Error('Invalid JSON report');
    if (value && typeof value === 'object') { if (seen.has(value)) throw Error('Cyclic report'); seen.add(value); Object.values(value).forEach(child => json(child, depth + 1)); seen.delete(value); }
  }
  try { json(report); check(schema, report, '#'); } catch { errors.push('#: invalid report structure'); }
  if (Array.isArray(report?.rules)) {
    if (new Set(report.rules.map(rule => rule?.id)).size !== report.rules.length) errors.push('#/rules: duplicate IDs');
    for (const status of ['pass', 'fail', 'warning', 'unverified', 'not-applicable']) if (report.summary?.[status] !== report.rules.filter(rule => rule?.status === status).length) errors.push('#/summary: inconsistent counts');
  }
  return errors;
}
export function assertReport(report) { if (validateReport(report).length) throw Error('Audit report does not match schema v2'); return report; }
