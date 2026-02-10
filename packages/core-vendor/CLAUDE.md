# Core Vendor - File-Based Routing Migration Guide

## Quick Reference

```
src/pages/
├── home/                    # Main route: /
├── products/                # Main route: /products
│   ├── index.tsx           # List page (export Component)
│   ├── [id]/               # Dynamic route: /products/:id
│   │   ├── index.tsx       # Detail page (export Component, loader, Breadcrumb)
│   │   └── edit/           # Nested: /products/:id/edit
│   ├── create/             # /products/create
│   └── _components/        # Internal components (not routes)
├── settings/               # Settings section: /settings/*
│   ├── index.tsx           # Settings landing page
│   ├── seller/             # /settings/seller (NEW - replaces store)
│   ├── profile/            # /settings/profile
│   ├── regions/            # /settings/regions
│   └── ...
├── login/                  # Public route (no auth required)
└── ...
```

## Page File Requirements

Every page MUST export `Component`:

```tsx
// Minimal page
export const Component = () => <div>Hello</div>

// With loader (for data pre-fetching)
export const loader = async ({ params }) => {
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

## Import Aliases

ALWAYS use aliases, NEVER relative imports to src-level folders:

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
- `@custom-types/` → `src/types/`
- `@/` → `src/`

## Route Files Structure

Routes are split into 3 files for parallel agent work:

```
src/providers/router-provider/
├── route-map.tsx           # Main file - imports others
├── main-routes.tsx         # Agent A - main business routes
├── settings-routes.tsx     # Agent B - settings routes
└── public-routes.tsx       # Agent B - public routes
```

## Agent A Responsibilities (Main Routes)

Edit `main-routes.tsx` for these modules:
- home/
- products/
- orders/
- categories/
- collections/
- customers/
- customer-groups/
- inventory/
- promotions/
- campaigns/
- price-lists/
- reservations/

## Agent B Responsibilities (Settings + Public)

Edit `settings-routes.tsx` for:
- settings/seller/ (NEW - create based on store/ from core-admin)
- settings/profile/
- settings/regions/
- settings/users/
- settings/locations/
- settings/tax-regions/
- settings/product-tags/
- settings/product-types/
- settings/return-reasons/
- settings/shipping-profiles/

Edit `public-routes.tsx` for:
- login/
- register/
- reset-password/
- invite/
- no-match/

## API Differences from Admin

Vendor uses `/vendor/` API instead of `/admin/`:

```typescript
// Admin (core-admin)
sdk.admin.product.list()
sdk.admin.product.retrieve(id)

// Vendor (core-vendor)
sdk.vendor.product.list()
sdk.vendor.product.retrieve(id)
```

## Creating a New Page

### 1. List Page Pattern

```tsx
// pages/products/index.tsx
import { ProductsPage } from "./_components"

export const Component = () => {
  return (
    <ProductsPage>
      <ProductsPage.Header>
        <ProductsPage.Actions />
      </ProductsPage.Header>
      <ProductsPage.Table />
    </ProductsPage>
  )
}
```

### 2. Detail Page Pattern

```tsx
// pages/products/[id]/index.tsx
import { ProductDetailPage } from "./_components"

export { productLoader as loader } from "./loader"
export { ProductDetailBreadcrumb as Breadcrumb } from "./breadcrumb"

export const Component = () => {
  return (
    <ProductDetailPage>
      <ProductDetailPage.Main>
        <ProductDetailPage.GeneralSection />
      </ProductDetailPage.Main>
      <ProductDetailPage.Sidebar>
        <ProductDetailPage.OrganizationSection />
      </ProductDetailPage.Sidebar>
    </ProductDetailPage>
  )
}
```

### 3. Modal/Drawer Pattern

```tsx
// pages/products/create/index.tsx
import { RouteFocusModal } from "@components/modals"
import { CreateProductForm } from "./_components/create-product-form"

export const Component = () => {
  return (
    <RouteFocusModal>
      <CreateProductForm />
    </RouteFocusModal>
  )
}
```

## Loader Pattern

```tsx
// pages/products/[id]/loader.ts
import { LoaderFunctionArgs } from "react-router-dom"
import { productsQueryKeys } from "@hooks/api/products"
import { sdk } from "@lib/client"
import { queryClient } from "@lib/query-client"

export const productLoader = async ({ params }: LoaderFunctionArgs) => {
  const id = params.id
  const query = {
    queryKey: productsQueryKeys.detail(id),
    queryFn: () => sdk.vendor.product.retrieve(id),
  }
  return queryClient.ensureQueryData(query)
}
```

## Breadcrumb Pattern

```tsx
// pages/products/[id]/breadcrumb.tsx
import { UIMatch } from "react-router-dom"
import { useProduct } from "@hooks/api/products"

export const ProductDetailBreadcrumb = (props: UIMatch<ProductResponse>) => {
  const { id } = props.params || {}
  const { product } = useProduct(id!, { initialData: props.data })
  return <span>{product?.name}</span>
}
```

## Adding Route to Route Files

After migrating a module, add it to the appropriate route file:

```tsx
// main-routes.tsx (Agent A)
export const mainRoutes: RouteObject[] = [
  // ... existing routes
  {
    path: "/products",
    errorElement: <ErrorBoundary />,
    handle: { breadcrumb: () => t("products.domain") },
    children: [
      {
        path: "",
        lazy: () => import("@pages/products"),
        children: [
          { path: "create", lazy: () => import("@pages/products/create") },
        ],
      },
      {
        path: ":id",
        lazy: async () => {
          const { Breadcrumb, loader } = await import("@pages/products/[id]")
          return {
            Component: Outlet,
            loader,
            handle: {
              breadcrumb: (match: UIMatch<any>) => <Breadcrumb {...match} />,
            },
          }
        },
        children: [
          { path: "", lazy: () => import("@pages/products/[id]") },
          { path: "edit", lazy: () => import("@pages/products/[id]/edit") },
        ],
      },
    ],
  },
]
```
