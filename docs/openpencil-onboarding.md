# OpenPencil: setup and comment review

OpenPencil (`open-pencil/open-pencil`) is a local desktop design canvas with an MCP server. In Baseline it is the canvas for owners who want to **review designs by pinning short notes on them**: the agent builds the boards, the owner presses **C** and clicks on what should change, and the agent reads each note, changes the design, replies with what changed and resolves the note. The owner never edits the canvas by hand. The `openpencil-site-design` skill holds the full workflow; this page is the setup an agent walks the owner through. Tested with OpenPencil 0.17.0 on Windows.

## Setup (once per machine)

1. **Install the app** from the [official releases](https://github.com/open-pencil/open-pencil/releases) and open it. Note its version.
2. **Install the MCP bridge at the same version**, outside any site repository:

   ```powershell
   npm install -g @open-pencil/mcp@0.17.0
   ```

Never add `@open-pencil/*` packages to a site's `package.json`.
3. **Register the bridge with the agent.** Claude Code:

   ```powershell
   claude mcp add --scope user open-pencil -- openpencil-mcp
   ```

Allow its tools in the user's Claude Code settings (`"permissions": { "allow": ["mcp__open-pencil__*"] }`) instead of approving each call, and restart the session. Other harnesses register a stdio server whose command is `openpencil-mcp`.
4. **Switch on the app's server:** Settings › MCP › Local server on, and "Share only the selection" off (with it on the agent sees no comments and cannot edit).
5. **Check:** the agent calls `list_documents`. A list, even an empty one, means it works; "OpenPencil app is not connected" means the app is closed or its server is off.

## Where the files go

The MCP server reads and writes only inside its root, which on Windows is the home folder by default: a path under `C:\dev\…` is refused. Keep each site's design file and its prepared photos in `<home>/Documents/OpenPencil/<site>/`, and record the path in the site's notes. `OPENPENCIL_MCP_ROOT` can narrow the root (see the skill's connection reference).

## How a review round goes

1. The agent builds two or three directions as boards (desktop and phone), each in one render, with every layer named, then runs OpenPencil's accessibility check and fixes what it finds.
2. The owner opens the `.fig`, presses **C**, clicks on anything that should change and types a short note. Nothing has to be selected first: a note is pinned to the board at the point clicked, and the agent finds the layer under it.
3. The owner tells the agent they are done. The agent reads the open notes, fixes each at its cause, sends before and after images, and replies in each thread before resolving it. A note it cannot act on gets a question and stays open.

In Baseline's trial, two notes ("these cards should be the same height", "this button isn't aligned") took three and four minutes each from reading to resolving, and the accessibility check found ten real issues before the owner's review.

## Limits worth knowing

- There is no HTML import over MCP: boards are written in OpenPencil's design JSX. Author them there from the start; redrawing an existing HTML page in the canvas was the slow part of the trial.
- The board is the picture of the decision, not code. The site is built afterwards with Baseline's Astro components and checked in the browser.
- New versions change tool names and JSX (0.17 renamed every tool and changed component properties). Keep the app and bridge versions matched and read the live tool list after an update.
- OpenPencil can also run Claude Code inside the app's AI chat (ACP). Baseline does not use that route: the comment loop works without it, and an agent started there does not follow Baseline's workflow unless pointed at it.
