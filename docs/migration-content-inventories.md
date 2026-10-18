# Offline content reconciliation

Use a **version-3 migration manifest** for content reconciliation. The URL and
HTTP assertions retain version-2 semantics. Version 3 requires `inventories` and
generates six required content checks in full scope: `content:inputs`,
`content:coverage`, `content:identity`, `content:fields`, `content:relationships`
and `content:media`. Keep at least one required editor declaration in
`acceptanceChecks`. Additional content/editor declarations remain separate
attestations; inventory results cannot certify an arbitrary editor workflow.

The [executable content schemas](../standards/schemas/migration-content.mjs)
and [reconciliation engine](../scripts/migration-content.mjs) define version 1
of the inventory, mapping and content-summary contracts. Unknown versions or
properties are rejected. A change in required fields or semantics requires a
new contract version. Version-1/2 manifests retain their previous behavior;
their reserved inventory references do not activate reconciliation.

## Capture and bind evidence

1. Obtain authorized, complete offline exports covering every intended entity
   type, locale and raw status, including drafts, private and scheduled records.
   Collection and pagination are separate reviewed operations. Never substitute
   the public crawl for unpublished-content evidence.
2. Project the exports into the normalized contracts below, or use a supported
   snapshot wrapper. Preserve source IDs and target IDs independently. Prepare a
   reviewed explicit mapping, including every source and target entity.
3. Place the three strict JSON files beneath the manifest directory, normally
   `.emdash/migration-acceptance/`. Set `manifest.inventories` to
   `{source, target, mapping}`, each `{reference, sha256}`. References are safe
   relative paths beneath that directory; SHA-256 covers **exact file bytes**.
   Inputs are regular files without linked components, at most 4 MiB each.
4. Bind the source inventory's `binding` to `manifest.sourceCapture.sha256` and
   target `binding` to `manifest.targetRevision`. These are reviewed capture and
   revision identities, not independent freshness or completeness proofs.
5. Run full scope, review all unknowns/failures, and retain the private inputs.

```sh
# Offline synthetic example: URL/editor attestations plus actual reconciliation.
npm run migration:verify -- --manifest tests/fixtures/migration-content/manifest.json --observations tests/fixtures/migration-content/observations.json --scope full

# Real private manifest: live HTTP plus offline inventories. Editor evidence is
# still required, so HTTP/content success alone cannot yield full acceptance.
npm run migration:verify -- --manifest .emdash/migration-acceptance/site.json --scope full

node --test tests/migration-content.test.mjs
```

`--scope url` does not open inventory files and marks content/editor checks
`not-applicable`. Full scope always recomputes content checks from the bound
files, including when HTTP/editor observations are replayed. Missing, malformed,
changed, unsupported, interrupted or incomplete inventory evidence produces
`unverified` and exit **2**. Confirmed required failures yield **1** when no
required evidence is unknown; otherwise **2** takes precedence. Known failures
remain in the check matrix or count-only `content.findings`, including when the
same content facet also contains unknowns. Exit **0** requires all required
checks, including separate editor evidence, to pass.

## Normalized source and target inventories

See the synthetic [source](../tests/fixtures/migration-content/source.json) and
[target](../tests/fixtures/migration-content/target.json). Both envelopes require:

| Field | Contract |
| --- | --- |
| `inventoryVersion` | Integer `1` |
| `side` | `source` or `target`, matching the selected reference |
| `binding` | Source-capture SHA-256 or target revision |
| `complete` | Explicit boolean attesting the reviewed capture scope is complete |
| `coverage` | Unique `{entityType, locale, status, total}` buckets, including declared zero-count scopes where useful |
| `entities` | At most 5000 unique entities |
| `media` | At most 5000 unique `{id, resolved: true\|false\|null}` catalog entries; resolved means the capture producer checked the target reference |

Each entity requires all these fields:

