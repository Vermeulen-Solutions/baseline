# Inspecting CMS client bundles

The EmDash foundation includes an opt-in local analysis command:

```sh
npm run build:analyze
```

It runs the normal release build, including release-artifact validation, then
writes ignored `.emdash/checks/client-bundles.json`. The report lists minified JS
bytes, per-chunk gzip estimates, static/dynamic imports, package ownership and
the inline editor/admin static import closures. Shared imports are counted once
per closure. CSS, dynamic imports, HTTP headers/cache and actual browser transfer
are excluded; this is build evidence, not a network performance score.

## Icon import boundary

The installed admin supports dynamic icon names and therefore retains the full
icon catalog. Named imports from the same package barrel previously pulled
that catalog into the inline editor's static graph too. The build transform in
`scripts/client-bundles.mjs` resolves the package from each importer, reads its
actual exports, and maps known named icons to its public `dist/csr/*` export
subpaths. Original components, aliases and ref/context behavior are retained.
Dependency files are never patched. Namespace/dynamic imports and unknown or
type-only exports are preserved, including custom admin icon resolution.

The `icon-vendor` group separates icon ownership by entry and bounds its leaf
chunks. Do not substitute a generic vendor group or split ProseMirror by size;
the editor's cyclic dependency initialization must remain intact. React and
PhotoSwipe keep their existing groups. No warning threshold is raised.

When upgrading the CMS, icon package or bundler:

1. Run `npm run build:analyze` and compare the editor/admin closures with the
   previous receipt. Unsupported icon export layouts keep original imports,
   so lost optimization is visible as increased size rather than changed icons.
2. Run the named-import/graph regression tests and normal verification.
3. On local Windows, run `node tests/visual/editor-rehearsal.mjs` to check actual
   built editor selection, typing, blur-save, reload, publish and anonymous output.
   Also exercise admin navigation and configured custom icons; attribute checks
   cannot prove hydration or dependency initialization.

The upstream prebuilt admin remains large and its build advisory remains
visible. Reducing that package's internal feature boundaries is an upstream
change, not something a baseline vendor split can safely accomplish. Static
profiles have no EmDash/React/icon dependency or CMS bundle configuration.
