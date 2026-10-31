# Versioned blocks: rendering and schema evolution

Use this reference for EmDash `blocks` composition fields, not custom objects inside Portable Text. The contracts below were checked against EmDash 1.4.0 source and the [official blocks guide](https://docs.emdashcms.com/guides/blocks/). Read the installed version's `tools/list` metadata before constructing MCP calls; do not infer parameter names from another release.

## Retained-version rendering contract

`defineBlockComponents<T>` from `emdash/ui` checks coverage of each `_type`, but does not require a renderer for each retained `_version`. Once a type has multiple retained versions, use one dispatcher at `src/components/blocks/<type>/index.astro` and a `vN.astro` for every retained version, including inactive versions being prepared for activation. A single-version type may use one component directly. Do not remove old renderers after migrating current entries: drafts and historical revisions can still contain those versions.

Keep one canonical `defineBlockComponents<GeneratedFieldBlock>` map per blocks field in `src/components/blocks/index.ts`. Routes import that map rather than copying it or defining their own partial map. Include the field's allowed and retired types. Regenerate types from the target schema after creating an inactive version, before checking the renderer; a stale generated union cannot catch a missing new renderer. Keep the generated literal `_type`/`_version` union rather than widening to `BlockValue` or `any` at the map call site.

In 1.4.0 the Astro integration generates the expanded `emdash-env.d.ts` union on dev-server startup. Start/restart it against the updated rehearsal schema and inspect that file for all retained versions. The CLI's separate `emdash types` output uses the schema endpoint's simpler TypeScript generator in this release; it does not emit these expanded block unions and is not a substitute for this check.

The following helper is a site-local file to add when needed, not an EmDash export. Adapted from [emdash-build's block-versions.ts](https://github.com/emdash-cms/emdash-build/blob/e072f0f92f3545a000df62003fa88b67cdfcb1ca/prototype/builder-cloudflare/src/components/ui/block-versions.ts), MIT, Copyright (c) 2026 Cloudflare Inc. Preserve the [license](emdash-build-MIT.txt) when copying it into a site.

**src/components/blocks/block-versions.ts**

```ts
import type { BlockComponent, BlockValue } from "emdash/ui";

export type BlockVersionComponents<T extends BlockValue> = {
  [Version in T["_version"]]: BlockComponent<Extract<T, { _version: Version }>>;
};

export function defineBlockVersionComponents<T extends BlockValue>(
  components: BlockVersionComponents<T>,
): BlockVersionComponents<T> {
  return components;
}

export function resolveBlockVersionComponent<T extends BlockValue>(
  value: T,
  components: BlockVersionComponents<T>,
): BlockComponent<T> {
  // The exhaustive map and runtime lookup share the same version discriminant.
  const component = (components as Record<number, BlockComponent<T> | undefined>)[value._version];
  if (!component) {
    throw new Error(`No renderer exists for block ${value._type} version ${value._version}.`);
  }
  return component;
}
```

For a generated `PageLayoutBlock` union containing `hero` versions 1 and 2, the dispatcher forwards `value`, `index` and `blockKey` unchanged. Substitute the actual generated field-union name from `emdash-env.d.ts`.

**src/components/blocks/hero/index.astro**

```astro
---
import type { BlockComponentProps } from "emdash/ui";
import type { PageLayoutBlock } from "../../../../emdash-env";
import { defineBlockVersionComponents, resolveBlockVersionComponent } from "../block-versions";
import V1 from "./v1.astro";
import V2 from "./v2.astro";

type HeroBlock = Extract<PageLayoutBlock, { _type: "hero" }>;
type Props = BlockComponentProps<HeroBlock>;
const versions = defineBlockVersionComponents<HeroBlock>({ 1: V1, 2: V2 });
const Component = resolveBlockVersionComponent(Astro.props.value, versions);
---
<Component {...Astro.props} />
```

Each `vN.astro` declares `type Props = BlockComponentProps<Extract<HeroBlock, { _version: N }>>` using the same generated union. Version 1 can read `heading`; version 2 can read its replacement `title`. Keep styling in Baseline's token layers/primitives, and render nested editorial Portable Text through the site's `RichText` adapter. Preserve native media resolution and edit attributes where supported. This dispatcher does not itself make nested fields live-editable; verify actual typing/save/reload when adding those targets.

**src/components/blocks/index.ts**

```ts
import { defineBlockComponents } from "emdash/ui";
import type { PageLayoutBlock } from "../../../emdash-env";
import Hero from "./hero/index.astro";
import FeatureGrid from "./feature-grid.astro";

export const pageLayoutComponents = defineBlockComponents<PageLayoutBlock>({
  hero: Hero,
  feature_grid: FeatureGrid,
});
```

In the existing server-rendered route, import `Blocks` from `emdash/ui` and `pageLayoutComponents` from the canonical map, then render `<Blocks value={page.data.layout} components={pageLayoutComponents} />`. Keep the existing entry query, cache hints and page shell. Do not flatten a blocks composition into rich text.

An unknown version throws from this helper instead of silently dropping a section. Separately, native `<Blocks>` only displays missing-type diagnostics in development; production renders its optional fallback or nothing. A production HTML search for that development marker cannot prove renderer coverage. Exercise every retained type/version and deliberately remove a version-map entry during validation to confirm typechecking fails. Do not port the builder's regex renderer validator or its Cloudflare/Tailwind scaffold.

## Change a block schema without rewriting stored content

Use the existing site setup/seed/CLI workflow to define initial block types and regenerate types. For a populated site, use the native block schema API or MCP operations below, not direct edits to `_emdash_block_types` or `_emdash_block_type_versions`. Keep a recovery point and rehearse the transformation on an isolated restore within the authorized migration scope.

1. Read the type with `schema_get_block_type({ "slug": "hero" })`. Its `item.currentVersion` names the active version. Find that version in `item.versions` and keep its `fingerprint` as `expectedFingerprint`; the inactive target's fingerprint is not the activation precondition. Inspect all retained versions and affected collections, including their retired types, drafts and locales.
2. Submit `schema_update_block_type` with `slug`, that `expectedFingerprint`, and the **complete desired `fields` array** when changing fields. It replaces the definition; it is not a field patch. Presentation-only updates can omit `fields`. A compatible optional-field/default/validation relaxation amends the active version. A breaking field removal, type change, new required field or tightened validation needs `breaking: true`, which creates an inactive version. Read the returned version number; do not assume it is `currentVersion + 1` when other inactive versions exist. A fingerprint conflict means reread and reconcile, not retry against an unreviewed schema.
3. Regenerate `emdash-env.d.ts` from that schema and implement every old/new version renderer. Typecheck and inspect representative rendered content, then deploy the renderer to every serving runtime **before** activation. An ordinary code deployment or seed edit does not activate or migrate a populated site's blocks.
4. Read the schema again and reconcile any changes. Activate with `schema_activate_block_type_version({ "slug": "hero", "version": 2, "expectedFingerprint": "<still-active-version-fingerprint>" })`, substituting the returned target version and reviewed current fingerprint. Confirm `currentVersion` afterwards. Activation changes which version new blocks use; it does not transform existing blocks.
5. Migrate entries explicitly through the content API with `migrateBlocks: true` as described below. Keep old definitions/renderers for retained data and revisions. Updating `seed/seed.json` afterwards makes fresh instances reproducible; deploying that file alone never migrates an existing database. Export every numbered version and the actual `currentVersion`, without renumbering or reusing a version for an incompatible definition. See [seed block types](https://docs.emdashcms.com/themes/seed-files/#block-types).

These operations require the installed tool's schema permissions; in 1.4.0, block-type reads require Editor plus `schema:read`, and mutations require Admin plus `schema:write`. Do not use an ordinary content token to bypass schema authorization. Remote operations apply only to the site's configured runtime and authorized targets; this guidance does not provision D1/R2 or require a Node site to add Cloudflare.

## Content writes and explicit migration

- For a new block in an ordinary content write, send explicit `_type` and its declared field values; omit `_key` and `_version` so EmDash assigns identity and the active version. Seed/restore data preserving a retained version has a separate explicit metadata contract. A field with one allowed type can infer `_type`, but explicit types survive a later second allowed type.
- Before updating existing composition, call `content_get` with `markdown: false` and retain the returned `_rev` alongside `item`. Read raw Portable Text and media objects; do not reconstruct blocks from a Markdown export or public HTML. Ordinary updates preserve every surviving `_key`, `_type`, `_version`, unrelated nested value and array order. Reordering intentionally changes only order, with the same whole keyed objects.
- Each supplied blocks field is a complete replacement array, and each supplied block is a complete object for its retained version. Top-level `content_update.data` remains partial: omit unrelated fields. Omitting a block from a supplied array removes it; do not submit only the one changed block.
- For migration, transform only the intended type/version into the complete active-version shape, retaining `_key` and `_type`, explicitly changing `_version`, mapping renamed fields and removing fields the new schema no longer declares. Keep other blocks and their order intact. Send the complete field array with `migrateBlocks: true` and the fresh `_rev`; do **not** use `replaceBlocks`, which is an entirely keyless replacement that generates new identities. Do not use it for normal editing or reordering either.
- On stale-revision conflict, reread raw content and reconcile the transformation before retrying. Respect `ENTRY_LOCKED`; rereading does not release another editor's lock. Do not force an override as part of an unattended migration. Updating a published entry stages a draft: compare, obtain any required publication authorization, and publish with the current revision. An update response alone does not prove the live page migrated.
- A block `url` field requires an absolute URL. Use a `string` field for an internal route such as `/contact/`, then sanitize links in the renderer. In 1.4.0 MCP collection-schema creation does not expose collection-level `repeater`; a block type can contain a repeater for private repeated rows. This is a tool-surface limitation, not a general ban on repeaters in seeds or other supported schema workflows.

For example, transforming `hero` v1 `{ heading }` to v2 `{ title }` keeps the same key. In a fresh raw entry with several blocks, send all blocks in their existing order, transforming only matching v1 objects:

```json
{
  "collection": "pages",
  "id": "<entry-id>",
  "_rev": "<fresh-content_get-revision>",
  "migrateBlocks": true,
  "data": {
    "layout": [
      { "_key": "<existing-key>", "_type": "hero", "_version": 2, "title": "Existing heading" }
    ]
  }
}
```

This illustrative `content_update` input assumes the field contains only that one block and v2 declares only `title`. Adapt it from the actual raw entry and complete target schema; never paste the one-block array over a multi-block composition.

## Acceptance for an actual site migration

- Generated types cover all retained versions; omitting a map entry fails typechecking. Public SSR renders old and new fixtures without dropping a section, and the unknown-version guard fails explicitly.
- On an isolated restore, schema update/activation rejects a stale fingerprint; activation leaves old entries untouched; migration rejects stale `_rev` and preserves keys, order, unrelated blocks, Portable Text and media values. Re-running the transformation skips already-current blocks rather than duplicating them.
- Draft and published states, locales, historical restore and any changed native editor targets are exercised. Observe typing/save/reload for edit targets, compare and publish within authorization, then verify anonymous live HTML.
- Record the actual database/runtime, renderer revision, active pointer, migrated/skipped/conflicted entry counts, seed/type export and recovery point. Separate local evidence from remote acceptance; a successful build is not a migration receipt.

API sources: [official blocks guide](https://docs.emdashcms.com/guides/blocks/), [field contract](https://docs.emdashcms.com/reference/field-types/#blocks), [MCP lifecycle](https://docs.emdashcms.com/reference/mcp-server/), and [live schema evolution](https://docs.emdashcms.com/deployment/schema-evolution/). The helper derives from the pinned MIT source above; no builder application, renderer regex validator or runtime check is installed by this guidance.
