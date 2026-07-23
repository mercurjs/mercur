---
name: figma-ui
description: Convert a Figma design into Mercur dashboard UI code (admin or vendor panel) that matches the project's design-system conventions. Trigger whenever the user shares a figma.com URL, selects a Figma node/frame, or asks to "convert this design", "implement this design", "build this screen", "turn this mockup into code", or otherwise do design-to-code work in packages/admin or packages/vendor. Also trigger when the user describes the flow in their own words ("here's the Figma, make the page"). Use the Figma MCP to read the design, then map it onto the component inventory and patterns in this skill's references before writing any JSX.
---

# figma-ui — Figma design → Mercur dashboard code

Turn a Figma design into React code for the **admin** (`packages/admin`) or **vendor** (`packages/vendor`) dashboard, using the shared design system (`@mercurjs/dashboard-shared` + `@medusajs/ui`). The goal is code that looks like the surrounding pages: same primitives, same section shells, same spacing, same tokens.

This skill is the **judgment layer**. It does not lint. The conventions that matter — which primitive to use, how sections and modals are built, which spacing/tokens are correct — live in the reference files below. Read the relevant one before writing code; do not guess from memory.

## References (read the one that fits the task)

- **`references/components.md`** — the component inventory. Which `@mercurjs/dashboard-shared` / `@medusajs/ui` primitive maps to which Figma element, the page archetypes (list / detail / create / edit), and the compound sub-parts (`Form.Field`, `RouteDrawer.Body`, `DataTable`, `ActionMenu`, empty states). This replaces Code Connect — it is the source of truth for "what do I render".
- **`references/spacing.md`** — the spacing scale and color/typography/effect tokens, and when to use each (`gap-y-3` page stack, `gap-y-4` drawer body, `gap-y-8` focus-modal body, `px-6 py-4` section rows, `p-16` tab body). Use this to translate Figma pixel values into the token scale instead of arbitrary values.
- **`references/patterns.md`** — the recurring structural rules: section shell (`Container className="divide-y p-0"`), create = `RouteFocusModal` + `TabbedForm`, edit = `RouteDrawer`, forms go through `Form.Field`, destructive actions use a delete-action hook + `usePrompt`, compound-component export shape, i18n, `data-testid`. Read this before building any page. It also lists what NOT to do (raw `<input>`, raw `FocusModal`/`Drawer`, foreign UI/icon libraries, hardcoded colors).

For the full narrative version of these conventions, `docs/UI-ARCHITECTURE.md` is the canonical repo doc; the references here are the condensed, task-focused extract.

## The workflow

### 1. Read the design from Figma — the screenshot is the source of truth

Use the Figma MCP against the shared node/URL. **Only two tools are used, and the screenshot is the primary one:**

- **`get_screenshot`** — the source of truth. Read the rendered image directly to get the **content** (all visible text: headings, labels, field placeholders, button copy, column names, badge text, empty-state copy) and the **visual state** (which button is filled vs. outline, badge colors, emphasis, density, spacing, layout). You transcribe the content and decide component variants + spacing from what you see here. Request a larger `maxDimension` if you need to read fine detail.
- **`get_metadata`** — a lightweight structural outline (layer names, nesting, sizes, which layers are `hidden`). Use it only to confirm the archetype and reading order (e.g. sidebar + table + footer ⇒ list page); don't rely on it for content — names can be generic or stale.

Do **not** depend on `get_variable_defs` or `get_design_context` — they are not part of this flow. Map colors and spacing yourself from the screenshot onto Medusa UI tokens using `references/spacing.md`.

If the user gave a URL but no specific node, ask which frame/screen to build. If the frame's **name** disagrees with what the **screenshot** shows (names can be stale — e.g. a frame named "Create Promotion" that actually renders the Promotions list), trust the screenshot and say so.

### 2. Decide the surface and the page archetype

- **Surface**: admin (`packages/admin`, operator, `sdk.admin.*`) or vendor (`packages/vendor`, seller, `sdk.vendor.*`)? If the design doesn't make it obvious, ask.
- **Archetype**: list, detail, create, or edit? Match it to `references/components.md` and find the closest existing page to mirror (e.g. `pages/categories/category-list`, `category-detail`, `pages/products/product-create`, `category-edit`).

### 3. From the screenshot, pick component + variant + spacing, then write code

Go region by region over what you saw in the screenshot. For each region make three decisions, each backed by a reference file — don't eyeball it:

1. **Which component** → look it up in `references/components.md` (the inventory: page frame → `SingleColumnPage`/`TwoColumnPage`; card → section `Container`; field → `Form.Field`; create → `RouteFocusModal`+`TabbedForm`; edit → `RouteDrawer`; table → `DataTable`; row/section action → `ActionMenu`; empty → `NoRecords`/`NoResults`).
2. **Which variant** → from the element's appearance in the screenshot, pick the exact prop using the **"Component variants & props"** table in `references/components.md`. Examples:
   - a filled primary button → `<Button variant="primary">`; an outlined/cancel button → `variant="secondary"`; an inline text action → `variant="transparent"`; a red/destructive one → `variant="danger"`.
   - a status pill's color (green/red/orange/grey…) → the matching `StatusBadge color`, sourced via `pages/<domain>/common/utils.ts` helpers.
   - text emphasis/size → `Text size`/`weight`; a title → `Heading level`.
   - Transcribe the **actual text** from the screenshot into these components (then route it through `t(...)` — see step 4).
3. **Which spacing / tokens** → translate the screenshot's spacing and colors using `references/spacing.md`: snap to the scale (`gap-y-3` page stack, `gap-y-4` drawer body, `gap-y-8` focus-modal body, `px-6 py-4` section rows, `p-16` tab body) and use Medusa UI color tokens — never arbitrary hex/rgb/palette values.

Follow `references/patterns.md` for the structural rules that tie it together: section shell, create/edit hosts, forms through `Form.Field`, destructive-action hook, compound-component export shape, i18n keys, and `data-testid`s. When the design shows a variant that isn't in the props table, stop and ask (step "When to stop and ask") rather than `className`-overriding a component.

### 4. Verify against the design and the conventions

- Compare your output to the `get_screenshot` reference and to the nearest existing page.
- Run `bun run lint` and `bun run build`; keep them green.
- Every user-facing string goes through `t(...)` — add keys to `packages/<pkg>/src/i18n/translations/en.json` first.

## When to stop and ask the user

- The design's surface (admin vs vendor) or archetype is ambiguous.
- The design needs data/an endpoint that doesn't exist yet (a hook in `src/hooks/api/<domain>.tsx` or a backend route) — confirm the data contract before inventing one.
- The design calls for a component that has no equivalent in `references/components.md` — ask whether to compose one from Medusa UI primitives or add a shared primitive to `@mercurjs/dashboard-shared`, rather than reaching for an outside library.
- The Figma tokens don't map cleanly onto Medusa UI tokens — surface the mismatch instead of hardcoding a color.

## What this skill does NOT do

- It does not add new UI libraries or icon packs. Components come from `@medusajs/ui` / `@mercurjs/dashboard-shared`; icons from `@medusajs/icons` only.
- It does not invent backend endpoints or data models — it consumes existing ones via the typed SDK.
- It does not enforce rules mechanically (no linter); it relies on the references and `bun run lint` / `bun run build` as the gate.
- It does not push code back into Figma; it is design-to-code only.
