// Override example: Custom categories page with custom columns
// This file overrides the core categories list page

import { useMemo } from "react"
import { createColumnHelper } from "@tanstack/react-table"
import { HttpTypes } from "@medusajs/types"
import { Badge, Text } from "@medusajs/ui"

import {
  CategoriesPage,
  useCategoryTableColumns,
} from "@mercurjs/core-admin/pages/categories"

const columnHelper = createColumnHelper<HttpTypes.AdminProductCategory>()

// Custom header component
function CustomHeader() {
  return (
    <div className="flex items-center gap-x-2 mb-4 p-4 bg-ui-bg-subtle rounded-lg border border-ui-border-base">
      <Badge color="purple">Custom Override</Badge>
      <Text size="small" className="text-ui-fg-muted">
        This page has a custom "Vendor" column added to the table
      </Text>
    </div>
  )
}

// Custom hook to add vendor column
function useCustomColumns() {
  const baseColumns = useCategoryTableColumns()

  return useMemo(
    () => [
      ...baseColumns,
      columnHelper.display({
        id: "vendor",
        header: () => <span className="text-ui-fg-subtle">Vendor</span>,
        cell: () => (
          <Badge color="green" size="2xsmall">
            Acme Inc.
          </Badge>
        ),
      }),
    ],
    [baseColumns]
  )
}

export const Component = () => {
  const columns = useCustomColumns()

  return (
    <CategoriesPage>
      <CustomHeader />
      <CategoriesPage.Table columns={columns} />
    </CategoriesPage>
  )
}
