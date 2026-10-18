# Authenticated Sveltia publishing pilot — 18 October 2026

**Passed: seven recorded acceptance checks**, covering real browser authentication,
GitHub writes, image upload, draft exclusion, publication, build failure protection,
recovery and logout. [Machine receipt](verification.json) · [artifact hashes](manifest.json).

## Target and configuration

- Generated cleanly from Baseline commit `30b2e08bd0292d52b1f9ade2cba8af142e474e09`
  using generator `0.3.1`, profile `static-sveltia`, Node `24.21.0`.
- [Private disposable GitHub repository](https://github.com/jacoplane/baseline-sveltia-pilot-20261018-3496a2),
  publishing branch `main`. Only synthetic content and starter assets were used.
- [Live pilot](https://baseline-sveltia-pilot-20261018-3496a2.pages.dev/) ·
  [admin](https://baseline-sveltia-pilot-20261018-3496a2.pages.dev/admin/) ·
  [published post](https://baseline-sveltia-pilot-20261018-3496a2.pages.dev/posts/authenticated-sveltia-pilot-3496a2/).
- Sveltia `0.248.0`, using the generated CDN URL and SHA-384 integrity pin unchanged.
  [Admin configuration](sveltia-config.json) uses GitHub/simple workflow, `main`,
  `src/content/posts`, `/src/assets`, and `../../assets` collection image references.
- Authentication used **Sign In Using Access Token** with the existing GitHub CLI
  OAuth credential supplied in memory. No new PAT, OAuth app, proxy, repository
  secret or additional account permission was created. This verifies authenticated
  token sign-in; it does not certify a freshly issued fine-grained PAT or an OAuth
  proxy login flow. The existing CLI credential has broader scopes than the minimum
  needed by an editor and is not the proposed client-handoff credential.
- Independent npm installation created the pilot's own lockfile. The receipt records
  zero EmDash/SQLite/libSQL lockfile packages. Astro typecheck covered 26 files with
  zero errors, warnings or hints; the three generated unit tests passed.

The project and site remain available for review. The source repository is private;
the deployed synthetic site and admin shell are public. No production client site,
DNS, database or existing deployment was changed.

## Editorial round trip

The deployed `/admin/` loaded the real pinned Sveltia application. An ephemeral
Chromium context signed in, authored a post, checked **Draft**, selected a local
hero file through the file-upload input, supplied its description, and clicked Save.
No content or asset write was substituted with a direct GitHub API mutation.

[Draft commit `9795639`](https://github.com/jacoplane/baseline-sveltia-pilot-20261018-3496a2/commit/97956397ff13e674c94a96c48aa331f461b71aa1)
was verified by GitHub and added exactly the post and `src/assets/sveltia-pilot-hero.jpg`.
See [commit response](draft-github-commit.json), [draft frontmatter](draft-post.md),
[authenticated library](authenticated-admin.png) and [draft editor](draft-editor.png).
The selected and committed 43,795-byte image matched SHA-256
`074765f7f90bc1655bde34056064de95b9172ce15a806a3ac058c7821e5ed00c`.
It deliberately reuses the starter's synthetic grid image bytes under a new upload
filename, so Astro deduplicated renditions under the existing `pilot-grid` basename.

The saved draft built successfully but was absent from the homepage/listing; its
detail URL returned HTTP 404. A second [control draft](control-draft.md) was also
created through the UI and remained unpublished throughout the remaining checks.

Clearing Draft and saving produced
[publication commit `e5fa8a9`](https://github.com/jacoplane/baseline-sveltia-pilot-20261018-3496a2/commit/e5fa8a96b836e0f04c63de40bcb5b770e8de618e).
The [published frontmatter](published-post.md) retained the relative hero reference
and exact alt description. After the pilot setup correction below,
[accepted commit `7c22f65`](https://github.com/jacoplane/baseline-sveltia-pilot-20261018-3496a2/commit/7c22f659f3057d0c3be40d7b5f74d037e5d9b12f)
passed [full GitHub CI](https://github.com/jacoplane/baseline-sveltia-pilot-20261018-3496a2/actions/runs/39138887882)
and the complete promotion gate.

Observed on the deployed site:

| Check | Result |
| --- | --- |
| Published slug | `/posts/authenticated-sveltia-pilot-3496a2/`: HTTP 200; linked from homepage/listing |
| Hero delivery | Native WebP renditions at 480/800/1400 widths: 3,002 / 4,436 / 8,584 bytes; all HTTP 200 |
| Image description | Rendered `alt` exactly matched the editor value |
| Control draft | Absent from listings; `/posts/unpublished-control-3496a2/`: HTTP 404 |
| Styleguide | `/_styleguide/`: HTTP 404 in production |
| Browser | Published page inspected at desktop and 390px; mobile overflow false; admin runtime errors empty |
| Logout | Reload required sign-in again; no GitHub token found in local storage; browser context closed |

[Desktop post](published-post.png) · [390px post](published-post-390.png) · [signed out](signed-out.png).

## Deployment and failure protection

This was **explicit local promotion to a real Cloudflare Pages Direct Upload
project**, not automatic Git-provider deployment integration. Each stage pulled
the actual GitHub commits. The final promotion harness required the same full-source
art gate as CI, `npm run verify`, `npm run build`, and `npm run check:dev-tools`
before invoking upload. `SITE_URL` was the pilot's `pages.dev` origin. GitHub CI
ran independently for every push and did not receive Cloudflare credentials.

The [archived promotion harness](promotion-harness.mjs) records the executed local
paths and needs the ignored target metadata and isolated Wrangler installation;
it is evidence of this rehearsal, not an installed Baseline command. Cloudflare
project creation used the API; uploads used isolated Wrangler `4.55.0` outside
the generated site's dependency graph. No Wrangler dependency entered Baseline or
the static pilot lockfile.

Using Sveltia, the hero description was cleared and saved in
[invalid commit `900140f`](https://github.com/jacoplane/baseline-sveltia-pilot-20261018-3496a2/commit/900140f62a9db9e58d1960e989ff691d54cb9d2a).
Sveltia omitted the empty optional field; Astro correctly rejected the
[invalid entry](invalid-post.md) with `heroAlt: Describe the meaningful hero image.`

- Direct `npm run build` exited 1: [build log](invalid-build.log).
- [GitHub CI failed as expected](https://github.com/jacoplane/baseline-sveltia-pilot-20261018-3496a2/actions/runs/39138993378):
  [CI error log](expected-ci-failure.log).
- [Promotion receipt](invalid-promotion.json) confirms `deploymentAttempted: false`.
- Cloudflare's canonical deployment remained `dcc595aa-b758-4bc0-9113-1b3b2ea3c70e`
  at the last accepted commit. HTTP statuses and SHA-256 hashes of all five probed
  production documents remained identical. [Production during failure](production-during-failed-build.png).

Restoring the description through Sveltia produced
[recovery commit `085fe25`](https://github.com/jacoplane/baseline-sveltia-pilot-20261018-3496a2/commit/085fe25878d241fc73857c7aebd1c921d1d9197e).
[Recovery CI passed](https://github.com/jacoplane/baseline-sveltia-pilot-20261018-3496a2/actions/runs/39139086104),
the [complete promotion gate passed](recovered-promotion.json), and a new production
deployment `3abca116-21ca-4949-961c-ea06f2020f34` served the restored content.
All five document hashes matched the earlier accepted rendering.

## Setup findings and recommended refinements

1. The generated foundation intentionally lacks a client Art Direction Record.
   Initial content commits were therefore blocked by CI's full-source gate even
   though local changed-source checks passed after pulling them. The disposable
   pilot then recorded its deliberate frozen neutral presentation without changing
   shared tokens or templates. The record explicitly states that chronology; no
   starter gate was weakened. The local promotion harness was also strengthened
   to run the full-source gate. Complete this setup before real editor access.
2. The Sveltia form accepts a missing hero description because the field is
   optional for posts without a hero; the Astro schema enforces the relationship.
   The failure test proves that protection works, but editor-side conditional
   validation and visible build/deployment feedback would improve handoff.
3. The generated simple workflow defaults Draft to false. Consider Draft=true for
   non-technical editorial handoffs so new posts need deliberate publication.
   The pilot retained the supplied form and explicitly checked Draft in the UI.
4. Cached Wrangler `4.151.1` unexpectedly attempted automatic project setup in
   Baseline while handling a Pages command. It was stopped; its task-owned package
   changes were reverted and `npm ci` restored the committed dependencies. No
   resulting configuration or dependency change remains. Keep deployment tooling
   isolated and verify supported commands before invoking it on a source checkout.

## Scope and receipts

The result covers the supplied flat Posts model, simple workflow and one real
authenticated GitHub user. It does not certify OAuth-proxy authentication,
fine-grained PAT permission boundaries, protected branches/editorial PR workflow,
nested media paths, multiple editors or automatic hosting integration. Failed
CI during the missing-record setup and the intentional invalid entry are retained
in [the complete Actions receipt](github-actions.json); they are not passing runs.

Credentials were never printed or saved in source, report files, screenshots or
browser storage-state exports. Logout and context closure were verified. Existing
CLI credentials were not revoked because they were reused, not created for this
pilot. The archived files and pilot tracked files were scanned for the actual
reused token values before finalizing the report; see [secret scan](secret-scan.json).

[Generation provenance](baseline.config.json) · [accepted gate](accepted-promotion.json)
· [recovery verification](recovered-verify.log) · [recovery build](recovered-build.log)
· [recovery production isolation](recovered-dev-tools.log).
