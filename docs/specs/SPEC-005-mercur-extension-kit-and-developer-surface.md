---
status: passing
canonical: true
area: framework/dx
created: 2026-05-25
last_updated: 2026-05-25
# 2026-05-25: added "Wrapper commands and preflight-driven codegen" section
# defining `mercur build` + `preflight-build` as the starter sub-spec and
# the type-augmentation replacement for `patchContainerTypes()` and the
# `ProductDTO` side of `patch-medusa.ts`. Scope explicitly limited to the
# build wrapper; develop/start/db-* wrappers are out of scope.
# 2026-05-25: narrowed module-registration goal — Mercur's silent override
# of `Modules.PRODUCT` is the chosen design, made visible to TypeScript via
# `.mercur/types.d.ts`'s `ModuleImplementations` augmentation. Workflow
# symbol names dropped the `Mercur` prefix and `Workflow` suffix (now
# `createProducts`, `CreateProductsInput`); the `mercur-` prefix lives
# only on the runtime ID inside `createWorkflow(...)`. No
# `defineMercurWorkflow` helper. Dashboard collapse and Vite config
# extraction removed from scope.
# 2026-05-25: switched product DTO strategy from "additive augmentation +
# opt-in MercurProductDTO" to a full TS path-mapping shim. `.mercur/types.d.ts`
# is now a re-export shim of `@medusajs/types` with Mercur overrides
# (`ProductDTO` → Mercur shape, `ProductStatus` → Mercur enum,
# `ModuleImplementations.product` → Mercur service). A second emitted
# file `.mercur/tsconfig.augment.json` carries the path mapping;
# consumers extend it from their `tsconfig.json`. `MercurProductDTO` no
# longer exists as a public exported name. Reason for the change: module
# augmentation can't replace `status` (enum conflict) or remove
# `options`, so the only way to make `import { ProductDTO } from
# "@medusajs/types"` return the Mercur shape is a path-mapping shim.
# 2026-05-25: fixed three concrete blockers in the path-mapping shim
# design that surfaced during Medusa-source verification:
#   (a) ProductStatus is downgraded from a TS `enum` (runtime value) to a
#       string-literal union type. Path mapping is types-only, so an
#       `enum` swap on `@medusajs/types` would compile but crash at
#       runtime (upstream `ProductStatus` has no runtime export).
#   (b) `ModuleImplementations` is no longer augmented via
#       `declare module`. The shim re-declares the entire interface
#       explicitly (re-listing every upstream key, with `product` typed
#       as `MercurProductModuleService`) and the shim's `export *` is
#       narrowed to `export type *` with `ModuleImplementations` excluded.
#       Reason: framework ships `declare module "@medusajs/types"` with
#       `product: IProductModuleService`; a competing augmentation would
#       collide on "subsequent property declarations must have the same
#       type" — the exact constraint the shim already works around for
#       `ProductDTO.status`.
#   (c) `preflight-build` post-processes Medusa's own generated
#       `.medusa/types/modules-bindings.d.ts` to remove the `'product':
#       IProductModuleService` line after `medusa build` runs the
#       upstream `generateContainerTypes` step. Without this, Medusa's
#       codegen reintroduces the same collision the shim was designed
#       to eliminate. The post-process writes inside the user's project
#       (`.medusa/`), never into `node_modules`.
---

# SPEC-005 Mercur Extension Kit and Developer Surface

This is a `live` canonical spec. It does not have a terminal "done" state — it
is the ongoing contract for how Mercur extends Medusa and how developers reach
into Mercur. Concrete deliverables that move the codebase toward this contract
should be tracked as their own `passing`-style specs that reference this one.

## Why

A developer extending Mercur today has to touch four or more import paths to
implement one concern (e.g. product creation):

- `createProductsWorkflow` from `@mercurjs/core/workflows`
- `ProductDTO` from `@mercurjs/types` (which re-declares upstream Medusa
  types verbatim and silently shadows the `ProductStatus` enum)
- The product module service from `@mercurjs/core/modules/product`
- Anything upstream-only from `@medusajs/core-flows` directly

On top of that, Mercur runs a build-time script (`patch-medusa.ts`) that
rewrites compiled `.js` inside `node_modules/@medusajs/medusa/dist/**` to
disable upstream routes, middlewares, rewire the cart line-items validator,
and strip the `[Modules.PRODUCT]: "IProductModuleService"` entry from
`@medusajs/utils/dist/modules-sdk/modules-to-container-types.js`. That
patch is re-applied on every `bun install`, is fragile under upstream
version bumps, and the type-system surgery in particular hides Mercur's
override from TypeScript.

