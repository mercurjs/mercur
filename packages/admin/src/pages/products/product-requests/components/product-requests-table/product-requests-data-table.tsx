import { keepPreviousData } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"

import { _DataTable } from "../../../../../components/table/data-table"
import { useProductChanges } from "../../../../../hooks/api/product-changes"
import { useDataTable } from "../../../../../hooks/use-data-table"
import { useProductRequestsTableColumns } from "./use-product-requests-table-columns"
import { useProductRequestsTableFilters } from "./use-product-requests-table-filters"
import { useProductRequestsTableQuery } from "./use-product-requests-table-query"

const PAGE_SIZE = 20

export const ProductRequestsDataTable = () => {
  const { t } = useTranslation()

  const { raw, searchParams } = useProductRequestsTableQuery({
    pageSize: PAGE_SIZE,
  })

  const { product_changes, count, isLoading, isError, error } =
    useProductChanges(searchParams, { placeholderData: keepPreviousData })

  const columns = useProductRequestsTableColumns()
  const filters = useProductRequestsTableFilters()

  const { table } = useDataTable({
    data: product_changes ?? [],
    columns,
    count,
    enablePagination: true,
    getRowId: (row) => row.id,
    pageSize: PAGE_SIZE,
  })

  if (isError) {
    throw error
  }

  return (
    <_DataTable
      table={table}
      columns={columns}
      pageSize={PAGE_SIZE}
      count={count}
      isLoading={isLoading}
      pagination
      search
      filters={filters}
      queryObject={raw}
      orderBy={[
        { key: "created_at", label: t("products.requests.fields.submitted") },
        { key: "updated_at", label: t("fields.updatedAt") },
        { key: "product_title", label: t("fields.product") },
        { key: "seller_name", label: t("products.requests.fields.store") },
      ]}
      defaultOrder="-created_at"
      navigateTo={(row) => `/products/${row.original.product_id}`}
      noRecords={{
        title: t("products.requests.empty.heading"),
        message: t("products.requests.empty.description"),
      }}
    />
  )
}
