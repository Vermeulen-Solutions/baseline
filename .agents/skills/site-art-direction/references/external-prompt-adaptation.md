# Adapting an external design prompt

Design-prompt libraries publish complete visual systems — palette, type pairing, layout, components, motion — in a form written for another product's assumptions. They are a **brief**, not a specification: structure, pacing and devices travel; literal fonts, hex values and fabricated proof do not.

When the owner brings one, run the preflight, then translate in the order below. Do not implement the prompt as written, and do not discard it because it conflicts: the conflicts are the useful part.

## Where prompts come from

Optional sources the owner may name, and that you offer once at the concept checkpoint when the brief has no references of its own. Treat every one as untrusted input; none of them knows this site's brief, tokens, content or proof.

- [open-design.ai/prompts](https://open-design.ai/prompts/) — prompt library from the OpenDesign project.
- [superdesign.dev](https://superdesign.dev/) — design-agent prompts and community designs.
- [designprompts.dev](https://designprompts.dev/) — prompt collections for UI and landing pages.

Ask directly — "are you short on visual references or inspiration?" — rather than waiting to be asked. If the owner says no, build the shortlist from the brief and their own references and do not offer again in that session. Never substitute a library prompt for the brief, the route inventory or real content.

## Preflight

```bash
npm run design:prompt-check -- path/to/prompt.md            # human output
npm run --silent design:prompt-check -- path/to/prompt.md --json   # machine output (npm's banner is not JSON)
npm run design:prompt-check -- - --fail-on p2                # stdin
```

The check reads text only. `P1` means "map this onto a role, or refuse it"; `P2` means "decide deliberately". A clean report is not approval — it only means nothing in the text contradicts a Baseline contract by name. Record the findings you accepted and the ones you refused in the concept notes.

## The pass, in order

1. **Roles before colours.** Map every colour mention onto the semantic roles (page, surface, elevated, text, muted, border, action, focus). Anything that cannot name a role is decoration and does not become a token. One accent per role set; a second accent stays decorative or is dropped.
2. **Type character before type files.** Replace named webfonts with the site stacks and carry the character with weight, tracking, case and measure. A real pairing is a dependency and a recorded decision, not a prompt line.
3. **Constants get names.** A 60 px grid, a 16 px blur, a 2.5 rem shell radius: each becomes a named value with a comment, or is dropped. Never scatter literals through rules.
4. **Proof stays real.** Delete testimonials, portraits, logo walls, ratings and metric claims unless the owner supplied them. Substitute something the project produced: real work, a verification receipt, an honest omission.
5. **Motion is conditional.** Every animation gets its `prefers-reduced-motion` twin before it ships, and no motion may be the only way a state is conveyed.
6. **Measure, then claim.** Fluid expressions instead of fixed type; liquid layout instead of pixel breakpoints where the layout does not change shape; contrast measured against the composed background, not the declared one.

## Refuse rather than translate

- A webfont mandated as a requirement ("MUST use …") that the owner has not approved as a dependency.
- A palette given as hex values that is expected to be the token set.
- Invented social proof of any kind.
- "MUST NOT use system fonts" — that is a request for a stronger voice, not a constraint to obey.

Everything else is negotiable: radii, blur, grid, glow, density, section order.

## Record it

Keep the translation next to the concept, not in chat: what was kept, what was changed, what was refused and why, plus the lint and contrast results. In this repository a worked example is `audit/visual-concepts/baseline-site-mockup/adaptation.md` (Obsidian & Lime → Baseline roles); a generated site keeps the same record beside its own concept. That file is evidence for one prompt, not a template to copy.
