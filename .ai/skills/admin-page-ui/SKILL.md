---
name: admin-page-ui
description: Enforce correct page and section UI patterns when creating or modifying admin pages. Use when building list pages, detail pages, Container sections, action menus, empty states, delete flows, or any page-level UI in packages/admin.
---

# Admin Page UI Patterns

Use this skill when:
- creating a new list page (table with filters, search, pagination)
- creating a new detail page (two-column layout with sections)
- building Container sections (cards with headers, actions, data rows)
- adding action menus (edit, delete dropdowns)
- implementing empty states
- implementing delete confirmation flows
- adding status badges

**Not for**: form fields inside pages (use `admin-form-ui`), tabbed wizard forms (use `admin-tab-ui`).

Read next (as needed):
- `references/list-page-patterns.md` — list page compound component structure
- `references/detail-page-patterns.md` — detail page sections, Container cards, SectionRow

## Hard Rules (DO NOT)

1. Do NOT use hardcoded strings — use `t("...")` from `useTranslation()`.
2. Do NOT use `window.confirm` or `window.alert` — use `usePrompt()` for delete confirmations.
3. Do NOT create context/provider for detail pages — Root fetches data, passes as props to sections.
4. Do NOT create a separate `Layout` wrapper — inline `TwoColumnPage` directly in Root.
5. Do NOT use render props (`header={<Custom />}`) — use nested compound components with `Children.count`.
6. Do NOT use `Heading level="h1"` in sections — h1 is for page title only, h2 for sections.
7. Do NOT skip `data-testid` on key elements.
8. Do NOT build custom dropdown menus — use `ActionMenu` component.
9. Do NOT build custom empty states — use `NoRecords` / `NoResults` components.
10. Do NOT skip error boundaries — wrap data fetching pages with `isError` + `throw error`.

## Page Types

### List Page

```
SingleColumnPage
  └─ Table (compound)
       ├─ Header
       │    ├─ Title (Heading)
       │    └─ Actions
       │         └─ CreateButton (Link + Button)
       └─ DataTable (_DataTable with filters, search, pagination)
```

### Detail Page

```
TwoColumnPage
  ├─ Main (first child)
  │    ├─ MainGeneralSection (Container card)
  │    ├─ MainMediaSection
  │    └─ MainVariantSection
  └─ Sidebar (second child)
       ├─ SidebarOrganizationSection
       └─ SidebarSellerSection
```

## Container Section Pattern (Detail Page Cards)

```tsx
<Container className="divide-y p-0">
  {/* Header row */}
  <div className="flex items-center justify-between px-6 py-4">
    <Heading level="h2">{t("scope.section.title")}</Heading>
    <div className="flex items-center gap-x-2">
      <StatusBadge color={statusColor}>
        {t(`scope.status.${status}`)}
      </StatusBadge>
      <ActionMenu
        groups={[
          {
            actions: [
              {
                label: t("actions.edit"),
                icon: <PencilSquare />,
                to: "edit",
              },
            ],
          },
          {
            actions: [
              {
                label: t("actions.delete"),
                icon: <Trash />,
                onClick: handleDelete,
              },
            ],
          },
        ]}
      />
    </div>
  </div>

  {/* Data rows */}
  <SectionRow title={t("fields.name")} value={data.name || "-"} />
  <SectionRow title={t("fields.email")} value={data.email || "-"} />
  <SectionRow title={t("fields.phone")} value={data.phone || "-"} />
</Container>
```

## ActionMenu Pattern

```tsx
import { ActionMenu } from "@components/common/action-menu"
import { PencilSquare, Trash } from "@medusajs/icons"

<ActionMenu
  groups={[
    {
      actions: [
        {
          icon: <PencilSquare />,
          label: t("actions.edit"),
          to: `/resource/${id}/edit`,  // navigation
        },
      ],
    },
    {
      actions: [
        {
          icon: <Trash />,
          label: t("actions.delete"),
          onClick: handleDelete,  // callback
        },
      ],
    },
  ]}
/>
```

**Action type**: either `to` (navigation link) or `onClick` (callback), never both.
**Groups**: separate edit actions from destructive actions with different groups.

## Delete Confirmation Pattern

