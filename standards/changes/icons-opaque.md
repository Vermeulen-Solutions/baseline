---
bump: patch
platforms: [emdash, static]
areas: [tooling]
adoption: copy
visible: no
database: no
files: [scripts/generate-icons.mjs, tests/generate-icons.test.mjs]
---

# App icons for light marks, and a portable icon test

- **`npm run icons -- --opaque`** puts `icon-192.png` and `icon-512.png` on the ground colour too, padded by `--padding`. Without it they stay transparent, so a white logo was invisible on a light launcher.
- **The icon test is portable.** It looks for the touch icon and manifest links in Base or SiteShell. A site that links them from SiteShell no longer fails it.

## For sites

Copy both files. A site with a light mark reruns `npm run icons -- --source <mark> --background "<ground>" --opaque` and commits the PNGs.
