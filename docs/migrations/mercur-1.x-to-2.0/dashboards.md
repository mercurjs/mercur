# Dashboard Migration (Admin & Vendor)

## Do You Need This?

Core-admin (`@mercurjs/admin`) ships a **complete admin panel** with 34+ standard pages: products, orders, customers, sellers, commission-rates, payouts, marketplace, campaigns, collections, inventory, and more.

Core-vendor (`@mercurjs/vendor`) ships a complete vendor panel.

**If your 1.x project only uses standard Mercur pages**, you don't need to migrate any dashboard code. The core panels cover everything.

**You only need this guide if** you have custom pages, custom hooks with business logic, or domain-specific UI that doesn't exist in core-admin/vendor.

## What's Different

### Import paths

| 1.x | 2.0 |
|-------|--------|
| `from "@medusajs/js-sdk"` | `from "@mercurjs/client"` |
| `from "@custom-types/*"` | `from "@mercurjs/types"` |
| `from "@hooks/*"` | Keep local, or `from "@mercurjs/dashboard-shared"` if the symbol exists there |
| `from "@components/*"` | Keep local, or `from "@mercurjs/dashboard-shared"` if the symbol exists there |
| `from "@lib/*"` | Keep local (e.g. `src/lib/client.ts`), or `from "@mercurjs/dashboard-shared"` if the symbol exists there |

### Routing

| 1.x | 2.0 |
|-------|--------|
| `src/routes/<domain>/page.tsx` | `src/pages/<domain>/page.tsx` |
| Explicit route registration | `virtual:mercur/routes` auto-discovery |
| React Router config | File-based conventions, `[param]` dirs |

### SDK / Hooks

1.x projects had custom hooks wrapping `@medusajs/js-sdk` for every endpoint. In 2.0, `@mercurjs/client` generates a typed client from route codegen:

```typescript
// 1.x — manual hook per endpoint
import Medusa from "@medusajs/js-sdk"
const client = new Medusa({ ... })
export const useProducts = () => useQuery({ queryFn: () => client.admin.products.list() })

// 2.0 — typed client, no manual hooks needed for standard CRUD
import { client } from "../../lib/client"
client.vendor.reviews.query()           // GET /vendor/reviews
client.vendor.reviews.$id.query({ $id }) // GET /vendor/reviews/:id
client.vendor.reviews.$id.mutate({ $id, ...body }) // POST /vendor/reviews/:id
```

**Most custom hooks become unnecessary** because the generated client covers all registered routes with full type safety. Only port hooks that contain business logic beyond API calls.

### Extensions

| 1.x | 2.0 |
|-------|--------|
| `DashboardApp` plugin system | Mercur extension model |
| Widget/form zones | Compound component overrides |
| `@medusajs/admin-vite-plugin` | `@mercurjs/dashboard-sdk` virtual modules |

## Porting Custom Pages

1. Move page files from `src/routes/` to `src/pages/`
2. Ensure each page has `export default`
3. Update imports per the mapping table above
4. Replace custom hooks with `@mercurjs/client` calls where possible
5. For custom endpoints not in the generated client, use `sdk.client.fetch()` pattern:

```typescript
import config from "virtual:mercur/config"
const backendUrl = config.backendUrl ?? "http://localhost:9000"

const response = await fetch(`${backendUrl}/vendor/my-custom-endpoint`, {
  method: "POST",
  credentials: "include",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(payload),
})
```

## Verification

```bash
# Build (skip tsc, use vite only)
cd apps/admin && bun vite build
cd apps/vendor && bun vite build

# Dev server
cd apps/admin && bun run dev   # port 7000
cd apps/vendor && bun run dev  # port 7001
```

Check browser console for import errors. Navigate to custom pages and verify rendering.
