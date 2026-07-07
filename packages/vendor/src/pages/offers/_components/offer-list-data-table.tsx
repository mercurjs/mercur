import { keepPreviousData } from "@tanstack/react-query"
import { type ColumnDef } from "@tanstack/react-table"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"

import { useExtendableTable } from "@mercurjs/dashboard-shared"

import { _DataTable } from "../../../components/table/data-table"
import { useDataTable } from "../../../hooks/use-data-table"
import { useProducts } from "../../../hooks/api/products"
import { OFFERS_PAGE_SIZE } from "../common/constants"
import { OfferProduct } from "../common/types"
import { useOfferTableColumns } from "./use-offer-table-columns"
import { useOfferTableFilters } from "./use-offer-table-filters"
import { useOfferTableQuery } from "./use-offer-table-query"

/**
 * Product-backed Offers list (SPEC-009). Reads `/vendor/products` scoped
 * to the seller's offered products (`has_offer=true`) with the seller's
 * offers wrapped under each variant. One row per product; no row
 * selection or bulk-delete command (the B2C list has no select column).
 */
export const OfferListDataTable = () => {
  const { t } = useTranslation()

  const { raw, searchParams } = useOfferTableQuery({
    pageSize: OFFERS_PAGE_SIZE,
  })

  const { products, count, isLoading, isError, error } = useProducts(
    searchParams,
    { placeholderData: keepPreviousData },
  )

  const rows = (products ?? []) as OfferProduct[]

  const baseFilters = useOfferTableFilters()
  const { columns, filters: extFilters } = useColumns()
  const filters = useMemo(
    () => [...baseFilters, ...(extFilters as typeof baseFilters)],
    [baseFilters, extFilters],
  )

  const { table } = useDataTable({
    data: rows,
    columns,
    count,
    enablePagination: true,
    getRowId: (row) => row.id,
    pageSize: OFFERS_PAGE_SIZE,
  })

  if (isError) {
    throw error
  }

  return (
    <_DataTable
      table={table}
      columns={columns}
      pageSize={OFFERS_PAGE_SIZE}
      count={count}
      isLoading={isLoading}
      pagination
      search
      filters={filters}
      queryObject={raw}
      orderBy={[
        { key: "title", label: t("fields.title") },
        { key: "created_at", label: t("fields.createdAt") },
        { key: "updated_at", label: t("fields.updatedAt") },
      ]}
      defaultOrderBy="title"
      navigateTo={(row) => `${row.original.id}`}
      noRecords={{
        title: t("offers.empty.heading"),
        message: t("offers.empty.description"),
        action: {
          to: "create",
          label: t("offers.actions.create"),
        },
      }}
    />
  )
}

const useColumns = () => {
  const base = useOfferTableColumns()
  const actionsColumn = base[base.length - 1]
  const baseColumns = base.slice(0, -1)

  const { columns: extended, filters } = useExtendableTable<OfferProduct>({
    model: "offer",
    columns: baseColumns as unknown as ColumnDef<OfferProduct, unknown>[],
  })

  const columns = useMemo(
    () => [...extended, actionsColumn],
    [extended, actionsColumn],
  )

  return { columns, filters }
}
