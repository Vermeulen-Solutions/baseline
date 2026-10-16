# Accessibility for Astro sites

Use WCAG 2.2 AA as the default target unless the project sets a different standard. This checklist guides implementation and review; it is not a substitute for a full conformance evaluation or legal advice. Consult the [W3C WCAG 2.2 Quick Reference](https://www.w3.org/WAI/WCAG22/quickref/) when a criterion is unclear.

## Structure and content

- Use landmarks and semantic HTML in a logical page outline. One clear page-level heading is typical; heading levels should describe the content hierarchy rather than visual size.
- Give links clear purposes and controls accessible names. Use anchors for navigation and buttons for actions; don't use click handlers on generic containers to imitate native controls.
- Supply meaningful alternative text for informative images, empty alternatives for decorative images, and accessible names/instructions for icon-only controls.
- Preserve language metadata, labels, captions, table headers, and other relationships that make content understandable. CMS content still needs editorially meaningful headings, link text, and image alternatives.

## Interaction

- All functionality must work using a keyboard. Provide a visible `:focus-visible` indicator with adequate contrast, a logical focus order, and no keyboard traps. Ensure sticky headers, dialogs, menus, and overlays do not hide focused content.
- Forms need persistent labels, understandable required/format instructions, errors tied to fields, and a way for assistive technology users to discover submission results and async status updates.
- Do not rely on color, hover, sound, or motion alone to convey information or state. Implement `prefers-reduced-motion` behavior for nonessential animation.
- Make pointer targets at least the WCAG 2.2 AA minimum of 24 by 24 CSS pixels or meet a documented exception; aim larger (around 44 by 44 CSS pixels) for touch comfort when layout permits. See WCAG 2.5.8 and its exceptions in the [W3C Quick Reference](https://www.w3.org/WAI/WCAG22/quickref/).

## Visual and responsive checks

- Verify text and non-text contrast for every semantic color pair, including focus, disabled, selected, and hover states. Check actual backgrounds and overlays; OKLCH or generated tint scales do not guarantee contrast.
- Ensure text can resize and pages reflow without losing content or functionality. Check 200% text resizing, 400% browser zoom (roughly 320 CSS pixels of inline space from a 1280-pixel viewport), long labels, translated text, user-increased line/paragraph/letter/word spacing, and keyboard focus near sticky/fixed UI. Test the rendered page; fluid `clamp()` or container queries do not guarantee reflow by themselves.
- Check that layouts don't encode essential meaning solely through position, shape, or visual grouping. Preserve visible labels and programmatic relationships.

## Validation

- Review with keyboard only at minimum. Use automated accessibility checks as issue finders, not proof of conformance; they cannot verify editorial quality, all focus behavior, or whether the interface makes sense.
- Inspect representative page types and interactive states at desktop and mobile widths. Record what was checked and any limitations; don't claim WCAG conformance without an appropriate full evaluation.