```tsx
import { usePrompt } from "@medusajs/ui"

const prompt = usePrompt()

const handleDelete = async () => {
  const res = await prompt({
    title: t("scope.delete.title"),
    description: t("scope.delete.description", { name: item.name }),
    verificationInstruction: t("general.typeToConfirm"),
    verificationText: item.name,
    confirmText: t("actions.delete"),
    cancelText: t("actions.cancel"),
  })

  if (!res) return

  await mutateAsync(undefined, {
    onSuccess: () => {
      toast.success(t("scope.delete.successToast"))
      navigate("/resource-list", { replace: true })
    },
  })
}
```

## Empty State Patterns

### NoRecords (table completely empty)
```tsx
<_DataTable
  table={table}
  columns={columns}
  noRecords={{
    message: t("scope.list.noRecordsMessage"),
  }}
/>
```

### NoRecords (section with no data)
```tsx
import { NoRecords } from "@components/common/empty-table-content"

{items.length === 0 && (
  <NoRecords
    className="flex h-full flex-col overflow-hidden border-t p-6"
    icon={null}
    title={t("general.noRecordsTitle")}
    message={t("general.noRecordsMessage")}
  />
)}
```

## StatusBadge Pattern

```tsx
import { StatusBadge } from "@medusajs/ui"

// Color helper function
const productStatusColor = (status: string): "green" | "orange" | "red" | "grey" => {
  switch (status) {
    case "published": return "green"
    case "draft": return "orange"
    case "rejected": return "red"
    default: return "grey"
  }
}

<StatusBadge color={productStatusColor(product.status)}>
  {t(`products.productStatus.${product.status}`)}
</StatusBadge>
```

## Typography Rules

| Element | Component | Level | Where |
|---------|-----------|-------|-------|
| Page title | `<Heading>` | (default) | Page root / modal body |
| Section title | `<Heading level="h2">` | h2 | Inside Container header |
| Drawer title | `<Heading>` | (default) | RouteDrawer.Header |
| Description | `<Text size="small">` | — | Below heading |
| Subtle text | `<Text size="small" className="text-ui-fg-subtle">` | — | Hints, descriptions |

## Data Loading Pattern

```tsx
const Root = () => {
  const { id } = useParams()
  const { data, isPending, isError, error } = useQuery(id!)

  if (isError) {
    throw error
  }

  const ready = !isPending && !!data

  return ready ? (
    <TwoColumnPage hasOutlet showJSON showMetadata data={data}>
      <TwoColumnPage.Main>
        <MainGeneralSection data={data} />
      </TwoColumnPage.Main>
      <TwoColumnPage.Sidebar>
        <SidebarInfoSection data={data} />
      </TwoColumnPage.Sidebar>
    </TwoColumnPage>
  ) : (
    <TwoColumnPageSkeleton mainSections={2} sidebarSections={1} />
  )
}
```

## Compound Component Structure (List Page)

```tsx
const Root = ({ children }: { children?: ReactNode }) => {
  return (
    <SingleColumnPage>
      {Children.count(children) > 0 ? children : <ResourceListTable />}
    </SingleColumnPage>
  )
}

export const ResourceListPage = Object.assign(Root, {
  Table: ResourceListTable,
  Header: ResourceListHeader,
  HeaderTitle: ResourceListTitle,
  HeaderActions: ResourceListActions,
  HeaderCreateButton: ResourceListCreateButton,
  DataTable: ResourceListDataTable,
})
```

## Compound Component Structure (Detail Page)

```tsx
const Root = ({ children }: { children?: ReactNode }) => {
  const { id } = useParams()
  const { data, isPending, isError, error } = useQuery(id!)

  if (isError) throw error
  const ready = !isPending && !!data
  if (!ready) return <TwoColumnPageSkeleton ... />

  return (
    <TwoColumnPage hasOutlet showJSON showMetadata data={data}>
      {Children.count(children) > 0 ? children : (
        <>
          <TwoColumnPage.Main>
            <MainGeneralSection data={data} />
          </TwoColumnPage.Main>
          <TwoColumnPage.Sidebar>
            <SidebarInfoSection data={data} />
          </TwoColumnPage.Sidebar>
        </>
      )}
    </TwoColumnPage>
  )
}

export const ResourceDetailPage = Object.assign(Root, {
  MainGeneralSection,
  SidebarInfoSection,
})
```
