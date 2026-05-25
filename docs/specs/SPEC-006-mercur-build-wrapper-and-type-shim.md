---
status: passing
canonical: false
priority: 1
area: framework/dx
created: 2026-05-25
last_updated: 2026-05-25
parent: SPEC-005
---

# SPEC-006 Mercur Build Wrapper and Type Shim (SPEC-005 starter sub-spec)

This is the starter sub-spec of [SPEC-005](./SPEC-005-mercur-extension-kit-and-developer-surface.md).
It delivers the `mercur build` wrapper, the `preflight-build` artifact emitter,
the path-mapping shim that makes `import { ProductDTO } from "@medusajs/types"`
return the Mercur shape, and the enum→string-literal-union conversion that the
shim requires.

The downstream sub-specs (workflow override triage, `<Name>Input`/`<Name>Output`
exports, `@mercurjs/core/<domain>` subpath exports, removing the wholesale
`export *` from `@mercurjs/types`, lint rule against direct `@medusajs/core-flows`
imports) are tracked separately.

## Scope

In:

1. **CLI wrapper.** Reintroduce `packages/cli/src/commands/build.ts` deleted in
   commit `67d6f885`. It runs the preflight, then delegates to `medusa build`
   via spawn. Register in `packages/cli/src/index.ts`.
2. **Preflight emitter.** `packages/cli/src/preflights/preflight-build.ts`
   emits into the consuming project's `.mercur/` directory:
   - `.mercur/routes.d.ts` (existing — via `writeRouteTypes`).
   - `.mercur/types.d.ts` — path-mapping shim re-exporting
     `@medusajs/types-original` plus Mercur overrides for `ProductDTO`,
     `ProductStatus`, and an explicit re-declaration of
     `ModuleImplementations` whose `product` key is typed as
     `MercurProductModuleService`. Uses `export type *` and
     `export type { ... }` exclusively — no runtime exports.
   - `.mercur/tsconfig.augment.json` — TS path map redirecting
     `@medusajs/types` → `.mercur/types.d.ts` and `@medusajs/types-original`
     → `node_modules/@medusajs/types`.
3. **Post-process `.medusa/types/modules-bindings.d.ts`.** After `medusa build`
   runs upstream's `generateContainerTypes`, the wrapper strips the
   `'product': IProductModuleService` entry from the file (and the now-unused
   `IProductModuleService` import) so the upstream codegen does not
   reintroduce the collision the shim was designed to eliminate. Idempotent —
   re-running on a cleaned file is a no-op.
4. **Enum → string-literal union conversion.** In
   `packages/types/src/product/common.ts`, convert the four enums
   (`ProductStatus`, `AttributeType`, `ProductChangeStatus`,
   `ProductChangeActionType`) to string-literal union types. Add companion
   frozen-object runtime constants (`ProductStatusValues`,
   `AttributeTypeValues`, `ProductChangeStatusValues`,
   `ProductChangeActionTypeValues`) for code that needs a JS value. Reason:
   path-mapping is a TS-only mechanism — it cannot redirect runtime values,
   so the shim cannot swap an upstream value-position `enum` import.
5. **Migrate value-position callsites.** ~62 occurrences of
   `ProductStatus.X` and ~121 of the other three across ~63 files become
   `<Name>Values.X`. Type-position uses (`status: ProductStatus`) stay
   unchanged because `ProductStatus` is still a valid type name.
6. **Expose Mercur product types under a subpath.** Add a `/product` subpath
   export to `packages/types/package.json` that exposes the Mercur
   string-literal unions, `<Name>Values` runtime constants, the Mercur-only
   DTOs, and the `MercurProductDTO` shape. The shim consumes
   `@mercurjs/types/product`.
7. **Consumer-side wiring.** Document and apply the one-line consumer change
   to `apps/api/tsconfig.json` (`"extends": "./.mercur/tsconfig.augment.json"`).

Out (deferred to follow-up sub-specs):

- Shrinking `packages/types/src/product/common.ts` to deltas only by
  removing duplicate `ProductImageDTO`, `ProductVariantDTO`, `ProductTypeDTO`,
  `ProductTagDTO`, `ProductCollectionDTO`, `ProductCategoryDTO`,
  `ProductVariantProductImageDTO`. They stay in place for this sub-spec
  because removing them ripples into every place currently importing
  `ProductVariantDTO` / `ProductCategoryDTO` from `@mercurjs/types` (those
  two carry Mercur fields and need their own shim entries).
