---
status: passing
canonical: false
priority: 1
area: framework/dx
created: 2026-05-25
last_updated: 2026-05-25
parent: SPEC-005
---

# SPEC-006 Mercur Build Wrapper and Type Shim

Sub-spec of [SPEC-005](./SPEC-005-mercur-extension-kit-and-developer-surface.md).
Delivers the `mercur build` wrapper, the `preflight-build` artifact emitter,
the path-mapping shim that makes `import { ProductDTO } from "@medusajs/types"`
return the Mercur shape, and the type-package cleanup that removes verbatim
Medusa-type duplicates in favor of `Omit + intersection` over upstream.

The workflow override triage, `<Name>Input`/`<Name>Output` exports,
`@mercurjs/core/<domain>` subpath exports, and removing the wholesale
`export *` from `@mercurjs/types` are tracked as separate sub-specs.

## Scope

1. **CLI wrapper.** Reintroduce `packages/cli/src/commands/build.ts` (deleted
   in `67d6f885`). Runs the preflight, then delegates to `medusa build` via
   spawn. Register in `packages/cli/src/index.ts`.
2. **Preflight emitter.** `packages/cli/src/preflights/preflight-build.ts`
   emits into the consuming project's `.mercur/` directory:
   - `routes.d.ts` (existing — via `writeRouteTypes`).
   - `types.d.ts` — path-mapping shim. Re-exports upstream types via
     `export type * from "@medusajs/types-original"`, overrides `ProductDTO`
     with `MercurProductDTO`, and re-declares `ModuleImplementations` so
     `product` types as `MercurProductModuleService`.
   - `tsconfig.augment.json` — TS path map redirecting `@medusajs/types` to
     the shim above and `@medusajs/types-original` to the real upstream
     package.
3. **Real TS enums for Mercur state machines.** In
   `packages/types/src/product/common.ts`: `ProductStatus`, `AttributeType`,
   `ProductChangeStatus`, `ProductChangeActionType` are real TS enums (both
   type and runtime). Code uses `ProductStatus.REQUIRES_ACTION` directly.
   Import path is `@mercurjs/types` (the canonical runtime export).
4. **No verbatim Medusa-type duplicates.** `common.ts` and `mutations.ts`
   drop the previous interface copies of upstream types
   (`ProductImageDTO`, `ProductTypeDTO`, `ProductTagDTO`,
   `ProductCollectionDTO`, `ProductVariantProductImageDTO`,
   `CreateProductImageDTO`, `CreateProductTypeDTO`, etc.). They flow
   through the wholesale `export * from "@medusajs/types"` in
   `packages/types/src/index.ts`. Mercur-extended DTOs (`ProductDTO`,
   `ProductVariantDTO`, `ProductCategoryDTO`, and their mutations) are
   declared as `Omit<UpstreamX, ConflictKeys> & MercurAdditions` over the
   upstream type — no field is copied verbatim.
5. **Expose Mercur product types under a subpath.** `/product` subpath
   export on `packages/types/package.json`. Exposes the enums, Mercur-only
   DTOs, Mercur-extended DTOs, and the `MercurProductDTO` alias used by
   the shim.
6. **Consumer-side wiring.** `apps/api/tsconfig.json` extends
   `./.mercur/tsconfig.augment.json`.

## Why TS enums, not string-literal unions

An earlier draft used string-literal unions plus companion frozen-object
`<Name>Values` constants so the path-mapping shim could swap `ProductStatus`
at the type level. The constants were ugly at the callsite and the
type/runtime split was confusing. Real TS enums are cleaner and the shim
no longer needs to swap `ProductStatus` — Mercur's enum is the canonical
runtime export from `@mercurjs/types`. Code imports from there.

The path-mapping shim still swaps `ProductDTO` because `ProductDTO.status`
must be the Mercur enum (with `REQUIRES_ACTION`), and TS declaration
merging cannot replace an existing field's type.

## User-Visible Behavior