A workflow-layer ambiguity also exists: ~73 call sites use
`overrideWorkflow(...)` to `WorkflowManager.unregister(id)` an upstream
workflow and re-register a Mercur composer under the same string ID. Code
that imports the upstream workflow gets a function reference whose runtime
behavior has been swapped silently.

The goal of this spec is to:

1. Replace `node_modules` patching with build-time emitted artifacts
   under `.mercur/` (route map + a single `.mercur/types.d.ts` `declare
module` augmentation file).
2. Collapse the developer's import surface to one obvious entry point per
   domain (`@mercurjs/core/<domain>`), with unprefixed workflow symbol
   names and clean type names.
3. End workflow ID shadowing: Mercur workflows use plain `createWorkflow`
   with `mercur-` prefixed runtime IDs; no more `WorkflowManager.unregister`.
4. Shrink `@mercurjs/types` to non-domain types only and `packages/types/src/product/`
   to Mercur deltas only.

Module-level silent override (Mercur's `ProductModuleService` registered
against `Modules.PRODUCT`) is **not** something this spec tries to undo.
That override is the chosen design; the type-augmentation file makes it
visible to TypeScript so call sites see the correct service shape. The
`apps/admin` / `apps/vendor` duplication is also explicitly out of scope
here — those stay as separate apps for now.

## Principles

1. **One entry point per concern.** A developer reaches for `product`,
   `seller`, `offer`, `commission`, `payout` and finds the runtime, types,
   workflow IO, and module service at one import path per domain.
2. **No mutation of `node_modules` at user-machine build time.** All
   extension is registered at build time and writes only into Mercur-owned
   directories (`.mercur/` in the consuming project, package sources in the
   monorepo).
3. **Build-time, deterministic registration.** Type augmentation, route
   skipping, and any other build-time wiring happen through typed APIs at
   build time, not by monkey-patching at runtime.
4. **Module overrides are explicit at the type level.** Mercur silently
   overrides upstream module registrations (e.g. registers its
   `ProductModuleService` against `Modules.PRODUCT`); the type-augmentation
   file makes that override visible to TypeScript so call sites see the
   correct service shape. This is the design, not a bug to fix.
5. **Workflow IDs are namespaced; workflow symbols are not.** Mercur
   workflows register under `mercur-`-prefixed runtime IDs to avoid
   colliding with upstream's `WorkflowManager` registry, but their exported
   TypeScript symbol names carry no prefix. `import { createProducts } from
"@mercurjs/core/product"` is the canonical Mercur path; the function's
   internal `createWorkflow(id, ...)` call uses `"mercur-create-products"`.

## Surfaces

### Wrapper commands and preflight-driven codegen

The CLI ships a wrapper for `mercur build` (only). Other Medusa commands
(`develop`, `start`, `db-migrate`, `db-generate`) are explicitly out of
scope for this spec; if and when they need preflight work, each will be
proposed as its own spec. The build wrapper has exactly two
responsibilities:

1. Run a **preflight** that emits artifacts into `.mercur/`.
2. Delegate to the underlying Medusa command (in-process via direct import
   when possible; spawn the Medusa bin when the command is not safely
   importable).

Concretely, each wrapper lives at `packages/cli/src/commands/<name>.ts` and
its preflight at `packages/cli/src/preflights/preflight-<name>.ts`. The
`.mercur/` directory is already owned by the CLI today (it is the codegen
output dir per `DIST_DIR = ".mercur"` in `packages/cli/src/codegen/constants.ts`).
Preflights write to that directory only; they never touch `node_modules`.

**`mercur build` is the only wrapper.** The deliverable shape is:

```
packages/cli/src/commands/build.ts           ← wraps `medusa build`
packages/cli/src/preflights/preflight-build.ts
                                             ← emits .mercur/types.d.ts
```

**All generated type augmentation lands in a single file: `.mercur/types.d.ts`.**
Not a `.mercur/types/` directory. Not per-domain files. One file.
Consumers' tsconfigs already include `.mercur/**` (per the existing
route-map codegen at `.mercur/index.d.ts`), so the new file is picked up
automatically with no consumer-side change.

**Goal:** any developer who writes
`import { ProductDTO } from "@medusajs/types"` in a Mercur project gets
the Mercur shape — added fields, `status` typed as the Mercur
`ProductStatus` string-literal union, `options` omitted, container
typing for `Modules.PRODUCT` pointing at the Mercur service. One import
path, fully Mercur-aware. No separate `MercurProductDTO`, no opt-in.

**Constraint that shaped the design:** path mapping is a TypeScript-only
mechanism. It redirects type resolution; it does **not** redirect
runtime module resolution. Two consequences fall out of this and the
spec lives within them:

