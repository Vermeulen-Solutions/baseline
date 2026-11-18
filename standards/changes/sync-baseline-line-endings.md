---
bump: patch
platforms: [static]
areas: [tooling]
adoption: copy
visible: no
database: no
files: [scripts/sync-baseline.mjs]
---

# Bounded sync ignores line endings when it compares local files

`sync:baseline` hashed local files byte for byte against upstream's LF hashes. On Windows, Git with `core.autocrlf=true` rewrites a managed file to CRLF the next time it touches it, and the next sync reported that unchanged file as a local conflict. A local file now matches its recorded or incoming hash in either line-ending form, so this works whether the receipt was written from LF or CRLF bytes.

## For sites

Copy `scripts/sync-baseline.mjs` whole before the next `sync:baseline`. A file that was reported as a conflict only because of line endings then applies normally.