| Field | Contract |
| --- | --- |
| `id` | Stable opaque ID, at most 256 characters; never a URL, route or computed slug identity. IDs must be unique across this inventory; namespace colliding source systems before capture. |
| `entityType`, `status`, `locale` | Literal type, **raw** publication status and locale. Do not collapse `publish`, `draft`, `private`, `future` into a published count. Labels use letters, numbers, `_` and `-`. `null` means evidence missing. |
| `slug`, `title` | Captured literal values, or `null` when unavailable. Inputs remain private. No URL/slash/query normalization. |
| `fields` | Selected field-name to semantic JSON SHA-256 map, or `null` digest for unavailable evidence. Use exported `contractDigest(value)`; bodies stay outside reports. |
| `requiredFields` | Unique selected field names that must exist on this source/target entity. A missing key fails; a null digest is unverified. |
| `parentId`, `translationGroup` | Stable relationship identifiers; `null` explicitly means no relationship. Resolve target parents through the supported relationship API during capture. |
| `mediaIds` | Explicit attachment/reference ID list; `[]` means none, `null` means unavailable. The catalog is separate from entity IDs. |
| `seo` | `{title, description, canonical, noindex}` or `null` for unavailable SEO evidence. Within known SEO, null text values mean absent metadata; `noindex` is boolean. |

Counts are recomputed and compared with declared coverage. An incomplete capture
or coverage mismatch cannot prove a pass. Target totals are also compared with
the **mapped target expectations**, by type/locale/status. Source totals need
not equal target totals after a deliberate merge, split or exclusion. Identity
checks run independently: equal totals with substituted IDs fail.

## Supported offline adapters

