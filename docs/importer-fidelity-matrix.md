# WordPress importer fidelity matrix

Tested **18 October 2026** with **Astro 7.4.0**, **EmDash 1.3.0**, **@emdash-cms/gutenberg-to-portable-text 1.3.0** and **Node 24.21.0**. This is evidence for the installed executable and the synthetic cases below, not certification of arbitrary WordPress themes, plugins or client exports.

The installed package's bundled `.mjs` behavior differs from some accompanying TypeScript source and documentation: notably, the executed paths preserve published status and schedule the future-dated fixture. Do not infer behavior from a source-only read or version string. Each run records executable, fixture and harness SHA-256 values in `receipt.json`; the dated [verification record](../audit/importer-fidelity-rehearsal-2026-10-18.json) identifies the tested artifacts. Review this matrix whenever those artifacts or importer versions change.

## Run the rehearsal

```sh
# New ignored output directory is selected automatically.
npm run rehearse:importer

# Keep a specific new private/local evidence directory.
npm run rehearse:importer -- --out .emdash/migration-acceptance/my-importer-rehearsal

node --test tests/importer-fidelity.test.mjs
npm run verify
```

Existing outputs are refused. The integration test runs in `npm test` / `verify` and needs no client credentials, WordPress server, network installation or remote HTTP requests. It uses installed dependencies via an owned temporary directory link; it is **not an independent npm installation**. It creates a fresh Node/SQLite Astro development instance and local media, drives real analysis/prepare/chunk/finalization/media/rewrite endpoints, reads the actual records, and anonymously renders them using native `getEmDashEntry()`, `getSeoMeta()` and `PortableText`. It stops its child/server, unlinks dependencies and removes only its verified temporary tree, including after failure.

The fixture uses explicit manual locale routing under `/view/<collection>/<locale>/<slug>` so CMS locale semantics can be checked independently of automatic prefix routing. It does not certify a client's theme, automatic Astro locale routing, production build/hosting, browser/editor save workflow or external provider behavior. The scheduled fixture is dated 2032-01-01; update and review it before that date.

### Evidence paths

- **WXR:** real XML upload, analysis, additive prepare, taxonomy/content chunks, section finalization, media copying and URL rewriting. A partial capture is followed by the complete capture to exercise `skipExisting`.
- **Exporter:** a loopback HTTP server supplies the documented `/emdash/v1` analysis/content/media/taxonomy/menu payload shapes, with three records per page to force content chunks. A first content chunk is interrupted, then a fresh run skips existing entries and finishes. These are **protocol fixtures**; no real WordPress/PHP installation, Exporter plugin version, application-password provisioning or migration-key UI has been executed.
- **Network isolation:** a child-only transport maps the one declared synthetic public source origin to the owned loopback server and answers its DNS probe synthetically. The installed SSRF validators remain active; production code is unchanged. Other remote origins are refused, fonts are disabled, and no real DNS/SSRF security or TLS interoperability claim is made.
- **Oracles:** reviewed [Portable Text expectations](../tests/fixtures/importer-fidelity/expected-content.json) retain structural content, mark definitions, order, captions and media IDs. Comparison removes random PT keys and maps run-specific media URLs to source attachment identities. It never replaces an expected body with the current imported body. Stored media bytes are compared with the two source PNGs.
- **Automation:** [integration test](../tests/importer-fidelity.test.mjs), [harness](../scripts/rehearse-importer.mjs), [WXR](../tests/fixtures/importer-fidelity/wordpress.xml) and [Exporter inputs](../tests/fixtures/importer-fidelity/wordpress.json). All entries, emails, origins, IDs and assets are synthetic.

## Observed capability

**Imported** means the declared fixture property was verified in stored data and, where listed, anonymous output. **Preserved for repair** means evidence survived but the intended function/output was not established. **Deliberately rebuilt** means an explicit fixture repair through supported APIs was verified separately. **Unsupported** means the selected path did not supply that property; it is never an implicit pass.

All automated rows below are asserted on every integration run. They describe the tested input/output property, not the whole migration.

