# Product Description -- Mercur.js

## What Is This?

Mercur is an open-source, MIT-licensed **marketplace platform** built on top of the [Medusa](https://medusajs.com) commerce framework. Medusa supplies the core commerce engine — products, pricing, carts, orders, fulfillment, promotions, payments, events. Mercur adds the marketplace layer on top: sellers, onboarding, commissions, vendor payouts, order splitting, requests, reviews, and three role-specific surfaces (Admin, Vendor, Store).

The product has three audiences:

- **Marketplace operators** — run the platform via the Admin Panel and Admin API.
- **Sellers / vendors** — run their store via the Vendor Portal and Vendor API.
- **Developers / AI agents** — extend the platform via the Dashboard SDK, typed API client, and Medusa's standard module/workflow extension model.

## Core Features

### Multi-Vendor Sellers
- Seller account creation, approval, suspension, unsuspend, and termination workflows. Account status is one of `pending_approval`, `open`, `suspended`, or `terminated`.
- Seller profile with name, slug, description, address, professional details, payment details, and metadata.
- **Scheduled closures** — a seller can set `closed_from` / `closed_to` to temporarily go offline (storefront unavailable, no new orders) without changing account status; the store auto-resumes once `closed_to` passes.
- **Premium sellers** — an operator-only `is_premium` flag used by the storefront for featured placement, badges, and priority curation (vendors cannot self-designate).
- **Members are many-to-many** — multiple members per seller, and one user can belong to multiple sellers and switch between them via a store switcher (fully isolated access per store). Every seller must have at least one admin member; member email is unique within a single seller. Invitations via `invite-seller` / `accept-member-invite`.
- Public seller storefronts exposed through the Store API.

### Commission Management
- Configurable commission rules and rates: fixed (per-currency amounts, falling back to a default `value`) or percentage.
- Rules match across five dimensions — `product`, `product_type`, `product_collection`, `product_category`, `seller`. Resolution is most-specific-wins (AND across dimensions, OR within a dimension); ties break to the oldest rate. Only the global rate may commission shipping (`include_shipping`).
- All commission arithmetic uses BigNumber (arbitrary precision) for financial accuracy.
- Bulk batch updates via `batch-commission-rules`.
- Per-order commission lines generated automatically during checkout (`refresh-order-commission-lines`).
- Commission visibility for both marketplace operators and individual vendors.

### Vendor Payouts
- Pluggable payout provider interface; **Stripe Connect** ships out of the box.
- Payout account creation and onboarding flows (`create-payout-account`, `create-onboarding`). Each account carries an onboarding record holding provider-specific data (e.g. Stripe Connect links).
- Payout account lifecycle: `PENDING` → `ACTIVE`, then `ACTIVE` ↔ `RESTRICTED` (provider flagged, e.g. missing KYC) or `ACTIVE` → `REJECTED`, driven by provider webhooks.
- **Automated payout pipeline**: a capture-check job (every 15 min) finds orders ready for capture; a subscriber captures authorized payments; a daily job (1 AM UTC) emits `payout.requested` for eligible orders; a subscriber runs `createPayoutWorkflow` to transfer funds. Tunable in `medusa-config.ts` via `authorizationWindowMs` (7d), `sellerActionWindowMs` (72h), `captureSafetyBufferMs` (24h), `requiredFulfillmentStatus` (`"fulfilled"`).
- Webhook processing for provider events (`process-payout-for-webhook`).
- Vendor-side onboarding status and payout history in the Vendor Portal.

### Order Splitting & Order Groups
- A single customer cart spanning multiple sellers is split into per-seller orders.
- Order Group entity aggregates child orders, payment, and status for the shopper. It exposes a human-readable auto-incrementing `display_id` and a read-only `cart_id` link to the originating cart (carts are immutable after checkout). `seller_count` and `total` are computed at query time, not stored.
- Admin gets platform-wide order visibility; vendors see only their slice.
- Independent fulfillment, returns, and refunds per child order.

### Master Products & Offers
- **Master products** form a single shared catalog — products are *not* seller-owned. Creating a product adds it to the shared catalog; the creator only gets attribution on unreviewed submissions.
- A **product–seller link** acts as an allowlist controlling which sellers may sell which products.
- Product status lifecycle: `draft` → `proposed` → `published`, or → `rejected`. Vendor-created products default to `proposed`. Visibility: vendors see their own submissions (any status) plus published products not allowlisted to others; admins see everything; the store sees published products of visible sellers.
- **Offers** are how a seller sells against a master product. An offer carries the seller's own SKU (unique per seller), price (offer-scoped pricing rule), inventory (offer-scoped, not variant-scoped), and shipping profile. Cart/order line items record which offer was purchased.

### Product Requests & Change Pipeline
- All product edits flow through a review pipeline of immutable `ProductChange` records — a full audit trail of who changed what and who approved it.
- `ProductChangeAction` types: `UPDATE`, `VARIANT_ADD` / `VARIANT_UPDATE` / `VARIANT_REMOVE`, `ATTRIBUTE_ADD` / `ATTRIBUTE_UPDATE` / `ATTRIBUTE_REMOVE`, `STATUS_CHANGE`, `PRODUCT_ADD`, `PRODUCT_DELETE`.
- Status lifecycle: `pending` → `confirmed` / `declined` / `canceled`, or `requires_action` when a revision is requested. Low-risk edits auto-confirm without operator review.
- Vendors see their own pending edits and revision requests on product pages.

### Catalog & Inventory
- Marketplace-wide master products, variants, collections, categories, tags, and types; sellers list via offers (see above), which carry vendor-scoped price, inventory, and shipping.
- **Product attributes** — an operator-managed, typed attribute catalog with five types: `multi_select`, `single_select`, `text`, `unit`, `toggle`. A `multi_select` attribute marked `is_variant_axis` generates product variants (backed by native Medusa `ProductOption`). Attributes can be global (shared catalog) or inline/product-scoped (one-off); an `is_filterable` flag exposes them as storefront filters. Products attach attributes through a single batch endpoint.
- Price lists and price preferences per vendor and region.
- Inventory items and stock locations (offer-scoped stock).
- Bulk product CSV import / export.

### Shipping & Fulfillment
- Vendor-configured shipping profiles, options, and option types.
- Vendor-level fulfillment sets and fulfillment providers.
- Region- and tax-region-aware rate calculation through the Store API.

### Promotions & Campaigns
- Vendor-level promotions and campaigns scoped to that vendor's catalog.
- Platform-wide promotions configurable from the Admin Panel.

### Returns & Requests
- Vendor-driven return workflows with vendor-defined return reasons.
- Seller-initiated approval requests (product publish, returns, refunds).

### Reviews
- Customer reviews for products and sellers.
- Admin, vendor, and customer routes.
- Aggregate rating exposed on public seller storefronts.

### Search & Discovery
- Optional **Algolia** and **Meilisearch** integrations with admin UI for re-indexing.

### Notifications & Communication
- In-app vendor notification feed.
- Vendor ↔ customer messaging.

### Wishlist
- Customer wishlists with admin moderation routes.

### Admin Panel Capabilities
- Manage all sellers (list, detail, approvals, professional and payment details, deactivation).
- Configure commission rates and platform-wide rules.
- Monitor all payouts across the marketplace.
- Marketplace configuration: currencies, sales channels, regions, tax regions, locations.
- Platform-wide catalog configuration: attributes, product types, tags, categories, collections, price lists.
- Admin user, role, and API key management.
- View every order, fulfillment, and return across sellers.

### Vendor Portal Capabilities
- Manage offers against master products (SKU, price, inventory, shipping); submit product edits through the change-request pipeline and track their approval status.
- Manage variants, collections, categories, tags, types, and attributes.
- View, fulfill, and refund orders; process returns.
- Configure shipping profiles, fulfillment, and return reasons.
- Create promotions and campaigns scoped to their catalog.
- Manage customers and customer groups.
- Track payouts, configure payout accounts, complete provider onboarding.
- Store profile and settings; invite and manage team members.
- Authentication (register, login, password reset, accept invite).

## Developer & Extensibility Features

### Dashboard SDK (`@mercurjs/dashboard-sdk`)
- Vite plugin shared by admin and vendor apps.
- File-based routing — drop a file in `src/routes/` and the page is registered.
- Automatic navigation generation with labels, icons, rank, nesting, i18n namespaces.
- Component overrides for layout primitives (sidebars, topbar, store setup, onboarding fields).
- Build-time configuration for backend/vendor URLs and i18n.

### Dashboard Shared (`@mercurjs/dashboard-shared`)
- Reusable React UI primitives, hooks, and form/table utilities used by both panels.
- Built on Medusa UI, Radix, and TanStack Query / Table.

### Typed API Client (`@mercurjs/client`)
- Fully typed fetch wrapper for the Admin, Vendor, and Store APIs.
- Types are generated from real route definitions, so requests and responses stay in sync with the backend.
- Route-based access pattern: `sdk.admin.entities.$id.query({ $id })`, `sdk.admin.entities.mutate(payload)`.

### Core Plugin (`@mercurjs/core`)
- Installed as a standard Medusa plugin and provides every marketplace module, link, workflow, API route, and subscriber.
- Extended through Medusa's normal extension model: custom modules, module links, workflow hooks, subscribers, and additional API routes inside the consuming project.

### Blocks & Registry
- **Blocks** are the primary way marketplace features ship — distributed as **source code**, not packages. The CLI copies files directly into the project, so you own every line (no hidden abstractions or version conflicts). A block can bundle modules, workflows, API routes, links, and vendor/admin UI extensions; installation may require registering a module, adding middlewares, running migrations, and codegen.
- Updates are explicit: `bunx @mercurjs/cli@rc diff <block>` shows upstream changes; re-install with `--overwrite`.
- **Registries** catalog blocks via a `registry.json` (file types `registry:module` / `:workflow` / `:api` / `:link` / `:vendor` / `:admin` / `:lib`, with dependencies). `bunx @mercurjs/cli@rc build` embeds file contents into JSON, which can be hosted on any static host (GitHub Pages, S3, …). Custom registries can be added to `blocks.json` with optional auth headers.

### Templates
- **basic** — full-stack marketplace monorepo (API, admin, vendor) with Turborepo, ready for production.
- **plugin** — npm-publishable Mercur plugin scaffold for sharing modules, providers, workflows, and UI.

### AI Integration
- `llms.txt` exposes the full documentation to any LLM.
- MCP server lets editors (Cursor, VS Code, Claude Code) search Mercur docs live.
- Pre-built **Skills** ship in every project to guide agents through page, form, tab, and component migrations.
- The typed client, monorepo layout, exposed workflows, dashboard SDK, and pluggable payout providers give AI agents structured contracts to extend rather than guess at.

## System Layout

```
+---------------------------------------------------------------+
| Storefront (any framework)        ─ Store API  (/store/*)     |
+---------------------------------------------------------------+
| Vendor Portal  (port 7001)        ─ Vendor API (/vendor/*)    |
| Admin Panel    (port 7000)        ─ Admin API  (/admin/*)     |
+---------------------------------------------------------------+
|                  Mercur Core Plugin (@mercurjs/core)          |
|  Modules: Seller · Commission · Offer · Payout ·              |
|           Product Attribute · Product Edit (change pipeline) · |
|           Order Group · Media · Custom Fields ·               |
|           Admin UI · Vendor UI · Codegen                      |
+---------------------------------------------------------------+
|                    Medusa Framework (core commerce)           |
|   Products · Pricing · Cart · Orders · Promotions · Payments  |
+---------------------------------------------------------------+
|                 Postgres · Redis · Payout Provider            |
+---------------------------------------------------------------+
```

## Constraints

- **Runtime**: Node.js + Bun. The repo enforces `bun` as the only package manager.
- **Database**: PostgreSQL (Medusa requirement).
- **Framework lock**: peer-pinned to `@medusajs/framework` 2.13.4 across core and providers.
- **Languages**: TypeScript end-to-end; React 18 for the dashboards.
- **License**: MIT, open-core. No transaction fees, no commercial lock-in, no hosted vendor required.
- **Payout providers**: only Stripe Connect ships out of the box; others must be implemented against the provider interface.

## Distribution Surface

- `@mercurjs/core` — marketplace plugin for the Medusa server.
- `@mercurjs/client` — typed API client.
- `@mercurjs/types` — shared TypeScript contracts.
- `@mercurjs/dashboard-sdk` — Vite plugin and types for admin/vendor extensibility.
- `@mercurjs/dashboard-shared` — shared dashboard primitives.
- `@mercurjs/admin` — admin panel UI package.
- `@mercurjs/vendor` — vendor portal UI package.
- `@mercurjs/payout-stripe-connect` — Stripe Connect payout provider.
- Templates (`basic`, `plugin`) — starter scaffolds.
