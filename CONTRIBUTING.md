# Contributing

Use npm and the checked-in lockfile. Node 22.22.2 is the supported minimum; Node 24 LTS is recommended. Open an issue describing the concrete problem, supported runtime and reproduction before proposing broad architecture changes. Keep changes focused and include relevant verification and limitations.

## Local workflow

1. Read AGENTS.md and the specialist guidance for the affected area. New sites and rebuilds start with new-site-workflow. Site visual work needs the saved Art Direction Record; starter infrastructure exceptions are exact, reviewed and hash-bound.
2. Run `npm ci`, then the appropriate tests. Before submitting code, run `npm run lint`, `node --test tests/*.test.mjs`, `npm run typecheck`, `npm run check:schema-budget` and `npm run build`.
3. For visual/component changes, run the local Windows harness described in [visual regression](docs/visual-regression.md), plus the relevant HUD/HTTP checks. Baseline changes require explicit `--update`, reviewed PNG/manifest differences and an explanation. Never update goldens to hide an unexplained failure.
4. Keep credentials, CMS databases/uploads, client copy, private registrations and identifiable client audit reports out of changes. Use synthetic fixtures and neutral examples. Do not post sensitive incident details in public issues.

CI runs one Node 22.23.3 job with fast checks and a normal build. Browser tests are local only and must remain independent of push/PR CI and production/deploy commands. Cloudflare/D1/R2 integration remains an unverified roadmap scope, not a requirement to provision resources for a contribution.

## Skill ownership

`building-emdash-site`, `creating-plugins` and `emdash-cli` are upstream EmDash mirrors. `sync:emdash-skills` stages an immutable candidate; it does not authorize overwriting local drift. Review source commit, licenses, normalized hashes and the staged diff, then explicitly apply under [skill synchronization](docs/skill-synchronization.md). Preserve dirty mirrors and backups. Submit upstream API guidance upstream; keep starter policy in AGENTS.md, maintained references and local skills.

Vermeulen-maintained skills include new-site-workflow, site-art-direction, astro-site-design, emdash-content-modeling and migration/setup guidance. `sync:site-skills` distributes reviewed snapshots; it does not own client content or AGENTS.md. Impeccable is a separately licensed upstream snapshot: preserve its LICENSE/PROVENANCE and update deliberately, rather than adding starter policy inside it. Checked-in local mirror drift remains pending review, not a claim of synchronization.

## Content and runtime contracts

Preserve canonical EmDash field values and edit attributes, editor metadata, locale ownership and query cache hints where caching is enabled. An ownership annotation does not prove successful editing. Use native Astro image processing and instance-specific media identities. Keep collections within the 50-physical-column preflight budget; never infer target width from seed fields alone. Database/media writes, deployments and client modernization are separately scoped operations.

Contributions are offered under the root MIT license, with third-party exceptions retained in [notices](THIRD_PARTY_NOTICES.md). Participation follows [the Code of Conduct](CODE_OF_CONDUCT.md).
