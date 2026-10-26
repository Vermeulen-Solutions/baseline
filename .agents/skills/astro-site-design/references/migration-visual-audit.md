# Existing-site visual audit and page QA

Respect machine findings' actionability: `bounded_recipe` still needs reviewed preconditions and authorized scope; `design_judgment` needs brief/rendered assessment; `verification_required` needs evidence; others default to manual review. Missing bento/breakout/dark-surface markers do not establish a design defect. Keep concrete alternatives and brief-led exceptions rather than applying every expressive pattern to raise counts. Newly emitted site audits use v3; current readers also accept legacy v2 reports.

Use this workflow when rebuilding or modernizing an existing site, especially a WordPress site whose theme or page builder will not be carried forward. For this user's migrations, improvement is the default; faithful reproduction is an explicit direction. The source is essential evidence of content, function, and identity, but its builder-imposed layout is not the target quality bar. This workflow prevents a content import or a good-looking homepage from being mistaken for a complete migration.

## Before implementation

### 1. Build the route and page-type inventory

List every in-scope public URL and group routes by page archetype, while keeping unique pages visible in the checklist. Include at least:

- Home and global shell (header, navigation, footer, shared banners)
- Standard and long-form content pages
- Every archive/listing type
- Every detail/single-item type, including custom post types and announcements
- Forms, calendars, maps, donation/support pages, and other interactive or functional pages
- Important empty, success, error, and mobile menu states

Record the source URL, target route, source content type, intended EmDash collection/fields (where applicable), target Astro template/component, and QA status. A repeated content type should generally be represented by an EmDash collection and a reusable Astro detail/list template when editors are expected to add more records; don't flatten repeatable records into hand-authored static pages without an explicit reason.

For multilingual sites, inventory every locale's URL variants and language-specific navigation, noting translated route pairs, locale-specific slugs, missing translations, and fallback expectations. Include these variants in visual capture and final route QA; a page verified in one language does not establish that its other translations, navigation, or text expansion render correctly.

### 2. Capture source evidence

Use browser automation to capture source screenshots before coding:

- Full-page desktop screenshots for each unique editorial page and one or more representative records per repeated page archetype. Include records with different field combinations or visual states.
- Full-page mobile screenshots for each page archetype and pages whose layout or controls differ materially on mobile.
- Focused screenshots for menus, forms, accordions, maps, payment instructions, calendars, and other important states.

Inspect below the fold. If a long page cannot fit in one image at useful resolution, capture overlapping viewport sections from top to bottom. When browser automation cannot reach a page or state, record that gap and request only that missing access/evidence; don't silently substitute a guess.

### 3. Create a preserve / improve / replace record and design direction

For each major page type and shared component, write a short record:

| Preserve | Improve | Replace |
| --- | --- | --- |
| Distinctive brand cues, useful content, meaningful imagery, recognizable motifs, working behavior | Specific issues such as cramped spacing, weak hierarchy, unreadable contrast, awkward mobile layout | WordPress-only implementation such as theme wrappers, shortcodes, plugin embeds, inaccessible controls |

Name identifiable elements instead of using general labels. Distinguish source motifs from additions made during the rebuild, and record which images, logo treatments, colors, or functional instructions carry meaning. Do not remove or reinterpret a distinctive element unless the source evidence or an explicit redesign decision supports it.

Translate that record into a short design direction before building pages:

- **Identity anchors:** which real imagery, logo, motifs, tone, colors, and community or product cues must remain recognizable?
- **Problems to solve:** which source decisions weaken hierarchy, readability, wayfinding, credibility, responsiveness, or accessibility? Separate these from actual brand character.
- **Proposed improvement:** describe the new composition, type and image treatment, navigation, and reusable patterns in concrete terms. Name where the design should be more expressive and where it should be quieter. Avoid defaulting every section to the same card grid or stripping away imagery and character in the name of cleanliness.
- **Success evidence:** what would demonstrate that visitors can understand and use the page more easily, while still recognizing the organization? Use this alongside completeness and functionality in the visual review.

This is a working design brief, not an approval gate. Make reasonable design decisions and test them in the rendered site. A reference screenshot is evidence for comparison, not a pixel-by-pixel specification unless the user explicitly requests one.

When the user requests a route-by-route proposal or review, present it before changing those routes. Reuse settled approvals; ask only consequential unresolved choices. Distinguish refinement from significant overhaul within the brand or replacement of the visual world. The latter scopes use the representative-page concept pass in `site-art-direction`, including for an existing Baseline site, before broad implementation.

