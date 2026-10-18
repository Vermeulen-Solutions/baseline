import { readFileSync } from 'node:fs';

export const PROFILE_IDS = Object.freeze(['static', 'static-sveltia', 'emdash']);
export const BASELINE_REPOSITORY = 'https://github.com/Vermeulen-Solutions/baseline';
// Exact historical identity of this repository, not an additional upstream.
export const BASELINE_PROVENANCE_REPOSITORIES = Object.freeze([BASELINE_REPOSITORY, 'https://github.com/Vermeulen-Solutions/emdash-baseline']);
const read = name => JSON.parse(readFileSync(new URL(`./manifests/${name}.json`, import.meta.url), 'utf8'));

/** Resolve inventories only. This does not scaffold, install, or convert a site. */
export function profileManifest(profile) {
  if (!PROFILE_IDS.includes(profile)) throw new Error(`Unknown Platform Profile: ${profile}`);
  const layers = [];
  const visit = (name, seen = new Set()) => {
    if (seen.has(name)) throw new Error('Cyclic profile inheritance');
    seen.add(name);
    const layer = read(name);
    if (layer.extends) visit(layer.extends, seen);
    layers.push(layer);
  };
  visit(profile);
  const unique = key => [...new Set(layers.flatMap(layer => layer[key] ?? []))];
  const result = { ...layers.at(-1), files: unique('files'), scripts: unique('scripts'), checks: unique('checks'), skills: unique('skills'), skillFiles: unique('skillFiles'), overrides: layers.flatMap(layer => layer.overrides ?? []), scriptOverrides: Object.assign({}, ...layers.map(layer => layer.scriptOverrides ?? {})), pending: layers.flatMap(layer => layer.pending ?? []) };
  result.packages = Object.fromEntries(['dependencies', 'devDependencies'].map(kind => [kind, [...new Set(layers.flatMap(layer => layer.packages?.[kind] ?? []))]]));
  return result;
}

const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const exact = (value, keys) => object(value) && Object.keys(value).length === keys.length && keys.every(key => Object.hasOwn(value, key));
const same = (actual, expected) => Array.isArray(actual) && actual.length === expected.length && new Set(actual).size === actual.length && actual.every(item => expected.includes(item));

/** Validate the versioned downstream baseline.config.json contract. No writes. */
export function validateProfileConfig(config) {
  if (!exact(config, ['schemaVersion', 'platformProfile', 'foundation', 'runtime', 'source', 'generatorVersion', 'features', 'checks', 'skills'])) throw new Error('Invalid profile configuration fields');
  if (config.schemaVersion !== 1) throw new Error('Unsupported profile configuration version');
  const manifest = profileManifest(config.platformProfile);
  if (config.foundation !== manifest.foundation || !manifest.runtimes.includes(config.runtime)) throw new Error('Profile/foundation/runtime mismatch');
  if (!exact(config.source, ['repository', 'commit', 'release']) || !BASELINE_PROVENANCE_REPOSITORIES.includes(config.source.repository) || !/^[a-f0-9]{40}$/.test(config.source.commit) || (config.source.release !== null && (typeof config.source.release !== 'string' || !/^[A-Za-z0-9][A-Za-z0-9._-]{0,79}$/.test(config.source.release)))) throw new Error('Invalid immutable Baseline provenance');
  if (typeof config.generatorVersion !== 'string' || !/^\d+\.\d+\.\d+(?:-[A-Za-z0-9.-]+)?$/.test(config.generatorVersion)) throw new Error('Invalid generator version');
  if (!Array.isArray(config.features) || new Set(config.features).size !== config.features.length || config.features.some(feature => !manifest.features.includes(feature))) throw new Error('Unsupported profile feature');
  if (!same(config.checks, manifest.checks) || !same(config.skills, manifest.skills)) throw new Error('Profile checks/skills must match the selected manifest');
  return config;
}

/** Package versions come from the canonical root package.json, never a second pin. */
export function profilePackages(profile, canonicalPackage) {
  const manifest = profileManifest(profile);
  return Object.fromEntries(['dependencies', 'devDependencies'].map(kind => [kind, Object.fromEntries(manifest.packages[kind].map(name => {
    const version = canonicalPackage[kind]?.[name];
    if (typeof version !== 'string') throw new Error(`Missing canonical ${kind}: ${name}`);
    return [name, version];
  }))]));
}
