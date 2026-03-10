# Registry Block Companion Notes

Operational package workflow now lives in [`AGENTS.md`](AGENTS.md).

Use this file as a compatibility bridge and specialized reference for deep registry path resolution details. It intentionally focuses on copied-code and install-path mechanics and should not replace the package workflow guide.

This document explains how to create blocks in `packages/registry/`. Blocks are installed by the CLI into user projects — incorrect file paths or imports will break at install time.

## 1. How the CLI Resolves File Paths

The CLI uses `resolveNestedFilePath()` to determine where each file lands in the user's project.

**Algorithm:** Given a file path and a target directory (from `blocks.json` aliases), find the **last segment** of the target dir in the file path, then return everything **after** that segment.

```typescript
// CLI default aliases (packages/cli/src/registry/config.ts):
aliases: {
  workflows: "packages/api/src/workflows",  // last segment: "workflows"
  api:       "packages/api/src/api",         // last segment: "api"
  links:     "packages/api/src/links",       // last segment: "links"
  modules:   "packages/api/src/modules",     // last segment: "modules"
  vendor:    "apps/vendor/src/pages",        // last segment: "pages" (NOT "src"!)
  admin:     "apps/admin/src/pages",         // last segment: "pages"
  lib:       "packages/api/src/lib",         // last segment: "lib"
}
```

**CRITICAL for vendor files:** The default vendor alias is `apps/vendor/src/pages` — the last segment is `pages`. However, some user configs override this to `apps/vendor/src/` (last segment: `src`). The product-import-export block uses `vendor/src/` in its paths to support the `src` last-segment pattern.

### Resolution Examples

| Registry file path | Type | Last segment | CLI finds segment at | Result (installed path) |
|---|---|---|---|---|
| `block/workflows/steps/foo.ts` | `registry:workflow` | `workflows` | index 1 | `steps/foo.ts` |
| `block/api/vendor/products/route.ts` | `registry:api` | `api` | index 1 | `vendor/products/route.ts` |
| `block/vendor/src/pages/reviews/page.tsx` | `registry:vendor` | `pages` | index 3 | `reviews/page.tsx` |
| `block/vendor/src/hooks/api/foo.tsx` | `registry:vendor` | `src` | index 2 | `hooks/api/foo.tsx` (if alias ends with `src/`) |
| `block/modules/reviews/index.ts` | `registry:module` | `modules` | index 1 | `reviews/index.ts` |

### Two Vendor Path Patterns

**Pattern A — reviews block** (alias last segment = `pages`):
```
reviews/vendor/pages/reviews/page.tsx          → reviews/page.tsx
reviews/vendor/hooks/api/reviews.tsx           → ../../hooks/api/reviews.tsx (relative)
reviews/vendor/lib/client.ts                   → ../../lib/client.ts (relative)
```
Vendor hooks/lib live outside the `pages` directory — the CLI resolves them via the last filename only (fallback behavior when segment not found).

**Pattern B — product-import-export block** (alias last segment = `src`):
```
product-import-export/vendor/src/pages/products/page.tsx     → pages/products/page.tsx
product-import-export/vendor/src/hooks/api/foo.tsx            → hooks/api/foo.tsx
```
With `src/` in the path, both pages and hooks resolve correctly under the `src/` target.

**Pattern used by most blocks (reviews, team-management):** Pattern A — vendor files under `vendor/` without `src/`. The CLI resolves pages via the `pages` segment and hooks/lib via fallback behavior.

**Alternative (product-import-export):** Pattern B — vendor files under `vendor/src/`. More consistent path resolution but less commonly used.

## 2. Block Directory Structure

