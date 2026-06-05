# Architecture -- @mercurjs/core

## System Overview

`@mercurjs/core` is the Medusa.js plugin that turns a standard Medusa
commerce server into a multi-vendor marketplace. It is published as a
Medusa plugin (built with `medusa plugin:develop` / `tsc` into
`.medusa/server`) and registered into a host Medusa application through
the `withMercur(...)` config wrapper.

The plugin contributes:

- Custom data modules (sellers, members, invites, commissions, payouts,
  subscriptions, attributes, vendor-product attributes, custom fields,
  embedded admin/vendor dashboards, codegen).
- Module links that associate Mercur entities with first-party Medusa
  entities (product, order, cart, fulfillment, inventory, promotion,
  etc.).
- HTTP routes for three scopes: `/admin/*` (marketplace operator),
  `/vendor/*` (seller-facing), `/store/*` (customer-facing), plus
  `/hooks/*` for inbound webhooks.
- Workflows + steps that orchestrate seller, cart, order-group,
  payout, commission, subscription, promotion, campaign, shipping,
  inventory, and price-list flows.
- Subscribers that bridge framework events (e.g. payout webhooks) into
  workflows.
- Embedded admin and vendor dashboards served by the API process in
  either Vite-proxy or static mode.

## Layer Diagram

```
+-----------------------------------------------------------------+
|                  Host Medusa Application                         |
|  medusa-config.ts -> withMercur(config)                          |
|    injects @mercurjs/core plugin + RBAC module + feature flags   |
+-----------------------------------------------------------------+
        |  registers plugin .medusa/server
        v
+-----------------------------------------------------------------+
|                      HTTP Layer (src/api)                        |
|  middlewares.ts                                                  |
|    -> adminMiddlewares + storeMiddlewares + vendorMiddlewares    |
|       + hooksRoutesMiddlewares + dashboard catch-all             |
|  admin/   vendor/   store/   hooks/                              |
|    File-based route.ts handlers with co-located                  |
|    validators.ts, query-config.ts, middlewares.ts.               |
+-----------------------------------------------------------------+
        |  req.scope.resolve(...) / workflow.run()
        v
+-----------------------------------------------------------------+
|                   Workflow Layer (src/workflows)                 |
|  seller / cart / order-group / payout / commission /             |
|  promotion / campaign / shipping-* / inventory-item /            |
|  price-list / subscription / custom-fields / hooks /             |
|  events.ts (event name constants)                                |
+-----------------------------------------------------------------+
        |  step.run() / module.<method>()
        v
+-----------------------------------------------------------------+
|                     Module Layer (src/modules)                   |
|  seller | commission | payout | subscription | attribute |       |
|  vendor-product-attribute | custom-fields | admin-ui |           |
|  vendor-ui | codegen                                             |
|    Each module: index.ts (Module(...)), service.ts,              |
|    models/, migrations/, loaders/, repositories?, providers?     |
+-----------------------------------------------------------------+
        |  defineLink(...)
        v
+-----------------------------------------------------------------+
|                     Link Layer (src/links)                       |
|  product-seller, order-seller, line-item-commission-line,        |
|  campaign-seller, fulfillment-set-seller, stock-location-seller, |
|  promotion-seller, price-list-seller, seller-customer,           |
|  seller-payout-account, order-payout, order-group-cart, ...      |
+-----------------------------------------------------------------+
        |  subscribed events
        v
+-----------------------------------------------------------------+
|                  Subscriber Layer (src/subscribers)              |
|  payout-webhook.ts -> processPayoutForWebhookWorkflow            |
+-----------------------------------------------------------------+
```

## Plugin Entrypoint (`src/with-mercur.ts`)

`withMercur(config)` is the public API consumed by host Medusa apps.
It returns an `InputConfigWithArrayModules` produced by
`defineConfig(...)` and is responsible for:

- Forwarding user `projectConfig.http`, including the Mercur-specific
  `vendorCors` extension typed on `MercurInputConfig`.
- Disabling the legacy Medusa admin app by default
  (`admin.disable: true`) so the Mercur admin dashboard can be served
  in its place.
- Enabling the `rbac` feature flag unless explicitly overridden.
- Idempotently appending Medusa's `rbac` module and the `@mercurjs/core`
  plugin entry, so a host config can be wrapped multiple times without
  duplicates.

