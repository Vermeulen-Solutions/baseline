# Production hardening implementation — 20 October 2026

Scope: reusable EmDash 1.3.0 / Astro 7.4.0 starter maintenance. The root remains Node/SQLite. No cloud resources, deployed content, credentials, database reset, DNS or email-provider changes were made. The two supplied audit reports remain unchanged. No upstream skill mirror was edited.

## Research and architectural decisions

Read both supplied [audit](emdashnow-production-audit-2026-10-20.md) and [review](emdashnow-production-audit-2026-10-20--review.md), then fetched the seven live field articles: [production](https://emdashnow.com/running-emdash-in-production), [SEO](https://emdashnow.com/emdash-seo-built-in-and-gaps), [Forms](https://emdashnow.com/emdash-forms-review), [newsletter ownership](https://emdashnow.com/own-your-newsletter-list-emdash), [1.3 release](https://emdashnow.com/emdash-1-3-released), [readiness](https://emdashnow.com/is-emdash-production-ready), and [operating costs](https://emdashnow.com/what-emdash-costs). Some web fetches timed out; direct HTTPS fetches with HTML parsing supplied the article text. Treat production observations and vendor cost estimates as scoped evidence, not a certification or universal benchmark.

Verified APIs through EmDash Docs MCP: [route caching](https://docs.emdashcms.com/deployment/route-caching/), [object caching](https://docs.emdashcms.com/deployment/object-cache/), [secrets](https://docs.emdashcms.com/deployment/secrets/), [configuration](https://docs.emdashcms.com/reference/configuration/), [CLI](https://docs.emdashcms.com/reference/cli/), [site transfer](https://docs.emdashcms.com/guides/site-transfer/), and [core migrations](https://docs.emdashcms.com/deployment/core-migrations/). Astro Docs MCP verified middleware/cache APIs and the bounded [origin-check behavior](https://docs.astro.build/en/reference/configuration-reference/#security). Cloudflare primary docs verified [Time Travel](https://developers.cloudflare.com/d1/reference/time-travel/), [asset versioning](https://developers.cloudflare.com/workers/versions-and-deployments/), [placement](https://developers.cloudflare.com/workers/configuration/placement/) and [cron](https://developers.cloudflare.com/workers/configuration/cron-triggers/).

Installed source checks under `node_modules/emdash/src/`:

- `loader.ts`: declared boolean fields normalize true/false and 1/0; arbitrary nested/plugin/raw values do not.
- `astro/middleware/setup.ts`, `astro/routes/api/setup/{status,admin}.ts`: flag/user/auth-mode checks differ. A setup SPA HTTP status does not establish lockdown; verify the real status envelope and fresh authentication. External setup restrictions survive database loss.
- `cli/commands/site.ts`: export requires `--output`, producing a `.emdash` package; redirecting stdout to ZIP was independently incorrect. Import analyzes an empty content target before executing a reviewed digest.
- `database/migrations/policy.ts`, `cli/commands/migrate.ts`: production runtime check mode and explicit target fingerprints are supported. Core migrations are not Wrangler's arbitrary SQL migrations.
- `astro/integration/runtime.ts`, `astro/middleware.ts`: client toolbar behavior, object-cache due-time caveat, build-aware validators and private/auth response exclusions.
- `page/{context,metadata,seo-contributions}.ts`: typed breadcrumbs are passed to consumers but not emitted as BreadcrumbList by core; safe JSON-LD serialization exists; WebSite/BlogPosting remain platform-owned.
- `astro/routes/robots.txt.ts`, `cache/chrome-tags.ts`: native one-day browser TTL, custom Sitemap suppression, and the exact `emdash:settings` invalidation tag.
- `taxonomies/index.ts`: list helpers return a hierarchy, while direct term lookup preserves deep-link/locale fallback. Routes retain direct lookup and separately register the supported taxonomy hint.

Nuances corrected from the review: D1 retention is seven days Free/thirty Paid; Smart Placement is explicit rather than synonymous with the default; the articles' placement/session experiments contain inconsistent statements and do not establish a universal consistency bug. Keep default placement unless measurement supports a change. Cron propagation must be observed rather than asserting a fixed 30–60 minute platform guarantee. A subscriber recipient's domain is not the site's sending domain.

Plan communicated before code: runtime/SEO boundaries → recovery/deploy tooling → forms and workflow contracts → regression verification. Functional starter metadata/request changes use reviewed exact LF-normalized art-direction exceptions; no invented client art direction or token changes.

## Findings mapped to deliverables

| Finding | Implementation and operational contract |
| --- | --- |
| Secret naming and export/DR confusion | Correct deployment/prompt examples to EMDASH_ENCRYPTION_KEY, `--output` and `.emdash/transfers/*.emdash`; ignore transfers in Git; document excluded auth/plugin state and analyze/confirm import. Node runbook now distinguishes transfer from DR and corrects its online-backup lock description. |
| Cloudflare DR and pre-migration gate | `docs/cloudflare-backup-restore.md`: current D1 bookmark + media manifest + complete key-list escrow, plan-specific retention, off-platform exports, key rotation, historical-key recovery, target fingerprint and serialized managed migrations, isolated drills and coherent incident restore. No Cloudflare deployment pipeline exists in this Node starter; gates are mandatory runbook/skill requirements for adopting that target. |
| Setup wizard ownership and auth recovery | `scripts/check-production-setup.mjs` / `check:production-setup` strictly verify the API envelope with no redirects. Skills/runbook require canonical-domain bootstrap under protection, external setup restrictions after bootstrap, real mode-specific login and fail-closed interpretation of Access/unknown responses. |
| Cache/SWR/toolbar/placement | `docs/edge-cache-lifecycle.md`: explicit public route rules, 300-second HTML freshness, no HTML SWR, browser revalidation, typed query hints, correct tags/purge limits, private/edit exclusions, client toolbar and real publish/purge/editor checks. Root cache policy remains disabled. |
| Old assets disappear on deploy | `scripts/retain-build-assets.mjs` / `assets:retain`: archive new-build bytes before merging prior seven days, verify checksums, preserve case, reject conflicts/tampering, never refresh inherited lifetimes, no remote writes/deletes. Runbook specifies persistent isolated archive, serialized clean builds, previous/current URL acceptance and host-limit/fallback strategy. |
| CMS booleans | `src/lib/cms-flag.ts`: explicit true/1 reader and nullish-default-on optional reader; partner activity and editorial link target use them. String flags fail closed. Rules recorded in AGENTS and diagnosis docs. |
| URL normalization and robots | Opt-in `NORMALIZE_PAGE_URLS=1` middleware plus tested `page-url.ts` exclusions for reserved/assets/API/upload/extension/escaped paths and edit/preview requests. Preserve query bytes; GET/HEAD only. Cap successful robots browser caching at one hour; optional edge rule and settings invalidation remain required. |
| Scanners and shared email accounts | `docs/newsletter-architecture.md`, forms adoption and contact-form reference define read-only GET/HEAD, deliberate POST, atomic token consumption, CSRF, consent, signature verification, known-subscriber-only/idempotent webhook updates and reconciliation. Tested `webhook-domain.ts` uses exact explicit sending-domain allowlists. There is no newsletter/provider endpoint in this starter to retrofit; those acceptance requirements apply when a site adopts one. Native Forms unsigned at-most-once transport is distinguished from signed provider webhooks. |
| Scheduled publishing and parity | Cutover/setup/Stage 7 skills require actual trigger logs and public list/detail visibility for a disposable future post, correct bindings/handler, TTL budget, and production form/provider/key parity. No inferred pass from preview or cron configuration. |
| SEO additions and indexing | Typed Base breadcrumbs plus safely serialized additive StructuredData; home Organization; post/category/tag trails; empty category/tag noindex. Core primary graphs stay intact. Home settings query uses its own hint; taxonomy hints registered. NewsArticle/news sitemap and reviews remain deliberate site-specific work; custom robots sitemap suppression and hub inventory documented. |

## Verification evidence and limits

Automated contracts: `tests/production-hardening.test.mjs` exercises flag representations, hostile JSON-LD, normalization exclusions, domain spoofing, incomplete/redirected setup responses, seven-day asset expiry, collisions and archive corruption. It is classified in the exhaustive test-tier inventory. EmDash-only files/scripts are classified in profile manifests; no CMS tooling is added to generated static sites.

`tests/metadata.integration.mjs` exercises real SSR and browser delivery in an owned temporary Node/SQLite project with synthetic seed/editor data; no working database/media/environment is copied. It checks twelve routes, empty taxonomies, organization/breadcrumb graphs, editor canonical precedence, robots header, setup API, exact media bytes, responsive delivery and page JavaScript errors. The production-hardening run additionally enables URL normalization and checks a mixed-case/slash URL with an unchanged query. Local receipts are under ignored `.emdash/checks/` and `.emdash/metadata/`.

Cloudflare deploy/cache purge, real cron propagation, provider delivery/webhook signatures and D1/R2 restore drills require a selected live site/account. They remain explicit site acceptance work; this repository change does not claim they were executed. No generic NewsArticle/newsletter feature or Cloudflare infrastructure was silently installed.

Final command results are recorded below after completion.

## Changed file inventory

The supplied audit/review are preserved as inputs and excluded from this implementation inventory.

```text
.agents/skills/emdash-production-cutover/SKILL.md
.agents/skills/emdash-production-cutover/references/contact-forms.md
.agents/skills/emdash-site-setup/SKILL.md
.agents/skills/new-site-workflow/SKILL.md
.env.example
.gitignore
AGENTS.md
audit/design-gate-exceptions.json
audit/production-hardening-2026-10-20.md
docs/README.md
docs/cloudflare-backup-restore.md
docs/edge-cache-lifecycle.md
docs/forms-adoption.md
docs/migration-cutover.md
docs/newsletter-architecture.md
docs/node-backup-restore.md
docs/production-deployment.md
docs/prompt-library.md
docs/site-standards-audit.md
package.json
profiles/file-inventory.json
profiles/manifests/emdash.json
scripts/check-production-setup.mjs
scripts/retain-build-assets.mjs
src/components/EditorialImage.astro
src/components/StructuredData.astro
src/layouts/Base.astro
src/lib/cms-flag.ts
src/lib/page-url.ts
src/lib/partners.ts
src/lib/structured-data.ts
src/lib/webhook-domain.ts
src/middleware.ts
src/pages/category/[slug].astro
src/pages/index.astro
src/pages/posts/[slug].astro
src/pages/tag/[slug].astro
tests/metadata.integration.mjs
tests/production-hardening.test.mjs
tests/test-tiers.json
```

## Final results

| Check | Result |
| --- | --- |
| doctor / setup:hooks | Passed preflight with expected launcher/dirty-tree warnings; local hook installed |
| check:art-direction | Pass; exact infrastructure exceptions, no client design/token changes |
| check:schema-budget | Pass; pages 17 and posts 19 physical columns |
| verify:fast | Pass; 140 unit tests, including a final pass after the taxonomy cache-only adjustment |
| npm test | Pass; 140 unit + 132 rehearsal tests, zero failures/skips |
| typecheck | Pass; 53 files, zero errors/warnings/hints |
| verify | Pass; lint, CSS/art/token checks, all 272 tests and typecheck |
| build | Pass; clean production Node artifact and release-profile check |
| audit:html | Pass; 9 HTML files from 10 captured public responses, including 404 |
| disposable SSR/browser rehearsal | Pass; 12 routes, safe additive graphs, empty-taxonomy noindex, editor precedence, media, no page JS errors, setup locked and one-hour robots header |
| opt-in normalization smoke | Pass; /Posts/Welcome/?Campaign=ABC → 301 /posts/welcome?Campaign=ABC |
| runtime receipt/source integrity | Pass; all recorded source SHA-256 values match final files |
| git diff --check | Pass |

No live Cloudflare/provider checks were performed. Those remain the site-specific acceptance gates described above. Logs and detailed runtime receipts stay in ignored .emdash/checks and .emdash/metadata directories; the final implementation inventory contains 40 files, excluding the two supplied audit inputs.