```
packages/registry/src/<block-name>/
├── modules/                          # registry:module
│   └── <module-name>/
│       ├── index.ts                  # Module entry point (exports MODULE constant + types)
│       ├── service.ts
│       ├── models/
│       │   ├── <model>.ts            # Can have multiple models in one module
│       │   └── <model-related>.ts    # e.g., member.ts + member-invite.ts
│       └── types.ts                  # (or types/ directory)
├── links/                            # registry:link
│   └── <entity>-<entity>.ts          # One file per link relationship
├── workflows/                        # registry:workflow
│   └── <entity>/                     # Group by entity name
│       ├── steps/
│       │   └── <step-name>.ts        # Individual steps
│       └── workflows/
│           └── <workflow-name>.ts    # Workflow compositions using steps
├── api/                              # registry:api
│   ├── middlewares.ts                # Root aggregator — imports + spreads per-resource middlewares
│   └── vendor/
│       ├── <resource-a>/             # Multiple API resources per block allowed
│       │   ├── route.ts
│       │   ├── middlewares.ts
│       │   ├── validators.ts
│       │   ├── query-config.ts
│       │   ├── [id]/
│       │   │   └── route.ts          # Dynamic route for single resource
│       │   └── _helpers/
│       │       └── helpers.ts
│       └── <resource-b>/             # e.g., members/ + invites/ in same block
│           ├── route.ts
│           ├── middlewares.ts
│           ├── validators.ts
│           ├── query-config.ts
│           └── <action>/
│               └── route.ts          # Sub-action routes (e.g., invites/accept/route.ts)
├── subscribers/                      # registry:lib (or registry:api)
│   └── <event-name>.ts
└── vendor/                           # registry:vendor
    ├── hooks/
    │   ├── api/
    │   │   ├── <resource-a>.tsx      # One hook file per API resource
    │   │   └── <resource-b>.tsx
    │   └── table/
    │       ├── columns/
    │       │   └── use-<entity>-table-columns.tsx
    │       └── query/
    │           └── use-<entity>-table-query.tsx
    ├── lib/
    │   └── client.ts
    └── pages/
        ├── <resource>/
        │   ├── page.tsx              # List page (export default)
        │   ├── [id]/
        │   │   ├── page.tsx          # Detail page
        │   │   ├── breadcrumb.tsx    # Dynamic breadcrumb
        │   │   └── edit/
        │   │       └── page.tsx      # Edit drawer page
        │   └── <action>/
        │       └── page.tsx          # e.g., invite/page.tsx
        └── <public-page>/            # Public-facing pages (e.g., invite acceptance)
            └── page.tsx
```

### Multi-resource blocks

A single block can contain **multiple API resources** (e.g., `members/` + `invites/`). Each resource gets its own:
- `route.ts`, `middlewares.ts`, `validators.ts`, `query-config.ts`
- Corresponding hook file in `vendor/hooks/api/`

The root `api/middlewares.ts` aggregates all per-resource middleware arrays:

```ts
import { vendorMembersMiddlewares } from "./vendor/members/middlewares"
import { vendorInvitesMiddlewares } from "./vendor/invites/middlewares"

export const vendorMiddlewares: MiddlewareRoute[] = [
  ...vendorMembersMiddlewares,
  ...vendorInvitesMiddlewares,
]
```

## 3. Import Rules for Vendor Files

### Allowed imports

| Source | Import path | Example |
|---|---|---|
| Shared components | `@mercurjs/dashboard-shared` | `RouteDrawer`, `FileUpload`, `FilePreview`, `SingleColumnPage`, `_DataTable`, `useDataTable`, `queryKeysFactory`, `SingleColumnPageSkeleton` |
| Compound page components | `@mercurjs/vendor/pages` | `ProductListPage` |
| Medusa UI | `@medusajs/ui` | `Button`, `Heading`, `Container`, `toast` |
| Medusa Icons | `@medusajs/icons` | `ArrowDownTray`, `ArrowUpTray` |
| Backend URL config | `virtual:mercur/config` | `config.backendUrl` |
| React Router | `react-router-dom` | `useParams`, `Link` |
| TanStack Query | `@tanstack/react-query` | `useMutation`, `useQuery`, `useQueryClient` |
| Mercur Client | `@mercurjs/client` | `createClient`, `InferClient`, `InferClientInput`, `InferClientOutput` |
| Type-only imports | Use `import type` | `import type { UseMutationOptions } from "@tanstack/react-query"` |
| Relative (within block) | Relative paths | `../../hooks/api/foo`, `./_components/bar` |

