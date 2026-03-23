# Testing Registry — Consumer Page Patterns

## Location

Testing registry consumer pages live at:
```
/Users/jakubsieradzki/workspace/testing-mercur/mercur-testing-registry/apps/admin/src/pages/
```

These pages are file-based routed (same as main admin app via `@mercurjs/dashboard-sdk`).

## Purpose

Consumer pages test that CC compound components are properly composable from an external consumer perspective. They import from `@mercurjs/admin/pages` and customize layout by overriding children.

## Pattern: Detail Page Consumer

Consumer fetches data with their own hook and passes as props to sections:

```typescript
import { ProductDetailPage } from "@mercurjs/admin/pages"
import { HttpTypes } from "@medusajs/types"
import { useParams } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { client } from "../../../lib/client"

// Consumer's own hook — fetches product data
function useProduct(id: string) {
  const { data, ...rest } = useQuery({
    queryKey: ["products", id],
    queryFn: () => client.admin.products.$id.query({ $id: id }),
  })
  return { product: data?.product as HttpTypes.AdminProduct | undefined, ...rest }
}

const Page = () => {
  const { id } = useParams()
  const { product, isLoading } = useProduct(id!)

  if (isLoading || !product) {
    return <div>Loading...</div>
  }

  return (
    <ProductDetailPage>
      <ProductDetailPage.Main>
        <CustomWidget product={product} />
        <ProductDetailPage.MainGeneralSection product={product} />
        <ProductDetailPage.MainOptionSection product={product} />
        <ProductDetailPage.MainVariantSection product={product} />
      </ProductDetailPage.Main>
      <ProductDetailPage.Sidebar>
        <ProductDetailPage.SidebarSalesChannelSection product={product} />
        <ProductDetailPage.SidebarOrganizationSection product={product} />
      </ProductDetailPage.Sidebar>
    </ProductDetailPage>
  )
}

export default Page
```

Key points:
- Consumer fetches data with own hook (NOT `useLoaderData` — loader is lost during dashboard-sdk route merge)
- Sections accept data as props (no context/provider)
- Import compound root directly (no `* as AdminPages` + cast)
- Slots accessed as `ProductDetailPage.MainGeneralSection`
- Custom components can be inserted between slot sections
- Sections can be omitted or reordered
- Root wraps consumer children in `TwoColumnPage` (layout works automatically)

## Pattern: List Page Consumer

```typescript
import { ProductListPage } from "@mercurjs/admin/pages"

const page = () => {
  return (
    <ProductListPage>
      <ProductListPage.Table>
        <ProductListPage.Header>
          <ProductListPage.HeaderTitle />
          <ProductListPage.HeaderActions>
            <ProductListPage.HeaderCreateButton />
            {/* Export and Import buttons omitted */}
          </ProductListPage.HeaderActions>
        </ProductListPage.Header>
        <ProductListPage.DataTable />
      </ProductListPage.Table>
    </ProductListPage>
  )
}

export default page
```

Key points:
- Override at any granularity: whole header, just actions, or individual buttons
- `DataTable` is self-contained (fetches data internally)
- `Table` renders `<Outlet />` for nested routes (export/import modals)

## Anti-patterns (do NOT use)

```typescript
// BAD: wildcard import + cast to any
import * as AdminPages from "@mercurjs/admin/pages"
const ProductDetailPage = (AdminPages as any).ProductDetailPage

// BAD: fallback aliases for backward compat
const MainGeneralSection = ProductDetailPage.MainGeneralSection ?? ProductDetailPage.GeneralSection

// BAD: useLoaderData — loader is lost during dashboard-sdk route merge
const data = useLoaderData() as { product: HttpTypes.AdminProduct }  // undefined!

// BAD: trying to use context (doesn't exist)
const ctx = ProductDetailPage.useContext()
```

## Why useLoaderData doesn't work

Dashboard-sdk's `mergeRoutes()` does a shallow spread: `{ ...baseRoute, ...customRest }`. When consumer overrides `Component`, admin's `loader` is lost. Consumer must fetch data themselves.

## When to update consumer pages

- After renaming CC exports (new import name)
- After adding/removing/renaming slots (new property names on compound)
- After changing composition API (e.g., `header` prop → `children`)
- Always test that `export default Page` still renders correctly
