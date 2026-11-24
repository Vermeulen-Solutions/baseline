---
bump: patch
platforms: [emdash, static]
areas: [styles]
adoption: manual
visible: no
database: no
---

# The `hidden` attribute always hides

A piece that sets its own `display` (a row laid out as a grid, a flex list item) stayed on screen when a script gave it the `hidden` attribute, because an author rule outweighs the browser's own rule for `hidden`. A programme filter built in a trial could not hide its rows until a rule was added by hand.

The starter's base layer now opens with:

```css
[hidden]:not([hidden="until-found"]) {
	display: none !important;
}
```

`hidden="until-found"` is left to the browser. Nothing the starter shows changes: its own components already hid what they marked hidden.

## For sites

Sites own `src/styles/global.css`: add the rule at the top of `@layer base`. Before adding it, search the site for a rule that deliberately shows an element carrying `hidden`; none is expected, and such an element should lose the attribute instead.
