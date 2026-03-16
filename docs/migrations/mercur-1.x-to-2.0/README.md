# Mercur 1.x → 2.0 Migration

This guide covers what changed and how to port your existing code. For setting up a new Mercur 2.0 project, see the [getting started guide](/v2/getting-started/installation).

## Sprawdź swoją wersję

Znajdź wersję w `package.json` (`@mercurjs/b2c-core` version) lub git tags.

| Twoja wersja | Co musisz wiedzieć |
|-------------|---------------------|
| **1.5.x** | Przejdź prosto do Prerequisites |
| **1.4.x** | Przejdź prosto do Prerequisites |
| **< 1.4.0** | Admin panel był częścią backendu (nie osobną aplikacją). Twój custom admin code znajduje się w backendzie — przeszukaj tam, nie w `apps/admin/`. Poza tym migracja przebiega identycznie. |

## Prerequisites

- Działający projekt Mercur 2.0 (`mercurjs create`)
- Backup bazy danych 1.x
- Lista custom paczek (`@mercurjs/*`) których używasz

## What Replaced What

### Packages

| 1.x | 2.0 | Action |
|-----|-----|--------|
| `@mercurjs/b2c-core` | `@mercurjs/core-plugin` | Replace. All core modules (seller, marketplace, payout, commission, configuration, attribute, secondary-categories, taxcode, split-order-payment) are now in core-plugin. |
| `@mercurjs/commission` | `@mercurjs/core-plugin` | Remove. Built into core-plugin. |
| `@mercurjs/algolia` | Registry block `algolia` | Install block, not npm package. |
| `@mercurjs/resend` | **No 2.0 equivalent** | Port manually as custom provider/module |
| `@mercurjs/payment-stripe-connect` | **No 2.0 equivalent** | Port manually as custom provider/module |
| `@mercurjs/stripe-tax-provider` | **No 2.0 equivalent** | Port manually as custom provider/module |
| `@medusajs/admin-vite-plugin` | `@mercurjs/dashboard-sdk` | Virtual modules, file-based routing |
| `@medusajs/js-sdk` | `@mercurjs/client` | Generated typed client from codegen |

### Directory structure

| 1.x | 2.0 |
|-----|-----|
| `apps/backend/` | `packages/api/` |
| `apps/backend/src/modules/` | `packages/api/src/modules/` |
| `apps/backend/src/workflows/` | `packages/api/src/workflows/` |
| `apps/backend/src/api/` | `packages/api/src/api/` |
| `apps/backend/src/subscribers/` | `packages/api/src/subscribers/` |
| `apps/backend/src/links/` | `packages/api/src/links/` |
| `apps/admin/src/routes/` | `apps/admin/src/pages/` |
| `apps/vendor/src/routes/` | `apps/vendor/src/pages/` |

### Dashboard imports

| 1.x | 2.0 |
|-----|-----|
| `from "@medusajs/js-sdk"` | `from "@mercurjs/client"` |
| `from "@custom-types/*"` | `from "@mercurjs/types"` |
| `from "@hooks/*"` | `from "@mercurjs/dashboard-shared"` or local |
| `from "@components/*"` | `from "@mercurjs/dashboard-shared"` |
| `from "@lib/*"` | `from "@mercurjs/dashboard-shared"` |

## Porting Custom Backend Code

### What you DON'T need to port

Everything that was in `@mercurjs/b2c-core` is now in `@mercurjs/core-plugin`. If your code was using standard Mercur features (seller management, commission, payouts, marketplace orders), it's already there. Don't re-implement what core-plugin provides.

Similarly, registry blocks (reviews, requests, wishlist, team-management, algolia, vendor-notifications) replace their 1.x equivalents. Install the blocks — don't port that code manually.

### Custom modules

Copy your custom module directories to `packages/api/src/modules/` and register in `medusa-config.ts`. Update imports from `@mercurjs/b2c-core` to `@mercurjs/core-plugin` where needed.

### Custom workflows

Copy to `packages/api/src/workflows/`. Organise by entity:

```
src/workflows/<entity>/workflows/create-<entity>.ts
src/workflows/<entity>/steps/create-<entity>-step.ts
```

Don't create barrel `index.ts` files in `workflows/` or `steps/` — this conflicts with block installation.

### Custom API routes

Copy to `packages/api/src/api/`. Ensure handlers type both generics — codegen reads these:

```typescript
export const GET = async (
  req: AuthenticatedMedusaRequest<BodyType>,
  res: MedusaResponse<ResponseType>
) => { ... }
```

Run `bunx @mercurjs/cli@latest codegen` after adding routes.

### Custom links and subscribers

Copy to `packages/api/src/links/` and `packages/api/src/subscribers/`. Update module references to 2.0 package names.

Watch out: core-plugin registers its own links at runtime. Don't create local link files that duplicate core-plugin links (seller↔product, seller↔order, etc.) or you'll get duplicate link errors.

### Custom providers

Copy to `packages/api/src/providers/`. Two required changes:

1. `medusa-config.ts` resolve path must use `./src/` prefix:
```typescript
resolve: './src/providers/my-provider'  // not './providers/my-provider'
```

2. Entry file imports from `@medusajs/framework/utils`, not `@medusajs/utils`:
```typescript
import { Modules, ModuleProvider } from "@medusajs/framework/utils"
```

## Porting Custom Dashboard Code

Core-admin (`@mercurjs/admin`) ships 34+ standard pages. Core-vendor ships a full vendor panel. **Most 1.x projects don't need to port any dashboard code** — the standard panels cover everything.

You only need to port if you have custom pages. See [dashboards.md](./dashboards.md) for details.

Key changes:
- `src/routes/` → `src/pages/` (file-based routing, `export default`)
- Most custom hooks become unnecessary — `@mercurjs/client` generates a typed client
- `@mercurjs/dashboard-shared` replaces `@components/`, `@hooks/`, `@lib/`
