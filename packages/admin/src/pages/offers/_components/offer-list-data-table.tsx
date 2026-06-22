import { toast, usePrompt } from "@medusajs/ui"
import { keepPreviousData } from "@tanstack/react-query"
import { RowSelectionState } from "@tanstack/react-table"
import { useState } from "react"
import { useTranslation } from "react-i18next"

import { _DataTable } from "../../../components/table/data-table"
import { useDataTable } from "../../../hooks/use-data-table"
import { useBulkDeleteOffers } from "../../../hooks/api/offers"
import { useProducts } from "../../../hooks/api/products"
import { OFFERS_PAGE_SIZE } from "../common/constants"
import { OfferProduct } from "../common/types"
import { collectOfferIds, useOfferTableColumns } from "./use-offer-table-columns"
import { useOfferTableFilters } from "./use-offer-table-filters"
import { useOfferTableQuery } from "./use-offer-table-query"

/**
 * Product-backed admin Offers list (SPEC-010). Reads `/admin/products`
 * scoped to products that carry an offer (`has_offer=true`) with every
 * seller's offers wrapped under each variant. One row per product. Admin
 * is read-only except for delete — the bulk command collects the offer
 * ids across the selected product rows and removes them (per-offer DELETE
 * fan-out via `useBulkDeleteOffers`).
 */
export const OfferListDataTable = () => {
  const { t } = useTranslation()
  const prompt = usePrompt()

  const [selection, setSelection] = useState<RowSelectionState>({})

  const { raw, searchParams } = useOfferTableQuery({
    pageSize: OFFERS_PAGE_SIZE,
  })

  const { products, count, isLoading, isError, error } = useProducts(
    searchParams,
    { placeholderData: keepPreviousData },
  )

  const rows = (products ?? []) as OfferProduct[]

  const filters = useOfferTableFilters()
  const columns = useOfferTableColumns()
  const { mutateAsync: bulkDelete } = useBulkDeleteOffers()

  const { table } = useDataTable({
    data: rows,
    columns,
    count,
    enablePagination: true,
    getRowId: (row) => row.id,
    pageSize: OFFERS_PAGE_SIZE,
    enableRowSelection: true,
    rowSelection: {
      state: selection,
      updater: setSelection,
    },
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
      navigateTo={(row) => `${row.id}`}
      noRecords={{
        title: t("offers.empty.heading"),
        message: t("offers.empty.description"),
      }}
      commands={[
        {
          label: t("offers.actions.bulkDelete"),
          shortcut: "d",
          action: async (currentSelection) => {
            const productIds = Object.keys(currentSelection)
            if (productIds.length === 0) return

            const selectedRows = rows.filter((r) => productIds.includes(r.id))
            const offerIds = selectedRows.flatMap((r) => collectOfferIds(r))
            if (offerIds.length === 0) return

            const confirmed = await prompt({
              title: t("general.areYouSure"),
              description: t("offers.bulkDelete.description", {
                count: offerIds.length,
              }),
              confirmText: t("actions.delete"),
              cancelText: t("actions.cancel"),
              variant: "danger",
            })

            if (!confirmed) return

            const result = await bulkDelete(offerIds)
            const succeededCount = result.succeeded.length
            const failedCount = result.failed.length

            if (failedCount === 0) {
              toast.success(
                t("offers.bulkDelete.successToast", { count: succeededCount }),
              )
              setSelection({})
            } else {
              toast.warning(
                t("offers.bulkDelete.errorToast", {
                  message: `${succeededCount}/${offerIds.length} succeeded`,
                }),
              )
            }
          },
        },
      ]}
    />
  )
}