### NEVER use these imports in vendor files

```typescript
// These aliases DO NOT exist in user projects:
import { X } from "@components/..."        // WRONG
import { X } from "@hooks/..."             // WRONG
import { X } from "@lib/..."               // WRONG
import { X } from "../../components/..."   // WRONG (reaching outside block)
```

### Relative import examples (within block)

```typescript
// From vendor/src/pages/products/import/_components/upload-import.tsx:
import { useImportProducts } from "../../../../hooks/api/product-import-export"
import { downloadImportTemplate } from "../_helpers/import-template"

// From vendor/src/pages/reviews/page.tsx:
import { useReviews } from "../../hooks/api/reviews"
```

## 4. File Naming Conventions

| Convention | Rule |
|---|---|
| Route pages | `page.tsx` with `export default function` — required for file-based routing |
| Breadcrumbs | `breadcrumb.tsx` in same dir as page |
| Private components | `_components/` directory (underscore prefix) |
| Private helpers | `_helpers/` directory (underscore prefix) |
| API routes | `route.ts` with exported HTTP methods (`GET`, `POST`, etc.) |

### Do NOT create barrel `index.ts` files in:
- `workflows/` — will overwrite existing barrel exports from other blocks
- `workflows/steps/` — same reason
- Root level directories shared across blocks

## 5. Component Patterns

### RouteDrawer pattern (for drawer pages)

```tsx
import { RouteDrawer } from "@mercurjs/dashboard-shared"

export default function MyDrawerPage() {
  return (
    <RouteDrawer>
      <RouteDrawer.Header>
        <RouteDrawer.Title asChild>
          <Heading>Title</Heading>
        </RouteDrawer.Title>
        <RouteDrawer.Description>Description</RouteDrawer.Description>
      </RouteDrawer.Header>
      <RouteDrawer.Body>
        {/* Content */}
      </RouteDrawer.Body>
      <RouteDrawer.Footer>
        <RouteDrawer.Close asChild>
          <Button variant="secondary">Cancel</Button>
        </RouteDrawer.Close>
      </RouteDrawer.Footer>
    </RouteDrawer>
  )
}
```

### useRouteModal MUST be inside RouteDrawer

```tsx
// WRONG — useRouteModal() outside RouteDrawer context
export default function MyPage() {
  const { handleSuccess } = useRouteModal()  // Will crash!
  return <RouteDrawer>...</RouteDrawer>
}

// CORRECT — extract child component
function MyForm() {
  const { handleSuccess } = useRouteModal()  // Works — inside RouteDrawer
  return <form>...</form>
}

export default function MyPage() {
  return (
    <RouteDrawer>
      <RouteDrawer.Body>
        <MyForm />
      </RouteDrawer.Body>
    </RouteDrawer>
  )
}
```

### Compound component page override

```tsx
import { ProductListPage } from "@mercurjs/vendor/pages"

export default function ProductsWithExtras() {
  return (
    <ProductListPage>
      <ProductListPage.Table>
        <ProductListPage.Header>
          <ProductListPage.HeaderTitle />
          <ProductListPage.HeaderActions>
            <Button asChild><Link to="my-action">Action</Link></Button>
            <ProductListPage.HeaderCreateButton />
          </ProductListPage.HeaderActions>
        </ProductListPage.Header>
        <ProductListPage.DataTable />
      </ProductListPage.Table>
    </ProductListPage>
  )
}
```

### Hook pattern (mutation with queryClient)

