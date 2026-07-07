---
status: passing
canonical: false
priority: 2
area: framework/dx
created: 2026-07-07
last_updated: 2026-07-07
---

# SPEC-023 Navigation Overrides (Slice 2 of SPEC-021)

Implements Slice 2 of [SPEC-021](./SPEC-021-panel-extension-api.md): a single
host-owned `src/_navigation.ts` file to reorder, hide, relabel, and re-parent
built-in sidebar items via `defineNavigationConfig`, for both panels.

## User-Visible Behavior

A developer authors `src/_navigation.ts`:

```ts
export default defineNavigationConfig({
  items: [
    { id: "orders", rank: 0 },        // pin to top
    { id: "price-lists", hidden: true }, // hide
    { id: "campaigns", nested: "orders" }, // re-parent under Orders
  ],
})
```

The built-in sidebar reflects the overrides; custom drop-in routes still place
themselves via `defineRouteConfig({ nested })` and are unaffected. Navigation is
host-only — installed blocks cannot contribute overrides.

## Design / Implementation

- **SDK helper** — `defineNavigationConfig` + `NavigationConfig` /
  `NavItemOverride`, with open `NavItemRegistry` / `NavParentRegistry` interfaces
  (`NavItemId` / `NavParentId`) in `packages/dashboard-sdk/src/config`.
- **Single-file discovery** — `packages/dashboard-sdk/src/navigation.ts`
  (`findNavigationFile`, modeled on `i18n.ts::findI18nIndex`) emits
  `virtual:mercur/navigation`; no plugin-entry slot (host-only). Wired through
  `constants.ts`, `virtual-modules.ts`, `plugin.ts`.
- **Apply** — `packages/dashboard-shared/src/extensions/nav.ts::applyNavOverrides`
  merges overrides into the two-level `useCoreRoutes()` shape: reorder (`rank`),
  hide (`hidden`), relabel (`label`/`icon`, override icon rendered via
  `createElement`), re-parent (`nested`; `null` promotes to top level). Both
  panels' `MainSidebar` map their core routes to `CoreNavItem` (stable id =
  path-without-slash) and apply the overrides read from `useExtension()`.
- **Typed targets** — the panel `generate-extension-targets.ts` scan derives
  `NavItemRegistry` (all `to:` ids) and `NavParentRegistry` (top-level ids) from
  `useCoreRoutes()`, seeding the shipped `extension-targets.d.ts`.

## Verification

1. `bun run build` — full monorepo green (11/11).
2. `applyNavOverrides` unit behavior: with the demo overrides, top-level order
   pins `orders` first, `price-lists` is removed, and `campaigns` moves under
   `orders`' children.
3. Demo file `apps/vendor/src/_navigation.ts` exercises rank/hide/re-parent.

## Evidence

- `bun run build`: `Tasks: 11 successful, 11 total` (2026-07-07).
- Generated targets: vendor `12 nav items / 7 nav parents`, admin
  `14 nav items / 8 nav parents`.
- Typed nav ids resolve against `NavItemRegistry` / `NavParentRegistry`
  (invalid ids fail `tsc`, same mechanism as SPEC-022's widget zones).

## Notes

- Re-parenting a top-level item with its own children is a two-level edge left
  simple for the MVP (children stay keyed to it; only shown when it is top-level).
