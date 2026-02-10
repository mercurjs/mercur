import { PencilSquare, Trash } from "@medusajs/icons"
import { HttpTypes } from "@medusajs/types"
import { toast, usePrompt } from "@medusajs/ui"
import { createColumnHelper } from "@tanstack/react-table"
import { useMemo, ReactNode } from "react"
import { useTranslation } from "react-i18next"

import { ActionMenu } from "@components/common/action-menu"
import { _DataTable } from "@components/table/data-table"
import { useDeleteProduct } from "@hooks/api/products"
import { useProductTableColumns } from "@hooks/table/columns/use-product-table-columns"
import { useDataTable } from "@hooks/use-data-table"
import { useProductsPageContext } from "./products-context"

export interface ProductsTableProps {
  /** Custom columns - replaces default columns */
  columns?: any[]
  /** Additional columns - appended to default columns */
  extraColumns?: any[]
  /** Hide actions column */
  hideActions?: boolean
  /** Custom empty state */
  emptyState?: ReactNode
  /** Custom row click handler - defaults to navigate to product detail */
  onRowClick?: (product: HttpTypes.AdminProduct) => void
}

export function ProductsTable({
  columns: customColumns,
  extraColumns,
  hideActions,
  emptyState,
  onRowClick,
}: ProductsTableProps) {
  const { t } = useTranslation()
  const {
    products,
    count,
    isLoading,
    searchParams,
    rawQuery,
    pageSize,
  } = useProductsPageContext()

  const filters = useProductTableFilters()
  const columns = useColumns({ customColumns, extraColumns, hideActions })

  const { table } = useDataTable({
    data: (products ?? []) as HttpTypes.AdminProduct[],
    columns,
    count,
    enablePagination: true,
    pageSize,
    getRowId: (row) => row.id,
  })

  return (
    <div data-testid="products-data-table">
      <_DataTable
        table={table}
        columns={columns}
        count={count}
        pageSize={pageSize}
        filters={filters}
        search
        pagination
        isLoading={isLoading}
        queryObject={rawQuery}
        navigateTo={onRowClick ? undefined : (row) => `${row.original.id}`}
        onRowClick={onRowClick ? (row) => onRowClick(row.original) : undefined}
        orderBy={[
          { key: "title", label: t("fields.title") },
          { key: "created_at", label: t("fields.createdAt") },
          { key: "updated_at", label: t("fields.updatedAt") },
        ]}
        noRecords={
          emptyState
            ? { custom: emptyState }
            : { message: t("products.list.noRecordsMessage") }
        }
      />
    </div>
  )
}

// Import filters hook
import { useProductTableFilters } from "@hooks/table/filters/use-product-table-filters"

// Product row actions
const ProductActions = ({ product }: { product: HttpTypes.AdminProduct }) => {
  const { t } = useTranslation()
  const prompt = usePrompt()
  const { mutateAsync } = useDeleteProduct(product.id)

  const handleDelete = async () => {
    const res = await prompt({
      title: t("general.areYouSure"),
      description: t("products.deleteWarning", {
        title: product.title,
      }),
      confirmText: t("actions.delete"),
      cancelText: t("actions.cancel"),
    })

    if (!res) {
      return
    }

    await mutateAsync(undefined, {
      onSuccess: () => {
        toast.success(t("products.toasts.delete.success.header"), {
          description: t("products.toasts.delete.success.description", {
            title: product.title,
          }),
        })
      },
      onError: (e) => {
        toast.error(t("products.toasts.delete.error.header"), {
          description: e.message,
        })
      },
    })
  }

  return (
    <ActionMenu
      groups={[
        {
          actions: [
            {
              icon: <PencilSquare />,
              label: t("actions.edit"),
              to: `/products/${product.id}/edit`,
            },
          ],
        },
        {
          actions: [
            {
              icon: <Trash />,
              label: t("actions.delete"),
              onClick: handleDelete,
            },
          ],
        },
      ]}
      data-testid={`product-actions-${product.id}`}
    />
  )
}

// Column helper
const columnHelper = createColumnHelper<HttpTypes.AdminProduct>()

// Hook to build columns
function useColumns({
  customColumns,
  extraColumns,
  hideActions,
}: {
  customColumns?: any[]
  extraColumns?: any[]
  hideActions?: boolean
}) {
  const base = useProductTableColumns()

  return useMemo(() => {
    // Use custom columns if provided
    if (customColumns) {
      return customColumns
    }

    const cols = [...base]

    // Add extra columns
    if (extraColumns) {
      cols.push(...extraColumns)
    }

    // Add actions column unless hidden
    if (!hideActions) {
      cols.push(
        columnHelper.display({
          id: "actions",
          header: () => null,
          cell: ({ row }) => <ProductActions product={row.original} />,
        })
      )
    }

    return cols
  }, [base, customColumns, extraColumns, hideActions])
}
