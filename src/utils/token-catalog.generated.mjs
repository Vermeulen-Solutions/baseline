/**
 * GENERATED FILE - DO NOT EDIT BY HAND.
 *
 * Derived from src/styles/global.css by scripts/generate-token-catalog.mjs.
 * Regenerate with: npm run tokens:generate
 * The guard in tests/token-coverage.test.mjs fails when this file is stale.
 */

/** Token catalogue, grouped for the panel. Shape: [key, label, cssProperty, readonly?]. */
/** @type {Array<{id: string, label: string, help: string, tokens: Array<[string, string, string, boolean?]>}>} */
export const tokenGroups = [
	{
		id: "typography",
		label: "Typography",
		help: "Fluid sizes keep their clamp expressions. Fonts must already be available on the site.",
		tokens: [
		['--font-body', "Body font", "font-family"],
		['--font-display', "Display font", "font-family"],
		['--text-step--1', "Small text", "font-size"],
		['--text-step-0', "Body text", "font-size"],
		['--text-step-1', "Heading 2", "font-size"],
		['--text-step-2', "Heading 1", "font-size"],
		['--text-step-3-to-1', "Fluid display pair", "font-size"],
		['--text-step-2-to-0', "Fluid text pair", "font-size"],
		],
	},
	{
		id: "spacing",
		label: "Spacing & layout",
		help: "Tune rhythm, container gutters and reading widths. Density scales the entire spacing family.",
		tokens: [
		['--spacing-content', "Content rhythm", "gap"],
		['--spacing-grid', "Grid gap", "gap"],
		['--spacing-container', "Container gutter", "padding"],
		['--spacing-section', "Section space", "padding"],
		['--spacing-2xl-to-md', "Fluid space 2XL → MD", "gap"],
		['--spacing-xl-to-sm', "Fluid space XL → SM", "gap"],
		['--measure-reading', "Reading width", "max-width"],
		['--measure-content', "Content width", "max-width"],
		['--measure-content-safe', "Safe content width (derived)", "max-width", true],
		['--measure-wide', "Wide width", "max-width"],
		['--header-height', "Header offset", "height"],
		['--scroll-offset', "Scroll clearance", "scroll-margin-top"],
		],
	},
	{
		id: "colors",
		label: "Colors",
		help: "Semantic roles accept CSS colors, including OKLCH. Check text and focus contrast on light and dark surfaces.",
		tokens: [
		['--color-page', "Page background", "color"],
		['--color-surface', "Surface", "color"],
		['--color-text', "Text", "color"],
		['--color-muted', "Secondary text", "color"],
		['--color-border', "Border", "color"],
		['--color-action', "Action / Accent", "color"],
		['--color-on-action', "Text on action", "color"],
		['--color-focus', "Focus ring", "color"],
		['--color-focus-on-dark', "Focus on dark", "color"],
		],
	},
	{
		id: "effects",
		label: "Shape & effects",
		help: "Shared radii, layered shadows and motion curves. Hero adjustments affect media marked data-hero-asset.",
		tokens: [
		['--radius-control', "Control radius", "border-radius"],
		['--radius-card', "Card radius", "border-radius"],
		['--shadow-sm', "Small shadow", "box-shadow"],
		['--shadow-md', "Medium shadow", "box-shadow"],
		['--shadow-lg', "Large shadow", "box-shadow"],
		['--ease-smooth', "Smooth easing", "transition-timing-function"],
		['--ease-snappy', "Snappy easing", "transition-timing-function"],
		['--ease-spring', "Spring easing", "transition-timing-function"],
		],
	},
];

/** Tokens the panel can write that deliberately have no authored value in global.css. */
/** @type {Array<{token: string, reason: string}>} */
export const writeOnlyTokens = [
	{ token: "--font-weight-display", reason: "Written by the display-weight control and the family calibration; consumed as font-weight: var(--font-weight-display, 700)." },
	{ token: "--letter-spacing-display", reason: "Written by the tracking control; consumed as letter-spacing: var(--letter-spacing-display, normal)." },
	{ token: "--hero-filter", reason: "Written by the hero brightness/contrast/saturation controls; consumed as filter: var(--hero-filter, none) on media marked data-hero-asset." },
	{ token: "--page-pattern", reason: "Written by the surface pattern controls; consumed as background-image: var(--page-pattern, none)." },
	{ token: "--page-pattern-size", reason: "Written together with --page-pattern; consumed as background-size: var(--page-pattern-size, auto)." },
];
