# Product Description -- Mercur.js

## What Is This?

Mercur is an open-source, MIT-licensed **marketplace platform** built on top of the [Medusa](https://medusajs.com) commerce framework. Medusa supplies the core commerce engine — products, pricing, carts, orders, fulfillment, promotions, payments, events. Mercur adds the marketplace layer on top: sellers, onboarding, commissions, vendor payouts, order splitting, requests, reviews, and three role-specific surfaces (Admin, Vendor, Store).

The product has three audiences:

- **Marketplace operators** — run the platform via the Admin Panel and Admin API.
- **Sellers / vendors** — run their store via the Vendor Portal and Vendor API.
- **Developers / AI agents** — extend the platform via the Dashboard SDK, typed API client, and Medusa's standard module/workflow extension model.

## Core Features

### Multi-Vendor Sellers
- Seller account creation, approval, suspension, unsuspend, and termination workflows.
- Seller profile with name, slug, description, address, professional details, payment details, and metadata.
- Seller team members and role-based invitations (`invite-seller`, `accept-member-invite`).
- Public seller storefronts exposed through the Store API.
- Subscription plans with per-seller pricing overrides.

### Commission Management
- Configurable commission rules and rates (flat, percentage, per-category, default).
- Bulk batch updates via `batch-commission-rules`.
- Per-order commission lines generated automatically during checkout (`refresh-order-commission-lines`).
- Commission visibility for both marketplace operators and individual vendors.

### Vendor Payouts
- Pluggable payout provider interface; **Stripe Connect** ships out of the box.
- Payout account creation and onboarding flows (`create-payout-account`, `create-onboarding`).
- Automatic payout generation tied to settled orders.
- Webhook processing for provider events (`process-payout-for-webhook`).
- Vendor-side onboarding status and payout history in the Vendor Portal.

### Order Splitting & Order Groups
- A single customer cart spanning multiple sellers is split into per-seller orders.
- Order Group entity aggregates child orders, payment, and status for the shopper.
- Admin gets platform-wide order visibility; vendors see only their slice.
- Independent fulfillment, returns, and refunds per child order.

### Catalog & Inventory (Vendor-Scoped)
- Vendor-owned products, variants, collections, categories, tags, and types.
- Custom **attributes** module with vendor-level overrides on top of Medusa's product schema.
- Price lists and price preferences per vendor and region.
- Inventory items and stock locations scoped to the vendor.
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
- Manage products, variants, collections, categories, tags, types, and attributes.
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
|  Modules: Seller · Commission · Payout · Subscription ·       |
|           Attribute · Vendor Product Attribute · Custom       |
|           Fields · Admin UI · Vendor UI · Codegen             |
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
