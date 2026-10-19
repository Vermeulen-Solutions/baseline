# Phase 1: CMS metadata ownership

This change implements Phases 0–1 of the [architecture implementation plan](../../audit/architecture-implementation-plan-2026-10-19.md). [Contracts](../../audit/architecture-implementation-contracts.md) define ownership, URL policy, route cases and profile applicability.

## Result and compatibility

- `SiteShell` retains the document, single title, global CSS, skip link and landmarks. Its default `metadataOwner="shell"` preserves existing static callers. CMS Base selects `platform`, so description/canonical are not emitted outside EmDash's metadata resolver.
- CMS Base accepts page type, article facts and SEO context using installed EmDash types. Posts explicitly select article semantics and supply hydrated publication/update dates and primary byline. Pages/custom routes remain websites.
- Default public URLs use configured settings, then Astro.site, then the request origin for unconfigured local sites. Default canonicals retain pathname case/deployment base and exclude queries/hash. A leading double-slash pathname cannot change the public origin. Explicit editor canonicals retain EmDash's supported cross-domain behavior.
- Content routes register settings and content cache hints. The Base retains settings/menu hints and existing contribution slots. No database/schema migration, package change or new public JavaScript is required.
- Error responses explicitly retain HTTP 404, omit canonical and emit noindex/nofollow through EmDash's metadata pipeline.

## Reproduce

Fast policy/pipeline tests, included in the normal root test suite:

```powershell
node --test tests/metadata.test.mjs
npm run verify
npm run build
```

Explicit local production rehearsal, outside CI/default verify:

```powershell
node tests/metadata.integration.mjs --out .emdash/metadata/manual-result.json
```

The rehearsal uses the existing owned temporary site bootstrap. It copies source and public seed, creates a fresh database via supported dev setup, and adds synthetic routes/plugin only inside that copy. It writes editor SEO through the supported authenticated local API, builds a normal Node artifact, checks rendered HTML and inventories JavaScript in fresh isolated Chromium contexts. It rejects CI execution, stops its server, unlinks the dependency junction, and removes only its verified temporary tree. The working database, uploads, env files and credentials are never copied. Local logs stay ignored under `.emdash/metadata/`.

`--baseline` collects observations without asserting the new metadata contract. It is useful before applying a change; running it after implementation does not reconstruct old behavior.

Generated compatibility is checked with `npm run test:profiles`: both static profiles independently install, clean-install, verify, build, create their separate fixture artifact and run existing HTTP acceptance. These results do not certify a static hosting provider or credentialed Sveltia publishing.

## Before/after evidence

Reviewed synthetic receipts: [before](../../audit/verification/metadata-phase-1-before.json), [after](../../audit/verification/metadata-phase-1-after.json).

| Scenario | Before | Implemented expectation |
| --- | --- | --- |
| Home | Two descriptions; no canonical | One description/canonical; WebSite uses public origin |
| Post with tracking query | Duplicate request-origin canonical; website; no article dates | One public canonical without query; article; real dates |
| Editor override | Duplicate description/canonical; website | One editor-selected value; article; actual byline; noindex preserved |
| Real fixture plugin hook | Both template and plugin canonical/description | One winning plugin value and one primary graph |
| Shared shell default/platform modes | No ownership switch | Default remains compatible; platform suppresses shell duplicates |
| Missing route | No explicit indexing policy in template | HTTP 404; no canonical; noindex/nofollow |

The before and after home/Post samples each requested one JavaScript asset: **6,078 decoded/body-transfer bytes**, with identical SHA-256 across the sampled runs. These are local standalone responses without compression; they are not a general CDN/bundle-performance claim. Browser cache was isolated per route, service workers blocked, and external requests/page errors rejected.

## Adoption and limits

Existing generated sites can stage the backward-compatible SiteShell update within their installed managed inventory. CMS Base/route/helper changes are site-owned EmDash adaptations, not additions to static sync membership. A static metadata renderer remains Phase 2 work. Preserve calibrated CSS and do not change `sync:baseline`'s file/dependency trust ceiling.

The fixture checks installed plugin and editor SEO resolution through actual rendering. It does not authenticate a real editor, simulate production cache expiry/CDN invalidation, implement multilingual routing, benchmark deferred user interactions, or claim accessibility conformance. Route-cache hints are registered and reviewed, but the local fixture's default cache configuration is not a provider cache-certification test.

Current check results are recorded in [the progress ledger](../../audit/architecture-implementation-progress.md).
