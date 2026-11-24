---
bump: patch
platforms: [emdash, static]
areas: [skills, tooling]
adoption: copy
visible: no
database: no
files: [scripts/design-look.mjs, tests/design-look.test.mjs]
---

# The craft pass can be followed as written, and the look tool reads its routes on Windows

Baseline's craft pass (critique, the refine commands, polish) was run for the first time on three trial sites, by two models. All three runs found real faults and fixed them, and all three stumbled on the same places in the pass itself.

- **`polish` is a procedure, not a command.** `impeccable-passes.md` said to "run `polish <page source>`"; the launcher has no such command. The pass now says to follow `polish.md`.
- **The snapshot is read before the first fix.** The helper fingerprints the page's source file, so after the first edit `critique-storage latest` and `close` exit 2 and the backlog is closed by the helper. The pass now says to read the snapshot once before fixing, to work from that body, and that exit 2 afterwards is the expected end.
- **Three things a job needs and the references do not say:** the overlay's live server takes `--port`; the context loader's closing-sentence directive belongs to an interactive session; and a page with a pinned scene or an arrival is also looked at once with motion allowed, because the capture tools take their pictures with motion reduced.
- **`design:look` puts a route back** when Git Bash has rewritten `/` or `/about` into a path under its install folder, as the other capture tools already do. One run captured the wrong page and overwrote its look file.

Not fixed here: inside a site whose tokens have been changed, two of the starter's own spacing-token tests fail, so `npm run verify` is red before any edit.

## For sites

Copy `scripts/design-look.mjs` and the `new-site-workflow` skill.
