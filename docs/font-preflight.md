# Font sources before rendering

`npm run design:tokens` includes a read-only font-source preflight alongside the existing token, contrast and family-declaration checks. JSON evidence is under `fontLoading.preflight`. It applies to the root foundation and generated static profiles; it adds no runtime dependency, network request, browser requirement or environment-doctor dependency.

## Normal workflow

Use the four existing typography roles (`--font-display`, `--font-body`, `--font-accent`, `--font-mono`) for the selected direction. Roles may share a family, and system stacks are valid. Prefer WOFF2 for modern web delivery. Use lowercase names for new owned assets and consistent literal paths; preserve established names and package ownership. Do not rename files or convert source archives simply to satisfy a naming convention.

Declare local web faces with accurate family, weight/range, style and format, then run:

```powershell
npm.cmd run design:tokens -- --json
```

Inspect errors and advisories before token application or broad page assembly. The existing CLI validates the candidate before saving CSS or companion art-direction/calibration files. Fix the actual missing reference, case mismatch, malformed descriptor or incorrect font container rather than adding the family name to a package/configuration comment. Remote, package, system-installed and dynamic sources need their supported integration and browser verification; a source-only audit cannot fetch or certify them.

## Evidence and limits

The preflight follows bounded literal local CSS imports and checks referenced owned files without executing configuration. Local paths must resolve inside the inspected project, have exact directory/file casing and avoid links/junctions. The selected CSS source and import graph determine its scope; this is not a recursive archive or dependency-directory scan. Bare CSS filenames prefer an owned local file; a missing bare path naming a declared package remains advisory, using bounded static package metadata without scanning dependencies. Explicit `./` and public-URL references remain owned paths. Package imports and unsupported source expressions remain explicit advisories. Valid non-WOFF2 delivery formats receive advice rather than automatic conversion or a blanket failure.

Inspection is bounded at 64 CSS sources, 1 MiB aggregate CSS, 256 faces/assets and 32 MiB per font file, with additional limits on role expansion and diagnostics. A refusal is an error rather than a completed inspection. Only a small header is read from each font; an unsupported format still has its local path checked but remains unverified. Sources imported only through component styles, JavaScript, framework configuration or a build transform need their supported integration/browser evidence; the preflight does not execute those paths.

File signatures and bounded container-header observations establish format consistency, not complete font decoding, glyph coverage, licensing, internal family naming or selected variable axes. Declared weight/style validation describes the CSS contract. A matching family declaration and a valid container do not prove that a face actually rendered.

During native calibration, inspect the actual route's typography and failed requests after styles/fonts settle, including needed weights and non-ASCII text. The optional local `audit:page` reports sampled platform-font glyph use beside requested CSS; see [public-page evidence](page-performance.md). Verify canvas-specific substitutions separately and preserve the accepted production pairing. Do not require four distinct font families or treat an advisory as human acceptance.

For an accepted canvas change, follow the installed `site-art-direction/references/token-handoff.md`: explicit semantic mapping, read-only proposed changes, reviewed application and native rendered comparison. CSS owns implemented token values; neither a canvas export nor a preflight report is a second token store.
