---
name: migration-guide
description: Analyze a Mercur 1.x project and guide migration to 2.0. Self-contained — works without access to the mercur monorepo.
argument-hint: "[path-to-old-project]"
---

# Migration Guide: Mercur 1.x → 2.0

Use this skill when:
- Migrating an existing Mercur 1.x project to 2.0
- Evaluating migration scope or effort
- Porting custom backend or dashboard code

## Package Mapping

| 1.x | 2.0 |
|-------|--------|
| `@mercurjs/b2c-core` | `@mercurjs/core-plugin` — all core modules built in |
| `@mercurjs/commission` | Built into core-plugin |
| `@mercurjs/algolia` | Registry block: `mercurjs add algolia` |
| `@mercurjs/resend` | No 2.0 equivalent — port manually |
| `@mercurjs/payment-stripe-connect` | No 2.0 equivalent — port manually |
| `@mercurjs/stripe-tax-provider` | No 2.0 equivalent — port manually |
| `@medusajs/admin-vite-plugin` | `@mercurjs/dashboard-sdk` |
| `@medusajs/js-sdk` | `@mercurjs/client` (generated typed client) |

## Directory Mapping

| 1.x | 2.0 |
|-------|--------|
| `apps/backend/src/*` | `packages/api/src/*` |
| `apps/backend/src/modules/` | `packages/api/src/modules/` |
| `apps/backend/src/workflows/` | `packages/api/src/workflows/` |
| `apps/backend/src/api/` | `packages/api/src/api/` |
| `apps/backend/src/subscribers/` | `packages/api/src/subscribers/` |
| `apps/backend/src/links/` | `packages/api/src/links/` |
| `apps/admin/src/routes/` | `apps/admin/src/pages/` |
| `apps/vendor/src/routes/` | `apps/vendor/src/pages/` |

## Import Changes

| Old | New |
|-----|-----|
| `from "@medusajs/utils"` | `from "@medusajs/framework/utils"` |
| `from "@medusajs/js-sdk"` | `from "@mercurjs/client"` |
| `from "@custom-types/*"` | `from "@mercurjs/types"` |
| `from "@hooks/*"` | `from "@mercurjs/dashboard-shared"` or local |
| `from "@components/*"` | `from "@mercurjs/dashboard-shared"` |
| `from "@lib/*"` | `from "@mercurjs/dashboard-shared"` |
| `from "@mercurjs/b2c-core"` | `from "@mercurjs/core-plugin"` |

## Provider Registration

Custom providers in `medusa-config.ts` must use `./src/` prefix:

```typescript
// Wrong (will fail with "Cannot find module")
resolve: './providers/my-provider'

// Correct
resolve: './src/providers/my-provider'
```

Provider entry files must import from `@medusajs/framework/utils`, not `@medusajs/utils`:

```typescript
import { Modules, ModuleProvider } from "@medusajs/framework/utils"
```

## Config Migration

`medusa-config.ts` plugin registration changed:

```typescript
// 1.x
plugins: [{ resolve: "@mercurjs/b2c-core", options: {} }]

// 2.0
plugins: [{ resolve: "@mercurjs/core-plugin", options: {} }]
// + individual module registrations in modules array
```

## Workflow

### Step 1: Analyze the old project

Scan the 1.x project the user provides:
- Read `package.json` — list all `@mercurjs/*` and `@medusajs/*` dependencies. Note the `@mercurjs/b2c-core` version to determine project version.
- If version < 1.4.0: custom admin code is inside the backend repo (not `apps/admin/`) — search `apps/backend/` when scanning for custom dashboard pages
- Read `medusa-config.ts` — list plugins, modules, providers
- Scan `src/modules/` — count and list custom modules
- Scan `src/workflows/` — count custom workflows
- Scan `src/api/` — count custom API routes
- Scan `src/subscribers/` — count subscribers
- Scan `src/links/` — count custom links
- Check `apps/admin/src/` and `apps/vendor/src/` for custom pages

### Step 2: Classify

| Level | Criteria |
|-------|----------|
| **Starter** | No custom code beyond configuration |
| **Light custom** | < 10 custom endpoints, < 5 workflows, no custom modules |
| **Heavy custom** | Custom modules, > 10 workflows, custom admin pages, third-party integrations |

Communicate classification to user before proceeding.

### Step 3: Map each element

For every custom element found, determine:
- Has 2.0 equivalent in core-plugin? → skip, already there
- Has registry block? → install with `mercurjs add <block>`
- Needs manual port? → queue for Step 4

### Step 4: Execute migration

Port in this order:
1. **Config** — update `medusa-config.ts` (plugins, modules, providers)
2. **Providers** — copy to `packages/api/src/providers/`, fix imports
3. **Modules** — copy to `packages/api/src/modules/`, register in config
4. **Workflows** — copy to `packages/api/src/workflows/<entity>/`
5. **Links** — copy to `packages/api/src/links/` (skip core-plugin duplicates)
6. **Subscribers** — copy to `packages/api/src/subscribers/`
7. **API routes** — copy to `packages/api/src/api/`, type both generics
8. **Middleware** — merge into `packages/api/src/api/middlewares.ts`
9. **Dashboard pages** — move to `src/pages/`, update imports

After each group: run `bun medusa develop` and verify server starts.

After API routes: run `bunx @mercurjs/cli@canary codegen`.

After dashboard: run `bun vite build` in `apps/admin` and `apps/vendor`.

### Step 5: Verify

- Server starts without errors
- All custom endpoints respond
- Dashboard builds without errors
- Custom pages render in browser

## Stop Conditions

Stop and ask the user when:
- A custom module depends on internal APIs not in core-plugin
- A third-party integration has no clear migration path
- Database schema conflicts arise
- The old project uses MedusaJS core modifications
- You cannot classify the project difficulty
- Server fails to start after porting and the cause is unclear

## Avoid

- Do not attempt in-place upgrades of 1.x projects
- Do not install 1.x packages in a 2.0 project
- Do not create barrel `index.ts` files in `workflows/` or `steps/` (conflicts with block installation)
- Do not duplicate links that core-plugin already provides

## More Info

Full migration documentation: https://docs.mercur.js/v2/migrations/overview
