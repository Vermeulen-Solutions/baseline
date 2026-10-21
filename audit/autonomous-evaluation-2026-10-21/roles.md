# Live EmDash MCP role acceptance

All sixteen checks in [role-acceptance.json](role-acceptance.json) passed against
the owned synthetic EmDash 1.3 Node/SQLite site. Content operations used its real
stateless MCP HTTP endpoint. Fixture accounts alone were provisioned locally;
no production database, external account or working-site credentials were used.

Contributors created and edited owned drafts, but could neither publish them,
create an initially published item, nor edit another contributor's draft.
Stale revisions were rejected. An author could publish owned content but could
not edit someone else's draft. An editor could edit and publish another user's
content. A read-only editor token still could not create content. Revoking one
author token caused HTTP 401 without affecting an editor token.

Subscriber reads returned published content and refused the test draft by ID.
Contributors could read other users' drafts: read visibility and edit ownership
are separate boundaries. The guide now explains that the authoring preset is
not owner-only draft isolation and gives the narrower published-content option.
The local helper also refused a Contributor's requested schema-read grant.

Created permission-test content was moved to trash through MCP after the checks.
Temporary credentials were revoked when the shared synthetic test server stopped.
The report does not establish hosted OAuth consent, GitHub editor login/save,
D1, media-upload or production acceptance. It validates the installed local
contract rather than promising permissions for every plugin or collection policy.