```tsx
import { useMutation, useQueryClient } from "@tanstack/react-query"
import type { UseMutationOptions } from "@tanstack/react-query"
import { queryKeysFactory } from "@mercurjs/dashboard-shared"
import config from "virtual:mercur/config"

const backendUrl = config.backendUrl ?? "http://localhost:9000"

const RESOURCE_QUERY_KEY = "vendor_resource" as const
export const resourceQueryKeys = queryKeysFactory(RESOURCE_QUERY_KEY)

export const useMyMutation = (
  options?: UseMutationOptions<ResponseType, Error, InputType>
) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: InputType) => {
      const response = await fetch(`${backendUrl}/vendor/resource`, {
        method: "POST",
        credentials: "include",
        body: JSON.stringify(input),
      })
      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.message || "Failed")
      }
      return response.json()
    },
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: resourceQueryKeys.lists() })
      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })
}
```

### Hook pattern (query with typed client)

```tsx
import { useQuery, UseQueryOptions } from "@tanstack/react-query"
import { queryKeysFactory } from "@mercurjs/dashboard-shared"
import { client } from "../../lib/client"
import { ClientError, InferClientInput, InferClientOutput } from "@mercurjs/client"

const RESOURCE_QUERY_KEY = "vendor_resource" as const
export const resourceQueryKeys = queryKeysFactory(RESOURCE_QUERY_KEY)

export const useResource = (
  query?: InferClientInput<typeof client.vendor.resource.query>,
  options?: Omit<UseQueryOptions<unknown, ClientError, InferClientOutput<typeof client.vendor.resource.query>>, "queryKey" | "queryFn">
) => {
  const { data, ...rest } = useQuery({
    queryKey: resourceQueryKeys.list(query),
    queryFn: async () => client.vendor.resource.query({ ...query }),
    ...options,
  })
  return { ...data, ...rest }
}
```

## 6. Registry.json Entry Format

### Simple block (single resource)
```json
{
  "name": "my-block",
  "description": "Short description of the block.",
  "dependencies": [],
  "registryDependencies": [],
  "docs": "## My Block\n\nInstallation and usage instructions in markdown.",
  "files": [
    { "path": "my-block/workflows/steps/my-step.ts", "type": "registry:workflow" },
    { "path": "my-block/api/vendor/resource/route.ts", "type": "registry:api" },
    { "path": "my-block/vendor/pages/resource/page.tsx", "type": "registry:vendor" }
  ],
  "categories": ["api", "workflow", "vendor"]
}
```

### Complex block (multiple resources, external deps)
```json
{
  "name": "team-management",
  "description": "Team member management with invitations, roles, and vendor portal pages.",
  "dependencies": ["jsonwebtoken", "@types/jsonwebtoken", "react-jwt"],
  "registryDependencies": [],
  "docs": "## Configuration\n\nAdd the member module to your `medusa-config.ts`:\n\n```ts\nmodules: [\n  {\n    resolve: './modules/member',\n    definition: { isQueryable: true },\n  },\n]\n```\n\n## Middlewares\n...\n\n## Run codegen\n\n```bash\nmercurjs codegen\n```",
  "files": [
    { "path": "team-management/modules/member/index.ts", "type": "registry:module" },
    { "path": "team-management/modules/member/models/member.ts", "type": "registry:module" },
    { "path": "team-management/modules/member/models/member-invite.ts", "type": "registry:module" },
    { "path": "team-management/links/seller-member.ts", "type": "registry:link" },
    { "path": "team-management/workflows/member/steps/create-member.ts", "type": "registry:workflow" },
    { "path": "team-management/workflows/member/workflows/invite-member.ts", "type": "registry:workflow" },
    { "path": "team-management/api/middlewares.ts", "type": "registry:api" },
    { "path": "team-management/api/vendor/members/route.ts", "type": "registry:api" },
    { "path": "team-management/api/vendor/invites/route.ts", "type": "registry:api" },
    { "path": "team-management/vendor/lib/client.ts", "type": "registry:vendor" },
    { "path": "team-management/vendor/hooks/api/members.tsx", "type": "registry:vendor" },
    { "path": "team-management/vendor/pages/users/page.tsx", "type": "registry:vendor" }
  ],
  "categories": ["module", "workflow", "api", "vendor"]
}
```

