---
status: in_progress
canonical: false
priority: 2
area: admin/marketplace
created: 2026-07-15
last_updated: 2026-07-15
---

# SPEC-025 Admin Product-Approval Toggle

Issue **#1238** — let operators decide, at runtime from the Admin panel,
whether vendor-submitted products require operator approval or are
auto-approved.

## Why this is not "just a toggle wired to a feature flag"

The gating behaviour already exists but is driven by the `product_request`
Medusa **feature flag** (`packages/core/src/feature-flags/product-request.ts`):

- Feature flags are `FlagSettings` resolved **once at boot** from
  `medusa-config.ts` / the `MEDUSA_FF_PRODUCT_REQUEST` env var and registered
  on a global in-memory router
  (`packages/core/src/modules/seller/loaders/register-feature-flags.ts`).
- `FeatureFlag.isFeatureEnabled(...)` is read **synchronously** from that
  singleton — there is no setter, no persistence, and no admin route.

So a runtime admin toggle cannot mutate the feature flag: a write would be
per-process, lost on restart, and not shared across workers. The toggle must
be backed by **persistent config**, and the consumption sites must read that
config.

## Decision

- **Persistence:** a boolean on the Store entity —
  `store.metadata.require_product_approval` — reusing the existing admin
  marketplace page and `sdk.admin.stores.$id.mutate` update path (no new
  module or migration).
- **Flag relationship:** the persisted setting **overrides** the feature
  flag. When the metadata key is absent, we fall back to
  `FeatureFlag.isFeatureEnabled(PRODUCT_REQUEST)`, so existing env/config
  deployments keep their behaviour (backward compatible).
- **Label semantics (inverted vs. the flag):** toggle **ON** ⇒ approval
  required ⇒ `true`; toggle **OFF** ⇒ auto-approve ⇒ `false`.

## User-Visible Behavior

- The Admin **Settings → Marketplace** page shows a "Product approval"
  section with a switch: **"Require admin approval for vendor products"**,
  description **"If disabled, vendor-submitted products will be
  automatically approved."**
- Toggling it persists immediately to store metadata.
- When **OFF**: vendor product edits auto-confirm without operator review,
  and vendors may submit a product directly in a published state.
- When **ON**: vendor product edits stay `pending` until an operator
  confirms, and vendors may only create with `draft` / `proposed` status.

## Consumption sites changed

- **Site A — auto-confirm** (`auto-confirm-product-change.ts`): the `when`
  condition now reads a resolved store setting via a workflow step instead
  of the static flag.
- **Site B — create status restriction** (`vendor/products` validator): the
  synchronous `zod.superRefine` flag check is moved into the async
  `POST /vendor/products` route handler, where the container is available to
  resolve the persisted setting.

## Verification

1. `POST /vendor/products` with `status: "published"` is rejected when
   `require_product_approval` is `true` and accepted when `false`
   (integration test, `integration-tests/http/product/vendor/`).
2. `POST /vendor/products/:id` (edit) produces a `pending` product change
   when the setting is `true` and a `confirmed` change when `false`,
   overriding the test-env `MEDUSA_FF_PRODUCT_REQUEST=false`.
3. Admin marketplace page renders the toggle, reflects current metadata, and
   persists changes via `useUpdateStore`.
4. `bun run build` passes.

## Evidence

- Implemented 2026-07-15. `bun run build` passes for all packages (core +
  admin verified green; vendor builds with
  `NODE_OPTIONS=--max-old-space-size=8192` — the default failure was a JS-heap
  OOM in the build env, not a code error, and no vendor files were touched).
- Integration spec written:
  `integration-tests/http/product/vendor/product-approval-setting.spec.ts`
  covering Site A (edit change `pending` vs `confirmed`) and Site B (create
  `published` rejected vs allowed). **Not yet executed** this session —
  run `bun run test:integration:http -- product-approval-setting` against a
  live Postgres/Redis and record the result here before flipping to
  `passing`.

## Notes

The feature flag is intentionally retained as the fallback default; a future
breaking change could remove it once all deployments migrate to the store
setting.
