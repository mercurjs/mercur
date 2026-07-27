# Architecture — Mercur.js Marketplace Platform

## System Overview

Mercur.js is an open-source multi-vendor marketplace platform built on top of [Medusa.js](https://medusajs.com). It adds a marketplace layer (sellers, members, commissions, payouts, multi-vendor orders) to a standard Medusa commerce backend, plus two dashboard surfaces (Admin and Vendor) built with React + Vite, and a CLI + blocks registry for scaffolding and extending projects.

The repository is a Turborepo monorepo managed with Bun. It contains the framework packages (`packages/`), starter apps (`apps/`) wired to those packages, and starter templates (`templates/`) used by the CLI to scaffold new projects.

## Layer Diagram

```
+-----------------------------------------------------------------+
|                     Storefront / Clients                         |
|        (React app, mobile app, server-side calls, etc.)          |
+-----------------------------------------------------------------+
                              |
                              |  @mercurjs/client (typed proxy:
                              |   .query / .mutate / .delete)
                              v
+-----------------------------------------------------------------+
|                     API Server (apps/api)                        |
|   Medusa server + withMercur() plugin                            |
|   Routes: /admin/*  /vendor/*  /store/*                          |
+-----------------------------------------------------------------+
                              |
                              |  HTTP routes -> workflows -> modules
                              v
+-----------------------------------------------------------------+
|                     @mercurjs/core (Medusa plugin)               |
|  modules:    seller, commission, offer, payout, order-group,     |
|              product-attribute, product-edit, media,             |
|              shipping-profile, price-list, promotion, ...        |
|  workflows:  seller lifecycle, payouts, commissions,             |
|              order-group split, cart, fulfilment, ...            |
|  api:        admin/* vendor/* store hooks + middlewares          |
+-----------------------------------------------------------------+
                              |
                              |  Medusa framework + DB
                              v
+-----------------------------------------------------------------+
|       Postgres + Redis        |   Stripe Connect (payouts)       |
+-----------------------------------------------------------------+

Dashboards (separate Vite apps that talk to the API above):

+-----------------------------------+   +---------------------------------+
|  Admin (apps/admin-test :7000)    |   |  Vendor (apps/vendor :7001)     |
|  @mercurjs/admin pages            |   |  @mercurjs/vendor pages         |
|  @mercurjs/dashboard-shared       |   |  @mercurjs/dashboard-shared     |
|  @mercurjs/dashboard-sdk (Vite    |   |  @mercurjs/dashboard-sdk        |
|   plugin: file-based routing,     |   |   (same extension model)         |
|   blocks, virtual route module)   |   |                                  |
+-----------------------------------+   +---------------------------------+
```

## Packages

### `packages/core` — marketplace plugin
The Medusa plugin that holds all marketplace business logic. Wired into the API via `withMercur()` in `apps/api/medusa-config.ts`.

- **Modules** (`src/modules/`): `seller` (registration, profiles, members, order groups), `commission` (rates, rules, calculation), `offer` (seller listings against master products), `payout` (accounts, onboarding, payouts), `product-attribute` (typed attribute catalog), `product-edit` (product change-request pipeline), `order-group`, `media`, `custom-fields`, `inventory-item`, `stock-location`, `shipping-profile`, `shipping-option`, `price-list`, `promotion`, `campaign`.
- **Workflows** (`src/workflows/`): 22+ workflow groups for seller lifecycle (create / approve / suspend), member invites, commissions, payouts, multi-vendor cart and order split, offers, product change-requests, fulfilment. Workflows support compensation (automatic rollback on failure) and expose hooks as extension points; steps return `StepResponse` and compose into a `WorkflowResponse`.
- **Modules never reference each other directly** — cross-module communication happens only through **links** and **workflows**. Links are relationships defined separately (e.g. `product-seller-link`, `offer-product-link`, `offer-variant-link`, `order-group-order-link`); dozens of them wire the marketplace layer into the commerce layer.
- **Scheduled jobs + subscribers**: jobs run on intervals (e.g. payout capture-check every 15 min, daily payouts at 1 AM UTC) and emit events; subscribers listen and fire async side effects (notifications, webhook calls, payout transfers).
- **API routes** (`src/api/`): `admin/*` (marketplace operator), `vendor/*` (seller-scoped), plus hooks, middlewares, query configs, and validators.
- **Auth/RBAC**: `withMercur()` auto-registers a roles module so vendor scoping works out of the box.

### `packages/cli` — `mercurjs` command
Scaffolds and operates projects. Key commands:

- `init` — initialize an existing project with a `blocks.json` configuration. (Bootstrapping new projects from `templates/basic` / `plugin` lives in the standalone `create-mercur-app` package under `packages/create-mercur-app`.)
- `add`, `search`, `view`, `diff` — discover and install **blocks** declared in `blocks.json`.
- `develop`, `start`, `build` — run the API + dashboards.
- `codegen`, `registry-codegen`, `plugin-build`, `registry-build` — generate the typed route map consumed by `@mercurjs/client` and build registry/plugin artefacts.

### `packages/client` — typed fetch wrapper
`createClient(...)` returns a recursive `Proxy`. Accessing `sdk.admin.products.$id.query({ $id })` resolves to a `GET /admin/products/:id`; `.mutate(...)` is POST, `.delete(...)` is DELETE. Types come from the generated route map. This is the only HTTP layer used by the dashboards.

### `packages/types`
Shared TypeScript types: re-exports Medusa framework types and adds Mercur entities (seller, member, commission, payout, order-group, etc.). Every other package depends on this.

### `packages/dashboard-sdk` — extension Vite plugin
The mechanism that lets users add their own pages and blocks into Admin/Vendor without forking. It:

- Scans `src/routes/**/page.tsx` to build a file-based route tree.
- Reads `blocks.json` aliases and resolves block packages from `node_modules` or workspace packages.
- Injects a virtual module (`RESOLVED_ROUTES_MODULE`) at build time so the dashboard app gets a single, statically-typed route map.
- Recognises `admin_ui` and `vendor_ui` entry points exported by block packages.

### `packages/dashboard-shared`
React primitives shared by Admin and Vendor: `TabbedForm`, `DataTable`, `Form`, `SwitchBox`, `FileUpload`, `ChipInput`, `ActionMenu`, layout shells. Built on `@medusajs/ui`, Ariakit, React Hook Form, TanStack Query/Table, i18next.

### `packages/admin` — operator dashboard UI library
~39 page folders covering the operator surface: sellers, products, categories, orders, customers, inventory, locations, commissions, attributes, payouts, campaigns, collections, order-groups, commission-rates, etc. Each folder typically owns `page.tsx`, query configs, validators, and forms.

### `packages/vendor` — seller dashboard UI library
~24 page folders for the vendor surface: products, orders, payouts, categories, inventory, price-lists, campaigns, collections, customers, product-variants, promotions, onboarding, store settings. Same primitives as Admin, scoped to a single seller's data.

### `packages/registry` — blocks registry
Private workspace holding the canonical block catalogue (team management, reviews, notifications, search integrations, chat, etc.). Backs `mercurjs search` / `mercurjs view` / `mercurjs add`.

### `packages/providers/payout-stripe-connect`
Stripe Connect implementation for the `payout` module: creates connected accounts per seller and transfers payout balances.

## Apps (starters wired to the packages)

- **`apps/api`** — Medusa 2.x server. `medusa-config.ts` calls `withMercur()` to mount the core plugin and RBAC module. Exposes `/admin`, `/vendor`, and `/store` routes. Scripts: `dev`, `start`, `test:integration:http`, `test:integration:modules`, `test:unit`.
- **`apps/admin-test`** — Vite app on **port 7000**. Mounts `@mercurjs/admin`, runs `mercurDashboardPlugin` from `@mercurjs/dashboard-sdk`, and points at the API. Drop a `page.tsx` under `src/routes` to add an admin page.
- **`apps/vendor`** — Vite app on **port 7001**. Same setup as admin but mounts `@mercurjs/vendor`. Used by sellers.
- **`apps/docs`** — Mintlify documentation site.

## Templates (consumed by the CLI)

- **`templates/basic`** — full marketplace starter (API + Admin + Vendor + workspace tooling). What `create-mercur-app` produces. Ships with `.claude/skills/` for `dashboard-page-ui`, `dashboard-form-ui`, `dashboard-tab-ui`, `mercur-cli`, `mercur-blocks`.
- **`templates/plugin`** — scaffold for building a reusable Medusa/Mercur plugin that can be installed as a block into projects.
- **`templates/registry`** — scaffold for hosting a custom block registry (alternative to the default `@mercurjs/registry`).

## Core Domain Concepts

- **Seller** — the marketplace vendor entity. Has handle, contact, address, payment details, account status (`pending_approval` / `open` / `suspended` / `terminated`), an operator-only `is_premium` flag, and optional scheduled-closure window (`closed_from` / `closed_to`).
- **Member** — a user belonging to a seller, with roles. The relationship is many-to-many (a user can belong to several sellers and switch between them); every seller needs at least one admin member. Invited via member-invite workflows.
- **Master Product** — products live in a single shared catalog, not owned by any seller. A **product-seller link** allowlists which sellers may sell a product. Status: `draft` / `proposed` / `published` / `rejected`.
- **Offer** — the central node of seller commerce: a seller's listing against a master product/variant, carrying the seller's own SKU, offer-scoped price (via a pricing rule), offer-scoped inventory item, and shipping profile. Cart/order line items link to the purchased offer.
- **Product Change** — an immutable record in the product change-request pipeline (`product-edit` module). Captures every product edit as typed actions (`UPDATE`, `VARIANT_*`, `ATTRIBUTE_*`, `STATUS_CHANGE`, `PRODUCT_ADD/DELETE`); status `pending` → `confirmed` / `declined` / `canceled` / `requires_action`. Low-risk edits auto-confirm.
- **Order-Group** — wrapper that lets a single customer cart contain items from multiple sellers. On placement, the cart is split into per-seller orders linked to a parent group. Has a serial `display_id`, read-only `cart_id`, and query-time computed `seller_count` / `total`.
- **Commission** — fee structure applied during order placement, deducted from payouts. Rules match across `product` / `product_type` / `product_collection` / `product_category` / `seller`; most-specific wins (AND across dimensions, OR within), ties to oldest. Fixed rates support per-currency amounts; only the global rate may include shipping. Arithmetic uses BigNumber.
- **Payout** — settlement to a seller's connected account (default provider: Stripe Connect). Account lifecycle `PENDING` → `ACTIVE` ↔ `RESTRICTED` / → `REJECTED`, driven by provider webhooks; each account has an onboarding record with provider `data`. Payout transfer is automated via a daily job (1 AM UTC) emitting `payout.requested` + a subscriber running `createPayoutWorkflow`.
- **Product Attributes** — an operator-managed, typed attribute catalog (`multi_select`, `single_select`, `text`, `unit`, `toggle`). A `multi_select` axis attribute (`is_variant_axis`) maps to a native Medusa `ProductOption` and generates variants; `is_filterable` exposes it as a storefront filter.
- **Blocks** — feature packages distributed as **source code** (not npm packages): the CLI copies files into the project so you own them. Discovered via `blocks.json`, added with `mercurjs add`, updated via `mercurjs diff` + `--overwrite`.

## Request Flow Examples

### Vendor creates a product
```
Vendor UI (apps/vendor) form submit
  -> @mercurjs/client: sdk.vendor.products.mutate(payload)
    -> POST /vendor/products on apps/api
      -> packages/core: vendor route + middleware (scopes to seller)
        -> createProductWorkflow (vendor variant) — product enters `proposed`,
           a ProductChange record captures the submission for operator review
          -> Medusa product service + Postgres
            -> response normalised by core query config
              -> dashboard refetches via TanStack Query
```

### Operator approves a seller
```
Admin UI (apps/admin-test) action
  -> sdk.admin.sellers.$id.mutate({ $id, status: "approved" })
    -> POST /admin/sellers/:id on apps/api
      -> packages/core admin route
        -> approveSellerWorkflow (sets status, emits events, sends email)
          -> seller module + notification module
```

### Customer places a multi-vendor order
```
Storefront cart contains offers from sellers A and B
  -> completeCartWorkflow (Medusa) + Mercur order-group steps
    -> create parent OrderGroup
    -> split items by seller -> create Order per seller
    -> calculate commission lines per seller (rule matching + specificity)
    -> split payment proportionally across seller orders
    -> credit each seller order to its payout account (after commission)
    -> later: daily job emits payout.requested -> subscriber transfers via provider
```

## Extension Points

1. **Custom pages** — drop `page.tsx` files under `apps/admin-test/src/routes` or `apps/vendor/src/routes`; `@mercurjs/dashboard-sdk` picks them up at build time.
2. **Blocks** — install with `mercurjs add <block>`; declared in `blocks.json`. Blocks can ship API routes, modules, workflows, and dashboard pages.
3. **Workflows** — Medusa's workflow system lets you wrap or re-compose Mercur workflows in your own API routes.
4. **Modules** — add new Medusa modules in `apps/api` alongside the core plugin.
5. **Providers** — swap or add new providers (e.g. an alternative payout provider) by following the Stripe Connect package as a reference.

## Dependency Graph (simplified)

```
apps/api
  └── @mercurjs/core ───────────────┐
                                    ├── @mercurjs/types
apps/admin-test    apps/vendor      │
  ├── @mercurjs/admin / vendor      │
  ├── @mercurjs/dashboard-shared ───┤
  ├── @mercurjs/dashboard-sdk ──────┤
  └── @mercurjs/client ─────────────┘

@mercurjs/cli ── orchestrates everything above + templates/
@mercurjs/registry ── source for `mercurjs add`
```

## Build & Tooling

- **Monorepo**: Turborepo, Bun workspaces.
- **Language**: TypeScript 5.9.
- **Bundlers**: `tsup` for libraries, Vite for dashboards, Medusa CLI for the API.
- **Lint**: Oxlint.
- **Tests**: Jest with `@medusajs/test-utils`; integration suites grouped by surface (`admin`, `vendor`, `store`) under `integration-tests/`.
- **Code generation**: `mercurjs codegen` writes the route map at `packages/core-plugin/.mercur/_generated/index.ts` consumed by `@mercurjs/client`.
- **Standard scripts** (root): `bun install`, `bun run lint`, `bun run build`, `bun run dev`, `bun run test:integration:tests`.
