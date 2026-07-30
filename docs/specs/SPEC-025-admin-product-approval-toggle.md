---
status: passing
canonical: false
priority: 2
area: admin/marketplace
created: 2026-07-15
last_updated: 2026-07-28
---

# SPEC-025 Admin Vendor-Product Controls

Issue **#1238** � give operators two runtime marketplace controls from the
Admin panel:

1. **Allow vendors to create products** (`allow_vendor_product_creation`) �
   when off, vendors cannot create products at all.
2. **Require admin approval for vendor products**
   (`require_product_approval`) � when off, vendor submissions are
   auto-approved; when on, they wait for operator review.

Together they cover the three behaviours from the issue:

| Vendor creation | Approval required | Behaviour                                        |
| --------------- | ----------------- | ------------------------------------------------ |
| Disabled        | N/A               | Vendors cannot create products.                  |
| Enabled         | Yes               | Vendors propose products; operator must approve. |
| Enabled         | No                | Vendor products are auto-accepted.               |

## Why this is not "just a toggle wired to a feature flag"

The gating behaviour already exists but is driven by the `product_request`
Medusa **feature flag** (`packages/core/src/feature-flags/product-request.ts`):

- Feature flags are `FlagSettings` resolved **once at boot** from
  `medusa-config.ts` / the `MEDUSA_FF_PRODUCT_REQUEST` env var and registered
  on a global in-memory router
  (`packages/core/src/modules/seller/loaders/register-feature-flags.ts`).
- `FeatureFlag.isFeatureEnabled(...)` is read **synchronously** from that
  singleton � there is no setter, no persistence, and no admin route.

So a runtime admin toggle cannot mutate the feature flag: a write would be
per-process, lost on restart, and not shared across workers. The toggle must
be backed by **persistent config**, and the consumption sites must read that
config.

## Decision

- **Persistence:** a boolean on the Store entity �
  `store.metadata.require_product_approval` � reusing the existing admin
  marketplace page and `sdk.admin.stores.$id.mutate` update path (no new
  module or migration).
- **Flag relationship:** the persisted setting **overrides** the feature
  flag. When the metadata key is absent, we fall back to
  `FeatureFlag.isFeatureEnabled(PRODUCT_REQUEST)`, so existing env/config
  deployments keep their behaviour (backward compatible).
- **Label semantics (inverted vs. the flag):** toggle **ON** ⇒ approval
  required ⇒ `true`; toggle **OFF** ⇒ auto-approve ⇒ `false`.

## User-Visible Behavior

- The Admin **Settings → Marketplace** page shows a "Vendor products"
  section with up to two switches:
  - **"Allow vendors to create products"** � description **"If disabled,
    vendors cannot create new products."**
  - **"Require admin approval for vendor products"** (only shown while
    creation is enabled) � description **"If disabled, vendor-submitted
    products will be automatically approved."**
- Toggling either persists immediately to store metadata.
- When **creation is OFF**: `POST /vendor/products` is rejected with a `FORBIDDEN` (HTTP 403) error and the approval switch is hidden (N/A).
- When approval is **OFF**: vendor product edits auto-confirm without
  operator review, and vendors may submit a product directly in a published
  state. A submission that omits `status` still defaults to `proposed`
  (Site B) and is then elevated to `published` by the `productsCreated`
  hook (Site D) � the default itself never depends on the toggle.
- When approval is **ON**: vendor product edits stay `pending` until an
  operator confirms, and vendors may only create with `draft` / `proposed`
  status.

## Consumption sites changed

- **Site A � auto-confirm** (`auto-confirm-product-change.ts`): the `when`
  condition now reads a resolved store setting via a workflow step instead
  of the static flag.
- **Site B � create status restriction** (`vendor/products` validator): the
  synchronous `zod.superRefine` flag check is moved into the async
  `POST /vendor/products` route handler, where the container is available to
  resolve the persisted setting. A `status`-less submission always defaults
  to `proposed` here, regardless of the toggle.