#### Early-Baseline & Legacy Pattern -> Modern Baseline Upgrade Matrix

When auditing either a legacy builder site (WordPress/Elementor/Blocksy) or an earlier-generation Baseline site, use this matrix to translate dated layout patterns into current Baseline primitives:

Use the concrete patterns below as the modernization defaults to inspect and propose, not merely as optional inspiration. Apply the five-point rubric in `astro-site-design/SKILL.md`. When an accepted brand/composition or a route's actual function conflicts with a pattern, record the specific exception and rendered rationale. Capability flags and usage counts are useful diagnostic cues, but cannot replace that visual review or prove quality by themselves.

| Observed Legacy / Early-Baseline Pattern | Modern Baseline Upgrade (`references/astro-primitives.md` & `references/landing-page-archetypes.md`) |
| --- | --- |
| Flat 1-surface pages where cards and backgrounds share the same canvas | **3-Tier Surface Hierarchy**: Pair `data-surface="dark|muted|brand"` section breaks with `.surface-elevated`, `.surface-glass`, or `.surface-spotlight` cards and `1px` `--color-border` hairlines. |
| 2-voice typography (`--font-display` + `--font-body` only) with generic bold subheads | **4-Voice Typography**: Add `--font-mono` (`.eyebrow-telemetry`, `.tabular-nums`, `.badge-pill` with `.status-dot`) for structured metadata/dates/counts and `--font-accent` (`.font-accent`) for editorial warmth or pull-quotes. |
| Back-to-back uniform 3-column card rows (`<Grid min="18rem">`) | **Asymmetric Pacing**: Alternate uniform grids with 12-column `.bento-grid` (`8/4` or `7/5` splits), exposed `1px` `.grid-hairline` matrices, `<Sidebar>` narrative splits, or `.stack-cards` sticky sequences. |
| Low-res screenshots, generic hero stock photos, or flat boxed callouts | **Live-Coded `.ui-specimen` or Editorial Frame**: Frame key workflows, schedules, or community highlights in a `.ui-specimen` window (`.ui-specimen__header`) or `.frame-crosshair` / `.prose-dropcap` editorial showcase. |
| Single button style or unstyled text links for secondary actions | **3-Tier Tactile Actions**: Pair primary `.btn` with `.btn--secondary` (translucent surface + hairline border) and `.btn--ghost` with `<span class="icon-nudge">&rarr;</span>`. |
| Abrupt page navigation or static header | **View Transitions & Scroll Choreography**: Pass `transitionName={`post-${slug}`}` on `<Card>` for shared-element morphing, enable `data-sticky-header` on `.site-header`, add `data-reveal` staggered entrances, and offer FOUC-free `[data-surface-toggle]` where appropriate. |

### 4. Verify content and asset meaning

Screenshots establish appearance, not the meaning of every asset or behavior. For ambiguous assets and calls to action, inspect surrounding text, alt text/captions, clickable destinations, source media names, and relevant WordPress/plugin configuration. Record the verified role. Do not invent explanatory copy or functionality from visual resemblance alone.

For each page, record required sections and important data/content before composing the Astro version. For repeatable WordPress records, inspect several examples and preserve the field distinctions editors need (title, body, dates, contact, image, links, status, taxonomy, etc.) in the EmDash schema and reusable template.

When the source uses Blocksy, Stackable, or Elementor, include its design configuration in the evidence: global palette/type/spacing, header/footer and archive/single templates, reusable blocks/widgets, display conditions, dynamic fields, responsive overrides, and interactions. The migration/content skill has a tool-specific checklist. These settings explain the rendered result but are not a mandate to reproduce the builder's implementation.

When repeated items have per-instance IDs or divergent builder styles, compare several instances and record the underlying content shape and any purposeful variants. Do not treat each generated selector as a separate design requirement: normalize recurring cards, feature rows, and calls to action into shared Astro components and data-driven variants, unless the visual audit confirms that a difference is intentional. Use source screenshots to detect genuine variation rather than inferring it from generated CSS alone.

## During implementation