### Key notes for `docs` field:
- Include `medusa-config.ts` setup (module resolve, `isQueryable` if needed)
- Include middleware aggregation instructions (import + spread pattern)
- Always include `mercurjs codegen` reminder at the end
- Use `\n` for newlines in JSON string
```

**File types and their aliases:**

| `type` | CLI alias | Default target dir |
|---|---|---|
| `registry:module` | `modules` | `packages/api/src/modules/` |
| `registry:link` | `links` | `packages/api/src/links/` |
| `registry:workflow` | `workflows` | `packages/api/src/workflows/` |
| `registry:api` | `api` | `packages/api/src/api/` |
| `registry:vendor` | `vendor` | `apps/vendor/src/pages/` (or `apps/vendor/src/`) |
| `registry:admin` | `admin` | `apps/admin/src/pages/` |
| `registry:lib` | `lib` | `packages/api/src/lib/` |

## 7. Pre-Completion Checklist

Before marking a registry block as done, verify:

- [ ] **Path resolution:** For each file in `registry.json`, mentally run `resolveNestedFilePath(filePath, targetDir)` — does the result land in the correct directory?
- [ ] **No forbidden imports:** Search for `@components/`, `@hooks/`, `@lib/` — none should exist in vendor files
- [ ] **Shared components:** All `RouteDrawer`, `FileUpload`, `FilePreview`, `SingleColumnPage`, `_DataTable`, `useDataTable`, `queryKeysFactory` come from `@mercurjs/dashboard-shared`
- [ ] **Page files:** Every route page is named `page.tsx` with `export default`
- [ ] **No conflicting barrels:** No `index.ts` in `workflows/` or `workflows/steps/` that would overwrite existing barrels
- [ ] **useRouteModal:** Only called inside a component rendered within `RouteDrawer`
- [ ] **Relative imports:** All cross-file imports within the block use correct relative paths
- [ ] **Type imports:** Use `import type` for type-only imports
- [ ] **All files registered:** Every file in the block directory is listed in `registry.json` with correct `type`
- [ ] **Dependencies declared:** External npm packages listed in `dependencies` array (including `@types/` packages)
- [ ] **Docs complete:** `docs` field includes medusa-config setup, middleware instructions, and `mercurjs codegen` reminder
- [ ] **Root middleware aggregator:** `api/middlewares.ts` imports and spreads all per-resource middleware arrays
- [ ] **Workflows grouped:** Steps and workflows organized under `workflows/<entity>/` — no loose files in `workflows/` root
- [ ] **Module exports:** Module `index.ts` exports MODULE constant, types, and service class

## 8. Type System — End-to-End (Route → SDK → Hook)

Types flow from backend routes through codegen to the frontend SDK. **Every layer must be typed.**

### Step 1: Response types — `modules/<name>/types/common.ts`

```ts
import { PaginatedResponse } from "@mercurjs/types"

export interface ReviewDTO {
  id: string
  rating: number
  customer_note: string | null
  seller_note: string | null
  created_at: Date
  updated_at: Date
}

export interface VendorReviewResponse {
  review: ReviewDTO
}

export type VendorReviewListResponse = PaginatedResponse<{
  reviews: ReviewDTO[]
}>
```

### Step 2: Validators — `api/vendor/<resource>/validators.ts`

```ts
import { z } from "zod"
import { createFindParams } from "@medusajs/medusa/api/utils/validators"

export type VendorGetReviewsParamsType = z.infer<typeof VendorGetReviewsParams>
export const VendorGetReviewsParams = createFindParams({ offset: 0, limit: 50 })

export type VendorUpdateReviewType = z.infer<typeof VendorUpdateReview>
export const VendorUpdateReview = z.object({
  seller_note: z.string().max(300),
})
```

### Step 3: Middleware — `api/vendor/<resource>/middlewares.ts`

```ts
import { validateAndTransformBody, validateAndTransformQuery } from "@medusajs/framework"
import { MiddlewareRoute } from "@medusajs/medusa"
import { reviewQueryConfig } from "./query-config"
import { VendorGetReviewsParams, VendorUpdateReview } from "./validators"

