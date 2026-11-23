---
bump: minor
platforms: [emdash, static]
areas: [skills, tooling]
adoption: copy
visible: no
database: no
files: [scripts/audit-composition.mjs, tests/audit-composition.test.mjs]
---

# The composition audit reads whether the text can be read

Nine trial sites from three rounds were scored by eye on six questions (does the look come from the client's own thing, is there a feature that does the visitor's job, can it be done on a phone, craft, the made things, one idea carried through). Craft was the lowest question in every round, and what cost the points was nearly always text: date cards a few letters wide on a phone, a ticket wider than the phone, a plan whose labels came out at 5px, a caption in white script over white flowers. The agents that build these sites cannot look at a screenshot, so the audit has to see these for them.

`audit:composition` now reads four more things from the lines of text on the page, at the wide and at the narrow width:

- **`text-cut`:** a line cut off by a frame or by the edge of the screen: a tenth of its width or more, while part of it shows. A strip made to move sideways, an ellipsis and a word set over 72px (which may bleed off the page on purpose) are left out.
- **`text-squeezed`:** one run of text, up to 32px, wrapped onto three lines or more with under eight characters a line. Lines broken on purpose are separate runs and do not count.
- **`text-tiny`:** text of three letters or more painted under 9px, counting the scale of the drawing it sits in.
- **`text-unreadable`:** a line that cannot be told from the picture behind it. The page is photographed with its text unpainted, once with the letters' shadows and once without, and each line's colour is held against what is behind its box. A line counts when it would stand out by less than 2 to 1 (type of 24px and more) or 3 to 1 over 30% of its box in both pictures, and the ground is a picture. A flat ground stays with the contrast check in `audit:ui`.

All four are floor findings for a direction whose record has a `Sources` line and advisories on older sites, like `text-collision`. Text in a turned object (a stamp, a card set at an angle) now counts for the size and the width measures and is still left out of the collisions.

World building says what usually causes each one in a built world and where its fix is: in the object, not in the words.

## For sites

Copy the two files; the guidance arrives with the usual skill sync. A direction made with sources makes every line readable at both widths before `audit:composition` passes. The audit takes two full-page screenshots more per route and width.
