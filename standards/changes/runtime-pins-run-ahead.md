---
bump: none
---

# Baseline's runtime pins may run ahead of its last release

Between releases, Baseline may now pin newer certified runtime versions (Astro, its adapters, React) than its last release, as long as a pending change note names each exact version in a new `packages:` field. Renovate's notes write that field. The next release certifies the pins, and `standards:release` refuses a manifest that does not match them. The importer rehearsal checks the installed Astro against the pin instead of a fixed version. Sites are still audited against released versions and take runtime updates with the release, so they have nothing to do.
