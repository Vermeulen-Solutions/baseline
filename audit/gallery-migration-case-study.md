# Legacy WordPress gallery migration: architectural case study

Privacy-edited summary, 2026-10-16. This replaces a client-specific historical report. Names, paths, deployments, album slugs, source attachment IDs and client counts are intentionally omitted. It is architectural guidance, not a reproducible client acceptance receipt or certification of Cloudflare.

The original diagnosis found that preserving ordered image positions and copying files into a public folder did not establish Media Library ownership. Legacy attachment strings could render through a custom map while the CMS picker remained empty. A second migration showed why large albums need bounded editor and public-performance trials rather than an assumed universal image-count limit.

Reusable repair sequence:

1. Preserve a private recovery snapshot and record source membership, intentional duplicates, order, captions, alt text, covers and locales.
2. Register originals through supported EmDash media APIs; bind each source attachment to an instance-specific media identity. A static URL is not that identity.
3. Add native fields through supported schema APIs and convert with revision checks. Stop for drafts, locks, unresolved assets or unexpected source differences.
4. Verify selection, reordering, caption editing, save/reload and publishing on a disposable supported editor surface. Compare the rendered public sequence separately.
5. Retire legacy fields only after verification and authorization. Update fresh-install seeds separately from existing database migrations.

Current behavior and limitations belong to [gallery workflow](../docs/gallery-workflow.md) and the [scoped standards receipt](certification-2026-10-16/README.md). The observed gallery outer-key regeneration must not be represented as full metadata preservation.
