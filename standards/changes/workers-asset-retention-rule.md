---
bump: patch
platforms: [emdash]
areas: [delivery, tooling]
adoption: none
visible: no
database: no
---

# The Workers HTML cache rule accepts asset retention on deploy

`fleet:status` and `audit:site` asked every Workers site with its own cache provider to key HTML per build. A site that keeps Astro's native provider and carries the previous builds' hashed assets forward on deploy (`assets:retain` in its build or deploy script) is just as safe: cached HTML from an earlier deploy still finds its stylesheets. Such a site now passes the rule.

## For sites

Nothing. A site that relies on asset retention runs it from its build or deploy script, so the rule can see it.