| Property | Input path | Observed result | Recovery or acceptance boundary | Evidence |
| --- | --- | --- | --- | --- |
| Classic prose, heading, bold, list, inline link | WXR + Exporter | **Imported** as structured Portable Text; public heading/list/link text survives | Inspect other HTML and formatting cases separately | Stored semantic oracle + public HTML |
| Gutenberg heading, paragraph, list and external inline link | WXR + Exporter | **Imported** with native blocks/marks and rendered list items | Dynamic/plugin blocks have separate outcomes below | Stored oracle + structural public HTML |
| Saved custom builder wrapper (`vendor/carousel`) | WXR + Exporter | **Preserved for repair** as `htmlBlock` with `originalBlockName` and saved fallback HTML | Promote repeated content to collections or rebuild approved native blocks/templates; retain recovery payload | Stored oracle + rendered review signals |
| Empty dynamic plugin block (`vendor/live-query`) | WXR + Exporter | **Unsupported** execution; raw block comment retained in an `htmlBlock` | Implement the required query/component against the target model; an empty saved block is not migrated functionality | Stored original marker; no plugin/PHP execution |
| Contact Form 7 / gallery shortcodes | WXR + Exporter | **Preserved for repair** as literal HTML/text; execution **Unsupported** | Rebuild gallery from explicit media membership; classify forms and verify submission/provider behavior separately | Stored raw shortcode text + F3 advisory |
| Fixture dynamic-content replacement | Supported content API after either import | **Deliberately rebuilt** into reviewed static Portable Text | This fixture intentionally replaces only saved content/query presentation; it does not implement a contact form/provider workflow | Revision-bound save/publish + F3/F4 passing evidence |
| Gallery positions `202, 201, 202`, captions and alt | WXR + Exporter | **Imported**, including the intentional repeated position; public image order matches | Verify real album sizes/editor operations separately | Stored oracle, real media copy/rewrite, public image order, file hashes |
| Custom destination on an image nested inside the gallery | WXR + Exporter | **Unsupported** preservation of the custom destination; gallery content keeps image assets/captions, not that `href` | Capture each image's intended link and model/render it explicitly; do not infer custom-link fidelity from successful media copy | Source contains custom destination; stored oracle/public links omit it |
| Changed permalink / internal link | WXR + Exporter | **Imported** link becomes origin-relative but retains `/2020/old/permalink/`; automatic route remap/301 **Unsupported** | Maintain explicit redirect register; configure redirects on the actual host/runtime. The fixture separately rewrites the internal link to its reviewed target route | Old path 404, F3 broken-link failure, explicit rewrite then pass |
| Yoast title/description overrides | WXR | Automatic mapping **Unsupported** in this upload path; neither generic SEO fields nor native SEO panel is populated | Extract reviewed source meta, resolve variables and write native SEO through supported content APIs | Actual WXR includes Yoast meta; record and public HTML assertions |
| Rank Math title/description overrides | WXR | Automatic mapping **Unsupported**, as above | Same native SEO reconciliation; retain original export | Actual WXR includes Rank Math meta; record assertions |
| Yoast + Rank Math title/description | Exporter | **Preserved for repair** in `data.seo_title` / `data.seo_description`; **not** promoted into native SEO | Write reviewed overrides to native SEO. `getSeoMeta()` renders the native panel/content fallback, not these generic fields | Each plugin payload asserted separately; native title null, public title/excerpt fallback |
| Canonical and noindex from either SEO plugin | WXR + Exporter | Automatic preservation **Unsupported**; native canonical remains null and noIndex false | Set native production canonical and indexing policy explicitly, then verify rendered canonical/robots | Input meta/payload, empty native SEO, rendered defaults; explicit repair then F3/F4 pass |
| Open Graph source title/image | WXR + Exporter | Automatic source social-override preservation **Unsupported**; public OG title defaults to content title; no OG image emitted | Configure native SEO image and any separate social overrides/contributions required by the site; verify actual tags | Source meta/payload and structural public `<meta>` assertions |
| SEO template variables | WXR + Exporter | Expansion **Unsupported**. Exporter retains literal `%%title%%`, `%%sitename%%`, `%title%`, `%sitename%` in generic fields | Resolve against reviewed source context; never publish unresolved placeholders or assume WordPress expansion runs in Astro | Exact generic field values; reviewed literal native SEO repair |
| Repaired SEO metadata | Supported content API after either import | **Deliberately rebuilt** native title/description/production canonical/noindex; public title/description/canonical/robots match | Social image/provider behavior remains separate | Fresh revisions, publish, F3 tags and F4 explicit SEO expectations |
| Locale, locale-specific slug, English/Dutch translation pair | WXR + Exporter | **Imported** as rows linked by the same native translation group | Test the site's actual multilingual plugin/export and fallbacks; fixture uses explicit locale/group metadata | Record IDs/locales/statuses/groups and F4 reconciliation |
| `publish`, `draft`, `pending`, `private`, `trash` | WXR + Exporter | **Imported**: publish → published; the other listed values → draft | Draft conversion does not preserve WordPress visibility, review or trash semantics; decide them explicitly before publishing | Raw source statuses, actual records, anonymous unpublished 404s |
| Future post dated 2032-01-01 | WXR + Exporter | **Imported** as scheduled, with exact `scheduledAt` in this installed bundle | Verify installed runtime; accompanying source/docs that imply all future items become drafts do not establish this executable's behavior | Real schedule handler result, stored timestamp, anonymous 404 |
| Source page parent | WXR + Exporter | Automatic native relationship reconstruction **Unsupported** in the selected contracts | Create a native reference relation and map parents explicitly when required. The passing fixture mapping declares this scoped exception | F4 preservation-required run fails; explicit scoped mapping is not called preserved |
| Source author | WXR + Exporter | **Preserved for repair** as guest credits; partial/chunked import produces duplicate guest identities | Map to reviewed users/bylines or consolidate guest identities through native APIs; validate localized credit display | One source author yields 2 credited WXR IDs / 5 Exporter IDs; Dutch credit display absent |
| Reusable block | WXR | **Imported** as one section during finalization | Section placement/reuse in a real theme remains separate | Actual finalize result: created 1; repeat skips |
| Menu | Exporter protocol | **Imported** as one menu/one item during finalization | Verify actual source-plugin version, chosen routes and public navigation; this fixture does not render a site navigation menu | Actual finalize counts; not browser navigation acceptance |
| Partial retry / existing slug | WXR + Exporter | **Imported** remaining records, skipping existing collection/slug/locale matches | Review partial errors and source-to-target IDs; a skip does not validate existing contents | Partial resume skips 3, full repeat imports 0 |
| Source edit, new source ID using an existing slug | WXR + Exporter | Existing target is skipped, unchanged | Reconcile explicitly with fresh revisions; stable WordPress IDs do not make this a delta sync | Changed body remains unapplied; different source ID with same slug skips |
| Source slug change / deletion | WXR + Exporter | New slug creates another row; source deletion leaves its old target | Classify duplicates/removals from final source snapshots before cutover | One extra target after changed slug; both old slug and deleted-source target remain |

