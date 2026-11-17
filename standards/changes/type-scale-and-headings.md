---
bump: minor
platforms: [emdash, static]
areas: [styles]
adoption: manual
visible: yes
database: no
files: [src/styles/global.css]
---

# Type steps, heading sizes and a resize-text rule in the starter stylesheet

The starter `global.css` gains a fluid space scale, type steps 3 to 5, a heading map and tokens for motion, layering and breakpoints. Headings h3 to h6 now have sizes (h3 step 0, h4 body size, h5/h6 step −1); before, they inherited the body size. The two text bridges are retuned to the new 2.5× resize-text rule: `--text-step-2-to-0` starts at 21px (was 16px) and `--text-step-3-to-1` at 28px (was 20px), so hero text using them is larger on phones. Three timings were rounded to tokens (180ms and 220ms to 200ms, 240ms to 250ms). Every theme token is emitted with `@theme static`.

## For sites

`global.css` is site-owned and calibrated, so nothing changes until a site merges it. Merging the heading map and bridges changes how pages look: decide per site, capture routes before and after (`capture:routes`), and record the decision. A site that keeps its stylesheet sees a warning from `design:tokens` for the resize-text ratio, not a failure. The new tokens are optional vocabulary; an older stylesheet stays valid. Details: the design-system section at the top of `docs/baseline-updates.md`.
