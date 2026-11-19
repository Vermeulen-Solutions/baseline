---
bump: minor
platforms: [emdash, static]
areas: [components, styles, skills, docs]
adoption: copy
visible: no
database: no
files: [src/styles/expressive.css, src/components/MediaStage.astro, src/components/IndexList.astro, src/lib/page-transition-script.ts, src/layouts/SiteShell.astro]
---

# Expressive layer: image-led stages, ruled indexes, frame shapes, fitted lines, scroll reveals and page-transition styles

An opt-in layer for sites whose art direction calls for more than cards and fades. Nothing applies until a page uses it, so sites that do not opt in look exactly as before.

- `src/styles/expressive.css`: `.bleed` (full viewport width out of the shell gutter), `data-shape="arch|round|leaf|tab"` (one frame shape from the subject), `.display-fit` (one large line sized to its column, with a rem floor for 200% text and a capital-height trim), scroll-driven `data-reveal="frame|mask"` and `data-scroll="open|recede|rise"`, and page-transition styles.
- `MediaStage.astro`: one photograph at full width with the section's words on a token scrim; on a narrow stage the words move below a shorter picture, so the heading stays on a phone's first screen.
- `IndexList.astro`: rows ruled with hairlines, one stretched link per row and an optional hover preview for fine pointers that morphs into the detail page.
- `SiteShell transitionStyle` (`fade`, `lift`, `curtain`, `wipe`): view-transition styles for cross-document transitions and `<ClientRouter />` alike, direction-aware, with `data-arrive` arrival in up to three stages. With cross-document transitions a 3 KB inline head script supplies the direction and the picked-card morph. Omitted, the document is unchanged.

Every motion is inside `prefers-reduced-motion: no-preference` and feature guards, rests in the EmDash visual editor, and leaves content in place without support or JavaScript. The starter Base layouts import the stylesheet; the development demo is `/_expressive` (`?router` for the ClientRouter variant).

## For sites

Nothing until a site chooses one. To adopt, copy the files with `npm run site:files -- --site <path> --files src/styles/expressive.css,src/components/MediaStage.astro,src/components/IndexList.astro,src/lib/page-transition-script.ts --apply`, merge `src/layouts/SiteShell.astro` (the `transitionStyle` prop) if the site wants page-transition styles, and add `import '../styles/expressive.css';` after the SiteShell import in `Base.astro`. Then follow the day-2 recipe "Give a page a signature moment" and check the changed routes with `audit:ui`, reduced motion and 200% text.