## F3/F4 loss detection and scoped repairs

The rehearsal verifies these transitions on the actual imported data:

1. Initial F3 URL report fails on the retained-but-broken legacy link, while shortcodes/raw builder markers are advisory. F4 fails the native SEO and expected rebuilt-content policy. A stored fallback is **not** called an executed dynamic block.
2. Fixture-only supported API repairs resolve native SEO, replace the dynamic payload with a declared static alternative, and rewrite the link. URL reports and inventory assessments pass for both paths. Mappings explicitly document singleton-group normalization, status conversions, separately verified WXR sections, and the unsupported parent relationship. Passing these scoped expectations does not waive real site requirements.
3. A real target record is unpublished; a gallery position is removed and a remaining media URL is changed to a missing file. F3 retains confirmed status and asset failures and returns **2**, because required metadata on the missing page is also unknown. F4 returns **1** for known status/content/media loss.
4. Restoring through supported fresh-revision APIs produces passing F3 and F4 results again. A separate F4 run requiring parent preservation fails.

The `http-*` subdirectories contain versioned manifests, observations, artifacts and JSON/Markdown URL reports. `inventory-*.json` files are **content-engine assessments**, not a full-scope CLI/editor acceptance certificate. Stored-content snapshots and `receipt.json` retain synthetic import results and classifications. No editor round trip or provider workflow was performed; those remain unverified. See [acceptance contracts](migration-acceptance.md) and [inventory contracts](migration-content-inventories.md) for exit precedence and the additional evidence required for a complete migration.

## Minimal upstream reproduction cases

No installed EmDash file is patched and no parallel importer is introduced. These cases isolate observed defects/limits for upstream review; no issue or message is published automatically.

| Case | Minimal input / steps | Expected versus observed |
| --- | --- | --- |
| SEO storage/render integration | [WXR SEO record](../tests/fixtures/importer-fidelity/repros/seo.xml), [Exporter record](../tests/fixtures/importer-fidelity/repros/seo-exporter.json). Prepare a collection with native SEO enabled; import; inspect the record and render with `getSeoMeta()` | WXR overrides absent; Exporter generic overrides retained but native panel empty, so public SEO falls back. Writing native SEO explicitly repairs the output. |
| Guest byline duplication across invocations | Upload [first record](../tests/fixtures/importer-fidelity/repros/byline-first.xml), then [next record](../tests/fixtures/importer-fidelity/repros/byline-next.xml) to the same collection with skip-existing enabled and no user mapping | Both have the same source author. The shared importer path creates another guest byline in a later invocation; the main automated rehearsal reproduces this with partial/chunked imports. |
| Nested gallery link loss | Import [one gallery](../tests/fixtures/importer-fidelity/repros/nested-gallery-link.xml); inspect native gallery JSON before media copying | Image order/captions survive; custom image destination does not. Rebuild linked-image semantics explicitly. |

Do not extrapolate these fixtures to every plugin block, SEO schema, author configuration or migration input. Real source exports and operational acceptance remain necessary; final source reconciliation and recovery/handoff are F6/F7.
