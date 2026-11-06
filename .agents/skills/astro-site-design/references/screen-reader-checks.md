# Bounded screen-reader checks

Read when verifying a public site's screen-reader behavior or diagnosing a reported announcement/focus problem. Use the existing accessibility guidance for implementation. This procedure adds observed assistive-technology evidence; it is not a conformance certification or a requirement to install a new reader for every edit.

Choose a representative route/task and an available actual reader/browser pair. Record the reader/browser versions, platform, route/build identity, task and scope. On Windows, NVDA with a supported browser is a useful starting point; on Apple platforms use the available VoiceOver/browser combination. Use the reader's version-matched commands. Do not assume one platform establishes another's behavior.

## Execute the relevant tasks

1. **Find the page and its content.** Listen to the page identity, navigate landmarks/headings, and follow a real content link. Check reading order, useful names and whether repeated decoration obscures the content. With NVDA in browse mode, `D` moves between landmarks, `H` between headings, and `NVDA+F7` opens the elements list.
2. **Complete a keyboard task.** Tab/Shift+Tab to the actual controls, activate them and listen for name, role and state. Use browse and focus modes as appropriate (`NVDA+Space` switches them). For a menu or dialog, check entering, Escape/closing and focus return; do not require a custom widget when a native element already works.
3. **Exercise a relevant error and recovery.** On a local/test form, submit invalid input, locate the error, correct it and verify the announced result. Avoid a real enquiry, subscriber record or message solely to complete a test. Use an authorized test endpoint or stop at validation and label successful submission untested.
4. **Check dynamic updates when present.** Trigger a filter/result change, asynchronous status or validation update. Listen for useful updates without duplicate chatter or lost focus. A `role="status"` attribute or a passing DOM test does not prove what the reader announced.

Capture concise observed speech or a reader transcript, alongside the expected meaning and outcome. NVDA Speech Viewer can help retain speech during a test; note manual transcription when used. Do not invent a transcript from accessible names or an accessibility-tree snapshot. Record `passed`, `failed` or `not exercised`, the relevant trigger, observed announcement/focus and any repair/recheck. Keep this in existing acceptance notes rather than starting another tracker.

If no real reader can be operated or speech cannot be observed, complete useful semantic/keyboard checks and explicitly retain the reader check as unverified. Do not equate an automated accessibility scan, visual inspection or generated test script with a completed reader session. Limit checks to the changed interaction and a representative path unless a shared change warrants broader coverage.

Sources: [Screen Reader Testing](https://github.com/wshobson/agents/blob/main/plugins/accessibility-compliance/skills/screen-reader-testing/SKILL.md), its [NVDA reference](https://github.com/wshobson/agents/blob/main/plugins/accessibility-compliance/skills/screen-reader-testing/references/nvda.md), and the [NVDA user guide](https://www.nvaccess.org/files/nvda/documentation/userGuide.html). Use current reader documentation; no market-share claims or copied widget controller is required by this procedure.