- Work from the route inventory, not just the homepage or whichever page is currently open.
- For a substantial rebuild, implement the shared shell and a small set of representative page archetypes first. Compare their full-page desktop and mobile renders with the source evidence and the design direction. Check both that content/identity survived and that the recorded weaknesses improved. Record specific differences, fix shared tokens/components and page-level problems, then render again to confirm the changes before applying the design across the remaining routes. Do not scale an unreviewed placeholder design to every page.
- Build shared shell and repeated page types as reusable Astro components/templates, but keep one-off editorial pages appropriately simple.
- Keep imported content, EmDash modeling, and presentation work separate enough to verify each. A correct import does not mean the design, URL, behavior, or content mapping is correct.
- Make improvements against concrete problems while retaining the recorded visual identity. If Impeccable or another critique tool is available, use it on the first representative pages and again during the final route pass; apply findings selectively against the brief and real screenshots. A critique is diagnostic evidence, not authority to remove brand elements or a substitute for checking the source.
- Track each route through implementation and review. Mark a finding resolved only after inspecting the rendered fix at the affected viewport; also check other routes that use the changed token or component. Do not mark an entire page type complete after checking only its first entry if records differ materially.

## Before calling the migration complete

1. Render every unique target page and each repeated page archetype; compare with its source reference at the same desktop width. Review the full page, not only the first viewport. For larger collections, sample records with different content shapes and check every migrated URL for status, missing assets, and broken links. Resolve missing sections, wrong content, substituted imagery, overflow, and inconsistent repeated templates.
2. Render mobile for each archetype and important unique interaction. Check navigation, image crop, reading order, form controls, card layout, and horizontal overflow. Also inspect intermediate widths and narrow placements of reusable components. Stress representative pages with long headings, extra or missing items, and unusual image ratios; test translated text where applicable. Check zoom/reflow and text-spacing overrides so content does not clip or disappear. Reserve space for images and late-loading content so the page does not shift while loading.
3. Exercise links and interactions that carry user intent, including forms, navigation, directions, and any functional image or code. Confirm labels and destinations against the source/configuration.
4. Verify editorial behavior in EmDash: create or edit a representative record in every custom collection and confirm the public list/detail templates pick it up without hand-editing Astro pages.
5. Run the project's relevant checks and build. Record routes or states that remain unverified, and do not report those as complete.
6. Run the **5-Point Visual Self-Critique Rubric** in `astro-site-design/SKILL.md` across every redesigned route at `1440x900` and `390x844`: (1) **3-Tier Surface Depth** (Base → Surface → Elevated/Glass), (2) **4-Voice Typography** (`.eyebrow-telemetry` / `.font-accent` / `.tabular-nums`), (3) **Grid Rhythm & Asymmetry** (no consecutive identical 3-column card grids; use `.bento-grid`, `.grid-hairline` or `<Sidebar>`), (4) **Tactile Action Hierarchy** (`.btn` + `.btn--secondary` + `.btn--ghost` with `.icon-nudge` and focus), and (5) **Motion & Polish** (`data-reveal`, `data-sticky-header`, `<Card transitionName>`, zero FOUC on `[data-surface-toggle]` and reduced-motion behavior). Evaluate all five checks; document a specific exception when the accepted direction or route function requires it rather than silently omitting a check. Check intermediate/narrow widths where layouts change, validate saved captures using `references/rollout-verification.md` and reconcile evidence with the route inventory before claiming completion.

The acceptance bar is not pixel identity. It is complete route coverage, correct content and asset meaning, retained brand character, visible improvement on the source's documented design problems, functional interactions, responsive rendering, and maintainable templates for repeated content. A technically clean but generic or less compelling result fails this bar even when its content and routes are correct.

## Actionable Audit Handoff

Once the visual audit and Preserve / Improve / Replace table are completed, do not leave the findings as an isolated document. Formulate them into immediate next actions:

Lead the handoff with the recommended plan, reasons and consequential decisions; retain screenshots and the detailed report as supporting evidence. Apply `new-site-workflow`'s **Audit requests and release completion** policy: an audit alone does not authorize implementation. Include the applicable verification, commit/push/deploy endpoint and resolve targets/authority during plan selection, reusing existing authorization.
1. **Translate repeated content into `audit/content-candidate-register.md` (Stage 3):** Repeated card grids, team rosters, or project sections become structured EmDash collections.
2. **Translate visual cues into the Art Direction Record (Stage 4):** Anchored brand colors, typography pairings, and spatial density feed directly into the `AGENTS.md` Art Direction Record.
3. **Report the next authorized action:** For an audit-only request, deliver findings and proposed next steps. When implementation is already requested, continue through the remaining authorized work; pause only for a consequential unresolved decision or unavailable required action. Do not make the user request continuation merely because the audit report is written.
