# Custom Pages

A custom page lets you add new views to the vendor portal. Pages are automatically discovered using file-based routing powered by the `@mercurjs/dashboard-sdk` Vite plugin.

> Learn more about the dashboard SDK in the [Mercur documentation](https://docs.mercurjs.com).

To create a custom page:

## 1. Create a Page File

Create a `page.tsx` file inside the `src/routes/` directory. The file path determines the URL route.

For example, create the file `src/routes/blog/page.tsx` with the following content:

```tsx
const BlogPage = () => {
  return (
    <div>
      <h1>Blog Posts</h1>
      <p>My custom vendor page</p>
    </div>
  )
}

export default BlogPage
```

This page will be accessible at `/blog` in the vendor portal.

## 2. File-Based Routing

The route is derived from the file path relative to `src/routes/`. Each route must be defined in a file named `page.tsx` (or `.ts`, `.jsx`, `.js`).

| File Path | Route |
|---|---|
| `src/routes/page.tsx` | `/` |
| `src/routes/blog/page.tsx` | `/blog` |
| `src/routes/blog/[id]/page.tsx` | `/blog/:id` (dynamic) |
| `src/routes/blog/[[id]]/page.tsx` | `/blog/:id?` (optional dynamic) |
| `src/routes/blog/[*]/page.tsx` | `/blog/*` (splat/catch-all) |
| `src/routes/(group)/foo/page.tsx` | `/foo` (route grouping) |
| `src/routes/dashboard/@sidebar/page.tsx` | Parallel route (nested child) |

## 3. Add a Sidebar Menu Item

To add your page to the sidebar navigation, export a `config` object from the page file:

```tsx
import { Building } from "lucide-react"
import type { RouteConfig } from "@mercurjs/dashboard-sdk"

export const config: RouteConfig = {
  label: "Blog",
  icon: Building,
}

const BlogPage = () => {
  return (
    <div>
      <h1>Blog Posts</h1>
    </div>
  )
}

export default BlogPage
```

### Config Options

| Property | Type | Description |
|---|---|---|
| `label` | `string` | **(required)** Display name in the sidebar |
| `icon` | `ComponentType` | Icon component shown next to the label |
| `rank` | `number` | Controls ordering in the sidebar |
| `nested` | `string` | Parent menu item path to nest under |
| `translationNs` | `string` | i18n translation namespace for the label |

## 4. Add Data Loading

Use React Router's loader pattern to pre-fetch data before the page renders:

```tsx
import { useLoaderData } from "react-router-dom"
import type { LoaderFunctionArgs } from "react-router-dom"

export const loader = async ({ params }: LoaderFunctionArgs) => {
  const response = await fetch(`/api/blog/${params.id}`)
  return response.json()
}

const BlogDetailPage = () => {
  const data = useLoaderData()

  return (
    <div>
      <h1>{data.title}</h1>
      <p>{data.content}</p>
    </div>
  )
}

export default BlogDetailPage
```

## 5. Add Route Metadata

Export a `handle` object to attach metadata to the route, accessible via React Router's `useMatches()`:

```tsx
export const handle = {
  breadcrumb: "Blog",
}

const BlogPage = () => {
  return <div>Blog</div>
}

export default BlogPage
```

## Summary

Each `page.tsx` file supports these exports:

| Export | Required | Description |
|---|---|---|
| `default` | Yes | The React component to render |
| `config` | No | Sidebar menu item configuration |
| `loader` | No | Data loading function (React Router) |
| `handle` | No | Route metadata (React Router) |

---

# Extending Built-in Pages

Beyond adding whole new pages, you can augment the **built-in** admin pages
without forking them: inject widgets into documented zones, add validated custom
fields to forms, extend detail sections and list tables, and reorder the
sidebar. Each concern is a single file under a well-known folder, discovered by
the same `@mercurjs/dashboard-sdk` build-time crawl used for routes.

## Typed targets are pre-wired

`src/extension-targets.d.ts` ships in this app:

```ts
/// <reference types="@mercurjs/admin/extension-targets" />
```

This one line registers the built-in zone / model / navigation ids (generated
and shipped by `@mercurjs/admin`) for the **whole app**, so every extension file
gets typed targets with **no per-file import**. A typo in a `zone`, `model`, or
nav `id` fails type-check. Keep this file; you don't need to import
`@mercurjs/admin/extension-targets` anywhere else.

## Widgets — `src/widgets/*.tsx`

Attach a component to a named zone; placement is the zone-id suffix
(`before | after | replace`).

```tsx
import { defineWidgetConfig } from "@mercurjs/dashboard-sdk"

export const config = defineWidgetConfig({
  zone: "product.list.before",
})

export default function ProductListBanner() {
  return <div>Heads up!</div>
}
```

## Custom fields, section displays & list tables — `src/custom-fields/*.tsx`

One model-scoped file owns form fields, detail-section displays, and list-table
columns/filters/bulk actions.

```tsx
import { defineCustomFieldsConfig } from "@mercurjs/dashboard-sdk"
import { createFormHelper } from "@mercurjs/dashboard-shared"

const form = createFormHelper<{ metadata?: Record<string, unknown> }>()

export default defineCustomFieldsConfig({
  model: "product",
  forms: [
    {
      zone: "edit",
      fields: {
        erp_id: form.define({
          validation: form.string().optional(),
          label: "ERP ID",
        }),
      },
    },
  ],
})
```

## Navigation — `src/_navigation.ts`

Reorder, hide, relabel, or re-parent built-in sidebar items from a single
host-owned file.

```ts
import { defineNavigationConfig } from "@mercurjs/dashboard-sdk"

export default defineNavigationConfig({
  items: [
    { id: "orders", rank: 0 },
    { id: "payouts", label: "Settlements" },
  ],
})
```

> See the full contract in the Mercur documentation (SPEC-021, Panel Extension
> API).