export const vendorReviewMiddlewares: MiddlewareRoute[] = [
  {
    method: ["GET"],
    matcher: "/vendor/reviews",
    middlewares: [
      validateAndTransformQuery(VendorGetReviewsParams, reviewQueryConfig.list),
    ],
  },
  {
    method: ["POST"],
    matcher: "/vendor/reviews/:id",
    middlewares: [
      validateAndTransformQuery(VendorGetReviewsParams, reviewQueryConfig.retrieve),
      validateAndTransformBody(VendorUpdateReview),
    ],
  },
]
```

### Step 4: Route handlers — ALWAYS type both generics

```ts
export const POST = async (
  req: AuthenticatedMedusaRequest<VendorUpdateReviewType>,  // ← body type
  res: MedusaResponse<VendorReviewResponse>                  // ← response type
) => { ... }

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<VendorReviewListResponse>              // ← always type response
) => { ... }
```

**CRITICAL:** `mercurjs codegen` reads the generic types from `AuthenticatedMedusaRequest<T>` and `MedusaResponse<T>` to generate the SDK `Routes` type. If you skip the generics, the SDK returns `unknown` and hooks lose type safety.

### Step 5: SDK Client — `vendor/lib/client.ts`

Every block with vendor/admin UI **must** include this file:

```ts
import { createClient, InferClient } from "@mercurjs/client"
import { Routes } from "@mercurjs/core-plugin/_generated"
import config from "virtual:mercur/config"

export const backendUrl = config.backendUrl ?? "http://localhost:9000"

export const client: InferClient<Routes> = createClient<Routes>({
  baseUrl: backendUrl,
  fetchOptions: { credentials: "include" },
})
```

After adding new routes, run `mercurjs codegen` to regenerate the `Routes` type.

### Step 6: Hooks — use `InferClientInput` / `InferClientOutput`

```ts
import { client } from "../../lib/client"
import { ClientError, InferClientInput, InferClientOutput } from "@mercurjs/client"

// Extract DTO type from SDK:
export type ReviewDTO = InferClientOutput<typeof client.vendor.reviews.$id.query>["review"]

// Query hook:
export const useReviews = (
  query?: InferClientInput<typeof client.vendor.reviews.query>,
  options?: Omit<
    UseQueryOptions<unknown, ClientError, InferClientOutput<typeof client.vendor.reviews.query>>,
    "queryKey" | "queryFn"
  >,
) => {
  const { data, ...rest } = useQuery({
    queryKey: reviewsQueryKeys.list(query),
    queryFn: async () => client.vendor.reviews.query({ ...query }),
    ...options,
  })
  return { ...data, ...rest }
}

// Mutation hook:
export const useUpdateReview = (id: string, options?: UseMutationOptions<...>) => {
  return useMutation({
    mutationFn: (payload) => client.vendor.reviews.$id.mutate({ $id: id, ...payload }),
    ...options,
  })
}
```

### SDK Method Mapping

| SDK call | HTTP | URL |
|----------|------|-----|
| `client.vendor.reviews.query()` | GET | `/vendor/reviews` |
| `client.vendor.reviews.mutate(body)` | POST | `/vendor/reviews` |
| `client.vendor.reviews.$id.query({ $id: id })` | GET | `/vendor/reviews/:id` |
| `client.vendor.reviews.$id.mutate({ $id: id, ...body })` | POST | `/vendor/reviews/:id` |
| `client.vendor.reviews.$id.delete({ $id: id })` | DELETE | `/vendor/reviews/:id` |

`$` prefix = dynamic route segment (`[id]` in file path). Value passed in the payload object.

### SDK Limitations

- SDK **always** sends `Content-Type: application/json` + `JSON.stringify(body)`
- **Does NOT support** `multipart/form-data` / file uploads
- For file uploads: type the route normally (`AuthenticatedMedusaRequest<{ file: Express.Multer.File }>`), add `multer` + `@types/multer` to block `dependencies`, and in the hook use `fetchOptions` to override Content-Type or use `backendUrl` from `lib/client.ts` with raw fetch

## 9. Seller Identity

In vendor API routes, `auth_context.actor_id` **IS** the seller ID. The Seller model does NOT have a `members` relation.

```ts
// WRONG — Seller has no "members" property
const seller = await query.graph({
  entity: "seller",
  filters: { members: { id: authActorId } },
})

