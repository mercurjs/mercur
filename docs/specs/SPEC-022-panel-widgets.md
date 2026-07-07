---
status: passing
canonical: false
priority: 2
area: framework/dx
created: 2026-07-07
last_updated: 2026-07-07
---

# SPEC-022 Widget Injection Zones (Slice 1 of SPEC-021)

Implements Slice 1 of [SPEC-021](./SPEC-021-panel-extension-api.md): file-based
widget injection zones with `defineWidgetConfig` and the `before | after |
replace` placement suffix, for the admin and vendor panels.

## User-Visible Behavior

A developer drops `src/widgets/<name>.tsx` in their host app (or ships it from a
block), exporting a component plus `export const config =
defineWidgetConfig({ zone })`. The component renders at the targeted zone on the
built-in page, with the rest of the page unchanged. Multiple `before`/`after`
widgets stack; a single `replace` widget swaps the built-in content.

Zones mounted in the MVP:

- `product.list` (vendor product list) — `.before` / `.after` / `.replace`
- `topbar` (both panels' shell) — `.before` / `.after` / `.replace`

## Design / Implementation

- **SDK helpers** — `packages/dashboard-sdk/src/config/{types,utils}.ts`:
  `defineWidgetConfig` (a `createConfigHelper` wrapper mirroring Medusa's
  `admin-sdk`, adding the `$$typeof: Symbol.for("react.memo")` HMR marker),
  `WidgetConfig`, and the open `WidgetZoneRegistry` interface with
  `WidgetZoneId = keyof WidgetZoneRegistry`.
- **Crawl / virtual module** — `packages/dashboard-sdk/src/widgets.ts` crawls
  `src/widgets/**` (any component file with a default export + `config`), derives
  a stable `widgetId` (explicit `config.id` or a path hash), and emits
  `virtual:mercur/widgets` as `{ widgets: [{ Component, zone, widgetId }] }`.
  Wired through `constants.ts`, `virtual-modules.ts`, `plugin.ts` (optimizeDeps +
  HMR watchers), and `generate-plugin-entry.ts` (`widgetModule` so blocks
  contribute).
- **Runtime** — `packages/dashboard-shared/src/extensions/`: an
  `ExtensionRegistry` singleton (mirrors Medusa's `DashboardApp`) builds
  `Map<slot, {before, replace, after}>` from the aggregated widgets;
  `<ExtensionProvider>` mounts it at each panel's app root (fed the virtual
  module); `<WidgetZone id data>` reads it via `useExtension().getWidgets(id)` and
  renders `before → built-in|replace → after`.
- **Typed targets** — each panel ships a generated
  `extension-targets.d.ts` (`scripts/generate-extension-targets.ts`, run before
  `tsup`) that seeds the built-in zone ids into `WidgetZoneRegistry` from the
  panel's `<WidgetZone id>` host usages; declaration merging unions it with a
  developer's hand-written augmentation. Exported as
  `@mercurjs/{admin,vendor}/extension-targets`.

## Verification

1. `bun run build` — full monorepo green (11/11).
2. Typed targets — a valid `zone: "topbar.before"` compiles; an invalid
   `zone: "does.not.exist"` fails `tsc` (TS2322: not assignable to
   `keyof WidgetZoneRegistry`).
3. Demo widgets in `apps/vendor/src/widgets/` (`topbar-help.tsx`,
   `product-list-banner.tsx`) exercise the topbar and product-list zones.

## Evidence

- `bun run build`: `Tasks: 11 successful, 11 total` (2026-07-07).
- tsc contract check: `defineWidgetConfig({ zone: "does.not.exist" })` →
  `error TS2322: Type '"does.not.exist"' is not assignable to type
  'keyof WidgetZoneRegistry | (keyof WidgetZoneRegistry)[]'`; the valid zone
  compiled with no error.
- Generated targets: vendor `6 widget zones`, admin `3 widget zones`;
  `dist/extension-targets.{d.ts,js}` shipped in both packages.

## Notes

- `defineCustomFieldsConfig` / `createFormHelper` (Slice 3), commands (Slice 5),
  and onboarding fields (Slice 4) are out of scope here — see SPEC-021.
- Login (`login.*`) zones are documented in SPEC-021 but not yet mounted; add the
  hosts under `PublicLayout` in a follow-up.
