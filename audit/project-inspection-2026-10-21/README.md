# Project inspection pilot

`acceptance.json` records the actual CLI running in independently installed
generated static and static-sveltia projects. The JSON reports alongside it
capture those projects and the root EmDash foundation. Both generated profiles
identify the correct installed profile, available commands, content sources and
Grid's declared gap prop; the Sveltia report locates the paired admin files.
Neither static report offers the CMS token command or CMS-only skills.

The six unit tests cover current CMS source observations, static profile routing,
dynamic configuration, no config execution, props changing with source, linked
and oversized inputs, invalid receipts and stack-free CLI failures. The existing
generator rehearsals also check the installed command and returned profile facts.
Reproduce with `node --test tests/project-inspection.test.mjs
tests/static-profile.test.mjs tests/profile-delivery.test.mjs`, or generate a new
profile, install its dependencies and run `npm run baseline:inspect -- --json`.

An initial acceptance assertion expected literal static runtime observations.
Generated configurations spread in routing settings, so the conservative parser
correctly returned unknown. The assertion was corrected to check the receipt's
declared static runtime and retain unknown AST observations. This limitation is
documented rather than hidden by assuming the spread cannot override a setting.

This is functional discovery acceptance, not an agent comparison. It establishes
that the optional command works across installed foundations and derives the
bounded API view from source. It does not quantify token savings, task success,
visual quality, live CMS state or deployment health. Catalog expansion remains
conditional on evidence from future tasks; no mandatory workflow step was added.
