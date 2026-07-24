# Spacing & tokens (translate pixels into the scale)

Figma gives you pixel values and raw colors. Do **not** copy them literally. Map them onto the scale and tokens below. Anything you can't map cleanly, surface to the user rather than hardcoding.

Tokens are applied as Tailwind utilities from the Medusa `ui-preset`. Source of truth: `@medusajs/ui-preset/src/theme/tokens/{colors,typography,effects}.ts` and https://docs.medusajs.com/ui/colors/overview. Light/dark are handled automatically by the token — never fork colors per theme.

## Spacing scale (the values you actually use)

| Context | Utility | Where |
| --- | --- | --- |
| Outer page section stack | `gap-y-3` | between `Container` sections; `TwoColumnPage` sidebar/main stacks |
| Section row padding | `px-6 py-4` | every row inside a `Container` section, and the section header row |
| Drawer body field stack | `gap-y-4` | inside `RouteDrawer.Body` |
| Focus-modal / tab form body stack | `gap-y-8` | inside a `TabbedForm` tab / `RouteFocusModal` form |
| Tab body outer padding | `p-16` | wrapper of a create-form tab, then an inner `max-w-[720px]` column |
| Form column max width | `max-w-[720px]` | the centered form column in focus modals |
| Two-column field row | `grid grid-cols-1 gap-4 md:grid-cols-2` | side-by-side fields |
| Cluster gaps (buttons, badges) | `gap-x-2` / `gap-x-3` / `gap-x-4` | toolbars, footers, header action clusters |

Rule of thumb: vertical rhythm inside a card is `py-4`; horizontal inset is `px-6`; stacks are `gap-y-{3,4,8}` depending on surface (page / drawer / focus-modal). Prefer these over arbitrary `mt-*`/`space-y-[...]` values.

## Section shell (memorize this)

```tsx
<Container className="divide-y p-0">
  <div className="flex items-center justify-between px-6 py-4">
    <Heading>{t("domain.section.title")}</Heading>
    {/* StatusBadge + ActionMenu */}
  </div>
  {/* divided rows, each px-6 py-4 */}
</Container>
```

## Color tokens — use these, never raw hex/rgb/palette

Apply as Tailwind utilities: `bg-ui-*`, `text-ui-*`, `border-ui-*`, `shadow-*`. Never write `#fff`, `rgb(...)`, or palette utilities like `text-gray-500` / `bg-slate-100`.

**Backgrounds** (`bg-ui-…`): `bg-base`, `bg-base-hover`, `bg-subtle`, `bg-subtle-hover`, `bg-component`, `bg-component-hover`, `bg-field`, `bg-field-component`, `bg-highlight`, `bg-interactive`, `bg-disabled`, `bg-overlay`, `bg-switch-off`.

**Foreground / text** (`text-ui-fg-…`): `fg-base`, `fg-subtle`, `fg-muted`, `fg-disabled`, `fg-interactive`, `fg-on-color`, `fg-on-inverted`, `fg-error`.

**Borders / dividers** (`border-ui-border-…`): `border-base`, `border-strong`, `border-interactive`, `border-error`, `border-danger`, `border-transparent`, `border-menu-top`, `border-menu-bot`. Section dividers use the `divide-y` utility (which resolves to the base border token).

**Tags / badges** (`…-ui-tag-{neutral|blue|green|red|orange|purple}-{bg|bg-hover|text|border|icon}`): use these via `StatusBadge` / `Badge` rather than by hand.

**Buttons**: don't hand-color buttons — use `Button` variants (`primary`, `secondary`, `transparent`, `danger`) and `IconButton`, which resolve to `--button-*` tokens.

**Effects / shadows** (`shadow-…`): `shadow-elevation-card-rest`, `shadow-elevation-card-hover`, `shadow-borders-focus`, `shadow-borders-base`. Focus rings via `shadow-borders-focus`, not custom outlines.

## Typography

Use components, not raw `<h*>` / `<p>` with sizes:

- Section titles → `<Heading>`; sidebar section titles → `<Heading level="h2">`.
- Body / row text → `<Text size="small" leading="compact">`; chips/breadcrumbs → `<Text size="xsmall">`; emphasis → `weight="plus"`.
- Help text → `<Hint>` (`info` default, `error` for form errors).
- Subtle copy → `<Text className="text-ui-fg-subtle">` / `text-ui-fg-muted`.

## Mapping Figma → tokens (from the screenshot)

You work from the `get_screenshot` image, not from exported variables. Decide tokens by role, not by exact pixel/hex:

1. Identify each color's **role** in the screenshot (page/card background vs. body text vs. subtle/muted text vs. border/divider vs. status pill) and pick the nearest token above.
2. Match spacing to the nearest **scale** value (`py-4`, `gap-y-4`, `px-6`, `gap-y-8`, …) — don't introduce a new arbitrary value to hit an exact pixel.
3. Status colors come from the `StatusBadge` color set via `pages/<domain>/common/utils.ts` helpers, not a hand-picked hex.
4. If a color or spacing clearly doesn't map onto any token/scale value, ask the user; do not hardcode a raw value.
