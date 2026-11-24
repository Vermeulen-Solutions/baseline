---
bump: minor
platforms: [emdash, static]
areas: [components, styles, tooling, skills, docs]
adoption: copy
visible: yes
database: no
files: [src/lib/page-transition-script.ts, src/styles/expressive.css, scripts/record-motion.mjs, scripts/check-art-direction.mjs]
---

# Page changes: a card's parts travel as one object, and four more styles

On sites that set `SiteShell transitionStyle` with cross-document transitions (the starter default):

- **A picked card's parts travel together.** Its photograph, title and any part the site marks (`data-vt-part="date"` in the card, `data-vt-hero-part="date"` on the detail page; `[data-vt-title]` and `[data-vt-hero-title]` for the title) morph into their places on the detail page, and back into the card on history Back or a link marked `data-vt-direction="back"`. Only the picked card is named. A Card's plain `.card-title` is not a part, because a part with no partner on the next page fades on its own. Text parts keep their proportions while they grow, and the held header stays above everything that moves.
- **Four more styles:** `iris` (a circle opening from the point the visitor clicked), `blinds` (six vertical strips), `slide` (the new page slides over the old one from the side) and `stack` (the new page is laid over the old one from below). They are clip paths and transforms on the root snapshots, with reduced motion and the other styles' fallbacks.
- **Arrival works in every browser that runs view transitions:** `[data-arrive]` elements now get their own names (`arrive-1`, `arrive-2` …) from the head script. The stylesheet's generated names (`match-element`) never pair across documents, and Safari ignores them there; they stay for `<ClientRouter />`.
- `record:motion -- --navigate "<link selector>" [--back]` films a page change from a real mouse click, so a review can judge the transition and not only a scroll.
- World-building and the reusable-patterns guide say which style suits which kind of world; the impression tier lists Interlude's other twelve non-WebGL transitions with the world each suits, and moves to `lenis@1.3.28` (a fix for `destroy()` with `autoToggle`).

## For sites

Copy the listed files; take `SiteShell.astro`'s `TransitionStyle` import and `global.css`'s view-transition rules by hand (the `vt-part` rules and the header group's `z-index`), or through `site:files` where the site has not changed them. To make an entry travel, mark its parts at both ends. A site on `lenis@1.3.27` can stay there; new impression sites install 1.3.28. Look at a page change in a browser with motion allowed after adopting.
