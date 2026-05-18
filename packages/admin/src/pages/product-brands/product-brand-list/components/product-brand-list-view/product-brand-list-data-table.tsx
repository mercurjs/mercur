import { ProductBrandDTO } from "@mercurjs/types"
import { keepPreviousData } from "@tanstack/react-query"
import { createColumnHelper } from "@tanstack/react-table"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"

import { _DataTable } from "../../../../../components/table/data-table"
import { useProductBrands } from "../../../../../hooks/api/product-brands"
import { useProductBrandTableColumns } from "../../../../../hooks/table/columns/use-product-brand-table-columns"
import { useProductBrandTableFilters } from "../../../../../hooks/table/filters/use-product-brand-table-filters"
import { useProductBrandTableQuery } from "../../../../../hooks/table/query/use-product-brand-table-query"
import { useDataTable } from "../../../../../hooks/use-data-table"
import { ProductBrandRowActions } from "../product-brand-list-table/product-brand-row-actions"

const PAGE_SIZE = 20

export const ProductBrandListDataTable = () => {
  const { t } = useTranslation()

  const { searchParams, raw } = useProductBrandTableQuery({
    pageSize: PAGE_SIZE,
  })
  const { product_brands, count, isLoading, isError, error } = useProductBrands(
    searchParams,
    {
      placeholderData: keepPreviousData,
    }
  )

  const filters = useProductBrandTableFilters()
  const columns = useColumns()

  const { table } = useDataTable({
    columns,
    data: product_brands,
    count,
    getRowId: (row) => row.id,
    pageSize: PAGE_SIZE,
  })

  if (isError) {
    throw error
  }

  return (
    <_DataTable
      table={table}
      filters={filters}
      isLoading={isLoading}
      columns={columns}
      pageSize={PAGE_SIZE}
      count={count}
      orderBy={[
        { key: "name", label: t("fields.name") },
        { key: "handle", label: t("fields.handle") },
        { key: "created_at", label: t("fields.createdAt") },
        { key: "updated_at", label: t("fields.updatedAt") },
      ]}
      navigateTo={({ original }) => original.id}
      queryObject={raw}
      pagination
      search
      data-testid="product-brand-list-table"
    />
  )
}

const columnHelper = createColumnHelper<ProductBrandDTO>()

const useColumns = () => {
  const base = useProductBrandTableColumns()

  return useMemo(
    () => [
      ...base,
      columnHelper.display({
        id: "actions",
        cell: ({ row }) => {
          return <ProductBrandRowActions productBrand={row.original} />
        },
      }),
    ],
    [base]
  )
}
