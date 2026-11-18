---
bump: minor
platforms: [emdash]
areas: [components, delivery]
adoption: manual
visible: no
database: no
files: [src/middleware.ts, src/lib/security-headers.ts, src/pages/llms.txt.ts, src/lib/llms-txt.ts, src/components/RichText.astro, src/components/PortableTextUnknown.astro, src/lib/portable-text-fallback.ts, "src/pages/[slug].astro", "src/pages/posts/[slug].astro", "src/pages/category/[slug].astro", "src/pages/tag/[slug].astro"]
---

# Real 404 status, security headers, /llms.txt and a quiet unknown-block fallback

A missing page, post, category or tag used to answer with a 302 redirect to `/404`, which search engines read as a soft 404; the routes now rewrite to the 404 page, so the URL stays and the status is 404. The middleware adds `X-Content-Type-Options: nosniff`, a `Referrer-Policy`, a minimal `Permissions-Policy` and, on HTML, `Content-Security-Policy: frame-ancestors 'self'`, each only when the response does not set it already. `/llms.txt` lists published pages and posts (title, canonical URL, excerpt) and skips entries marked noindex. A Portable Text block type with no renderer no longer prints a hidden warning into public HTML: it renders nothing, logs one server warning per type and shows a placeholder in development.

## For sites

Take the four route files when they are unchanged from the starter; a site that customised them replaces each `return Astro.redirect("/404")` with `return Astro.rewrite("/404")`. Merge the middleware wrapper and copy `src/lib/security-headers.ts`; if the site or its proxy already sends a Content-Security-Policy or X-Frame-Options, nothing is added on top. Add `src/pages/llms.txt.ts` and `src/lib/llms-txt.ts` and extend its sections when the site has other public collections or routes. Copy the unknown-block fallback and register it in RichText (`unknownType`). After deploying, check a missing URL returns 404 and that `/llms.txt` lists the expected pages.
