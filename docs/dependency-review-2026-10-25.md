# Dependency advisory review — 25 October 2026

Issue [#12](https://github.com/Vermeulen-Solutions/baseline/issues/12) follows the fresh-install findings from the static onboarding exercise. This review covers the root EmDash Node/SQLite application and independently installed `static` and `static-sveltia` projects. It does not certify production exposure or security.

## Subsequent design-package retirement

This review records the earlier compatible dependency remediation and its audit results. The subsequent focused maintenance change removes `@google/design.md` and its bridge from the default installation instead of waiting for an upstream release. See [existing-site adoption](baseline-updates.md#retiring-the-default-designmd-package). The original receipts remain historical evidence; EmDash's separate Zod path is not resolved by removing the design tool.

## Compatible changes

| Package | Before → after | Dependency path and decision |
| --- | --- | --- |
| sharp | 0.35.4 → 0.35.5 | Update the canonical development pin and lockfile, including optional platform binaries and libvips 1.3.4 packages. Astro uses the same deduplicated version. Both generated profiles inherit the pin. |
| body-parser | 2.3.0 → 2.4.0 | Root lockfile only: EmDash → MCP SDK → Express 5.3.0 → `body-parser: ^2.3.0`; the patch satisfies the existing range. |
| fast-uri | 3.1.8 → 3.1.9 | Root lockfile only: EmDash → MCP SDK → AJV 8.20.0 → `fast-uri: ^3.0.1`; the patch satisfies the existing range. |

The [Sharp advisory](https://github.com/advisories/GHSA-wq5f-xc86-pv6w) describes librsvg impact under particular glibc Linux runtime conditions. Sharp also processes build-time images and live CMS media; its development dependency classification does not prove absence from runtime image processing. The Windows checks below verify functionality, without reproducing the vulnerability or certifying Linux binaries.

The [body-parser advisory](https://github.com/advisories/GHSA-27r3-jxmh-p828) covers compressed-request decompression errors. The installed EmDash MCP endpoint uses the SDK's Web Standard transport and checks authentication; it does not use the SDK's Express server adapter. This source observation is not a general reachability proof for every installed module or deployment.

[fast-uri advisories](https://github.com/fastify/fast-uri/security/advisories) cover scheme and path/host normalization. AJV uses fast-uri for schema references; the SDK includes AJV validation. Updating the compatible package avoids retaining the known affected version without claiming a demonstrated site exploit.

Only these packages and Sharp's platform packages changed versions. No framework, CMS, schema, route, client token or content changes are included. No audit force fix, dependency override or advisory suppression is used.

The tooling checks also reproduced an existing `design:export` failure: CommonJS `require.resolve()` cannot select this package's import-only export. The shared bridge now uses `import.meta.resolve()` and converts the resulting file URL to a native path before invoking Node. A CLI regression test checks exported color and alias values. Existing generated sites may adopt this shared script through reviewed Baseline synchronization independently of the package bump.

## Unresolved Zod paths

The [Zod advisory](https://github.com/advisories/GHSA-mrhx-c7xc-m3w5) identifies versions below 4.6.6. Installed Astro already resolves 4.6.7. Two separate paths remain:

- **EmDash runtime:** `emdash@1.3.0`, `@emdash-cms/auth@1.3.0` and `@emdash-cms/plugin-types@0.6.0` pin Zod **4.5.4 exactly**. Registry review of the latest EmDash/auth 1.3.1 and plugin-types 0.6.0 found the same pin. Zod validates OAuth/API/MCP and plugin data as well as local configuration; this is not solely development tooling. A lockfile refresh cannot satisfy an exact pin with 4.6.7. A scoped override would depart from the upstream contract and requires separate validation of those APIs; this review does not apply one.
- **Optional local design tooling:** latest `@google/design.md@0.4.0` declares `zod: ^3.24.0`, resolving 3.25.76. Both published CLI and linter JavaScript additionally contain bundled Zod 3.25.76. Overriding the installed dependency would neither preserve the declared major nor remove the bundled implementation. The bridge processes local DESIGN.md files; review imported files before invoking it and do not expose the CLI as a public validation service. This operational limit does not remove or resolve the advisory.

Keep #12 open for upstream-compatible Zod remediation. These updates reduce known findings but do not approve a new production launch or establish that EmDash request validation is protected against oversized constrained collections. For a deployed instance, review applicable request limits and access boundaries before accepting the remaining risk. Static output has no server validator, but its build tools still retain the design-package advisory.

## Reproduction and adoption

Use Windows PowerShell with Node 24.21.0 and npm 10.5.0:

```powershell
npm.cmd run doctor
npm.cmd ci
npm.cmd audit --json
npm.cmd ls sharp zod @google/design.md body-parser fast-uri --all
```

The before root was clean `a2df5c86df9883c37c669f7e2e490f686bd8b0fe`. Fresh projects were generated separately for each profile, installed with their own npm lockfiles and audited before and after the change; no root node_modules or lockfile was shared. Audit counts are affected-package counts, including dependent packages, rather than independent vulnerability counts:

| Install | Before | After |
| --- | --- | --- |
| Root | 9 high, 1 moderate | 7 high, all through the remaining Zod paths |
| static | 3 high | 2 high: Zod and @google/design.md |
| static-sveltia | 3 high | 2 high: Zod and @google/design.md |

Audit data and registry tags can change. Saved results and dependency paths live in [the review evidence](../audit/dependency-review-2026-10-25/).

New generated sites inherit the Sharp pin from root package.json. Existing sites need a separate package/lockfile review: `sync:baseline` does not update dependencies. In an existing static site, update Sharp to 0.35.5 with npm, review its own lockfile, then run its installed verification/build/dev-tool checks. Root/template users adopt both package.json and package-lock.json and use npm ci. Do not copy the EmDash lockfile or add its dependencies to static sites.

## Verification

All final functional checks passed on Windows with the source hashes in the saved evidence:

- Doctor (shell-launcher observability warning only) and clean root `npm ci`.
- `verify:fast`: 182 tests; full `verify`: 182 unit and 136 rehearsal tests, followed by Astro diagnostics on 53 files with zero errors/warnings/hints.
- Fresh `build`, then `audit:html`: 9 HTML documents and 10 public SSR responses. The existing bundle-size advisory remains.
- `check:native-images`: responsive WebP sizes, original/small image behavior, unapproved remote rejection and storage media added after the Node build.
- `design:check` with the neutral mapping, corrected CSS export and its CLI regression test; the full suite also checks invalid design values/references.
- `check:dev-tools`: development/fixture behavior, fixture release rejection and production GET/HEAD isolation, including dependency-local Zod resolution.
- `test:profiles`: independent install and clean npm ci for both profiles; 39 static / 40 Sveltia tests, zero Astro diagnostics, production/fixture builds, image/draft/metadata HTTP checks and zero CMS/database packages.

Initial attempts are retained in the verification receipt. The first fast run overlapped the native-image fixture and rejected its temporary source route; the final fast run passed after cleanup. The first full verification overlapped independent profile installation and exceeded the HTML unit test's one-second budget (1163ms). After those jobs finished, the unchanged test passed at about 301ms in a complete rerun; its limit was not relaxed. CSS export initially failed before the ES-module resolution fix described above.

The final root `npm audit` still exits **1**, and both static audit reports retain their high findings. Functional checks do not convert these to a clean security audit. No new browser/editor/provider or Linux runtime acceptance is claimed.
