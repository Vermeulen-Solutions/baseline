---
bump: minor
platforms: [emdash, static]
areas: [skills]
adoption: copy
visible: no
database: no
files: [.agents/skills/astro-site-design/references/smooth-scroll.md]
---

# Smooth scroll and page transitions for impression-led sites

Sites whose job is the impression (an architect, a caterer, a studio, an event) often smooth the wheel scroll so that pages staged on the scroll glide and settle. Baseline treated any scroll library as out of scope, and its own page transitions (`transitionStyle`, `data-arrive`) went unused: trial sites with rich pages left every page change a plain cut.

- New skill reference `astro-site-design/references/smooth-scroll.md`: when to reach for smoothed scrolling (the site's job is the impression and its sections are staged on the scroll) and when to leave the scroll native (a task, a lookup, a service), a component built on Lenis 1.3.27 that keeps sticky positioning, anchors, the skip link, keyboard scrolling, touch scrolling and CSS scroll-driven animations working, honours reduced motion, and survives both cross-document transitions and `<ClientRouter />` (Lenis's `autoToggle` leaves the next page unscrollable under the client router, so it is left off), and the checks to run on the built site.
- The motion range in `site-art-direction` names the impression as a reason for the upper end, and the World's motion adds two layers that carry it across the site: the page transition chosen from the world, and, for an impression-led site, the smoothed scroll.

## For sites

Copy the reference. Nothing changes until a site records the choice and installs `lenis`.