## Modules (`src/modules/`)

Each module is a self-contained Medusa module with `index.ts` calling
`Module(MercurModules.<NAME>, { service, loaders? })`.

| Module | Key Models | Purpose |
|--------|------------|---------|
| `seller` | `Seller`, `SellerMember`, `Member`, `MemberInvite`, `Address`, `ProfessionalDetails`, `PaymentDetails`, `OrderGroup` | Seller identity, members, invites (JWT-signed), and per-seller order groups. Hosts `SellerModuleService` with seller validation, member upsert, invite-token generation/verification, and `OrderGroupRepository`. |
| `commission` | `CommissionRule`, `CommissionRate`, `CommissionLine` | Commission configuration and persisted lines linked to order line items. |
| `payout` | `Payout`, `PayoutAccount`, `Onboarding` | Payout records and provider-driven onboarding state; loads payout providers via `loaders/provider.ts`. |
| `subscription` | `SubscriptionPlan`, `SubscriptionOverride` | Seller subscription plans and per-seller overrides. |
| `attribute` | `Attribute`, `AttributeValue`, `AttributePossibleValue` | Attribute definitions and assignable values. |
| `vendor-product-attribute` | `VendorProductAttribute` | Vendor-scoped attribute extensions on products. |
| `custom-fields` | (no models) | Loader-based schema for user-defined custom fields on core entities. |
| `admin-ui` / `vendor-ui` | (no models) | Service wrappers around `DashboardBase` (src/utils/dashboard) for serving the embedded admin/vendor SPAs. |
| `codegen` | (no models) | Dev-only `onApplicationStart` hook that runs `@mercurjs/cli codegen` using the host's detected package runner. |

Conventions:

- `service.ts` extends `MedusaService({ ...Models })` and adds custom
  methods with `@InjectManager` / `@InjectTransactionManager`.
- Module identifier strings come from `MercurModules` in
  `@mercurjs/types`.
- Loaders attach side-effects at boot (feature flag registration,
  payout provider registration, custom field schema parsing).
- Repositories (e.g. `OrderGroupRepository`) are used when a model
  needs queries beyond what `MedusaService` generates.

## Module Links (`src/links/`)

Module links are the marketplace's seams. They use
`defineLink(...)` to wire Mercur tables to Medusa core tables (and to
each other) without breaking module isolation. Notable links:

- `product-seller-link`, `order-seller-link`, `promotion-seller-link`,
  `price-list-seller-link`, `campaign-seller-link`,
  `shipping-option-seller-link`, `shipping-profile-seller-link`,
  `service-zone-seller-link`, `stock-location-seller-link`,
  `inventory-item-seller-link`, `fulfillment-set-seller-link`,
  `seller-customer-link`, `seller-payout-account-link`,
  `payout-seller-link`, `order-payout-link` -- attach core entities to
  a `Seller`.
- `line-item-commission-line-link`, `order-group-cart-link`,
  `order-group-order-link` -- wire Mercur-specific entities into the
  cart/order graph.
- `category-attribute-link`, `seller-attribute-link`,
  `seller-attribute-value-link`, `product-attribute-value-link`,
  `product-vendor-product-attribute-link`,
  `seller-vendor-product-attribute-link` -- attribute graph.
- `seller-member-rbac-role` -- bridges members to the Medusa RBAC
  module.

## API Layer (`src/api/`)

File-based routing with three top-level scopes plus webhook hooks:

- `src/api/admin/*` -- marketplace-operator endpoints
  (`attributes`, `commission-rates`, `members`, `order-groups`,
  `orders`, `payouts`, `products`, `sellers`, `subscription-plans`).
- `src/api/vendor/*` -- seller-facing endpoints covering the full
  vendor surface (products, orders, fulfillment, returns, payouts,
  promotions, price lists, shipping, customers, members, uploads,
  subscription, etc.).
- `src/api/store/*` -- customer-facing endpoints
  (`carts`, `order-groups`, `products`, `sellers`, `shipping-options`).
