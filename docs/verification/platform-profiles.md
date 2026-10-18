# Platform Profiles milestone verification

Local verification completed on 18 October 2026 using Windows and Node 24.21.0.
These results cover the shared design extraction, static generator, Sveltia overlay,
profile-specific workflows, skill routing and staged upstream synchronization.

| Verification | Result |
| --- | --- |
| Root `npm run verify` | 112 tests passed, zero failures; Astro: 40 files, zero errors/warnings/hints |
| Root `npm run build` | Passed; existing EmDash bundle-size warning remains |
| Root `npm run check:dev-tools` | Dev/fixture specimens passed; fixtures rejected for release; production GET/HEAD isolation passed |
| Generated `static` | Independent `npm install` followed by clean `npm ci`; verification, production build, fixture build and HTTP checks passed |
| Generated `static-sveltia` | Same independent verification passed; admin HTML/config preserved byte-for-byte in production output |
| Generated unit tests/typecheck | Static: 2 tests; Sveltia: 3 tests; each checked 26 Astro files with zero errors/warnings/hints |
| Static lockfile isolation | Both independent lockfiles contained zero EmDash, SQLite or libSQL packages; no server output or CMS specialist directory |
| Browser acceptance | Both profiles: home, post and fixture styleguide at 390/768/1440px; zero overflow, broken images or page errors; keyboard focus passed |
| Sveltia runtime | Pinned 0.248.0 bundle and config loaded; token sign-in offered; zero runtime errors |
| Update safety | Tests cover preserved local token edits, bounded skill membership, immutable upstream references, staged-byte/local-hash changes, traversal and symlinks |

Reproduce the automated profile checks from the Baseline root:

```sh
npm ci
npm run verify
npm run build
npm run check:dev-tools
npm run test:profiles
```

The last command independently generates, installs, clean-installs, checks and
builds both static profiles, including production/fixture HTTP verification. Root
GitHub Actions runs each generated profile in its own matrix job. Screenshots are
not run in CI. For optional local browser acceptance, retain the generated project
with `npm run test:profiles -- --profile static-sveltia --keep`, then run
`node tests/static-pilot.integration.mjs --root <generated-project> --browser`.

Local generated receipts identified a dirty source tree based on the preceding
commit and recorded exact assembled file hashes. They did not claim to be clean
release artifacts from that preceding revision. GitHub Actions on the milestone
commit provides the clean-checkout verification linked from Issue #5.

Credentialed Sveltia login/upload/publishing requires the destination repository,
OAuth proxy or PAT and real editor accounts; it was not certified by these local
checks. The existing EmDash Node/SQLite application remains supported; this work
does not certify a new Cloudflare deployment or enable EmDash profile generation.

A subsequent [authenticated Sveltia publishing pilot](../../audit/sveltia-pilot-2026-10-18-3496a2/README.md)
verified real GitHub token sign-in, draft/image commits, publication, optimized
images, draft exclusion, logout and failure protection on a disposable Cloudflare
Pages project. That rehearsal used explicit local Direct Upload promotion; OAuth
proxy sign-in, fine-grained PAT boundaries and automatic Git hosting integration
remain outside its scope. Read its setup findings before editor handoff.
The disposable deployment has since been retired; its historical acceptance
receipts remain available. See the [cleanup record](../../audit/rehearsal-cleanup-2026-10-18/README.md).

See [Platform Profiles](../platform-profiles.md),
[generation inventories](../../profiles/README.md) and
[staged Baseline updates](../baseline-updates.md).
