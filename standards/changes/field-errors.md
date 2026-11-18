---
bump: minor
platforms: [emdash, static]
areas: [components, docs]
adoption: copy
visible: yes
database: no
files: [src/components/Form.astro]
---

# Inline field errors in enhanced forms

An enhanced `Form.astro` shows a message under a field once the visitor has touched it and left it invalid (`:user-invalid`, with a blur fallback), never on load.

- **Message text:** written in the page's language through `data-error-required`, `data-error-type` and the other `data-error-*` attributes, falling back to the browser's own message.
- **Screen readers:** the message joins the field's `aria-describedby` (an existing hint stays) and sets `aria-invalid`.
- **Clearing:** both are removed as soon as the value is valid. Server errors from `FormError` are untouched.

## For sites

Copy `src/components/Form.astro`, then add `data-error-*` messages in the site's languages to the fields of each form.