These are JSON readers, not network collectors or universal export importers.
They never run WordPress code, evaluate PHP serialization, infer internal SQL
tables, download media or modify CMS content. Installed source inspected for
this contract: **EmDash 1.3.0**, `src/cli/wxr/parser.ts` (`WxrPost`),
`src/database/repositories/types.ts` (`ContentItem`, `ContentSeo`). The configured
EmDash Docs MCP was checked for locale, status and translation behavior; see
[EmDash internationalization](https://docs.emdashcms.com/guides/internationalization/).

The wrapper fields are exactly `snapshotVersion: 1`, `format`, `binding`,
`complete`, `coverage`, `media`, `records`. Coverage/media/binding retain the
normalized meanings. Each record is `{record, evidence}`; evidence requires
`{parentId, mediaIds, requiredFields, seo}`. Sidecars must come from reviewed
authorized evidence; absence must never be filled with invented empty values.

- **`wordpress-wxr-json/1`**: JSON projection of parsed `WxrPost`, not raw XML.
  Reads positive numeric `id`, `postType`, `status`, `postName`, `title`,
  `postParent`, explicit `locale` and `translationGroup`. Converts numeric IDs
  to strings; zero parent means none. Hashes `content` and `excerpt` when
  present. Parent sidecar must agree with `postParent`. Serialized Map members
  are not required or interpreted. Supply normalized inventories for custom
  fields, SEO plugin projections, attachments and multilingual exports that
  need additional extraction. No default locale is invented.
- **`emdash-content-items/1`**: reviewed snapshot of `ContentItem` records.
  Reads `id`, `type`, `slug`, `status`, `locale`, `translationGroup`,
  `data.title`; hashes fields in `data`. Maps `seo.noIndex` to `noindex`.
  Explicit relationship and resolved media sidecars are required because they
  cannot be inferred from a generic content field. Mixed `liveData`/draft
  overlays are refused; capture one reviewed data revision per entity.

The normalized form also supports selected WordPress JSON snapshots and custom
types. Arbitrary REST responses, raw WXR XML, whole-site transfer archives and
bootstrap seeds are **unsupported inputs**. In particular, the installed
`export-seed` generates `collection:slug:locale` seed IDs and reduces statuses to
published/draft (`src/cli/commands/export-seed.ts`); it cannot prove stable live
identity or scheduled/private parity. This package does not change the seed or
credentialed export workflows. Importer conversion fidelity remains F5.

## Explicit mapping

The [mapping example](../tests/fixtures/migration-content/mapping.json) requires
`mappingVersion: 1`, `rules`, `media`, `translationGroups`, `seoPolicy`.

Each rule has `id`, `kind`, `sources` (source IDs), `targets` (complete target
expectations), `reason`, `relationships`, `fieldLinks`. Cardinalities are strict:

| Kind | Source to target |
| --- | --- |
| `one-to-one` | Exactly one to one |
| `merge` | More than one to one |
| `split` | One to more than one |
| `exclude` | One or more to zero; nonempty reason required |

All rules require concrete reasons. Each source ID and target assignment appears
in exactly one rule. Duplicate assignments/cardinality errors invalidate input
(exit 2). Unmapped source records, unexpected targets, deleted source IDs still
referenced by a rule and missing targets are confirmed identity failures.

Each target expectation requires `id`, `entityType`, `status`, `locale`, `slug`,
`titleSHA256` (semantic digest of title), `parentId`, `translationGroup`,
`mediaIds`, `fields` (required exact field digests) and `seo`. This explicitly
records status conversions and slug/type/locale/title changes rather than
inferring successful preservation. Every captured required field must be known;
each required source field needs a field link unless its entity is excluded.
Each link is `{sourceId, sourceField, targetId, targetField, mode, reason}`.
`mode: preserve` checks equal digests; `replace` documents a deliberate rebuild
and still requires the mapped target field expectation to match. Different
body representations require an explicit replacement policy, not byte equality
between HTML and Portable Text.

`relationships: preserve` resolves source parents through their entity mappings
and source groups through `translationGroups`. `replace` permits a reviewed
restructure described by the rule reason, but still checks expected target
relationships, broken parents, cycles and duplicate locale members in a group.
The engine does not infer a parent when a split makes it ambiguous: the target
expectation identifies the intended parent.

`media` and `translationGroups` use `{sourceId, targetId, reason}`. Null target
means a deliberate reasoned exclusion. Every attached source medium must map
to a reference on at least one target in its merge/split rule, or be excluded.
Target media assignments must match the expectations and resolve in the media
catalog. This validates supplied resolution evidence; it does not decode image
bytes or prove that two files show the same image. HTTP media availability
remains a separate URL check.

`seoPolicy` is `{fields: [...], canonical: ...}`. Fields are selected from
`title`, `description`, `canonical`, `noindex`; an explicit empty list means
SEO parity is outside this inventory policy. `preserve` compares the sources;
`map-production-origin` preserves values while rewriting the canonical source
origin to `productionOrigin`. A merge with conflicting source SEO needs
`explicit`, which compares the reviewed target `seo` values. Expected
canonicals must use the production origin. Preservation requires evidence on
both sides; explicit replacement requires target expectations and target
evidence. Unavailable required SEO evidence is unverified; wrong known metadata fails. Rendered metadata is
independently checked by the HTTP assertions.

## Reports and privacy

Version-3 reports require `content` (a count-only summary in full scope, `null`
in URL scope). Observations may carry the same summary. It contains
`contentVersion: 1`, `source`, `target`, `expectedTarget` aggregate buckets,
`rules` count, and `{code, state, count}` findings. It contains no entity,
relationship or media IDs, field values/digests, titles or editorial bodies.
JSON and Markdown include findings and per-type/locale/status counts.

`content-evidence/reconciliation.json` holds the same sanitized findings and
check results. Full-scope runs save combined `observations.json`; valid replay
artifacts are staged under `replay/` so the bundle remains self-contained.
Supplied content assertions are replaced with newly computed results.

The privacy boundary is scoped: HTTP expectations, source URLs, custom labels,
editor attestations and input paths may still be confidential. Existing HTTP
artifacts retain their documented bounded metadata. Inputs and runs default to
ignored local storage; review the **whole bundle** before publishing anything.
Hashes attest integrity, not the truth, authorization or freshness of captures.
