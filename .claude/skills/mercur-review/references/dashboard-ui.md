# Dashboard UI patterns (admin, vendor, plugin panels)

`docs/UI-ARCHITECTURE.md` is the contract. This file lists what reviews keep catching. Medusa's own dashboard lives at `~/Desktop/medusa/packages/admin/dashboard/src`; Mercur's canonical pages are `category-list`, `category-detail`, `product-create`, `category-edit`, `payouts/payout-detail` and `payout-accounts/payout-account-detail`.

## Page structure

- **One entity per route.**
  - A list is `SingleColumnPage` + `Container className="divide-y p-0"` + a header row (`flex items-center justify-between px-6 py-4`, `<Heading>` + short subtitle + actions) + `_DataTable` with `filters`, `pagination`, `navigateTo` and `noRecords`.
  - A detail is `TwoColumnPage` with `Main` / `Sidebar`, `showJSON`, `WidgetZone`s, a status `Alert` at the top when there is a reason, and a general section whose header holds the title, a `StatusBadge` and an `ActionMenu`.
- **No page-level tabs, KPI/count strips or "job cards"** repeated across tabs. Related entities become nested sidebar items (`defineRouteConfig({ nested: "/parent" })`), like Medusa's Products → Collections / Categories.
- **Don't duplicate core pages.** If core already shows an entity (payouts, payout accounts), a plugin adds a widget to that page's zone (`payouts.detail.side`, `payout_accounts.detail.side`, ...) instead of its own table.
- **Side information goes in the sidebar column,** main content in the main column.

## Linking to another entity

Use the shared pattern, not a hand-made card:
- `SidebarLink` (`packages/admin/src/components/common/sidebar-link/sidebar-link.tsx`): icon + label + description + arrow, as in the payout References section.
- A section row whose value is a link (`text-ui-fg-subtle hover:text-ui-fg-base`), as in Medusa's order customer section.

## Forms and modals

- **Create** is a `RouteFocusModal` + `TabbedForm`. **Edit/small create** is a `RouteDrawer` + `RouteDrawer.Form` + `KeyboundForm`, routed as a child of the list page. In a plugin, use a parallel route folder (`routes/x/@create/page.tsx`) so it opens over the list (`SingleColumnPage hasOutlet`).
- Use react-hook-form + `zodResolver`, and every field as `Form.Field` → `Form.Item` → `Form.Label` / `Form.Control` / `Form.Hint` / `Form.ErrorMessage`. No `useState` forms and no raw `Drawer`.
- Entity pickers are a `Combobox` with search over the API, never a free-text id input.
- Destructive or irreversible actions go through `usePrompt()` and then a toast. Actions live in an `ActionMenu` with a `permission`, `disabled` and `disabledTooltip`. Edit actions come first; destructive ones go last, in their own group.

## Data

- Use hooks in `hooks/api/<domain>.tsx` with `queryKeysFactory`. Queries return `{ ...data, ...rest }`, and mutations accept options and forward `onSuccess` after invalidating.
- Never spread `q: undefined` (or any undefined param) into a client query; spread it conditionally.
- Vendor product lists use `useProductTableQuery`'s curated fields. Adding `+field` to `GET /vendor/products` returns a 500.

## What users see

- **Labels, not raw values.** Map status enums and provider codes (`requirements.past_due`, `rejected.fraud`) to sentences, and show names instead of ids.
- **Short copy.** Subtitles are one short clause. Empty states say what will appear, not how the system works. No "AI-ish" explanatory paragraphs.
- **Strings go through i18n** in core panels: `en.json` + `$schema.json` together. Plugin panels without i18n keep the copy short and consistent.
- **Brand icons follow the Medusa extension-icon shape:** a full 15×15 square (no own radius), a brand fill, a white→transparent 20% gradient overlay and a 9×9 glyph area (see the loyalty plugin's `gift-card-icon.tsx`). Nav items for plugin routes are `type: "extension"` so the sidebar draws the bordered tile.

## Tokens

- Only Medusa UI tokens (`text-ui-fg-*`, `bg-ui-bg-*`, `border-ui-border-*`, `shadow-elevation-*`) and only `@medusajs/icons`. Brand marks are the one exception, with a one-line comment saying so.
- Use `Text` / `Heading` for typography, never raw `<p>` / `<h*>` with color classes.
- `data-testid` goes on headings, inputs, buttons and menu triggers (kebab-case, scoped to the page).
