---
version: alpha
name: Neutral starter interoperability specimen
description: Documentation-only example; source CSS and AGENTS.md retain authority.
colors:
  primary: "oklch(43% 0.14 250)"
  on-action: "oklch(100% 0 0)"
  action-alias: "{colors.primary}"
typography:
  body:
    fontFamily: "ui-sans-serif, system-ui, sans-serif"
    fontWeight: 400
rounded:
  control: "0.375rem"
omitted:
  - section: spacing
    reason: Fluid expressions are preserved in mapping.json rather than flattened.
  - section: components
    reason: Existing Astro APIs are authoritative.
---
# Neutral interoperability specimen

## Overview
A local documentation experiment with synthetic component/content shapes. It creates no client identity and does not authorize visual implementation. Desktop and mobile reference composition is the existing development styleguide, using authored geometric SVG assets.

## Colors
Primary maps to the shipped action role. The alias tests token reference resolution. Contextual focus ink stays in CSS; a swatch is not a complete theme.

## Typography
The body role records the real source font stack and a representative normal weight. Font size is deliberately omitted: its fluid source expression cannot be represented losslessly by the alpha dimension schema. See mapping.json.

## Layout
Use intrinsic grids and the actual reading/content/wide Containers. Preserve fluid spacing and responsive composition in source.

## Elevation & Depth
No new shadow system is introduced.

## Shapes
The control radius maps to the existing source token.

## Components
Reuse the actual styleguide primitives; this document does not generate CMS-ready templates.

## Do's and Don'ts
Keep authored rationale and source expressions. Never paste exporter output over global.css. No external account is required for this local path.
