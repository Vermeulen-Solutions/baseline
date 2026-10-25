# Default design-package retirement — 25 October 2026

This focused maintenance change removes `@google/design.md` from the root and
all profile manifests, retires the local lint/export bridge and its dedicated
tests, and updates maintained skill/document guidance. `DESIGN.md` remains
optional reference material. CSS tokens, the Art Direction Record gate, native
token checks and rendered calibration retain their existing roles. No replacement
token framework or canonical token file is introduced.

The root lockfile loses 59 package entries, adds none and changes no remaining
package versions. The existing neutral exchange specimen and prior dependency
audit receipts are preserved as historical evidence. Existing installations need
the [explicit adoption steps](../../docs/baseline-updates.md#retiring-the-default-designmd-package);
bounded sync does not remove packages, commands or retired managed paths.

## Executed verification

Windows, Node 24.21.0, npm 10.5.0; uncommitted working-tree changes against the
base commit and LF-normalized source hashes recorded in `verification.json`.

| Check | Result |
| --- | --- |
| `npm.cmd run doctor` | Passed; Windows launcher reminder only |
| `npm.cmd run setup:hooks` | Local supplemental hook installed |
| `npm.cmd ci --no-audit --no-fund` | Passed with the revised checked-in lockfile |
| `npm.cmd run verify:fast` | Final run passed, 181 unit tests |
| `npm.cmd run test:design` | Passed, 33 tests; retired suite removed from the command |
| `npm.cmd run verify` | Passed, 317 tests across unit/rehearsal tiers; 53 Astro files, zero diagnostics |
| `npm.cmd run build` | Passed; existing large-chunk warning remains |
| `npm.cmd run audit:html` | Passed, 9 HTML files and 10 captured public SSR responses |
| `npm.cmd run test:profiles -- --keep` | Both static profiles independently generated, installed, clean-installed, verified, built and HTTP-checked; production/fixture isolation and native images passed |
| Fresh `npm.cmd audit --json` | Root exits 1: six high affected-package entries through EmDash/Zod; both static profiles exit 0 with zero findings |
| `git diff --check` | Passed |

The profile rehearsal includes an optional prose `DESIGN.md` and asserts that
independent lockfiles omit Google's design package and generated projects omit
the retired bridge. Manifest regression coverage checks all three profiles and
preserves the native design/art-direction checks.

The first fast run exposed a replay source-freeze bug: reading a deleted tracked
file threw `ENOENT`. Source input maps now record deletions as `null`, matching
the existing site-source preservation map. Regression coverage retains private
input exclusions and confirms restoration changes the frozen map. The final
fast and full runs passed after that fix; no check or timeout was weakened.

This verifies local tooling and HTTP behavior. It does not certify production
security, browser appearance, authenticated editing or a hosting provider. No
presentation sources, calibrated tokens, client content or databases were changed.
EmDash's independent Zod findings remain unresolved; raw audit reports are saved
alongside this record. Automatic approval review rejected deletion of the owned
temporary generated projects with "blocked by policy", so they remain in place.
Their location is in the ignored local verification log at
`.emdash/checks/design-retirement-profiles.log`; their lockfile/provenance
summaries and audit results are saved here.