- `src/api/hooks/*` -- inbound webhooks (e.g. payout providers).
- `src/api/utils/` -- shared middleware helpers:
  `ensureSellerMiddleware`, `unlessBaseUrl`,
  `scanUnauthenticatedRoutes`, `filterBySellerId`,
  `vendorCorsMiddleware`.

### Aggregated Middleware (`src/api/middlewares.ts`)

The root `defineMiddlewares(...)` merges per-scope middleware arrays
(`adminMiddlewares`, `storeMiddlewares`, `vendorMiddlewares`,
`hooksRoutesMiddlewares`) and appends a final catch-all `GET *`
middleware that resolves the `admin-ui` and `vendor-ui` modules and
calls `DashboardBase.getApp()` if the dashboard is enabled. This is
how the API server transparently serves the admin and vendor SPAs.

### Vendor Auth & Seller Context

`vendorMiddlewares` exempts a small allowlist of public routes (seller
registration, `members/invites/accept`, `sellers/select`,
`feature-flags`, `stores`, plus any route flagged via
`scanUnauthenticatedRoutes`) and otherwise enforces:

1. `vendorCorsMiddleware` -- CORS using `http.vendorCors` from project
   config.
2. `authenticate("member", ["session", "bearer"])` via
   `unlessBaseUrl(...)`.
3. `ensureSellerMiddleware` (`src/api/utils/ensure-seller-middleware`):
   - Reads `x-seller-id` header or `req.session.seller_id`.
   - Queries the `seller_member` link for the authenticated member.
   - Rejects with `NOT_ALLOWED` if no membership exists.
   - Populates `req.seller_context = { seller_id, seller_member,
     currency_code }` (typed via
     `src/types/seller-context.ts`, which augments `express.Request`).
   - If the member has a `role_id`, calls
     `ensureSellerDefaultRoles(rbacService)` and injects the role into
     `req.auth_context.app_metadata.roles` so RBAC policies apply.

### Route Convention

Each endpoint directory typically contains:

- `route.ts` -- exports `GET` / `POST` / `PUT` / `DELETE` handlers.
- `validators.ts` -- Zod schemas for body/params/query.
- `query-config.ts` -- default fields & pagination for `query.graph`
  reads.
- `middlewares.ts` -- route-specific middleware bindings exported as a
  named array (e.g. `vendorProductsMiddlewares`).
- `helpers.ts` -- private helpers (when needed).
- `[id]/` subdirectories for path parameters.

Handlers typically resolve `ContainerRegistrationKeys.QUERY` for reads
and run a workflow for writes (e.g. `createProductsWorkflow`,
`createSellersWorkflow`).

## Workflow Layer (`src/workflows/`)

Workflows are the canonical place for write operations. Each top-level
folder groups workflows by entity, with `steps/` and `workflows/`
subdirectories and a barrel `index.ts`. `src/workflows/index.ts`
re-exports them all.

Notable groups:

- `seller/` -- creation, approval, suspension, termination, member
  invites (with token issuance/validation), member updates, removal,
  email dispatch.
- `cart/` -- `add-seller-shipping-method-to-cart`,
  `complete-cart-with-split-orders`,
  `list-seller-shipping-options-for-cart`,
  `update-cart-seller-promotions`.
- `order-group/` -- aggregating per-seller orders into customer-facing
  order groups.
- `payout/` -- payout processing, including the
  `processPayoutForWebhookWorkflow` invoked by the subscriber.
- `commission/`, `promotion/`, `campaign/`, `shipping-option/`,
  `shipping-profile/`, `stock-location/`, `inventory-item/`,
  `price-list/`, `subscription/`, `custom-fields/`.
- `hooks/` -- workflow hooks (e.g. `product-created`,
  `product-variant-created`) attached to first-party Medusa workflows
  to enrich them with marketplace behavior.
- `events.ts` -- event name constants
  (`SellerWorkflowEvents`, `SellerMemberWorkflowEvents`,
  `MemberInviteWorkflowEvents`, `OrderGroupWorkflowEvents`).

## Subscribers (`src/subscribers/`)

- `payout-webhook.ts` -- listens for
  `payout.webhook_received`, normalizes the raw buffer, resolves the
  payout module's `getWebhookActionAndData`, and dispatches the
  result through `Modules.WORKFLOW_ENGINE.run(processPayoutForWebhookWorkflowId, ...)`.

