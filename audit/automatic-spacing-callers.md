# Automatic spacing caller inventory

Source revision: c3d965c. Phase 1 inventory; source implementation has not changed.

Each row represents an inspected source file; line numbers identify every matched structural/editorial caller. The migration owner and cases below cover the individual occurrences, including conditional branches. Counts are inventory, not behavioral proof.

| Caller | Lines | Current ownership / target migration | Cases |
| --- | --- | --- | --- |
| [src/components/dev/CompositionSpecimens.astro](../src/components/dev/CompositionSpecimens.astro) | 10, 35, 43, 44, 45, 48, 49, 50, 53 | Explicit specimen policy; ordinary Container automatic stack; breakout stays grid; handwritten editorial specimens marked deliberately; remove only redundant flow ownership | V02-V15 |
| [src/components/dev/EmDashStyleguide.astro](../src/components/dev/EmDashStyleguide.astro) | 10, 11, 14, 15 | Actual Portable Text/media examples under explicitly activated styleguide; retain no writable CMS IDs | V01,V08,V09,V11 |
| [src/components/dev/Styleguide.astro](../src/components/dev/Styleguide.astro) | 38, 39, 40, 43, 45, 47, 48, 59, 60, 61, 62, 63, 64, 66, 68, 76, 78 | Explicit specimen policy; ordinary Container automatic stack; breakout stays grid; handwritten editorial specimens marked deliberately; remove only redundant flow ownership | V02-V15 |
| [src/components/Disclosure.astro](../src/components/Disclosure.astro) | 11 | Body owns editorial flow; isolate nested RichText and empty edit placeholders; preserve native details behavior | V08,V10,V11,V13,E01 |
| [src/dev/FormRecoveryFixture.astro](../src/dev/FormRecoveryFixture.astro) | 43, 50 | Ordinary Container gets automatic gaps; form remains explicit flow; preserve focus/error and conditional recovery states | V04,V13,V14 |
| [src/pages/404.astro](../src/pages/404.astro) | 8 | Section/article flow or error flow: activate explicit shell policy; retain editorial RichText; give metadata block layout; preserve article/aside/404 semantics | V03,V11,V12,V14,E01 |
| [src/pages/category/[slug].astro](../src/pages/category/[slug].astro) | 22, 30, 32 | Section + flow / ul + flow / li + flow: migrate to automatic Section, explicit collection list and item stack; preserve taxonomy/empty branches | V03,V07,V12,V14 |
| [src/pages/index.astro](../src/pages/index.astro) | 16, 23, 25 | Section + flow / ul + flow / li + flow: migrate to automatic Section, explicit collection list and item stack; preserve taxonomy/empty branches | V03,V07,V12,V14 |
| [src/pages/posts/index.astro](../src/pages/posts/index.astro) | 26, 33, 35 | Section + flow / ul + flow / li + flow: migrate to automatic Section, explicit collection list and item stack; preserve taxonomy/empty branches | V03,V07,V12,V14 |
| [src/pages/posts/[slug].astro](../src/pages/posts/[slug].astro) | 52, 53, 87 | Section/article flow or error flow: activate explicit shell policy; retain editorial RichText; give metadata block layout; preserve article/aside/404 semantics | V03,V11,V12,V14,E01 |
| [src/pages/tag/[slug].astro](../src/pages/tag/[slug].astro) | 25, 33, 35 | Section + flow / ul + flow / li + flow: migrate to automatic Section, explicit collection list and item stack; preserve taxonomy/empty branches | V03,V07,V12,V14 |
| [src/pages/[slug].astro](../src/pages/[slug].astro) | 45, 46, 50 | Section/article flow or error flow: activate explicit shell policy; retain editorial RichText; give metadata block layout; preserve article/aside/404 semantics | V03,V11,V12,V14,E01 |
| [profiles/static/project/src/pages/404.astro](../profiles/static/project/src/pages/404.astro) | 8 | Remove ordinary Container flow in favor of automatic content gaps; Grid retains its own gap; Base activates policy | V02,V04,V05,V11,V14,V15 |
| [profiles/static/project/src/pages/index.astro](../profiles/static/project/src/pages/index.astro) | 13, 17, 19 | Remove ordinary Container flow in favor of automatic content gaps; Grid retains its own gap; Base activates policy | V02,V04,V05,V11,V14,V15 |
| [profiles/static/project/src/pages/posts/index.astro](../profiles/static/project/src/pages/posts/index.astro) | 10, 12 | Remove ordinary Container flow in favor of automatic content gaps; Grid retains its own gap; Base activates policy | V02,V04,V05,V11,V14,V15 |
| [profiles/static/project/src/pages/posts/[...id].astro](../profiles/static/project/src/pages/posts/[...id].astro) | 21, 22, 26 | Preserve breakout named tracks; header structural flow becomes a stack; native Markdown RichText remains editorial | V02,V04,V05,V11,V14,V15 |

## Nonmatching but affected shared roots and composites

- `src/layouts/SiteShell.astro`: add explicit policy prop and compatibility-default marker; preserve document/landmarks/head/body slots.
- Root and static-overlay `Base.astro`: site-owned explicit activation; preserve all metadata/menu/widget contributions.
- Section/Container/Grid: scoped local defaults, gap/layout/attribute/style APIs; unchanged behavior for unactivated downstream shells.
- Card/ResponsiveImage/EditorialImage/PhotoGallery/LogoTicker/PartnersPanel: maintain internal presentation; verify ambient editorial contexts cannot modify their interiors.
- Empty CMS values, optional slots and hidden controls are explicit cases, not candidates for blanket CSS hiding.

## Downstream adoption

No external client checkout was changed or presumed available. Rehearse an older generated project in an owned temporary directory during Phase 8. Shared updates alone must preserve compatibility: new behavior is selected from the client-owned Base via SiteShell spacingPolicy="automatic-v2". Rollback reverts activation plus related composition changes, retaining calibrated tokens.

## Frozen API and precedence

- Section: labelledBy; spacing="section|content|none"; layout="stack|custom"; gap?:string; ordinary section HTML attributes.
- Container: width; breakout; layout="stack|custom"; gap?:string; div HTML attributes. breakout retains named-grid behavior and takes precedence over ordinary stack mode.
- Grid: minimum; gap?:string; div HTML attributes.
- SiteShell: spacingPolicy="legacy|automatic-v2" defaults legacy. Current site-owned Bases and new generated Bases explicitly select automatic-v2.
- Within activated policy, default stack gap is initialized locally; custom mode has no automatic display/direction/gap; explicit grid utilities retain the managed grid context.
- Explicit gap prop overrides the same local custom property supplied through style; actual gap utility wins in utilities. Class and unrelated string/object style attributes survive merging.
- Malformed enum values normalize safely; non-string/empty gap is omitted. Intentional regional --layout-* values inherit; local primitive values do not leak into nested defaults.

