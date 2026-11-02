---
name: mercur-figure
description: Draw a Mercur docs illustration — a hairline, monospace fragment of Mercur's own UI (stacked panels, tabs, tables, square status markers, quiet tiled background) rendered as a light and a dark SVG for apps/docs. Use when the user asks for an illustration, figure, diagram, or hero image for a docs page (e.g. "illustrate the architecture page", "replace this mermaid diagram", "make a figure like Infisical's / Hairline's"), or wants an existing figure in apps/docs/figures changed.
argument-hint: "[page or idea]"
---

# mercur-figure — docs illustrations

A Mercur figure is a fragment of a real Mercur screen, drawn with 1px lines in one
monospace face: panels stacked like paper, tabs, a table with real data, square
status markers, and a few quiet tiles behind it. It explains one idea by
*showing the product doing it*, not by drawing boxes and arrows.

Lineage: the cascading panels of infisical.com, the mono order-group table of
the Mercur admin, and the discipline of [Hairline](https://hairline.lucasmarkes.com)
(one stroke weight, colour as information, a designed still frame, no
decoration). The figures are static SVG — no motion — so they work as `<img>`
in Mintlify and in both themes.

## Files

| File | Role |
| --- | --- |
| `kit.mjs` | The drawing kit. Tokens for both themes, every primitive. **Do not add colours or sizes outside it.** |
| `build.mjs` | Renders a figure to `<name>-light.svg` / `<name>-dark.svg`, checks it, prints the MDX snippet, `--look` writes PNGs. |
| `references/rules.md` | The ten rules. A figure that breaks one is not finished. |
| `references/kit.md` | The kit API with examples. |
| `apps/docs/figures/*.mjs` | Figure sources (one per figure). These are the worked examples — read the nearest before writing a new one. |
| `apps/docs/images/figures/*.svg` | Build output, committed. Never hand-edit. |

## Workflow

1. **Read the page.** Find the one idea the figure must carry (a section, or a
   mermaid block to replace). One figure, one idea.
2. **Concept.** Offer two or three one-liners, then wait for a pick (if nobody
   can answer, take the one with the strongest still frame and say so):
   > **Name.** Which Mercur surface it shows · what data is on it · what the eye lands on first (the accent).

   Prefer a *screen* over a diagram: "the Orders list showing group #G98 split
   into two seller orders" beats "cart → arrow → orders". Use a diagram layout
   (panels + wires) only when the idea is genuinely topology (layers, request
   paths), and even then make every box a little UI panel with real content.
3. **Gather real data.** Every name in the figure must exist: route paths,
   workflow + hook names, widget zone ids, block names, module names, statuses.
   Grep the repo (`packages/core/src/workflows`, `packages/registry`,
   `packages/vendor/src` for zone ids). Plausible values (order numbers,
   amounts, store names) must add up — group totals equal the sum of their
   orders, commission + payout equal total.
4. **Write** `apps/docs/figures/<name>.mjs` — `export default { name, width,
   height, alt, draw(f) }`, using only the kit (`references/kit.md`). Width is
   1040 unless there is a reason.
5. **Build and look**:
   ```bash
   node .claude/skills/mercur-figure/build.mjs apps/docs/figures/<name>.mjs --look <scratchpad>/look
   ```
   Exit 0 = clean, 1 = rejected, 3 = warnings (overflowing cells, small text,
   too much accent). Fix every warning. Then **Read both PNGs** and answer the
   look checklist in `references/rules.md`. Do not claim it is done without
   looking at both themes.
6. **Place it** in the MDX with the snippet `build.mjs` prints (two `<img>`
   tags with `dark:hidden` / `hidden dark:block`). Put the figure directly
   under the heading or paragraph it illustrates; keep the `alt` a full
   sentence describing what the figure shows.
7. **Hand over**: the figure(s), the concept in one line each, what was
   verified (build exit code, both themes looked at), and anything not checked
   (e.g. not viewed inside `mint dev`).

## What goes wrong

| If you catch yourself | Do this instead |
| --- | --- |
| writing `<rect>`, a hex colour, or a font size in a figure | use the kit; a missing primitive goes into `kit.mjs` with tokens for both themes |
| drawing arrows with labels on them | wires carry no words; the panels they connect say what flows |
| colouring a header marker because it looks nice | markers are `hi`/`mid`/`lo` unless the colour means something (status, the accent) |
| making two things violet | violet marks the one place the figure is about (rule 4) |
| lorem ipsum, `foo`, `example-1` | real names from the repo, plausible values that add up |
| a table so wide the text overflows | shorten the value (`/vendor/sellers/…`) or the column set; never shrink the font |
| shrinking text to fit | text below 14px at 1040 wide is unreadable in the docs column; cut content instead |
| filling the canvas with tiles | tiles are ambience at the edges; `clear` them out of wire corridors |
| hand-editing the SVG output | edit the `.mjs`, rebuild |
