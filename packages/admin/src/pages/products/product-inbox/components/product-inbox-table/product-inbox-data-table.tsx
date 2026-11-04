import { keepPreviousData } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"

import { _DataTable } from "../../../../../components/table/data-table"
import { useProductChanges } from "../../../../../hooks/api/product-changes"
import { useDataTable } from "../../../../../hooks/use-data-table"
import { useProductInboxTableColumns } from "./use-product-inbox-table-columns"
import { useProductInboxTableFilters } from "./use-product-inbox-table-filters"
import { useProductInboxTableQuery } from "./use-product-inbox-table-query"

const PAGE_SIZE = 20

export const ProductInboxDataTable = () => {
  const { t } = useTranslation()

  const { raw, searchParams } = useProductInboxTableQuery({
    pageSize: PAGE_SIZE,
  })

  const { product_changes, count, isLoading, isError, error } =
    useProductChanges(searchParams, { placeholderData: keepPreviousData })

  const columns = useProductInboxTableColumns()
  const filters = useProductInboxTableFilters()

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
        { key: "created_at", label: t("products.inbox.fields.submitted") },
        { key: "updated_at", label: t("fields.updatedAt") },
        { key: "product_title", label: t("fields.product") },
        { key: "seller_name", label: t("products.inbox.fields.store") },
      ]}
      defaultOrder="-created_at"
      navigateTo={(row) => `/products/${row.original.product_id}`}
      noRecords={{
        title: t("products.inbox.empty.heading"),
        message: t("products.inbox.empty.description"),
      }}
    />
  )
}