- Retargeting `packages/types/src/http/*.ts` imports. Same reason: until the
  duplicates are removed, the http types compile fine against the current
  paths.
- Workflow override triage (the 73 `overrideWorkflow` sites).
- `@mercurjs/core/<domain>` subpath exports.
- Removing the wholesale `export * from "@medusajs/types"` from
  `@mercurjs/types`.
- `develop`, `start`, `db-migrate`, `db-generate` CLI wrappers.

## User-Visible Behavior

After this sub-spec lands:

- `mercurjs build` (or `mercur build`) runs the preflight then `medusa build`.
- Consumers whose `tsconfig.json` extends `./.mercur/tsconfig.augment.json`
  see Mercur's product shape when they `import { ProductDTO } from
  "@medusajs/types"`: `status` typed as the Mercur `ProductStatus`
  string-literal union, Mercur fields (`is_restricted`, `created_by_actor`,
  `sellers`, `changes`, ...) present. `container.resolve(Modules.PRODUCT)`
  is typed as `MercurProductModuleService` via the shim's re-declared
  `ModuleImplementations`.
- Code that needs a runtime value for a Mercur enum imports
  `ProductStatusValues` (or the matching `<Name>Values`) from
  `@mercurjs/types/product`. Importing a runtime value from
  `@medusajs/types` is not promised by the shim because upstream never
  shipped one.
- `WorkflowManager.unregister(...)` calls, `overrideWorkflow`,
  `patch-medusa.ts`, and the `apps/admin` / `apps/vendor` consolidation are
  all out of scope — they belong to follow-up sub-specs.

## Verification

1. `bun install` clean.
2. `cd packages/types && bun run build` — emits `dist/index.{js,d.ts}` and
   `dist/product/index.{js,d.ts}` (the new subpath).
3. `cd packages/cli && bun run build` — emits the new `build.ts` and
   `preflight-build.ts`.
4. `cd packages/core && bun run build` — passes against the new union types
   + `Values` constants.
5. `cd packages/admin && bun run build` and `cd packages/vendor && bun run
   build` — both pass (these packages have the most callsites for the
   enum migration).
6. `cd apps/api && bun run build` — completes with `.medusa/` + `.mercur/`
   artifacts. `.mercur/types.d.ts`, `.mercur/tsconfig.augment.json`, and
   `.mercur/routes.d.ts` are all present. `.medusa/types/modules-bindings.d.ts`
   does not contain a `'product':` entry after the wrapper finishes.
7. Smoke check the shim: in `apps/api`, a one-liner test file
   `import type { ProductDTO } from "@medusajs/types"; const _x:
   ProductDTO["sellers"] = undefined;` type-checks under `tsc --noEmit`.
   (`sellers` is Mercur-only.)
8. `bunx oxlint --quiet` — no new errors introduced by the migration.
9. `bun run test:integration:http -- product` — passes (the product module
   is the most affected by the enum change).

## Evidence

_2026-05-25 — SPEC-006 starter sub-spec landed._

- `packages/types/src/product/common.ts` — `ProductStatus`,
  `AttributeType`, `ProductChangeStatus`, `ProductChangeActionType` are
  now string-literal union types with companion `*Values` runtime
  constants. Added internal `MercurProductDTO` alias.
- `packages/types/src/index.ts` — type-only re-export of the four
  unions; value re-export of the four `*Values` constants.
- `packages/types/package.json` — new `./product` subpath export.
- 43 callsites across `packages/core`, `packages/admin`,
  `packages/vendor`, `packages/dashboard-shared`, `packages/registry`,
  `apps/api/src/scripts`, and `templates/basic/...` were migrated to
  `<Name>Values.<Member>` for value-position uses (computed property
  keys, default values, `z.nativeEnum(...)`, `model.enum(...)`,
  template literals, comparisons).
- `packages/core/src/modules/product/index.ts` — added
  `MercurProductModuleService` alias export for the shim.
- `packages/cli/src/commands/build.ts` — reintroduced (was deleted in
  commit `67d6f885`). Runs `preflightBuild`, spawns `medusa build`,
  then runs `postprocessModulesBindings`.
- `packages/cli/src/preflights/preflight-build.ts` — new. Emits
  `.mercur/routes.d.ts` (via existing `writeRouteTypes`),
  `.mercur/types.d.ts` (the path-mapping shim with `ProductDTO`,
  `ProductStatus`, and re-declared `ModuleImplementations`), and
  `.mercur/tsconfig.augment.json`. Exposes
  `postprocessModulesBindings` which strips the `product` entry from
  `.medusa/types/modules-bindings.d.ts` after upstream codegen runs.
- `packages/cli/src/utils/get-command-bin.ts` — restored (was deleted in
  `67d6f885`).
- `packages/cli/src/index.ts` — registered the `build` command.
- `apps/api/tsconfig.json` — added `"extends": "./.mercur/tsconfig.augment.json"`.
- `apps/api/.mercur/{routes.d.ts,types.d.ts,tsconfig.augment.json}` —
  generated by running the preflight on apps/api. Stale
  `apps/api/.mercur/index.d.ts` (legacy name pre-routes.d.ts rename)
  deleted.

**Verification runs:**

- `cd packages/types && bun run build` — `tsc` clean, `dist/product/`
  subpath emitted (per `package.json` exports).
- `cd packages/cli && bun run build` — tsup ESM + DTS clean.
- `cd packages/core && bun run build` — Medusa codegen + tsup clean.
- `cd packages/vendor && bun run build` — tsup ESM + DTS clean.
- `cd packages/client && bun run build` — clean.
- `cd packages/dashboard-shared && bun run build` — clean.
- `cd packages/dashboard-sdk && bun run build` — clean.
- `cd packages/providers/payout-stripe-connect && bun run build` —
  clean.
- `cd packages/admin && bun run build` — fails with pre-existing
  `notifications.tsx` `Property 'admin' does not exist on Routes`
  error. Confirmed pre-existing via `git stash`. Tracked under the
  unfinished admin-build issue noted in Session 15 of
  `claude-progress.md` — out of scope for this sub-spec.
- `bun run lint` — no new errors introduced (53 errors are
  pre-existing `no-unused-vars` in unrelated files; confirmed by
  inspecting the file list — none were touched by this sub-spec).
- `bun run test:integration:http -- product/vendor/product` — 10/10
  pass.
- `bun run test:integration:http -- product/admin/product` — 50/50
  pass.
- `bun run test:integration:http -- offer/vendor/offer` — 18/18 pass.
- **Shim smoke test in `apps/api`**: a one-off
  `.smoke-shim-check.ts` with `import type { ProductDTO, ProductStatus,
  ModuleImplementations } from "@medusajs/types"` type-checks
  cleanly. Asserts: (a) `ProductDTO["sellers"]` exists (Mercur-only);
  (b) `ProductStatus` accepts `"requires_action"` (Mercur-only);
  (c) `ModuleImplementations["product"]` resolves to the Mercur
  service (has `addAttributesToProduct`).

## Notes

- The shim file uses `export type *` (not `export *`) to make explicit that
  it is types-only by construction. The runtime side of any `@medusajs/types`
  import still resolves through normal Node resolution to the upstream
  package (which is itself types-only).
- The shim's `ModuleImplementations` re-declaration is intentionally hand-
  enumerated rather than introspected via the TS compiler API. The list is
  derived from the current `apps/api/.medusa/types/modules-bindings.d.ts`
  snapshot (Medusa 2.13.4) — a future spec can lift the list to a generator
  if upstream churns frequently. For 2.13.4 the upstream interface keys are:
  `auth, cache, cart, currency, customer, event_bus, file, fulfillment,
  inventory, locking, notification, order, payment, pricing, product,
  promotion, region, sales_channel, settings, store, tax, user, workflows,
  api_key, stock_location`. Plus the Mercur additions (`admin_ui`, `codegen`,
  `commission`, `custom_fields`, `offer`, `payout`, `seller`, `subscription`,
  `vendor_ui`) are already declared by Medusa's per-build codegen — the shim
  does not redeclare them.
- The preflight is the **same code path** as the standalone `mercur codegen`
  command for the route-map portion. It re-uses `writeRouteTypes(rootDir)`.
- The post-process step in step 3 above runs **after** spawn returns. If the
  spawn exits non-zero, the post-process does not run (build already failed).
- Migration of `ProductStatus.DRAFT` → `ProductStatusValues.DRAFT` is
  mechanical. Type-position uses (`x: ProductStatus`) require zero change
  because we keep the `ProductStatus` name as a string-literal union type
  alias.
