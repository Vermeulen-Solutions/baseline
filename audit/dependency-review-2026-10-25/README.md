# Dependency review evidence

Read the [review and adoption notes](../../docs/dependency-review-2026-10-25.md)
for decisions, unresolved Zod paths and validation limits.

- `*-audit-before.json` and `*-audit-after.json` retain npm's reports for the
  root and independently installed static profiles. Dependent-package findings
  remain visible; a reduced count is not a security certification.
- `dependency-summary.json` retains selected resolved dependency paths, the
  clean starting revision, environment and LF-normalized SHA-256 hashes of the
  changed package, lockfile, bridge and regression test.
- `registry-review.json` retains the queried upstream dependency pins and hashes
  of the published design CLI/linter files containing bundled Zod 3.25.76.
- `native-images.json` records actual development and built Node HTTP checks,
  decoded responsive WebP dimensions and rejection of unapproved remote images.
  Built Node additionally served CMS storage media uploaded after build. The
  existing historical image receipt was preserved separately.
- `verification.json` records command outcomes, including initial failures and
  the final reruns. Local complete logs remain ignored under `.emdash/checks/`.

Both audit phases generated each static profile into an owned temporary root,
installed its own dependencies/lockfile, captured audit/tree results and removed
that root in a guarded finally block. The separate normal `test:profiles` run
also clean-installed, verified, built and HTTP-tested both profiles before
removing its fixtures. No CMS/database dependencies entered their lockfiles.

Root native image fixtures, their temporary storage object and server were
removed by the check. The dev-tool check used a disposable database/media root
and cleaned its processes and files. No deployment or external provider setup
was performed. Browser/visual, production-request abuse and glibc Linux exploit
acceptance are outside these results.
