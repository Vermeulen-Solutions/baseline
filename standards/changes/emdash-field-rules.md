---
bump: patch
platforms: [emdash]
areas: [skills]
adoption: sync
visible: no
database: no
---

# Content-modeling skill: field rules EmDash does and does not enforce

The emdash-content-modeling skill now records schema behaviour verified on EmDash 1.5.0: `required` and `unique` cannot change on an existing field (`FIELD_UPDATE_REQUIRES_MIGRATION`), so fields added to a live collection start optional and templates enforce the rule; repeater sub-fields drop `maxLength` and other validation without an error, so components must tolerate any length; seeds and scripts must write full ISO datetimes and compare booleans and images by their stored shapes; and a collection update that rewrites `supports` without `"seo"` turns the SEO panel off unless it sends `hasSeo`.

## For sites

Nothing: the next skill sync delivers it. A site that already put `maxLength` on repeater sub-fields should check that its components cope with longer values.
