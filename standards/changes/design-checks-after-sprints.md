---
bump: minor
platforms: [emdash, static]
areas: [tooling, skills, docs]
adoption: copy
visible: no
database: no
files: [scripts/check-art-direction.mjs, scripts/audit-composition.mjs, scripts/check-quality.mjs, tests/world-record.test.mjs, tests/audit-composition.test.mjs, tests/check-quality.test.mjs]
---

# Design checks: motion names, unloaded pictures, and the first-screen checks at Stage 5

Seven design sprints on a frozen release met three faults in the design checks.

- **Motion names.** `check:art-direction` read every backticked word on the record's World › Motion line as an animation the site promises, so a record that also named its page-transition style, `data-arrive` or the scroll library failed `audit:composition` on `world-motion` for an animation nobody promised (five of seven runs). A motion is now a backticked name followed by a colon or a bracket and what it belongs to (`stamp-lands`: the stamp on the label); when the line uses that form, only those names count. The starter's own words (`fade`, `lift`, `curtain`, `wipe`, `data-arrive`, `Lenis`, `prefers-reduced-motion` and similar) are never counted. A line that only lists names with commas is read as before.
- **Unloaded pictures.** `audit:composition` measured a page before every lazy picture had loaded, then read the picture's `src` attribute, the small fallback beside its srcset, and reported `soft-photo` for a full-width photograph the browser shows from a large file. It now brings each pending picture into view and waits for it, and a picture with a srcset counts only by the file the browser chose.
- **First-screen checks at Stage 5.** Three of seven runs finished with a scroll-driven entrance caught part-way on the first screen, which reviewers saw as a crooked card at load; `check:quality` reports it, but only at Stage 6. `check:quality -- --only <kind,kind>` reports the named kinds and nothing else, and the Stage 5 comparison pass now runs `--only first-viewport-hidden,first-viewport-scroll-motion` on the served build before a page is called finished.

## For sites

Copy the files. Nothing changes on a built site. A record whose Motion line names a starter word in the described form (`lift`: between pages) no longer counts it towards the three motions the gate asks for: name the world's own animations. The Stage 5 step arrives with the usual skill sync.
