---
name: cc-alignment
description: Align existing Compound Component pages to vendor standard naming and structure. Use when renaming CC exports, adding slot prefixes, refactoring list headers to nested compounds, updating barrel exports, fixing DTS build blockers, or updating testing registry consumer pages.
---

# CC Alignment (Compound Components → Vendor Standard)

Use this skill when:
- renaming existing CC exports to match vendor naming (`XxxDetail` → `XxxDetailPage`)
- adding `Main`/`Sidebar` prefix to existing section slots
- refactoring list page headers from render props to nested compounds
- updating `pages/index.ts` barrel exports after CC rename
- fixing DTS build blockers in `tsup` pipeline
- updating testing registry consumer pages to use new CC API

**Not for**: initial CC migration from scratch (use `compound-components-migration` skill instead).

Read next (as needed):
- `references/alignment-checklist.md` — step-by-step alignment workflow
- `references/build-pipeline.md` — tsup, DTS, dist verification
- `references/testing-registry.md` — consumer page patterns

## Workflow

1. **Identify what needs alignment** — compare current exports against vendor standard:
   - Root name has `Page` suffix?
   - Slots have `Main`/`Sidebar` prefix?
   - List header uses nested compounds (not render props)?
   - No context/provider? (data passed as props from Root to sections)
   - No Layout wrapper? (TwoColumnPage inlined in Root)

2. **Rename + restructure** in this order:
   1. Component file — rename export, prefix slots, add missing slots (e.g., `SidebarSellerSection`), remove context/provider if present, pass data as props
   2. Route `index.ts` — update `as Component` export
   3. `pages/index.ts` barrel — new names
   4. Testing registry consumers — update to use new slot names

3. **Build + verify**:
   - `npx tsup` — must pass both ESM and DTS
   - If DTS fails on pre-existing errors in OTHER files, fix them (they block the whole DTS emit)
   - Grep for old export names — must return zero hits in `pages/index.ts`
   - Verify `dist/pages/index.js` contains new exports

4. **Test in testing registry**:
   - Consumer pages import from `@mercurjs/admin/pages` — must resolve without errors
   - No `implicit any` warnings on import

## Hard Rules

1. Do NOT create backward-compat aliases (`ProductDetail` re-export alongside `ProductDetailPage`). Clean rename only.
2. Do NOT change component behavior during alignment — only rename/restructure exports.
3. Do NOT skip DTS build — consumers need type declarations.
4. Do NOT fix pre-existing TS errors with `any` casts — use proper types (`HttpTypes.*`, `Omit<>`, etc.).
5. Do NOT forget to update ALL consumers (barrel, route index, testing registry).
6. Do NOT use `header?: ReactNode` prop pattern for list headers — use nested compound components.
7. DO preserve all existing `data-testid` attributes.
8. DO preserve `hasOutlet` on `TwoColumnPage` in Root's default composition.
9. DO preserve `location.search` on export/import links.
10. Do NOT create a separate `Layout` wrapper component in detail pages. Inline `TwoColumnPage` directly in `Root`'s default composition (vendor standard). `data`, `hasOutlet`, `showJSON`, `showMetadata` go directly on the `TwoColumnPage` in Root.
10. Do NOT keep nested detail routes as direct `:id -> Component: DetailPage`; use `:id -> Component: Outlet` and child `path: "" -> DetailPage`.
11. Do NOT use broad override switch (`Children.count(children) > 0`) for detail pages with nested routes/extensions; use explicit compound composition guard.
12. DO reuse shared composition helper (`src/lib/compound-composition.ts`) where override guard is needed.

## Naming Convention Reference

### Detail pages
```
Root:  XxxDetailPage (e.g., ProductDetailPage)
Slots: Main{Section}    — MainGeneralSection, MainMediaSection
       Sidebar{Section} — SidebarOrganizationSection, SidebarSellerSection
Fixed: Main, Sidebar
```

### List pages
```
Root:  XxxListPage (e.g., ProductListPage)
Slots: Table            — Container (Header + DataTable + Outlet)
       Header           — title + actions (Children.count override)
       HeaderTitle      — Heading component
       HeaderActions    — button container (Children.count override)
       Header{Action}Button — individual buttons (Create, Export, Import)
       DataTable        — raw data grid (self-contained fetch)
```

### Barrel (`pages/index.ts`)
```typescript
export { XxxDetailPage } from "./path/to/xxx-detail"
export { XxxListPage } from "./path/to/xxx-list"
```
