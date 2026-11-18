// Files Baseline has retired, with the commit that retired them and how to remove them from a site
// (found in a site that still mounted the development Tweaks panel a month after its removal:
// the component only rendered on the dev server, but it showed up in every local capture and
// audit). Bounded sync never deletes files, so an older site keeps them until someone removes them.
// `update:plan` reports them for any site regardless of --since, and `doctor` warns about them.
//
// Each entry: commit (short SHA), date, title, paths (files that should no longer exist), mounts
// (a file and the text that shows the retired code is still wired in), dependencies (package
// names), and removal (what to do). A package script whose command names a retired path is
// reported too. Add an entry whenever a commit deletes a file that generated or copied sites have.
import { existsSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';

export const RETIRED = Object.freeze([
  {
    commit: 'adc6c203',
    date: '2026-10-17',
    title: 'Development Tweaks panel (Dev HUD)',
    paths: [
      'src/components/TweaksBar.astro',
      'src/utils/clipboard.mjs',
      'src/utils/design-tweaks.mjs',
      'src/utils/emdash-ownership.mjs',
      'src/utils/grid-guide.ts',
      'src/utils/ownership-inspector.ts',
      'src/utils/reference-image.mjs',
      'src/utils/reference-overlay.ts',
      'src/utils/token-catalog.generated.mjs',
      'scripts/check-token-calibration.mjs',
      'scripts/generate-token-catalog.mjs',
      'scripts/token-catalog-overrides.mjs',
      'playwright.dev-tools.config.mjs',
      'tests/clipboard.test.mjs',
      'tests/dev-hud.test.mjs',
      'tests/token-calibration.test.mjs',
      'tests/dev-tools/hud.spec.mjs',
      'tests/dev-tools/setup.mjs',
      'docs/dev-hud.md',
      'docs/images/design-tweaks.png',
      'docs/images/grid-guide.jpg',
      'docs/images/ownership-inspector.png',
      'docs/images/reference-overlay.png',
    ],
    mounts: [
      { file: 'src/layouts/Base.astro', text: 'TweaksBar' },
      { file: 'src/components/dev/Styleguide.astro', text: 'TweaksBar' },
    ],
    dependencies: [],
    removal: 'Delete the files, the TweaksBar import and its {import.meta.env.DEV && <TweaksBar />} mount in each file listed, and the package scripts that run them (tokens:generate, check:token-calibration, test:dev-hud) with their test-tier entries. npm run design:tokens replaces the token catalog; keep check:dev-tools.',
  },
  {
    commit: 'a124d860',
    date: '2026-10-20',
    title: 'StructuredData component',
    paths: ['src/components/StructuredData.astro'],
    mounts: [{ file: 'src/layouts/Base.astro', text: 'StructuredData' }],
    dependencies: [],
    removal: 'JSON-LD moved to the baseline-metadata plugin (src/plugins/baseline-metadata); a site with both emits its graphs twice. Once the site has adopted the plugin, delete the component and its import and mount in Base.astro. A site that has not adopted the plugin keeps the component until it does.',
  },
  {
    commit: '0be2eb28',
    date: '2026-10-25',
    title: 'DESIGN.md bridge (design:check, design:export)',
    paths: ['scripts/design-interchange.mjs', 'tests/design-interchange.test.mjs'],
    mounts: [],
    dependencies: ['@google/design.md'],
    removal: 'Follow "Retiring the default DESIGN.md package" in docs/baseline-updates.md: uninstall the package, remove design:check, design:export, the script and its test. Keep any site-owned DESIGN.md references.',
  },
  {
    commit: '0f970fc',
    date: '2026-11-18',
    title: 'PROJECT.example.md (one brief: PRODUCT.md)',
    paths: ['PROJECT.example.md'],
    mounts: [],
    dependencies: [],
    removal: 'Delete PROJECT.example.md; PRODUCT.example.md replaces it. A filled PROJECT.md is not retired automatically: merge it into PRODUCT.md following "One brief" in docs/project-context.md, then delete it and update the link in AGENTS.md.',
  },
]);

const readText = file => { try { return statSync(file).isFile() ? readFileSync(file, 'utf8') : null; } catch { return null; } };

// Everything retired that a site still has: files, mounts, package scripts and dependencies.
// Read-only. Returns [{ commit, title, kind, path, note }] in list order.
export function findRetired(site, retired = RETIRED) {
  const found = [];
  let pkg = null;
  try { pkg = JSON.parse(readText(path.join(site, 'package.json')) ?? 'null'); } catch {}
  for (const entry of retired) {
    const add = (kind, where, note) => found.push({ commit: entry.commit, title: entry.title, kind, path: where, note });
    for (const file of entry.paths) if (existsSync(path.join(site, file))) add('file', file);
    for (const { file, text } of entry.mounts) if (readText(path.join(site, file))?.includes(text)) add('mount', file, `still refers to ${text}`);
    for (const [name, command] of Object.entries(pkg?.scripts ?? {})) {
      const named = entry.paths.find(file => String(command).includes(file));
      if (named) add('script', 'package.json', `script "${name}" runs ${named}`);
    }
    for (const dep of entry.dependencies) if (pkg?.dependencies?.[dep] || pkg?.devDependencies?.[dep]) add('dependency', 'package.json', `depends on ${dep}`);
  }
  return found;
}

export const removalFor = commit => RETIRED.find(entry => entry.commit === commit)?.removal ?? '';
