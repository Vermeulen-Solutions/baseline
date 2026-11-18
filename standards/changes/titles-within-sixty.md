---
bump: patch
platforms: [emdash, static]
areas: [components]
adoption: manual
visible: yes
database: no
files: [src/layouts/Base.astro, profiles/static/project/src/lib/metadata.ts]
---

# Page titles add the site name only when it fits

The Base layouts (and the static profile's metadata) added " — Site name" to every page title, so a descriptive title went past the 60 characters search results show and `check:quality` reported `title`. The site name is now added only when the whole title stays within 60 characters; a longer page title stands alone, and the name is still in `og:site_name`.

## For sites

Base and the static metadata are site-owned, so merge by hand: build the branded title, and use it only when it is 60 characters or fewer. Titles over 60 characters that come from editor content (an SEO title field) stay an editor decision.