1. **The shim can only swap types, not runtime values.** Upstream
   `ProductStatus` in `@medusajs/types` is a string-literal union (no
   runtime export). So Mercur's `ProductStatus` is also a string-literal
   union, not an `enum`. Code that wants a runtime constant uses the
   `ProductStatusValues` object exported alongside the type from
   `@mercurjs/core/product`. Importing a runtime value from
   `@medusajs/types` was never possible upstream and is not promised
   here either.
2. **`ModuleImplementations` cannot be patched via `declare module`.**
   The framework ships its own `declare module "@medusajs/types"` that
   declares `product: IProductModuleService`. A second augmentation
   with a different service type fails to merge ("subsequent property
   declarations must have the same type" — the same TS rule that forced
   the shim approach for `ProductDTO.status`). The shim therefore
   **re-declares** `ModuleImplementations` explicitly (replacing the
   re-export) rather than augmenting it.

**Why a single `declare module` augmentation isn't enough.** TypeScript's
module augmentation via `declare module "@medusajs/types" { interface
ProductDTO { ... } }` is **additive only**. It can add fields. It cannot
replace `status: ProductStatus` with `status: MercurProductStatus`
(enum conflict — TypeScript refuses to merge with "subsequent property
declarations must have the same type"). It also cannot remove `options`.
Module augmentation is structurally the wrong tool for the "replace" and
"remove" parts of the Mercur diff.

**Mechanism: TypeScript path-mapping shim.** `.mercur/types.d.ts` is
emitted as a re-export shim, and a companion `.mercur/tsconfig.augment.json`
path-maps `@medusajs/types` to it. Consumers extend the augment config
in their root `tsconfig.json`; TypeScript then resolves every
`@medusajs/types` import through the shim, which re-exports upstream
plus Mercur's overrides.

The two emitted artifacts:

```ts
// .mercur/types.d.ts (generated by preflight-build — do not edit)
//
// This file is the shim path-mapped from "@medusajs/types". When code
// writes `import { ProductDTO } from "@medusajs/types"`, TypeScript
// resolves to this file and sees the Mercur overrides below.
//
// `export type *` is used in place of `export *` so we never claim a
// runtime export the upstream package doesn't actually have. The shim
// is types-only by construction.

export type * from "@medusajs/types-original";

// Replace ProductDTO with the Mercur shape (status union swap, options
// dropped, Mercur fields included). Same name; the explicit named
// re-export wins over `export type *` per TS module rules.
export type { MercurProductDTO as ProductDTO } from "@mercurjs/types/product";

// Replace ProductStatus. NOTE: this is intentionally a `type` export,
// not a value export. Upstream `ProductStatus` in @medusajs/types is a
// string-literal union with no runtime value; the shim cannot promise a
// runtime value the underlying package never had. Mercur's
// `ProductStatus` is therefore also defined as a string-literal union
// (see `packages/types/src/product/common.ts`). Code that needs a
// runtime constant imports `ProductStatusValues` from
// `@mercurjs/core/product` directly — that import path resolves
// normally at runtime and is not path-mapped.
export type { ProductStatus } from "@mercurjs/types/product";

// Re-declare ModuleImplementations explicitly. We cannot use `declare
// module` augmentation here: the framework already declares
// `product: IProductModuleService` against the same interface, and TS
// rejects interface merges with conflicting property types. The shim's
// `export type *` above intentionally omits `ModuleImplementations` so
// this re-declaration is the only one visible to consumers of
// "@medusajs/types".
//
// Every upstream key is re-listed verbatim. preflight-build keeps this
// block in sync with upstream by reading the framework's
// `ModuleImplementations` shape via the TS type-checker API at build
// time and emitting the union of (upstream keys) + (Mercur overrides).
import type {
  // The exact upstream interface list is reproduced verbatim by the
  // generator — kept short here for readability.
  IAuthModuleService,
  ICacheService,
  ICartModuleService /* ...all
  upstream module service interfaces... */,
} from "@medusajs/types-original";
import type { MercurProductModuleService } from "@mercurjs/core/product";

export interface ModuleImplementations {
  // upstream entries copied verbatim from @medusajs/framework
  auth: IAuthModuleService;
  cache: ICacheService;
  cart: ICartModuleService;
  // ...etc, every upstream key except `product`...

  // Mercur override
  product: MercurProductModuleService;
}
```

```jsonc
// .mercur/tsconfig.augment.json (generated by preflight-build — do not edit)
{
  "compilerOptions": {
    "paths": {
      "@medusajs/types": ["./.mercur/types.d.ts"],
      "@medusajs/types-original": ["node_modules/..."],
    },
  },
}
```

The consumer's `tsconfig.json` extends the augment fragment (one-line
change, documented in the starter):

```jsonc
// apps/api/tsconfig.json (consumer-owned; one-line change)
{
  "extends": "./.mercur/tsconfig.augment.json",
}
```

Result:

- `import { ProductDTO } from "@medusajs/types"` → Mercur's shape.
- `import type { ProductStatus } from "@medusajs/types"` → Mercur's
  string-literal union. **Type position only.** Runtime constants are
  imported from `@mercurjs/core/product` (`ProductStatusValues`); the
  shim never claims a runtime value upstream doesn't have.
- `import { ModuleImplementations } from "@medusajs/types"` → the shim's
  explicitly re-declared interface with Mercur's `product` field. Not
  augmented; replaced.
- `container.resolve(Modules.PRODUCT)` → typed as the Mercur service.
- `MercurProductDTO` does not exist as a separate exported name.

**Runtime semantics by construction.** The shim is a `.d.ts` file and
uses `export type *` / `export type {…}` exclusively. There are no
`export {…}` lines that would imply a runtime value the upstream package
doesn't carry. At runtime, every `import { ... } from "@medusajs/types"`
resolves to the real upstream package via normal Node resolution; the
upstream package is types-only (no runtime exports), so there is no
runtime divergence and no opportunity for a runtime-vs-type mismatch.

**Disarming Medusa's own codegen output.** `medusa build` runs upstream's
`generateContainerTypes` (`@medusajs/medusa/dist/commands/utils/generate-types.js`)
and writes `.medusa/types/modules-bindings.d.ts` containing a
`declare module "@medusajs/framework/types"` block with a
`'product': IProductModuleService` line (sourced from `SERVICES_INTERFACES`
in `@medusajs/utils/dist/modules-sdk/modules-to-container-types.js`).
`@medusajs/framework/types` re-exports `ModuleImplementations` from
`@medusajs/types`, so the generated binding lands on the same interface
the shim re-declares — and would re-introduce the
"subsequent property declarations must have the same type" collision
the shim was designed to eliminate.

`preflight-build` therefore runs **after** the upstream `generateTypes`
step and post-processes `.medusa/types/modules-bindings.d.ts`, stripping
exactly the `'product': IProductModuleService` line (and its `import
type { IProductModuleService } from '@medusajs/framework/types'` if the
import becomes unused). The replacement is the shim's own
`ModuleImplementations.product` entry. The post-process writes inside
the user's project under `.medusa/` — never into `node_modules`. The
edit is idempotent: re-running the preflight on an already-cleaned file
is a no-op.

There is a follow-up worth filing upstream: a Medusa-side API to mark a
module key as "interface override" (so `generateContainerTypes` either
skips the entry or sources the type from the module's resolved class).
Until that lands, the post-process is the bounded escape hatch and the
spec carries it explicitly rather than silently.

**TS constraint is permanent.** This shim file pattern is the cost of
wanting `import { ProductDTO } from "@medusajs/types"` to return Mercur's
shape. The constraint isn't a Medusa limitation — it's a TypeScript
language limitation on what `declare module` can do. The path-mapping
shim is the standard escape hatch.

**Tooling support.** `tsc`, vite, esbuild, swc, jest (via ts-jest), and
eslint (via `eslint-import-resolver-typescript`) all honor tsconfig
`paths`. Editors using the TypeScript language service get the redirect
automatically. The starter sub-spec verifies behavior under at least
`tsc --noEmit` and the project's vite build.

### Source of truth — shrinking `packages/types/src/product`

Today `packages/types/src/product/common.ts` re-declares the full
`ProductDTO`, `ProductVariantDTO`, `ProductImageDTO`, `ProductTagDTO`,
`ProductCollectionDTO`, `ProductCategoryDTO`, etc. — every one of them a
near-verbatim copy of `@medusajs/types`. The duplicate types diverge
silently from upstream on every Medusa version bump, the only signal being
a future compile error.

The end state under this spec is:

- `packages/types/src/product/` **does not re-declare anything Medusa
  already declares**. No standalone `ProductDTO`, `ProductVariantDTO`,
  `ProductImageDTO`, `ProductTagDTO`, `ProductCollectionDTO`,
  `ProductCategoryDTO`. Those are imported from `@medusajs/types` at the
  point of use (and, via the shim, return the Mercur shape).
- The package contains only Mercur's **deltas**:
  - Mercur-only **string-literal unions** for marketplace state machines
    that have no upstream counterpart in equivalent shape:
    `ProductStatus` (overrides upstream's narrower union),
    `ProductChangeStatus`, `AttributeType`, `ProductChangeActionType`.
    All four are typed as string-literal unions, **not** TS `enum`s,
    because the shim cannot redirect a runtime value via path mapping
    (path mapping is a type-resolution mechanism only — see the
    "Runtime semantics by construction" subsection above).
  - For each union, a companion runtime constant object exported under
    `<Name>Values` (e.g. `ProductStatusValues`) gives callers a way to
    reach a real JS value when they need one (`if (s ===
ProductStatusValues.REQUIRES_ACTION) { ... }`). This object is
    imported from `@mercurjs/core/<domain>` (or `@mercurjs/types`),
    **not** from `@medusajs/types` — the runtime side of the type/value
    split lives off the shim.
  - Mercur-only DTOs that have no upstream counterpart
    (`ProductBrandDTO`, `ProductChangeDTO`, `ProductChangeActionDTO`,
    `ProductAttributeDTO`, `ProductAttributeValueDTO`).
  - The internal `MercurProductDTO` shape
    (`Omit<UpstreamProductDTO, "status" | "options"> & { status:
ProductStatus, ...mercur fields }` where `ProductStatus` is the
    Mercur string-literal union above). This type is **internal** — it
    exists only so the shim can re-export it as `ProductDTO`. Code
    outside `packages/types` and the shim itself never imports
    `MercurProductDTO` by that name; everyone reaches for `ProductDTO`
    from `@medusajs/types`.

`preflight-build` reads from this shrunk package and emits the shim
(`.mercur/types.d.ts`) plus the path-mapping fragment
(`.mercur/tsconfig.augment.json`). There is no second copy of any Medusa
type anywhere in Mercur after this lands.

**Internal consumers that follow when the duplicate types are removed.**
The HTTP response types under `packages/types/src/http/` currently import
`ProductDTO`, `ProductVariantDTO`, and related types from
`../product/common`. Each of these files needs its imports retargeted
during the same change:

- `packages/types/src/http/product.ts` (imports `ProductDTO`,
  `ProductVariantDTO` from the duplicated file)
- `packages/types/src/http/product-category.ts`
- `packages/types/src/http/product-brand.ts`
- `packages/types/src/http/product-attribute.ts`

After the shrink, these imports come from `@medusajs/types` for product
shapes (already the Mercur shape via the shim) and from
`@mercurjs/types/product` only for Mercur-only DTOs that have no upstream
counterpart (`ProductBrandDTO`, `ProductChangeDTO`, etc.). They never
import `MercurProductDTO` by that name — `ProductDTO` from
`@medusajs/types` is the Mercur shape. `VendorProduct extends ProductDTO`
(currently in `http/product.ts`) keeps compiling because the shim's
`ProductDTO` is Mercur's full shape.

What stays the same:

- The wrapper shape: `cwd`, error handling, logger, spawn fallback — copy
  from the deleted `build.ts` shown in the prior chore commit.
- `.mercur/index.d.ts` (the route map already emitted by `writeRouteTypes`)
  continues to live alongside the new `.mercur/types.d.ts`. The preflight
  runs `writeRouteTypes` and the new type-augmentation emitter back to
  back; both write into `.mercur/` and nowhere else.

Every new piece of "things Mercur generates per project" lands as another
emitter inside `preflight-build`, into `.mercur/`. There is one place to
look. Additional CLI commands (develop, start, db-migrate, db-generate) are
not part of this spec — they remain plain Medusa CLI invocations unless and
until a follow-up spec proposes wrapping them.

### `@mercurjs/core/<domain>` — domain-cohesive entry points

Per-domain subpath exports. Each subpath is a physical
`packages/core/<domain>.js` + `.d.ts` (no `exports`-field gymnastics) that
re-exports the runtime, the types, and the workflow IO for that domain:

```
@mercurjs/core/product    → { ProductDTO, ProductStatus, ProductChangeDTO,
                              createProducts,
                              CreateProductsInput,
                              CreateProductsOutput,
                              MercurProductModuleService }
@mercurjs/core/seller     → seller types + workflows + module service
@mercurjs/core/offer      → offer types + workflows + module service
@mercurjs/core/commission → ...
@mercurjs/core/payout     → ...
```

**Symbol names carry no `Mercur` prefix.** Workflows are exported as
`createProducts`, not `mercurCreateProductsWorkflow`. The `Workflow` suffix
also drops. I/O types follow the same shape: `CreateProductsInput`,
`CreateProductsOutput`. The prefix lives only on the runtime registration
ID inside the implementation:

```ts
// packages/core/src/workflows/product/create.ts
import { createWorkflow } from "@medusajs/framework/workflows-sdk";

export type CreateProductsInput = {
  /* ... */
};
export type CreateProductsOutput = {
  /* ... */
};

export const createProducts = createWorkflow(
  "mercur-create-products", // ← prefix only on the runtime ID
  (input: CreateProductsInput): CreateProductsOutput => {
    // composer body
  },
);
```

No `defineMercurWorkflow` helper, no `overrideWorkflow` wrapper. Plain
`createWorkflow` from Medusa's workflow SDK. The `mercur-` prefix
convention is enforced by code review and (later sub-spec) a lint rule
over `createWorkflow` calls inside `packages/core/src/workflows/`.

The only exception class — Mercur workflows whose symbol name must
collide with an upstream symbol to satisfy a backwards-compatible import
path — has no current members. If one appears later, it gets called out
explicitly in the file that re-exports it.

`MercurProductModuleService` keeps its prefix because the class is the
Mercur extension of upstream's `ProductModuleService`; calling them both
`ProductModuleService` would collide at the import level in any file that
uses both.

`@mercurjs/types` shrinks to non-domain types only: `HttpTypes`, `Modules`
enum, `FeatureFlags`, `Dashboard`, `CustomFields`. The wholesale
`export * from "@medusajs/types"` line is removed. Medusa types are
imported from `@medusajs/types`. Mercur additions are imported from
`@mercurjs/core/<domain>` or `@mercurjs/types`. Zero shadowing.

### Module registration — silent override, typed via augmentation

Mercur silently overrides the upstream `product` module registration:
`packages/core` registers its `ProductModuleService` against
`Modules.PRODUCT`, replacing the stock Medusa implementation in the
container. This is the chosen design — not a transitional state.

The type system is brought into agreement with that override by the
**explicit re-declaration** of `ModuleImplementations` inside
`.mercur/types.d.ts` (see "Wrapper commands and preflight-driven
codegen" above):

```ts
export interface ModuleImplementations {
  // every upstream key copied verbatim, EXCEPT product
  // ...
  product: MercurProductModuleService;
}
```

`declare module` augmentation cannot be used here because the framework
already ships `declare module "@medusajs/types" { interface
ModuleImplementations { product: IProductModuleService } }` inside
`@medusajs/framework/types/container.ts`; a competing augmentation with
a different service type would trigger "subsequent property declarations
must have the same type" — the same constraint that drove the shim
approach for `ProductDTO.status`. The shim therefore **replaces**
`ModuleImplementations` (via explicit re-declaration plus an
`export type *` that omits the name) instead of augmenting it. And, as
documented above, `preflight-build` strips the matching `'product'`
line from Medusa's own generated `.medusa/types/modules-bindings.d.ts`
so the upstream codegen doesn't reintroduce the collision.

After both pieces land, `container.resolve(Modules.PRODUCT)` is typed as
`MercurProductModuleService` everywhere, with no call-site change and no
regex patch of `modules-to-container-types.js` inside `node_modules`.
The `SERVICES_INTERFACES`-stripping block in `patch-medusa.ts` is
deleted; the explicit re-declaration plus the codegen post-process is
its replacement, not a staging step. Decomposing `ProductModuleService`
into narrower modules joined via `defineLink` remains a possible future
refactor, but it is **not** an end-state requirement of this spec.

### Workflow registration — no silent overrides

`overrideWorkflow` is deleted. Every workflow Mercur ships uses plain
`createWorkflow` from Medusa's workflow SDK and passes a `mercur-`
prefixed ID as the first argument:

```ts
import { createWorkflow } from "@medusajs/framework/workflows-sdk";

export const createProducts = createWorkflow(
  "mercur-create-products",
  (input) => {
    /* ... */
  },
);
```

Two things to notice:

- **The runtime ID is prefixed.** `WorkflowManager.getWorkflow("create-products")`
  still returns the upstream Medusa composer; Mercur's lives at
  `"mercur-create-products"`. No `WorkflowManager.unregister()` calls
  anywhere.
- **The exported symbol name is not prefixed.** Consumers import
  `createProducts` from `@mercurjs/core/product`. No `mercurCreateProducts`,
  no `Workflow` suffix.

The current 73 `overrideWorkflow` call sites are triaged into three
buckets:

- **Hookable (subscribe to upstream)** — most overrides that only add data
  after the upstream workflow runs (e.g. linking seller to product, attaching
  `product_change`). Convert to subscribers on the upstream workflow's
  published hooks. The Mercur workflow goes away entirely.
- **Wrappable (compose upstream as a step)** — overrides that validate or
  pre/post-process around upstream. The Mercur workflow is defined with
  `createWorkflow("mercur-<id>", ...)` and calls the upstream workflow as
  a composed step. Routes call the Mercur ID.
- **Rewrite (structurally incompatible)** — minority case where upstream
  composition shares no steps with Mercur. Same `createWorkflow("mercur-<id>", ...)`
  shape; the workflow file documents why upstream wasn't reusable.

Every workflow exported by `@mercurjs/core` exports its input and output
types under `<Name>Input` / `<Name>Output` (e.g. `CreateProductsInput`,
`CreateProductsOutput`). Non-breaking; do this first as a forcing
function.

### Public workflow surface

The default developer path is a flat import from the domain subpath:

```ts
import {
  createProducts,
  type CreateProductsInput,
} from "@mercurjs/core/product";

await createProducts(container).run({
  input: {
    /* ... */
  },
});
```

`@mercurjs/core/<domain>` is the canonical place to reach for Mercur
workflows. The upstream `createProductsWorkflow` symbol from
`@medusajs/core-flows` is never re-exported by `@mercurjs/core`. A lint
rule under `packages/api/src` and `packages/core/src/api` forbids
importing workflows from `@medusajs/core-flows` directly; the rule is
allowed only inside Mercur's own workflow composers.

## Acceptance Contract

A Mercur project is conformant with this spec when:

1. `packages/core/src/patch-medusa.ts` does not exist. Nothing in the
   Mercur tree writes into `node_modules/@medusajs/**` at install or
   build time. The closest things to "patching" that remain are
   confined to the user's project directory: the `.mercur/` emitters
   and the post-process of `.medusa/types/modules-bindings.d.ts`.
2. `WorkflowManager.getWorkflow("create-products")` returns the upstream
   Medusa composer. Mercur's equivalent is registered as
   `"mercur-create-products"` (or has been replaced by a subscriber on
   the upstream workflow's hooks). No call to `WorkflowManager.unregister`
   exists anywhere in `packages/core`.
3. Workflow symbols exported from `@mercurjs/core/<domain>` carry no
   `Mercur` prefix and no `Workflow` suffix: `createProducts`,
   `CreateProductsInput`, `CreateProductsOutput`. The prefix lives only
   on the runtime ID passed to `createWorkflow`.
4. `@mercurjs/types` does not contain `export * from "@medusajs/types"`.
   Domain types are imported from `@mercurjs/core/<domain>`.
5. Every workflow exported by `@mercurjs/core` exports its `<Name>Input`
   and `<Name>Output` types.
6. `mercur build` exists as a CLI wrapper in
   `packages/cli/src/commands/build.ts` with a matching
   `packages/cli/src/preflights/preflight-build.ts`. The preflight emits
   only into `.mercur/` (route map at `.mercur/index.d.ts` + types shim
   at `.mercur/types.d.ts` + path-mapping fragment at
   `.mercur/tsconfig.augment.json`); nothing is written into
   `node_modules`. No wrappers exist for `develop`, `start`, or the db
   commands under this spec.
7. `import { ProductDTO } from "@medusajs/types"` (in any consuming
   project that extends `./.mercur/tsconfig.augment.json`) resolves to
   Mercur's shape: `status` typed as the Mercur `ProductStatus`
   string-literal union, `options` absent, Mercur fields present.
   `import type { ProductStatus } from "@medusajs/types"` resolves to
   the Mercur union as well. No `MercurProductDTO` symbol is exported
   from any Mercur package; the Mercur shape is reachable only as
   `ProductDTO` via the shim.
   7a. The Mercur `ProductStatus` (and the other Mercur-only state-machine
   unions: `ProductChangeStatus`, `AttributeType`,
   `ProductChangeActionType`) is a **string-literal union type**, not
   a TS `enum`. A companion runtime constant object is exported as
   `<Name>Values` from `@mercurjs/core/<domain>` for code that needs
   a real JS value. No code anywhere in Mercur imports a runtime value
   from `@medusajs/types`.
8. `container.resolve(Modules.PRODUCT)` is typed as
   `MercurProductModuleService`, achieved by **explicit re-declaration**
   of `ModuleImplementations` inside `.mercur/types.d.ts` (with
   `export type *` narrowed to exclude that interface name) — not by
   `declare module` augmentation. `preflight-build` additionally
   post-processes `.medusa/types/modules-bindings.d.ts` after the
   upstream `generateContainerTypes` step to strip the
   `'product': IProductModuleService` entry, so Medusa's own codegen
   does not re-introduce the merge collision. No regex rewrites of
   compiled `.js` under `node_modules/@medusajs/*`.
9. `packages/types/src/product/` no longer re-declares any type that
   already exists in `@medusajs/types`. It contains only Mercur deltas:
   Mercur-only string-literal unions (`ProductStatus`,
   `ProductChangeStatus`, `AttributeType`, `ProductChangeActionType`)
   plus their `<Name>Values` runtime constants, Mercur-only DTOs, and
   an internal `MercurProductDTO` shape consumed by the shim. All
   internal HTTP response files under `packages/types/src/http/`
   import product shapes from `@medusajs/types` and Mercur-only DTOs
   from `@mercurjs/types/product`.

## Sub-spec Backlog

The work above is large enough that each piece should be tracked as its own
spec with its own verification, evidence, and `passing` state. Suggested
breakdown (numbering is a placeholder — assign as they get picked up):

- SPEC-XXX: `mercur build` wrapper + `preflight-build` emitting (1)
  `.mercur/types.d.ts` as a TypeScript path-mapping shim that re-exports
  `@medusajs/types` with Mercur's overrides (`ProductDTO` → Mercur shape,
  `ProductStatus` → Mercur string-literal union, `ModuleImplementations`
  → explicit re-declaration with `product: MercurProductModuleService`)
  and (2) `.mercur/tsconfig.augment.json` containing the path map
  (`"@medusajs/types": ["./.mercur/types.d.ts"]`). The preflight also
  post-processes `.medusa/types/modules-bindings.d.ts` (generated by
  Medusa's own `generateContainerTypes`) to strip the
  `'product': IProductModuleService` line so the upstream codegen does
  not collide with the shim's re-declared interface. Sourced from
  `packages/types/src/product/` and `packages/core/src/modules/product/`.
  As part of this sub-spec, `packages/types/src/product/` is shrunk to
  deltas only — no more re-declared Medusa types — the four
  `packages/types/src/http/` consumers (`product.ts`,
  `product-category.ts`, `product-brand.ts`, `product-attribute.ts`)
  are retargeted to import product shapes from `@medusajs/types`,
  `ProductStatus` is downgraded from `enum` to a string-literal union
  with a `ProductStatusValues` runtime companion, and the starter
  `apps/api/tsconfig.json` is documented as needing
  `"extends": "./.mercur/tsconfig.augment.json"`. Runtime registration
  of the Mercur product service is unchanged. **This is the starter
  sub-spec and the only CLI wrapper this top-level spec defines.**
- SPEC-XXX: Replace `patch-medusa.ts` route-globs block with a build-time
  `defineFileConfig({ isDisabled })` registration step, called from
  `preflight-build` against compiled Medusa route/middleware files
- SPEC-XXX: Export `<Name>Input` / `<Name>Output` types for every Mercur
  workflow (forcing function; non-breaking)
- SPEC-XXX: Triage the 73 `overrideWorkflow` call sites into
  hook/wrap/rewrite buckets and migrate each to plain `createWorkflow`
  with a `mercur-` prefixed runtime ID
- SPEC-XXX: Introduce `@mercurjs/core/<domain>` subpath exports for the
  top five domains (product, seller, offer, commission, payout), with
  unprefixed workflow symbol names
- SPEC-XXX: Stop wholesale re-exporting `@medusajs/types` from
  `@mercurjs/types`
- SPEC-XXX: Lint rule forbidding `@medusajs/core-flows` imports outside
  Mercur workflow composers

## Notes

- Migration order: start with the `mercur build` wrapper + `preflight-build`.
  It produces the path-mapping shim (`.mercur/types.d.ts`) and the
  matching `.mercur/tsconfig.augment.json` that downstream consumers
  pick up automatically, and post-processes Medusa's generated
  `.medusa/types/modules-bindings.d.ts` so the upstream codegen no
  longer competes with the shim's re-declared `ModuleImplementations`.
  The workflow-side changes (plain `createWorkflow` with `mercur-`
  prefixed IDs, `<Name>Input`/`<Name>Output` exports, override triage)
  follow as independent sub-specs.
- Out of scope: wrappers for `mercur develop`, `mercur start`,
  `mercur db-migrate`, `mercur db-generate`. They stay as plain Medusa CLI
  invocations. If a future need arises, each gets its own spec.
- Out of scope: any `apps/admin` / `apps/vendor` consolidation or Vite
  config sharing. The two dashboard apps stay as they are under this
  spec. A future spec can revisit if real DX pain shows up.
- The workflow input/output type exports are non-breaking and unblock
  programmatic workflow use immediately — they can ship in any order
  without coordination.
- `patch-medusa.ts` is gone end-to-end. No `node_modules` write step
  runs at install or build time. Everything that file used to do is
  either replaced by build-time emitters under `.mercur/` (type shim,
  path-mapping fragment, modules-bindings post-process), runtime
  registration (`defineFileConfig({ isDisabled })` against compiled
  Medusa route/middleware paths), or by the workflow-prefix design
  (Mercur workflows live under `mercur-` IDs; upstream IDs are left
  alone, so the previous "stub upstream" patches become unnecessary).
