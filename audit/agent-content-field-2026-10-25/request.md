Add an optional reading-time field to posts in this existing Fieldnote Notes
site. Editors should be able to enter a whole number from 1 through 60 minutes.
Use the field name `readingMinutes` and label it “Reading time (minutes)”.

Show the value as “5 min read” on the post detail, below the publication date.
Set it to 5 on “A clearer brief”. Keep reading time out of Home and the Posts
listing. Existing entries without the field must continue to work and show no
reading-time label; editors must be able to leave or clear it. Reject fractions,
non-numeric values and numbers outside the requested range.

Preserve the current design, tokens, navigation, URLs, existing copy/images,
publication dates, draft behavior and all unrelated content. Keep the current
dependencies and lockfile. This is an authorized local maintenance task: use
the installed instructions and complete the implementation and applicable
verification without reopening settled site decisions.

Work only in `C:/dev/baseline-field-maintenance-20261025-run1`. Do not edit the
Baseline source checkout or any other site. No deployment, backend configuration,
login, credentials, remote commits or external messages are authorized. Local
browser inspection and temporary local build fixtures are allowed; remove your
temporary fixtures and stop any processes you start.

Report changed files, checks actually run, failed attempts, content preservation,
and any editor acceptance still pending. Leave a short resumable handoff in the
existing project when the local work is complete. Do not commit the result.
