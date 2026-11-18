---
bump: minor
platforms: [emdash, static]
areas: [components, docs]
adoption: copy
visible: no
database: no
files: [src/components/BeforeAfter.astro]
---

# Before/after comparison

`BeforeAfter.astro` compares two pictures of the same view on one frame: renovations, gardens, treatments, restorations and redesigns. It is built on an invisible native range input over the picture:

- arrow keys, Home, End and screen readers work without extra code, and the read-out says how much of the before picture shows;
- a click or tap anywhere moves the divider, and dragging is never required (WCAG 2.5.7);
- without JavaScript the two pictures stand one after the other with their labels.

Labels, read-out and hint are props, so the component can be translated. Colours come from tokens, focus shows on the handle, and forced-colors mode draws the handle in the system text colour.

## For sites

Copy `src/components/BeforeAfter.astro` when a site has real before pictures. It uses the site's existing `ResponsiveImage`. `docs/reusable-public-patterns.md` lists the props.
