---
bump: none
---

# Tests read sources as LF

Four tests matched source patterns with LF line endings and failed in a CRLF checkout (`core.autocrlf=true` on Windows): the before/after contract, two interaction-hardening checks and the Sveltia gate test. They now normalize what they read. Found by the 0.4.0 clean-clone certification; nothing changes for sites.