// CORRECT — actor_id is the seller ID
const seller = await query.graph({
  entity: "seller",
  filters: { id: req.auth_context.actor_id },
})
```

## 10. Common Mistakes to Avoid

1. **Using `index.ts` instead of `page.tsx`** for route pages — file-based routing requires `page.tsx`
2. **Importing from `@components/modals`** — use `@mercurjs/dashboard-shared` instead
3. **Creating barrel `index.ts` in shared directories** — workflows/steps barrels will overwrite other blocks' exports
4. **`useRouteModal()` at top level** — must be a child of `RouteDrawer`, extract into a sub-component
5. **Wrong relative imports** — count the directory levels carefully, especially from `_components/` up to `hooks/api/`
6. **Forgetting `credentials: "include"`** — required for authenticated fetch calls to the backend
7. **Missing route type generics** — skipping `AuthenticatedMedusaRequest<T>` or `MedusaResponse<T>` makes codegen produce `unknown` types, breaking SDK type safety
8. **Querying Seller by `members`** — Seller model has no `members` relation; use `{ id: actor_id }` directly
9. **Missing `vendor/lib/client.ts`** — every block with vendor UI needs the SDK client file
10. **Missing `Action.icon`** — `Action` type (ActionMenu/FilePreview) requires `icon: ReactNode`, e.g. `{ icon: <Trash />, label: "Remove", onClick: handler }`
11. **Using raw `fetch` instead of SDK** — always use `client.vendor.xxx.query/mutate` for typed API calls (except file uploads)
12. **Forgetting root middleware aggregator** — multi-resource blocks need `api/middlewares.ts` that imports and spreads all per-resource middleware arrays
13. **Loose workflow files** — always organize under `workflows/<entity>/steps/` and `workflows/<entity>/workflows/`, never put workflows directly in `workflows/` root
14. **Missing `dependencies` in registry.json** — external npm packages (e.g., `jsonwebtoken`, `react-jwt`) and their `@types/` must be declared
15. **Missing `isQueryable` in docs** — if module needs query graph support, include `definition: { isQueryable: true }` in medusa-config docs
16. **Forgetting `mercurjs codegen` in docs** — always remind users to regenerate SDK types after installing blocks with new API routes

## 11. Reference Blocks

Two reference blocks exist — choose based on complexity:

| Block | Path | Use as reference for |
|-------|------|---------------------|
| **reviews** | `src/reviews/` | Simple blocks: single API resource, single model, admin+vendor+store |
| **team-management** | `src/team-management/` | Complex blocks: multiple API resources, multiple models in one module, workflows grouped by entity, external npm deps, public-facing pages |

**Key differences in team-management:**
- Multiple API resources (`vendor/members/` + `vendor/invites/`) with root middleware aggregator
- Multiple models in one module (`member.ts` + `member-invite.ts`)
- Workflows organized under entity name: `workflows/member/steps/` + `workflows/member/workflows/`
- External npm dependencies: `jsonwebtoken`, `@types/jsonwebtoken`, `react-jwt`
- Module with `isQueryable: true` in medusa-config docs
- Public invite acceptance page (`vendor/pages/invite/page.tsx`)
- Sub-action routes (`vendor/invites/accept/route.ts`)
- Helper files for shared logic (`vendor/members/_helpers/helpers.ts`)

Read the relevant reference block files before creating or modifying any block.
