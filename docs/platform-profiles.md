# Platform Profiles

Baseline has two technical foundations and three Platform Profiles. Profile is
independent of the Standard/Express delivery track, visual identity and locale count.

| Profile | Foundation | Editing and rendering | Infrastructure to budget |
| --- | --- | --- | --- |
| `static` | Native Astro, `output: "static"` | Developer/agent edits typed Markdown collections; rebuild publishes | Static hosting and build minutes; optional external forms/search |
| `static-sveltia` | Same static foundation | Sveltia SPA commits the same files through GitHub; rebuild publishes | Static hosting/builds plus OAuth proxy for friendly sign-in, or PAT management |
| `emdash` | Relational SQL with Astro server output | CMS forms, Portable Text, live edit canvas, MCP server | Node/SQLite and persistent media, or Workers/D1/R2; backups, auth and optional sandbox runners |

Choose based on who edits, whether relational/runtime features are needed, release
latency, hosting restrictions and ongoing operations. Static content changes need
a build; there is no public server runtime to execute CMS queries. Sveltia adds an
editor, not relational collections or EmDash's live canvas/MCP. The existing root
EmDash application remains the supported Node/SQLite starter; Cloudflare adoption
requires separate configuration and verification.

From a Baseline source checkout, generate either static profile into a new or
empty destination whose parent exists:

```sh
npm run init:profile -- --profile static --out C:/dev/my-site
# Alternatively: --profile static-sveltia
cd C:/dev/my-site
npm install
npm run verify
npm run build
npm run check:dev-tools
```

Commit the newly created lockfile and use `npm ci` after that. The generator does
not clone the source lockfile, install dependencies, copy credentials or initialize
Git. For EmDash, use the full repository template and its CMS setup instructions;
`init:profile --profile emdash` is intentionally unavailable rather than claiming
an unverified assembly path. Static generation is not an in-place CMS conversion.

`baseline.config.json` records the selected profile, runtime, allowed skills/checks
and immutable source commit. `.baseline/managed-files.json` records the exact
assembled hashes and dirty-source flag. Keep both tracked. A dirty assembly records
its actual bytes rather than claiming they exactly match the base Git commit.

The generator resolves explicit file, dependency and skill allowlists plus profile
overlays. Static projects omit seeds, databases, EmDash endpoints/types/packages,
server adapters, React integrations, database migration scripts and CMS specialists.
Sveltia adds only admin HTML/config, its setup guide and a paired-form test; it
adds zero npm dependencies. Generated CI runs a clean install, art gate, token
audits, tests, Astro typecheck, static build and release/styleguide isolation checks.
Commit the first lockfile before enabling CI. No SQLite fixture is fabricated.

## Shared presentation

`src/styles/global.css`, token tools, layout primitives and `SiteShell.astro` are
shared authority. SiteShell owns document metadata, global styles and landmarks;
platform wrappers supply navigation, settings and header/footer slots. `Card`
accepts generic HTML attribute bags. `ResponsiveImage` uses Astro's native image
pipeline with metadata from `src/assets`; EmDash's `EmDashImage` adapter resolves
storage endpoints before reaching this presentation boundary. Static RichText
wraps native Markdown rendering; Portable Text remains an EmDash extension.

The native Posts collection lives in `src/content.config.ts`. Static routes use
`getStaticPaths()` and `render()`; drafts are excluded. Site identity/navigation
live in `src/config/site.ts`. Sveltia's form must evolve with the same schema.
See `docs/sveltia-cms.md` in a generated Sveltia project for authentication and
native upload paths. Configure the new site's repository before signing in.

Design calibration is identical on both foundations: establish the real Art
Direction Record, calibrate tokens and production primitives on `/_styleguide`,
and record observed results. Static specimens use native Markdown/images; EmDash
extends the common specimens with Portable Text and storage/gallery examples.
Production builds exclude the route; fixture builds are nondeployable. Static
hosting must serve missing paths as HTTP 404 with no SPA catch-all rewrite.

Use `new-site-workflow`, `site-art-direction`, `astro-site-design` and `impeccable`
on all profiles. Load EmDash setup/modeling/building/CLI specialists only on
`emdash`. Profile changes require deliberate content/routing/auth migration;
changing the profile ID in a receipt is not a migration.

## Updating and delivery

[Baseline updates](baseline-updates.md) describes immutable, staged shared-file
and skill synchronization. Client content, settings, routes and admin config are
never updated by that tool; calibrated tokens become review conflicts when changed
locally. Review dependency upgrades separately with the site's own lockfile.
Static sites do not inherit EmDash registry, database audit or screenshot baseline
commands. Record their deployment and browser acceptance evidence in project notes;
the existing Windows screenshot harness remains EmDash-specific. Baseline CI's
`test:profiles` independently installs, builds and HTTP-checks both generated profiles
without running screenshot regression in CI.