## Policies (`src/policies/`)

`policies/seller.ts` defines a small CRUD policy matrix
(`seller`, `seller_member` x `read|create|update|delete`) via
`definePolicies(...)`. These names are paired with the RBAC module
through the `seller-member-rbac-role` link.

## Feature Flags (`src/feature-flags/`)

- `seller-registration.ts` -- toggles public seller self-registration.

The flag is registered at boot by the seller module loader
`loaders/register-feature-flags.ts`, which is required because
Medusa's plugin discovery does not scan feature flags inside
`node_modules`.

## Embedded Dashboards (`src/utils/dashboard/dashboard-base.ts`)

`DashboardBase` is the shared base class used by both `admin-ui` and
`vendor-ui` module services. It:

- Detects a serving mode on application start: `vite-proxy` (when a
  Vite dev server is reachable on the configured port), `static` (when
  `dist/index.html` exists), or `default-page` (fallback).
- Periodically re-checks for an upgrade out of `default-page` mode
  (throttled to once every 5 s).
- Builds an Express sub-app mounted at `options.path` that either
  proxies to the Vite dev server (via `http-proxy-middleware`) or
  serves the built `dist` directory, including SPA index fallback.
- Exposes `getApp()` so the API's root middleware can run the
  sub-app inline.

The two concrete services live in
`src/modules/admin-ui/services/admin-ui-module-service.ts` and
`src/modules/vendor-ui/services/vendor-ui-module-service.ts`. Their
`__hooks.onApplicationStart` triggers detection and logs the
`http://localhost:9000<path>` URL once ready.

## Providers (`src/providers/`)

Module providers (notification/file/etc.) live here. The package's
`package.json` `exports` map already wires
`./providers/*` to `./.medusa/server/src/providers/*/index.js` so
hosts can register concrete providers as
`@mercurjs/core/providers/<name>`.

## Types Augmentation (`src/types/`)

`seller-context.ts` defines `SellerContext` and augments
`express.Request` with an optional `seller_context` so handlers and
middleware downstream of `ensureSellerMiddleware` can rely on
`req.seller_context`.

## Build & Publish

- `bun run build` (in `packages/core`):
  1. `bunx @mercurjs/cli codegen` -- regenerates the typed client
     descriptors consumed by `@mercurjs/client`.
  2. `rm -rf .medusa && tsc --declaration --outDir .medusa/server`
     -- emits the runtime + `.d.ts` files Medusa loads from the
     published plugin.
- `bun run dev` runs `medusa plugin:develop` so a sibling Medusa app
  can hot-link this plugin.
- `package.json#exports` only publishes `.medusa/server` and the
  generated codegen tree, keeping `src/` source-only.

## Typical Request Flow (Vendor POST /vendor/products)

```
1. Express -> src/api/middlewares.ts -> vendorMiddlewares.
2. vendorCorsMiddleware applies (origin from http.vendorCors).
3. authenticate("member", ["session","bearer"]) resolves member.
4. ensureSellerMiddleware:
   a. Reads x-seller-id (or req.session.seller_id).
   b. query.graph({ entity: "seller_member", ... }) checks membership.
   c. Sets req.seller_context = { seller_id, seller_member, currency_code }.
   d. Injects RBAC role into req.auth_context.app_metadata.roles.
5. vendorProductsMiddlewares validates body via validators.ts.
6. route.ts POST handler:
   a. Reads req.seller_context.seller_id.
   b. Runs createProductsWorkflow(req.scope) with seller_id in
      additional_data so the seller<->product link is established.
   c. Re-queries the created product via query.graph for the response.
7. Response is shaped according to query-config.ts fields.
```

## Typical Webhook Flow (Payout)

```
1. Provider POSTs to /hooks/payout/<provider> (src/api/hooks).
2. Hook route normalizes payload and emits "payout.webhook_received".
3. src/subscribers/payout-webhook.ts handles the event:
   a. Resolves PayoutModuleService.
   b. Re-hydrates rawData Buffer if serialized.
   c. Calls payoutService.getWebhookActionAndData(input).
   d. Runs processPayoutForWebhookWorkflow via WORKFLOW_ENGINE.
4. Workflow updates payout records and links via the payout module.
```
