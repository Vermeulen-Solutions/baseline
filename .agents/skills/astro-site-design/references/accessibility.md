# Accessibility for Astro sites

Use WCAG 2.2 AA as the default target unless the project sets a different standard. This checklist guides implementation and review; it is not a substitute for a full conformance evaluation or legal advice. Consult the [W3C WCAG 2.2 Quick Reference](https://www.w3.org/WAI/WCAG22/quickref/) when a criterion is unclear.

## Structure and content

- Use landmarks and semantic HTML in a logical page outline. One clear page-level heading is typical; heading levels should describe the content hierarchy rather than visual size.
- Give links clear purposes and controls accessible names. Use anchors for navigation and buttons for actions; don't use click handlers on generic containers to imitate native controls.
- Supply meaningful alternative text for informative images, empty alternatives for decorative images, and accessible names/instructions for icon-only controls.
- Preserve language metadata, labels, captions, table headers, and other relationships that make content understandable. CMS content still needs editorially meaningful headings, link text, and image alternatives.

## Interaction

- All functionality must work using a keyboard. Provide a visible `:focus-visible` indicator with adequate contrast, a logical focus order, and no keyboard traps. Ensure sticky headers, dialogs, menus, and overlays do not hide focused content.
- Forms need persistent labels, understandable required/format instructions, errors tied to fields, and a way for assistive technology users to discover submission results and async status updates. Give fields that collect the visitor's own details the matching `autocomplete` token (`name`, `email`, `tel`, `postal-code` and similar; WCAG 1.3.5), and do not ask again for information already entered in the same process (WCAG 3.3.7).
- Do not rely on color, hover, sound, or motion alone to convey information or state. Implement `prefers-reduced-motion` behavior for nonessential animation.
- Make pointer targets at least the WCAG 2.2 AA minimum of 24 by 24 CSS pixels or meet a documented exception; aim larger (around 44 by 44 CSS pixels) for touch comfort when layout permits. See WCAG 2.5.8 and its exceptions in the [W3C Quick Reference](https://www.w3.org/WAI/WCAG22/quickref/).

## Visual and responsive checks

- Verify text and non-text contrast for every semantic color pair, including focus, disabled, selected, and hover states. Check actual backgrounds and overlays; OKLCH or generated tint scales do not guarantee contrast.
- Ensure text can resize and pages reflow without losing content or functionality. Check 200% text resizing, 400% browser zoom (roughly 320 CSS pixels of inline space from a 1280-pixel viewport), long labels, translated text, user-increased line/paragraph/letter/word spacing, and keyboard focus near sticky/fixed UI. Test the rendered page; fluid `clamp()` or container queries do not guarantee reflow by themselves. `audit:ui` runs enlarged-text cases (a larger root size and text-only enlargement); run it on every page type a design pass touched before the owner looks, since phone users with enlarged text are where fixed-width screenshots miss breakage.
- For a card or row that should stack when its own box runs short, a container query in `rem` follows the reader's text size (`@container (max-width: 24rem)`), where a viewport breakpoint does not. `container-type: inline-size` takes away the box's intrinsic width: on an element its parent sizes by content (`justify-self: start`, `width: fit-content`, a flex item without a basis), the box collapses to zero width and its text runs off. Give such a box a definite width (`width: 100%` or a grid track) or put the container on a wrapper that already has one.
- Check that layouts don't encode essential meaning solely through position, shape, or visual grouping. Preserve visible labels and programmatic relationships.

## Validation

For actual screen-reader behavior or announcement/focus defects, use [bounded screen-reader checks](screen-reader-checks.md). Record the reader/platform and observed task result; keep an unoperated reader check explicitly unverified rather than inferring speech from the DOM.

- Review with keyboard only at minimum. Use automated accessibility checks as issue finders, not proof of conformance; they cannot verify editorial quality, all focus behavior, or whether the interface makes sense.
- Inspect representative page types and interactive states at desktop and mobile widths. Record what was checked and any limitations; don't claim WCAG conformance without an appropriate full evaluation.
