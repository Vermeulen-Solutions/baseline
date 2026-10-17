/**
 * Optional annotations for the generated token catalogue.
 *
 * Everything here is optional. The catalogue's membership, grouping and roles are
 * derived from src/styles/global.css by scripts/generate-token-catalog.mjs; this file
 * only records the things a stylesheet cannot express:
 *
 *   labels   - friendly names. Delete an entry and a name is derived from the token instead.
 *   deltas   - per-token overrides for role or the derived-value flag.
 *   writeOnly- tokens the panel can write that deliberately have no authored value.
 *
 * Regenerate with: npm run tokens:generate
 */

/** Friendly names, carried over from the hand-written catalogue this replaced. */
export const labels = {
	"--font-body": "Body font",
	"--font-display": "Display font",
	"--text-step--1": "Small text",
	"--text-step-0": "Body text",
	"--text-step-1": "Heading 2",
	"--text-step-2": "Heading 1",
	"--text-step-3-to-1": "Fluid display pair",
	"--text-step-2-to-0": "Fluid text pair",
	"--spacing-content": "Content rhythm",
	"--spacing-grid": "Grid gap",
	"--spacing-container": "Container gutter",
	"--spacing-section": "Section space",
	"--spacing-2xl-to-md": "Fluid space 2XL → MD",
	"--spacing-xl-to-sm": "Fluid space XL → SM",
	"--measure-reading": "Reading width",
	"--measure-content": "Content width",
	"--measure-wide": "Wide width",
	"--measure-content-safe": "Safe content width (derived)",
	"--header-height": "Header offset",
	"--scroll-offset": "Scroll clearance",
	"--color-action": "Action / Accent",
	"--color-page": "Page background",
	"--color-text": "Text",
	"--color-muted": "Secondary text",
	"--color-surface": "Surface",
	"--color-border": "Border",
	"--color-on-action": "Text on action",
	"--color-focus": "Focus ring",
	"--color-focus-on-dark": "Focus on dark",
	"--radius-control": "Control radius",
	"--radius-card": "Card radius",
	"--shadow-sm": "Small shadow",
	"--shadow-md": "Medium shadow",
	"--shadow-lg": "Large shadow",
	"--ease-smooth": "Smooth easing",
	"--ease-snappy": "Snappy easing",
	"--ease-spring": "Spring easing"
};

/** Per-token overrides: `property` (semantic role) and `readonly` (value is composed from other tokens). */
export const deltas = {
	"--measure-content-safe": {
		"readonly": true
	},
	"--spacing-container": {
		"property": "padding"
	},
	"--spacing-section": {
		"property": "padding"
	}
};

/** Tokens the panel can write that have no authored value in global.css. Each needs a reason. */
export const writeOnly = [
	[
		"--font-weight-display",
		"Written by the display-weight control and the family calibration; consumed as font-weight: var(--font-weight-display, 700)."
	],
	[
		"--letter-spacing-display",
		"Written by the tracking control; consumed as letter-spacing: var(--letter-spacing-display, normal)."
	],
	[
		"--hero-filter",
		"Written by the hero brightness/contrast/saturation controls; consumed as filter: var(--hero-filter, none) on media marked data-hero-asset."
	],
	[
		"--page-pattern",
		"Written by the surface pattern controls; consumed as background-image: var(--page-pattern, none)."
	],
	[
		"--page-pattern-size",
		"Written together with --page-pattern; consumed as background-size: var(--page-pattern-size, auto)."
	]
];
