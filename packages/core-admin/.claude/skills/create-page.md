# Skill: Create Page

Creates a new page/route in the admin dashboard.

## Usage

```
/create-page <type> <path> [options]
```

## Types

- `list` - List page with table
- `detail` - Detail page with sections (requires dynamic [id])
- `create` - Create modal/form
- `edit` - Edit drawer/form
- `settings` - Settings page (under /settings)

## Examples

```
/create-page list vendors
/create-page detail vendors/[id]
/create-page create vendors/create
/create-page edit vendors/[id]/edit
/create-page settings api-keys
```

## What Gets Created

### List Page (`/create-page list vendors`)

```
src/pages/vendors/
├── index.tsx                    # Main list page
├── _components/
│   ├── index.ts                 # Exports
│   ├── vendor-list-table.tsx    # Table component
│   └── use-vendor-table-columns.tsx
└── common/
    └── hooks/
        └── use-vendor-table-query.tsx
```

### Detail Page (`/create-page detail vendors/[id]`)

```
src/pages/vendors/[id]/
├── index.tsx          # Detail page
├── loader.ts          # Data loader
├── breadcrumb.tsx     # Dynamic breadcrumb
└── _components/
    ├── index.ts
    └── vendor-general-section.tsx
```

## Template: List Page

```tsx
// src/pages/{name}/index.tsx
import { SingleColumnPage } from "@components/layout/pages"
import { useExtension } from "@providers/extension-provider"

import { {Name}ListTable } from "./_components/{name}-list-table"

const {Name}List = () => {
  const { getWidgets } = useExtension()

  return (
    <SingleColumnPage
      widgets={{
        before: getWidgets("{name}.list.before"),
        after: getWidgets("{name}.list.after"),
      }}
    >
      <{Name}ListTable />
    </SingleColumnPage>
  )
}

export const Component = {Name}List
```

## Template: Detail Page

```tsx
// src/pages/{name}/[id]/index.tsx
import { useLoaderData, useParams } from "react-router-dom"
import { SingleColumnPageSkeleton } from "@components/common/skeleton"
import { SingleColumnPage } from "@components/layout/pages"
import { use{Name} } from "@hooks/api/{name}"
import { useExtension } from "@providers/extension-provider"

import { {NAME}_DETAIL_FIELDS } from "../common/constants"
import { {Name}GeneralSection } from "./_components/{name}-general-section"
import { {name}Loader } from "./loader"

const {Name}Detail = () => {
  const initialData = useLoaderData() as Awaited<ReturnType<typeof {name}Loader>>
  const { id } = useParams()
  const { getWidgets } = useExtension()

  const { {name}, isPending, isError, error } = use{Name}(
    id!,
    { fields: {NAME}_DETAIL_FIELDS },
    { initialData }
  )

  if (isPending || !{name}) {
    return <SingleColumnPageSkeleton sections={1} showJSON showMetadata />
  }

  if (isError) {
    throw error
  }

  return (
    <SingleColumnPage
      widgets={{
        before: getWidgets("{name}.details.before"),
        after: getWidgets("{name}.details.after"),
      }}
      data={{name}}
      showMetadata
      showJSON
    >
      <{Name}GeneralSection {name}={{name}} />
    </SingleColumnPage>
  )
}

export const Component = {Name}Detail
export { {name}Loader as loader } from "./loader"
export { {Name}DetailBreadcrumb as Breadcrumb } from "./breadcrumb"
```

## Template: Breadcrumb

```tsx
// src/pages/{name}/[id]/breadcrumb.tsx
import { UIMatch } from "react-router-dom"
import { use{Name} } from "@hooks/api/{name}"
import { {NAME}_DETAIL_FIELDS } from "../common/constants"

type {Name}DetailBreadcrumbProps = UIMatch<{Name}Response>

export const {Name}DetailBreadcrumb = (props: {Name}DetailBreadcrumbProps) => {
  const { id } = props.params || {}

  const { {name} } = use{Name}(
    id!,
    { fields: {NAME}_DETAIL_FIELDS },
    { initialData: props.data, enabled: Boolean(id) }
  )

  if (!{name}) {
    return null
  }

  return <span>{{name}.name}</span>
}
```

## Template: Loader

```tsx
// src/pages/{name}/[id]/loader.ts
import { LoaderFunctionArgs } from "react-router-dom"
import { QueryClient } from "@tanstack/react-query"
import { {name}QueryKeys } from "@hooks/api/{name}"
import { sdk } from "@lib/client"
import { queryClient } from "@lib/query-client"

import { {NAME}_DETAIL_FIELDS } from "../common/constants"

const {name}DetailQuery = (id: string) => ({
  queryKey: {name}QueryKeys.detail(id),
  queryFn: async () => sdk.admin.{name}.retrieve(id, { fields: {NAME}_DETAIL_FIELDS }),
})

export const {name}Loader = async ({ params }: LoaderFunctionArgs) => {
  const id = params.id!
  const query = {name}DetailQuery(id)

  return (
    queryClient.getQueryData(query.queryKey) ??
    (await queryClient.fetchQuery(query))
  )
}
```

## Template: Create Modal

```tsx
// src/pages/{name}/create/index.tsx
import { RouteFocusModal } from "@components/modals"
import { Create{Name}Form } from "./_components/create-{name}-form"

export const Component = () => {
  return (
    <RouteFocusModal>
      <RouteFocusModal.Header />
      <RouteFocusModal.Body>
        <Create{Name}Form />
      </RouteFocusModal.Body>
    </RouteFocusModal>
  )
}
```

## Template: Edit Drawer

```tsx
// src/pages/{name}/[id]/edit/index.tsx
import { useParams } from "react-router-dom"
import { RouteDrawer } from "@components/modals"
import { use{Name} } from "@hooks/api/{name}"

import { Edit{Name}Form } from "./_components/edit-{name}-form"

export const Component = () => {
  const { id } = useParams()
  const { {name}, isPending } = use{Name}(id!)

  if (isPending || !{name}) {
    return null
  }

  return (
    <RouteDrawer>
      <RouteDrawer.Header />
      <RouteDrawer.Body>
        <Edit{Name}Form {name}={{name}} />
      </RouteDrawer.Body>
    </RouteDrawer>
  )
}
```
