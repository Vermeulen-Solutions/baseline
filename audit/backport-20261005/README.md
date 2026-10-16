# Reusable audit improvements backport — 5 October 2026

Implemented in /workspace/starter with user authorization. Existing unrelated changes to new-site-workflow and production-cutover (including its new reference files) were preserved; only the release-check lessons were appended to production-cutover. Upstream EmDash skill mirrors were not edited. No commit, push or deployment.

## Included

- Configurable responsive-media preparation, automatic Node prebuild hook, native orientation/dimension limits, original-only exceptions and explicit verified remote aliases. Generated assets are rebuilt and ignored in Git. The manifest starts empty; no client media was copied.
- Shared ResponsiveImage, EditorialImage and RichText public rendering integrated into neutral page/post bodies and justified gallery previews. Gallery sizes follow actual row widths; lightbox originals/order remain intact. Installed PortableText detects native edit metadata before custom public renderers, preserving editor ownership; authenticated editor interaction was not exercised in this backport.
- Neutral Card with shared spacing, media/metadata/body/action slots, heading levels, horizontal/stacked layout and equal-height action alignment. No hockey variants, yellow controls or client tokens.
- PartnersPanel, partnersFromEntries and optional CMSPartnersPanel with published queries, no fixed cap, cache hints and actual media storage keys. No sponsor seed is installed. Complete-collection behavior was verified against installed EmDash 1.1.0 query source; adoption still requires defining the site's collection and editor acceptance.
- Bounded, allowlisted 10-minute private form recovery, one-time consumption, native/legacy calendar-date validation and configurable error-summary presentation. No client emails/locales/timezone, submission model or delivery provider was copied. Session storage and application validation remain per-site configuration.
- Opt-in dark-surface focus role and public-link protocol validation.
- Migration, multi-page audit and production-release guidance for image provenance, alt text, practical density, prerequisites, localization and code/CMS/media separation. Tests are wired into CI.

## Verification

- Utilities: 5 passing tests (native/legacy date validity; allowlist, bounds, expiry and consumption; partner ordering/activity/storage keys; safe link protocols; actual variant pixel dimensions/orientation/cache reuse).
- Existing design workflow: 8 passing tests. Existing galleries: 6 passing tests. **19 passing total.**
- Astro check: 30 files, zero errors/warnings/hints. Node production build passes, including automatic preparation (empty neutral media tree). Existing large-bundle advisory remains.
- Art-direction gate passes exact path/hash exceptions for authorized neutral infrastructure; no invented client direction was added. Diff whitespace check passes.
- Temporary independent rendering fixture tested at 1440 and 390 pixels: uneven card copy retains aligned actions, artwork loads, no horizontal overflow, error-summary link focuses the intended input. Screenshots desktop.png/mobile.png are verification fixtures, not a client design. No CMS save/import or form submission was performed. Fixture route/image and helper server were removed/stopped.

Use docs/reusable-public-patterns.md for configuration, component examples and launch checks. New sites still choose their identity, content model, storage/runtime, locales and form provider. The neutral Node starter has no Cloudflare script; its guide explains adding the media hook when that runtime is selected.