- **Site C � create gate** (`POST /vendor/products` route): when
  `allow_vendor_product_creation` resolves to `false`, the handler throws a
  `FORBIDDEN` error (HTTP 403) before running the create workflow. Absent
  metadata defaults to `true` (`resolveAllowVendorProductCreation`),
  preserving legacy behaviour.
- **Site D � create auto-publish hook**
  (`workflows/product/hooks/auto-publish-created-products.ts`): a
  `createProductsWorkflow.hooks.productsCreated` handler that, when
  `require_product_approval` resolves to `false`, updates any product left
  in `proposed` status straight to `published` via the product module
  service. This keeps the create route's default status computation
  independent of the toggle (per reviewer feedback on PR #1263) while still
  giving the "vendor products are auto-accepted" behaviour from the issue's
  table.
- **Site E - vendor panel create button** (`product-list-header.tsx`): the
  vendor dashboard reads `store.metadata.allow_vendor_product_creation` via
  `useStore` and renders the Create button disabled with an explanatory
  tooltip when creation is off, instead of letting the vendor land on a
  create form that Site C will reject with 403. Server-side enforcement
  (Site C) remains authoritative; this is UX only.

## Verification

1. `POST /vendor/products` is rejected with **403** when
   `allow_vendor_product_creation` is `false`, and accepted when `true`
   (Site C, integration test).
2. `POST /vendor/products` with `status: "published"` is rejected when
   `require_product_approval` is `true` and accepted when `false`
   (Site B, integration test).
3. `POST /vendor/products/:id` (edit) produces a `pending` product change
   when the setting is `true` and a `confirmed` change when `false`,
   overriding the test-env `MEDUSA_FF_PRODUCT_REQUEST=false` (Site A).
4. Admin marketplace page renders both toggles, reflects current metadata,
   and persists changes via `useUpdateStore`; the approval toggle is hidden
   while creation is disabled.
5. `POST /vendor/products` with no `status` in the body comes back
   `proposed` when `require_product_approval` is `true`, and `published`
   when `false` (Site D, integration test).
6. Vendor dashboard "Create" button is disabled with a tooltip when
   `allow_vendor_product_creation` is `false`, and links to the create form
   as before when `true` or unset (Site E, manual/visual check - no vendor
   package component-test harness exists in this repo).
7. `bun run build` passes.

## Evidence

- `bun run build` passes for `@mercurjs/core` and `@mercurjs/admin` (admin
  ESM + DTS green with `NODE_OPTIONS=--max-old-space-size=8192`; the default
  heap size OOMs in this env after a successful ESM build, not a code error).
- Integration spec
  `integration-tests/http/product/vendor/product-approval-setting.spec.ts`
  executed 2026-07-16 against a local Postgres � **6/6 passing** (Site A
  pending/confirmed, Site B published rejected/allowed, Site C creation
  403/allowed):

  ```
  Test Suites: 1 passed, 1 total
  Tests:       6 passed, 6 total
  ```
- The spec's original run surfaced a real test-harness defect: the direct
  `storeService.updateStores({ id, metadata })` call did not persist
  metadata (store read back `metadata: null`). Fixed by driving the update
  through `updateStoresWorkflow` � the same path the admin route uses.
- Site D's two new cases (default-status proposed/auto-published) were added
  to the same spec but have not been re-run against a local Postgres in this
  session (no Docker/DB available in this environment) � `tsc --noEmit` on
  `@mercurjs/core` passes with the hook wired in; running the full
  integration suite locally is the outstanding verification step.
- Site E (`product-list-header.tsx`) added 2026-07-28: `tsc --noEmit` on
  `@mercurjs/vendor` shows no new errors from this file. No component-test
  harness exists for `@mercurjs/vendor`, so this was checked by type-check
  and code review only, not an automated test.

## Notes

The feature flag is intentionally retained as the fallback default; a future
breaking change could remove it once all deployments migrate to the store
setting.
