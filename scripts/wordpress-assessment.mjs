import { analyzeElementor, readElementorKit } from './wordpress-elementor.mjs';
import fs from 'node:fs';
import path from 'node:path';
import { readBundle, readBytes, privateDirectory, writeBundle, jsonBytes, fact } from './wordpress-io.mjs';
import { plainText } from './wordpress-markdown.mjs';

const count = values => Object.fromEntries([...new Set(values)].sort().map(value => [value, values.filter(item => item === value).length]));
const cell = value => String(value ?? '').replace(/[\r\n|]/g, ' ');
export function assessSnapshot(snapshot, { profile = 'emdash', plan = null, captureSHA256 = null, designKit = { status: 'not-supplied', reason: null } } = {}) {
  const mediaById = new Map(snapshot.media.map(item => [item.id, item]));
  const records = snapshot.records.map(record => {
    const builder = analyzeElementor(record), route = plan?.routes?.find(item => item.key === record.key), excluded = plan?.exclusions?.find(item => item.key === record.key), referenceOnly = record.type === 'elementor_library';
    if (builder) builder.media = builder.media.map(reference => {
      const match = mediaById.get(reference.id) ?? snapshot.media.find(item => item.url === reference.url);
      return { ...reference, capturedId: match?.id ?? null, capturedFile: match?.file ?? null, needsURLReview: Boolean(match && reference.url && match.url !== reference.url) };
    });
    const taxonomies = Object.entries(record.taxonomies ?? {}).filter(([, terms]) => Array.isArray(terms) && terms.length).map(([name, terms]) => ({ name, terms }));
    const fields = [
      { name: 'body', disposition: builder?.requiresRecovery ? 'needs-conversion' : 'candidate', reason: builder?.requiresRecovery ? 'Elementor copy/assets are missing from saved post HTML or builder data is unavailable; review candidateHTML.' : 'Semantic HTML is eligible for conversion; rendered acceptance remains required.' },
      ...(builder && (builder.unsupported.length || builder.dynamic.length || builder.templateReferences.length) ? [{ name: 'builder-behavior', disposition: 'needs-conversion', reason: 'Unknown/dynamic widgets and referenced templates require deliberate native replacements; captured HTML alone does not recreate their behavior.' }] : []),
      ...(!['post', 'page', 'elementor_library'].includes(record.type) ? [{ name: 'content-model', disposition: 'needs-conversion', reason: 'Review this custom post type as a repeatable content candidate before choosing collections and routes.' }] : []),
      ...(taxonomies.length ? [{ name: 'taxonomies', disposition: profile === 'emdash' ? 'needs-native-mapping' : 'needs-conversion', reason: 'Assignments remain in the source capture; static Markdown does not yet model categories/tags.' }] : []),
      ...(Object.keys(record.meta ?? {}).length || record.acf ? [{ name: 'custom-fields', disposition: 'retained-private', reason: 'Raw meta/ACF values are captured; required business fields need explicit target models and mapping.' }] : []),
      ...(record.locale ? [{ name: 'translations', disposition: 'needs-review', reason: 'Configure and verify language routes, translation groups and navigation.' }] : []),
    ];
    return { key: record.key, title: plainText(record.title), type: record.type, status: record.status, locale: record.locale ?? null, sourceURL: record.permalink, targetPath: route?.path ?? null,
      disposition: referenceOnly ? 'reference-only' : excluded ? 'excluded' : record.status !== 'publish' ? 'retained-private' : route ? 'planned' : fields.some(field => field.disposition === 'needs-conversion' || field.disposition === 'needs-native-mapping') ? 'needs-conversion' : 'candidate',
      reason: excluded?.reason ?? (referenceOnly ? 'Elementor templates/settings are reference evidence for reconstruction, not ordinary public pages.' : record.status !== 'publish' ? 'Unpublished source content remains private until deliberately recovered.' : null),
      bodyCharacters: plainText(record.html).length, fields, taxonomies, customMetaKeys: Object.keys(record.meta ?? {}), acfKeys: record.acf && typeof record.acf === 'object' ? Object.keys(record.acf) : [], elementor: builder };
  });
  return { version: 1, captureSHA256, source: snapshot.source, profile, captureComplete: snapshot.complete === true, sourceCoverage: snapshot.sourceCoverage ?? null, sourceExclusions: snapshot.sourceExclusions ?? [], captureFailures: snapshot.failures ?? [], designKit, records,
    summary: { records: records.length, byType: count(records.map(record => record.type)), byStatus: count(records.map(record => record.status)), byDisposition: count(records.map(record => record.disposition)), elementorPages: records.filter(record => record.elementor && record.type !== 'elementor_library').length, elementorTemplates: records.filter(record => record.type === 'elementor_library').length, contentRecovery: records.filter(record => record.elementor?.requiresRecovery && record.type !== 'elementor_library').length, media: snapshot.media.length, unavailableMedia: snapshot.media.filter(item => !item.file).length },
    media: snapshot.media.map(item => ({ id: item.id, sourceURL: item.url, disposition: item.file ? 'captured-private' : 'unavailable', plannedTarget: plan?.assets?.find(asset => asset.id === item.id)?.target ?? null })),
    siteData: Object.keys(snapshot.extras ?? {}).map(name => ({ name, disposition: 'retained-private', reason: 'Native EmDash import or deliberate static reconstruction; capture does not implement site behavior.' })),
    scope: 'Source assessment and proposed outcomes only. Planned files are not evidence of imported content, working interactions or complete migration acceptance.' };
}
export function assessmentMarkdown(report) {
  const lines = ['# WordPress source assessment', '', report.scope, '', 'Capture: `' + report.captureSHA256 + '`', '', 'Elementor kit: ' + report.designKit.status + (report.designKit.reason ? ' — ' + cell(report.designKit.reason) : ''), '', '| Source record | Type/status | Outcome | Target |', '| --- | --- | --- | --- |'];
  if (!report.captureComplete) lines.splice(4, 0, 'Capture is INCOMPLETE. Planning/application and final acceptance are refused until source coverage and failed media are resolved.', '');
  for (const exclusion of report.sourceExclusions) lines.splice(4, 0, 'Deferred source type: ' + cell(exclusion.type) + ' (' + exclusion.analyzed + ' analyzed records). ' + cell(exclusion.reason), '');
  for (const record of report.records) lines.push('| ' + cell(record.key + ' — ' + record.title) + ' | ' + cell(record.type + '/' + record.status) + ' | ' + record.disposition + ' | ' + cell(record.targetPath) + ' |');
  for (const record of report.records.filter(item => item.fields.length || item.elementor)) {
    lines.push('', '## ' + cell(record.key), '');
    for (const field of record.fields) lines.push('- ' + field.name + ': ' + field.disposition + '. ' + field.reason);
    if (record.elementor) {
      lines.push('- Elementor data: ' + record.elementor.data + '; widgets: ' + cell(JSON.stringify(record.elementor.widgets)) + '; missing copy nodes: ' + (record.elementor.missingCopy?.length ?? 'unknown') + '; unmatched inline media references: ' + (record.elementor.missingMedia?.length ?? 'unknown') + '. Candidate copy, media and responsive/global references are in assessment.json.');
      if (record.elementor.unsupported.length) lines.push('- Widgets requiring deliberate replacement/review: ' + cell([...new Set(record.elementor.unsupported.map(item => item.widget))].join(', ')) + '.');
      if (record.elementor.dynamic.length || record.elementor.templateReferences.length) lines.push('- Dynamic field owners: ' + record.elementor.dynamic.length + '; template references: ' + record.elementor.templateReferences.length + '. Resolve against source configuration before rebuilding.');
    }
  }
  lines.push('', 'Media: ' + report.summary.media + ' catalog entries, ' + report.summary.unavailableMedia + ' unavailable. Captured files stay private unless deliberately selected for output.', '');
  return lines.join('\n');
}

