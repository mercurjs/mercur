# The ten rules

Adapted for static docs figures from Hairline's ten rules
(hairline.lucasmarkes.com, MIT) and the Infisical marketing illustrations.

## 01 · real: it is a Mercur screen

Every panel is a fragment of a real Mercur surface — admin, vendor, a cart, a
route table, a file tree — with real names from the codebase. Values may be
invented but must be plausible and consistent (sums add up, ids look like ids).

- **Rejected when:** a name does not exist in the repo; numbers contradict each
  other; placeholder text appears.

## 02 · mono: one face, four sizes

Everything is set in the kit's monospace stack at the kit's sizes: title 18,
tab 17, body 16, cell 15, caps 14 (uppercase, tracked). Nothing under 14 at
1040 wide — the docs column shows figures at ~720px, so 14 becomes ~10px.

- **Rejected when:** a size outside the scale; bold anywhere but a title or a
  surface path (weight 500); text overflowing its column.

## 03 · hairline: one stroke weight, square corners

All lines are 1px. Corners are square (the docs use `border-radius: 0`). Plates
are opaque and filled with the plate colour; a panel is a plate, a 1px border,
and rules between rows. Rules inside a panel are lighter (`rule`) than its
border (`line`).

- **Rejected when:** a rounded corner, a thicker line used for emphasis (the
  only exceptions are the 3px active-tab bar and the 3px accent bar).

## 04 · accent: colour is information

Structure is grey. Colour appears only where it means something:

- **status** — `green` done/on, `amber` pending/diff, `red` failing/not done,
  always as a small square marker (chips, header markers) or a toggle track;
- **the accent** — `violet`, Mercur's colour, marks the one place the figure is
  about: one header marker, one accented row, one domain. One idea, one place.

Text is never coloured. `build.mjs` warns when violet is used more than four
times.

- **Rejected when:** two unrelated things are violet; a colour is decorative; a
  status colour contradicts its label.

## 05 · rest: the still frame is composed

The figure is a thumbnail. Something is clearly in front, something recedes,
and the eye lands on the accent first. Stacks cascade down-left (`cascade`) so
the front panel is the one with the story and the panels behind show only a
header and a cropped column tail.

- **Rejected when:** everything has the same weight; the front panel is not the
  one the caption is about; the composition is a regular grid of equal boxes
  with nothing leading.

## 06 · honest: back to front

Draw in paint order: tiles, wires, then panels from the back. Plates hide what
is behind them; a wire may end under a plate (its square half-hidden), never
cross over a panel's face.

- **Rejected when:** a line shows through a plate; a wire crosses a panel.

## 07 · crop: cut, don't shrink

Panels behind the front one are cut by it, and their content is cut by their
own edges (`panel` clips). A cropped column tail (`.00`, `ICE`) says "there is
more" better than a shrunken full table.

- **Rejected when:** a back panel was squeezed to fit; content spills outside
  its panel.

## 08 · quiet: tiles are ambience

The background is a sparse grid of 88px tiles — outlined squares, dotted
squares, a few grain blocks — denser toward the canvas edges. They sit behind
everything and never read as content.

- **Keep it:** `f.tiles({ seed, clear })` last (it paints underneath); pass `clear` rects for wire
  corridors so a tile edge never looks like a wire. Change `seed` until the
  edges look balanced.
- **Rejected when:** a tile edge lines up with or continues a wire; tiles crowd
  the centre.

## 09 · wires: orthogonal, few, unlabelled

Only topology figures have wires. They run vertical–horizontal–vertical, merge
rather than cross, and end in a 6px square. They carry no labels; the panels at
each end say what connects.

- **Rejected when:** wires cross; a diagonal; an arrowhead; a label on a wire.

## 10 · both themes

The same figure ships as `-light.svg` and `-dark.svg`. The dark plate is the
docs' lifted surface (`#15121d`) on the page's `#0c0a12`; nothing may vanish
or invert meaning between them.

- **Rejected when:** only one theme was looked at; an element disappears in
  one theme.

## The look

After every build, Read both PNGs and answer yes/no:

1. At 720px wide, can you read every word?
2. Does the eye land on the accent first?
3. Is every name real, and do the numbers add up?
4. Is there exactly one violet place?
5. Do the panels behind read as "more of the product", not as clutter?
6. No overflowing text, no tile posing as a wire, no wire crossing a panel?
7. Does the dark one hold up as well as the light one?
8. Without the caption, would someone who knows the page say what it shows?
