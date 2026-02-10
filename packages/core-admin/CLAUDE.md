# Core Admin - File-Based Routing Guide

## Quick Reference

```
src/pages/
├── _layout.tsx              # Root layout (ProtectedRoute)
├── products/                # Main route: /products
│   ├── index.tsx           # List page (export Component)
│   ├── [id]/               # Dynamic route: /products/:id
│   │   ├── index.tsx       # Detail page (export Component, loader, Breadcrumb)
│   │   └── edit/           # Nested: /products/:id/edit
│   ├── create/             # /products/create
│   └── _components/        # Internal components (not routes)
├── settings/               # Settings section: /settings/*
│   ├── index.tsx           # Settings landing page
│   ├── regions/            # /settings/regions
│   └── users/              # /settings/users
└── login/                  # Public route (no auth required)
```

## Page File Requirements

Every page MUST export `Component`:

```tsx
// Minimal page
export const Component = () => <div>Hello</div>

// With loader (for data pre-fetching)
export const loader = (queryClient: QueryClient) => async () => {
  // Pre-fetch data
  return queryClient.fetchQuery(...)
}
export const Component = () => { ... }

// With breadcrumb (for dynamic routes like [id])
export const Breadcrumb = (props: UIMatch<DataType>) => {
  return <span>{props.data.name}</span>
}
export const Component = () => { ... }
export { loader } from "./loader"
```

## Folder Conventions

| Pattern | URL | Description |
|---------|-----|-------------|
| `products/index.tsx` | `/products` | List page |
| `products/[id]/index.tsx` | `/products/:id` | Detail page (dynamic) |
| `products/[id]/edit/index.tsx` | `/products/:id/edit` | Edit page |
| `products/create/index.tsx` | `/products/create` | Create page |
| `products/_components/` | - | Internal components (NOT routes) |
| `products/common/` | - | Shared utilities (NOT routes) |
| `settings/regions/` | `/settings/regions` | Settings sub-route |

## Route Classification

Routes are automatically classified:

1. **Public routes** - `/login`, `/invite`, `/reset-password` → `PublicLayout`
2. **Settings routes** - `/settings/*` → `SettingsLayout` (separate from main)
3. **Main routes** - Everything else → `MainLayout` with sidebar

## Creating a New Route

### 1. Main Route (e.g., /vendors)

```
src/pages/vendors/
├── index.tsx              # List page
├── [id]/
│   ├── index.tsx          # Detail page
│   ├── edit/index.tsx     # Edit modal/page
│   ├── breadcrumb.tsx     # Dynamic breadcrumb
│   ├── loader.ts          # Data loader
│   └── _components/       # Page-specific components
├── create/index.tsx       # Create modal/page
├── _components/           # Shared list components
└── common/                # Shared hooks, utils, constants
```

### 2. Settings Route (e.g., /settings/api-keys)

```
src/pages/settings/api-keys/
├── index.tsx              # List page
├── [id]/
│   └── index.tsx          # Detail/edit page
├── create/index.tsx
└── _components/
```

## Component Patterns

### List Page Pattern

```tsx
// pages/vendors/index.tsx
import { SingleColumnPage } from "@components/layout/pages"
import { useExtension } from "@providers/extension-provider"
import { VendorListTable } from "./_components/vendor-list-table"

const VendorList = () => {
  const { getWidgets } = useExtension()

  return (
    <SingleColumnPage
      widgets={{
        before: getWidgets("vendor.list.before"),
        after: getWidgets("vendor.list.after"),
      }}
    >
      <VendorListTable />
    </SingleColumnPage>
  )
}

export const Component = VendorList
```

### Detail Page Pattern

```tsx
// pages/vendors/[id]/index.tsx
import { useLoaderData, useParams } from "react-router-dom"
import { SingleColumnPage } from "@components/layout/pages"
import { useVendor } from "@hooks/api/vendors"

const VendorDetail = () => {
  const initialData = useLoaderData()
  const { id } = useParams()
  const { vendor, isPending } = useVendor(id!, { initialData })

  if (isPending || !vendor) {
    return <SingleColumnPageSkeleton />
  }

  return (
    <SingleColumnPage data={vendor} showJSON showMetadata>
      <VendorGeneralSection vendor={vendor} />
    </SingleColumnPage>
  )
}

export const Component = VendorDetail
export { vendorLoader as loader } from "./loader"
export { VendorBreadcrumb as Breadcrumb } from "./breadcrumb"
```

### Breadcrumb Pattern

```tsx
// pages/vendors/[id]/breadcrumb.tsx
import { UIMatch } from "react-router-dom"
import { useVendor } from "@hooks/api/vendors"

type Props = UIMatch<VendorResponse>

export const VendorBreadcrumb = (props: Props) => {
  const { id } = props.params || {}
  const { vendor } = useVendor(id!, { initialData: props.data })

  return <span>{vendor?.name}</span>
}
```

### Loader Pattern

```tsx
// pages/vendors/[id]/loader.ts
import { QueryClient } from "@tanstack/react-query"
import { vendorQueryKeys } from "@hooks/api/vendors"
import { sdk } from "@lib/client"
import { queryClient } from "@lib/query-client"

const vendorDetailQuery = (id: string) => ({
  queryKey: vendorQueryKeys.detail(id),
  queryFn: () => sdk.admin.vendor.retrieve(id),
})

export const vendorLoader = (client: QueryClient) => {
  return async ({ params }: { params: { id: string } }) => {
    const query = vendorDetailQuery(params.id)
    return queryClient.getQueryData(query.queryKey) ??
           (await client.fetchQuery(query))
  }
}
```

## Import Aliases

Always use aliases, never relative imports outside the module:

```tsx
// Good
import { Button } from "@components/ui/button"
import { useVendor } from "@hooks/api/vendors"
import { sdk } from "@lib/client"

// Bad
import { Button } from "../../../components/ui/button"
```

Available aliases:
- `@components/` → `src/components/`
- `@hooks/` → `src/hooks/`
- `@lib/` → `src/lib/`
- `@providers/` → `src/providers/`
- `@pages/` → `src/pages/`

## Modal Routes

For create/edit modals that appear over the list:

```tsx
// pages/vendors/create/index.tsx
import { RouteFocusModal } from "@components/modals"
import { CreateVendorForm } from "./_components/create-vendor-form"

export const Component = () => {
  return (
    <RouteFocusModal>
      <CreateVendorForm />
    </RouteFocusModal>
  )
}
```

## Drawer Routes

For side panel edits:

```tsx
// pages/vendors/[id]/edit/index.tsx
import { RouteDrawer } from "@components/modals"
import { EditVendorForm } from "./_components/edit-vendor-form"

export const Component = () => {
  return (
    <RouteDrawer>
      <EditVendorForm />
    </RouteDrawer>
  )
}
```