- `mercurjs build` runs the preflight, then `medusa build`.
- Consumers whose `tsconfig.json` extends `./.mercur/tsconfig.augment.json`
  see Mercur's product shape when they `import { ProductDTO } from
  "@medusajs/types"`: `status` typed as Mercur's `ProductStatus`, Mercur
  fields present, upstream's `options` absent.
- `container.resolve(Modules.PRODUCT)` is typed as `MercurProductModuleService`.
- Code that needs the Mercur enum imports `ProductStatus` from
  `@mercurjs/types` (type + runtime, both work).

## Verification

1. `bun install` clean.
2. `cd packages/types && bun run build` — `tsc` clean, `dist/product/` subpath
   emitted.
3. `cd packages/cli && bun run build` — tsup ESM + DTS clean.
4. `cd packages/core && bun run build` — clean.
5. `cd packages/admin && bun run build` and `cd packages/vendor && bun run
   build` — both clean (or `@mercurjs/admin` fails on the pre-existing
   `notifications.tsx` `Routes` issue, confirmed via `git stash`).
6. `cd apps/api && bun run build` — completes with `.medusa/` and `.mercur/`
   artifacts. `.mercur/types.d.ts`, `.mercur/tsconfig.augment.json`, and
   `.mercur/routes.d.ts` are all present.
7. Smoke check the shim in `apps/api`: `import type { ProductDTO,
   ModuleImplementations } from "@medusajs/types"` followed by
   `const _: ProductDTO["sellers"] = undefined` type-checks (Mercur-only
   field present), and `ModuleImplementations["product"]` resolves to a
   service with `addAttributesToProduct`.
8. `bun run test:integration:http -- product` — passes.

## Evidence

_2026-05-25_

- `packages/types/src/product/common.ts` — real TS enums (`ProductStatus`,
  `AttributeType`, `ProductChangeStatus`, `ProductChangeActionType`).
  Mercur-only DTOs only. Mercur-extended DTOs declared as `Omit + &`
  over upstream. `MercurProductDTO` alias for the shim.
- `packages/types/src/product/mutations.ts` — same pattern. Mercur-only
  mutations only. Mercur-extended mutations declared as `Omit + &` over
  upstream.
- `packages/types/src/index.ts` — re-exports the enums (value + type) and
  Mercur-extended DTOs from `./product`. Verbatim Medusa types flow through
  the wholesale `export * from "@medusajs/types"`.
- `packages/types/package.json` — `./product` subpath export.
- `packages/core/src/modules/product/index.ts` — `MercurProductModuleService`
  alias export.
- `packages/cli/src/commands/build.ts` and
  `packages/cli/src/preflights/preflight-build.ts` — new.
- `packages/cli/src/utils/get-command-bin.ts` — restored.
- `packages/cli/src/index.ts` — `build` command registered.
- `apps/api/tsconfig.json` — extends `./.mercur/tsconfig.augment.json`.
- `apps/api/.mercur/{routes,types}.d.ts` + `tsconfig.augment.json` —
  generated.

**Builds:** every package builds clean except `@mercurjs/admin` (pre-existing
`notifications.tsx` failure, confirmed via `git stash`).

**Tests:** `bun run test:integration:http -- product/vendor/product` —
10/10 pass. `bun run test:integration:http -- product/admin/product` —
50/50 pass. `bun run test:integration:http -- offer/vendor/offer` —
18/18 pass.

**Shim smoke test:** in `apps/api`, `import type { ProductDTO, ProductStatus,
ModuleImplementations } from "@medusajs/types"` type-checks against
`ProductDTO["sellers"]`, `"requires_action"` assignable to `ProductStatus`
(via Mercur's enum exported as the union's superset), and
`ModuleImplementations["product"]` resolves to the Mercur service.

## Notes

- The shim file uses `export type *` exclusively. Runtime resolution of
  `@medusajs/types` still goes through the real upstream package (which is
  itself types-only).
- The shim's `ModuleImplementations` re-declaration is hand-enumerated from
  Medusa 2.13.4. If upstream churns, a generator can be added later.
- Mercur's enums are the canonical runtime exports; code imports them from
  `@mercurjs/types` (or `@mercurjs/types/product` for the subpath). There
  is no companion `*Values` constants surface.
