# Architecture hardening contracts

Scope: Phases 0–2 of [the implementation plan](architecture-implementation-plan-2026-10-19.md). Baseline remains Astro 7.4.0 / EmDash 1.3.0 with the existing Tailwind v4 design system. This is functional starter maintenance, not a client visual redesign.

## Metadata ownership

| Output | Shared shell | EmDash wrapper/runtime | Static wrapper |
| --- | --- | --- | --- |
| Document, charset, viewport, language, title | Single owner | Supplies resolved title/locale | Supplies title/locale |
| Skip link, main landmark, styles and structural slots | Single owner | Composes slots | Composes slots |
| Description and canonical | Default owner for existing callers; omitted with platform ownership | `EmDashHead` owns resolved output | `StaticMetadata` owns resolved output |
| Robots, OG/Twitter, JSON-LD | No independent CMS output | `EmDashHead`, with editor overlay and plugin precedence | One build-time model and safe serializer |
| Article facts | None | Post route supplies real publication/update dates and primary byline name | Real Markdown publication date/hero; optional route-supplied author/update |
| Locale alternates | None | Native EmDash translation handling; no fabricated translations | No invented localized routes/alternates |

Templates retain `<title>` ownership because EmDashHead deliberately does not emit it. Plugin metadata overrides do not change that document title. Content routes use `getSeoMeta` to honor the editor's title. Other metadata is resolved by EmDash in plugin → site → base precedence, with entry SEO overlaid on base values.

## URL and article policy

- Public default origin: nonblank `settings.url`, then configured `Astro.site`, then the incoming origin for an unconfigured local site. Configured values must be absolute HTTP(S) URLs without credentials. Derive the origin once; use the incoming pathname, which already includes any deployment base path. Default canonicals omit request queries/hash and retain the route's existing no-trailing-slash content URL policy.
- Explicit editor canonical values remain EmDash-owned and may legitimately use another HTTP(S) origin. Never replace them with a host-only normalizer.
- Base supplies a default canonical for public custom routes when the caller omits it. Explicit `canonical=null` opts out (404). A 404 remains a real 404, has no canonical, and declares noindex/nofollow through the platform metadata pipeline.
- Posts explicitly use `article`; Pages and custom routes default to `website`. CMS content identity alone does not imply an article in this starter.
- Article dates come from the entry's `publishedAt`/`updatedAt`; author comes from `byline.displayName`. Missing/invalid facts are omitted, not replaced with the site name, logged-in user or build date. EmDash's own structured-data defaults remain upstream-owned.
- Content routes register the settings cache hint as well as their entry hint; Base registers settings/menu hints. Queries remain server-rendered, and editor field annotations remain attached to their existing content nodes.

## Acceptance inventory

| Case | Evidence | Scope |
| --- | --- | --- |
| Home and posts listing | Rendered title/description/canonical count; website graph with public origin | CMS local built artifact |
| Post and Page | Rendered counts; article versus website; ISO article dates and primary byline | CMS local built artifact |
| Alternate request origin and query | Canonical/social/schema stay on the configured origin, without request query | URL unit tests + loopback built requests |
| Editor SEO | Set supported content SEO via API in disposable dev site; reload published page | CMS local rehearsal |
| Plugin override | Real fixture native `page:metadata` hook; one final canonical/description/primary graph | Disposable fixture plugin only |
| Missing facts | No invented author/date/image | Fast metadata tests + plain sample content |
| Static ownership | New wrapper selects platform; shell default remains compatible | Independent generated-profile HTML checks |
| Missing URL setting | Astro.site fallback, then local request origin | Fast URL tests |
| 404 | HTTP 404, no canonical, noindex | Local built artifact |
| Styleguide | Normal built artifact returns 404; local fixtures remain separate | Existing owned server bootstrap |
| JS footprint | Fresh isolated Chromium context, same-origin script requests and response sizes on home/Post | Local production rehearsal; no numeric performance budget claim |

Non-root base-path and explicit cross-domain override behavior are covered by pure URL policy tests. This phase does not add multilingual routing, claim provider/CDN caching certification, or test real editor authentication. The local synthetic CMS fixture uses fresh public seed content, never the working DB/uploads/env/credentials. Browser acceptance stays local and outside CI/default verify.

## Upgrade and applicability boundaries

| Change | Classification | Existing generated site adoption |
| --- | --- | --- |
| SiteShell option | Existing managed shared file; backward-compatible default | Staged immutable sync, review local conflicts |
| CMS Base/routes/helper | EmDash-only, client-adapted source | Review site-specific manual patch; never copy into static |
| CMS metadata tests/rehearsal | Root verification infrastructure | Not shipped implicitly to generated sites |
| Static metadata/new dependencies | Explicit overlay files and dev-only parser; no public runtime | Explicit additive upgrade, not ordinary sync |
| Existing CSS/tokens | No change in Phase 1 | Preserve local calibration |
| Infrastructure exceptions | Exact changed source hashes only | Review with code; no directory exemptions or client-page exceptions |

Session form recovery is CMS-only; shared error markup is portable; a static form submission handler and Sveltia publishing remain separate integration contracts. No content schema/database migration is planned for Phase 1.

Primary API evidence: installed `emdash/page` context types and serializers, `emdash` SEO/settings APIs, plus the [EmDash SEO guide](https://docs.emdashcms.com/guides/seo/). Tests execute installed public functions and real Astro output rather than reimplementing EmDash's merge pipeline.

## Static policy and acceptance additions

Static has no request-origin fallback: `SITE_URL` supplies its public identity;
without it, URL-dependent output is omitted. `src/config/routing.ts` is the single
Astro/model base/slash/build-format policy. Explicit canonical overrides preserve
cross-domain destinations and meaningful queries; default canonicals strip
queries/fragments. Error routes opt out and declare noindex. Native hero metadata
supplies actual dimensions/type, and no missing author/update field is fabricated.

The ten portable tests include URL/base/format cases and adversarial JSON-LD parsed
as real HTML. Independent static and Sveltia rehearsals inspect built home/listing/
Post/error metadata, tracking-query invariance, emitted image dimensions, a
synthetic draft's publication exclusion, and fixture/release isolation. No schema
or Sveltia form migration is needed. Existing-site adoption is explicit in
[Phase 2 documentation](../docs/verification/metadata-phase-2.md).
