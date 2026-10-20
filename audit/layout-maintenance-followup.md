# Layout spacing setup and tooling follow-up

Scope authorized after the eight-phase refactor: finish direct baseline work and
optional bundle/test-harness improvements. Client adoption, cross-browser,
physical-device and manual accessibility acceptance are deferred by the user.

## Phase A — New-site setup language and choice

Complete: Standard and Express design handoffs explain layout spacing and ask
once about shared defaults versus custom spacing for specified compositions.
Root and generated-profile instructions share that contract. CSS remains the
configuration source; `automatic-v2` remains only the compatibility API name.
The generator remains noninteractive. Existing decisions and autonomous design
authorization take precedence; this is not a new maintenance approval gate.

Terminology follows layout primitives/stacks, spacing tokens, CSS gap, fluid
spacing and flow spacing. No external-product references are in the setup flow.
Historical audit evidence and compatibility identifiers are retained.

Validation: `npm.cmd run verify:fast` passed (129 tests), followed by review of
both handoff paths and generated-profile instruction inheritance.

## Phase B — Local test reliability

In progress: retain performance budgets while avoiding browser/Fetch-blocked
loopback ports and excessive concurrent rehearsal subprocesses.

## Phase C — Editor/admin bundle investigation

In progress: measure actual module ownership and delivery, then make bounded
changes that preserve dependency initialization and editor behavior. Never
hide the size advisory or reinstate the generic vendor split that broke editing.
