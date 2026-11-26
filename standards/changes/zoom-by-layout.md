---
bump: patch
platforms: [emdash, static]
areas: [skills, tooling]
adoption: copy
visible: no
database: no
files: [scripts/audit-composition.mjs]
---

# Enlarge a picture by its layout, not a transform; `soft-photo` sees zoomed pictures

A static site's product screenshots looked soft. Each was enlarged 1.6 times with CSS `scale` inside its frame, but a transform acts after the browser has chosen a file from the `srcset`, and `ResponsiveImage` gives lazy images `sizes="auto"`, which reads the untransformed width: the browser loaded a file sized for the frame.

- `astro-site-design` (next to the framed-photographs rule): to show part of an image larger, lay it out larger (a width above 100%, placed with margins) inside an `overflow: hidden` window of fixed aspect ratio, so `sizes="auto"` and the `srcset` see the width shown; keep transforms for motion. A screenshot of an interface shown under about two thirds of its captured size has unreadable text whatever the file: capture at 2x, crop to the part that matters and show it larger.
- `audit:composition` measured `soft-photo` only for pictures at least 40% of the screen wide, which a zoomed screenshot in a card is not. It now also measures any picture from 120px that a transform shows at least 1.1 times its laid-out width, and its finding names the transform and the layout fix.

## For sites

Copy `scripts/audit-composition.mjs`; the guidance comes with the skill sync. Run `npm run audit:composition` on pages with enlarged pictures: a `soft-photo` finding that names a transform is fixed by laying the picture out at the size it is shown. Changing that layout changes how the picture sits, so look at it in a browser after the change.
