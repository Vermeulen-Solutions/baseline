# Native images and framework docs backport — 2026-10-05

This neutral reusable image backport preserves no client theme, domain, media, seed or deployment resources. This report is privacy-edited historical evidence; current certification is in audit/certification-2026-10-16/.

## Changes

- Replaced the manual Sharp rendition generator/config/manifest/prebuild hook with Astro `getImage`, static metadata and EmDash 1.1's existing storage-backed image endpoint. Preserves native dimensions, small originals, captions, links, gallery originals and error recovery. Added `optimize={false}` for artwork/animated sources.
- Hosted media authorization derives from the site's build-time `SITE_URL`; local defaults authorize restricted localhost CMS paths. Cloudflare image-service/binding and plan verification are documented for sites choosing that host; this remains a Node starter.
- Added Astro and EmDash docs MCP configuration for Codex, VS Code and Cursor, plus Antigravity's always-on rule and user-level setup/Refresh instructions. Existing user-level Antigravity servers were configured during legacy-migration work; this backport did not overwrite them. Actual refreshed Codex/Antigravity client inventories remain unverified; cloning a repository is not client activation.
- Added reusable HTTP and documentation transport checks. Removed retired manifest tests; existing behavior tests remain. The design gate now accepts an explicitly marked infrastructure deletion only when its previous source matches the approved exact hash; regression coverage rejects unmarked deletions, changed bytes and unrelated client paths.
- Synced upstream EmDash skills at `b74679528630a7ffc0f0f45e73bab4e7c5e61abb`. Reviewed changes cover canonical file-field storage URLs and native admin field-widget guidance. Custom native-image instructions live outside the three upstream mirrors.

## Verification and boundaries

- Typecheck: 31 files, zero errors/warnings/hints. Clean Node build passes; existing large client-bundle advisory remains.
- Design tests: 9 pass; gallery tests: 6 pass; utility tests: 4 pass.
- Development and built Node HTTP image checks decode all responsive candidates as WebP within native width, with correct ratios. Small/selected originals have no srcset; unapproved external source returns 403. A new image uploaded through the public Storage API after building receives responsive transforms without rebuilding. Evidence: `http-images.json`.
- Astro and EmDash MCP endpoints answered real documentation queries; compact source/transport evidence: `docs-mcp-check.json`. These are endpoint checks, not client-inventory verification.
- Disposable fixture routes, source images and storage upload were removed. Final build excludes the fixture. No CMS records, site secrets, form submissions, database migration or email operation were performed. No starter deployment or Git push was requested.
- Historical client hosting reports are private and excluded. This starter certifies the scoped Node profile; Worker/D1/R2 and plugin-specific hosting need separate verification.

Setup and future-site acceptance: [image delivery](../../docs/image-delivery.md), [agent connections](../../docs/agent-documentation.md).
