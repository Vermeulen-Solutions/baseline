# Obsidian & Lime → Baseline: what was kept, changed and refused

Concept mockup for Baseline's own site, built from an external design prompt ("Obsidian & Lime" glassmorphism). It is review material under `audit/visual-concepts/`, not shipped code and not an approved art direction.

The point of the exercise: an external prompt is a **brief**, not a specification. Structure, pacing and devices travel; literal fonts, hex values and fabricated proof do not. This file records the translation so the same pass can be applied to the next prompt mechanically.

## The order that works

1. **Roles before colours.** Map every colour mention onto the site's semantic roles (page, surface, elevated, text, muted, border, action, focus). Anything that cannot name a role is decoration and does not get to be a token.
2. **Type names before type files.** Replace named webfonts with the site's stacks; carry the *character* through weight, tracking and case instead.
3. **Constants get names.** A 60 px grid is a decorative rhythm: `--grid-cell`, not `60px` scattered through rules.
4. **Proof stays real.** Remove testimonial portraits, metric counters and client logos unless the owner supplied them; substitute something the project actually produced.
5. **Motion is conditional.** Every animation gets a `prefers-reduced-motion` branch before it ships.
6. **Measure, then claim.** Lint and contrast are checked, not asserted.

## Translation table

| Source spec | Decision | Baseline implementation |
| --- | --- | --- |
| "MUST use Space Grotesk and JetBrains Mono" | **Replaced.** A webfont is a dependency and a preflight decision, not a style note. | `ui-sans-serif` display/body and `ui-monospace` labels (the starter's existing families). Character carried by `-0.045em` display tracking and mono labels at `0.18em`, 11 px. |
| Shell `#000`, surfaces `#0c0c0c`, text `#ebebeb` | **Converted to roles** in OKLCH. | `--color-page`, `--color-surface`, `--color-text`, `--color-muted`. Values chosen so muted text measures 9.6:1 on the surface. |
| Primary accent `#ccff00`, "MUST" | **Kept as the single action role.** Converted, not copied. | `--color-action: oklch(93% 0.26 124)`, one role for buttons, dots, focus, gradient stop. |
| Secondary `#10b981` | **Kept, demoted.** | `--color-secondary: oklch(72% 0.16 160)`; used for one glow and one swatch label. Never for text on dark. |
| Hero at `7.5rem`, `line-height 0.85` | **Fluid, bounded.** | `clamp(3.1rem, 7.6vw, 7.5rem)` at `0.9` leading, `-0.045em` tracking; the 0.85 target collides at small widths. |
| Shell radius `2.5rem`, cards `2.5rem`, pill nav | **Split by object.** | `--radius-shell: 2.5rem`, `--radius-card: 1.5rem`, `--radius-pill`. A 2.5rem radius on a small card looks like a lozenge. |
| Glass at `rgba(255,255,255,0.03)` + `blur(16px)` | **Kept.** | Same recipe on cards and the specimen; text over glass is measured against the composed background, not the raw surface. |
| 60 px grid at 15% | **Kept, quieter.** | `--grid-cell: 60px` at 3.5% white; the source's 15% wins over the typography. |
| 15% noise overlay | **Reduced.** | Inline `feTurbulence` data URI at 5%; at 15% the small mono labels lose their edges. |
| "Large glow-sphere radial gradients, 120px blur" | **Kept, bounded.** | Two absolutely-positioned glows behind content, `aria-hidden`, no effect on layout. |
| Float `6s infinite`, pulse dot | **Kept, conditional.** | Same curve; both disabled under `prefers-reduced-motion`, along with transitions and smooth scroll. |
| 4-column bento, 2×2 large card, tall card | **Adapted to four 2-column cards.** | `.bento` is 4 columns at ≥900 px; each card spans 2. One column below 900 px. The type specimen card is new — it earns its cell by showing the scale it describes. |
| Light contrast section `#e5e5e5`, 4rem top radius | **Kept as the paper band.** | `--color-paper` and `--color-ink`; radius 4rem desktop, natural block on mobile. |
| Numbered circles 01–03 | **Kept.** | Mono numerals in bordered circles, real workflow steps with real commands. |
| "Greyscale circular portrait with a glass testimonial card" | **Refused.** | No client, no quote, no portrait exists. Replaced with the actual `verify:fast` → `build` → `audit:html` pass and a line stating what each check buys. |
| Footer watermark `SUPER` at 5% | **Renamed.** | `BASELINE` at 3.5%, `<span aria-hidden>`; the source's 5% sat on the copyright line. |
| "AI cursor" floating label | **Kept as an agent tag.** | `aria-hidden` mono tag on the specimen's top edge; it must not cover content, which is why it lives outside the card's padding box. |

## Content substitutions

Only statements the repository supports: Astro 7.4, Tailwind v4, EmDash 1.4, three profiles, MIT, the real script names, and the real check list. No metric, logo, quote or customer name was invented — the source prompt's testimonial slot became verification evidence instead.

## Recorded anti-patterns for this direction

- **No second accent as text.** Emerald stays decorative; action lime and neutral text carry all meaning.
- **No glass on glass.** One blurred layer over a ground; nested blur reads as mush.
- **No gradient headline without a solid fallback.** `-webkit-text-fill-color: transparent` is paired with an action-colour fallback.
- **No animation without its reduced-motion twin.**

## Verification

- `od lint --fail-on p1`: P0 0, P1 0, P2 0.
- Contrast, computed from rendered pixels with alpha compositing: 22 text pairs, lowest 5.79:1, all pass WCAG AA.
- Widths 390 / 768 / 1440: no horizontal overflow (`scrollWidth == clientWidth`), no console or page errors.
- Reviewed as a file, not in a canvas: `index.html` opened directly and through `npm run design:watch`.

## If this direction is chosen

It needs a real `## Art Direction Record` in `AGENTS.md` before any Astro implementation (this file is a concept record, not that record), and the type pairing must be decided explicitly — the system stacks are the Baseline default, not a brand choice. The next step would be one representative route built with native tokens and a `/_styleguide` calibration pass, not a second mockup.
