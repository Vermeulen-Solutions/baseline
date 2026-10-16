# Justified gallery review: redacted historical summary

Original review: 2026-10-02. Privacy-edited: 2026-10-16. Client names, deployment identifiers, editorial content, URLs and machine paths have been removed. This summary preserves architectural lessons rather than client acceptance evidence.

An earlier implementation used the MIT-licensed Flickr justified-layout library with ResizeObserver. Intrinsic-size feedback caused overflow during desktop-to-mobile resizing; containing gallery width resolved that failure. Editorial order, duplicates, captions, alt text and focus return were separate checks from visual row filling.

The current starter uses CSS-based justified rows, not that earlier JavaScript layout implementation. Current tests and local visual fixtures are authoritative for present behavior. Stored dimensions reserve space; they do not establish a universal zero-CLS guarantee. Check missing dimensions, long captions, final rows, no-JS links, reduced motion and lightbox focus at narrow/intermediate/wide widths.

The accompanying [route summary](justified-gallery-route-check.json) has had all real routes removed. Historical client deployment tests do not certify the starter's optional Worker/D1/R2 profile. Follow [gallery workflow](../docs/gallery-workflow.md) for current acceptance.
