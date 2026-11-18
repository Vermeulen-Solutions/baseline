---
bump: patch
platforms: [emdash]
areas: [skills]
adoption: sync
visible: no
database: no
---

# Contact forms: score suspicious submissions, flag or hold them, never lose one

The contact-forms reference of the production cutover skill gains a section on what gets past the honeypot and rate limit:

- store every accepted submission first, then score it, with each signal adding points and a reason a person can read;
- mail messages below a flag line as normal, mail those above it with a subject marker and the reasons at the top, and only store those above a hold line;
- list held submissions for the owner and never delete them automatically;
- calibrate the thresholds on the site's own stored spam;
- treat request country and unsigned timing fields as weak signals;
- set a retention period and name the storage in the privacy notice.

Two acceptance rows cover the flag and hold paths.

## For sites

Take the skill with the next skill sync. A site with a native contact form should add scoring when spam starts reaching the inbox, starting with a flag line only and adding a hold line once the stored spam shows where it should sit.
