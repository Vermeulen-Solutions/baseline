---
bump: patch
platforms: [emdash, static]
areas: [tooling, docs, skills]
adoption: copy
visible: no
database: no
files: [scripts/prepare-image.mjs, tests/media-preparation.test.mjs, tests/spacing-tokens.test.mjs]
---

# Prepared photographs lose their camera metadata; the token tests copy the site's stylesheets

Two faults found again in a trial build from an owner's phone photographs.

- `media:prepare` kept a photograph byte for byte when it was already within the size policy, with its EXIF intact: 19 of 25 prepared photographs still carried the phone model, the date and in some cases the GPS position. A file that carries EXIF, XMP or IPTC metadata is now re-encoded, which writes none; a file without metadata is still kept as it is, so repeated lossy encoding stays avoided.
- `tests/spacing-tokens.test.mjs` copied `global.css` alone into an empty folder, so a site whose stylesheet imports a sibling (`@import "./site.css";`) failed two tests while the site itself was fine. The tests now copy the whole `src/styles` folder first.
- The fonts recipe shows a Fontsource import in `global.css` by its package path, without `.css`.

## For sites

Copy the three files. Photographs prepared before this change may still carry their metadata: prepare them again from the originals.