export function assessWordPress({ capture, out, root = process.cwd(), kit, kitDecision, reason, stage }) {
  const source = readBundle(capture, 'baseline-wordpress-capture'), snapshot = JSON.parse(source.files.get('snapshot.json'));
  fact(snapshot.version === 1 && Array.isArray(snapshot.records) && Array.isArray(snapshot.media), 'Unsupported source snapshot');
  fact(!kitDecision || ['supplied', 'skipped', 'unavailable'].includes(kitDecision), 'Kit decision must be supplied, skipped or unavailable');
  fact(!kit || !kitDecision || kitDecision === 'supplied', 'A supplied kit contradicts the kit decision');
  fact(kit || kitDecision !== 'supplied', 'Supplied kit decision needs --kit');
  fact(!['skipped', 'unavailable'].includes(kitDecision) || typeof reason === 'string' && reason.trim().length >= 5, 'Record a concrete reason for skipping or unavailable kit evidence');
  let plan = null;
  if (stage) { const bundle = readBundle(stage, 'baseline-wordpress-static-plan'); plan = JSON.parse(bundle.files.get('plan.json')); fact(plan.captureSHA256 === source.sha256, 'Assessment plan and capture differ'); }
  const files = new Map(), reference = kit ? readElementorKit(kit) : null;
  if (reference) files.set('kit/source' + reference.extension, reference.bytes);
  const designKit = { status: reference ? 'supplied' : kitDecision ?? 'not-supplied', reason: reason ?? null, ...(reference ? { analysis: reference.analysis } : {}) };
  const config = path.join(root, 'baseline.config.json');
  const profile = plan?.profile ?? (fs.existsSync(config) ? JSON.parse(readBytes(config)).platformProfile : 'emdash');
  const report = assessSnapshot(snapshot, { captureSHA256: source.sha256, profile, plan, designKit });
  const data = jsonBytes(report); fact(data.length <= 16 * 1024 * 1024, 'Assessment exceeds the document bound; use a smaller reviewed source/reference scope');
  files.set('assessment.json', data); files.set('report.md', assessmentMarkdown(report));
  const directory = privateDirectory(out, root), receipt = writeBundle(directory, files, 'baseline-wordpress-assessment');
  return { directory, sha256: receipt.sha256, summary: report.summary, exitCode: 0 };
}

export function assessmentReference(directory, captureSHA256) {
  if (!directory) return null;
  const bundle = readBundle(directory, 'baseline-wordpress-assessment'), report = JSON.parse(bundle.files.get('assessment.json'));
  fact(report.version === 1 && report.captureSHA256 === captureSHA256, 'Assessment belongs to another capture');
  return { sha256: bundle.sha256, designKit: report.designKit };
}
