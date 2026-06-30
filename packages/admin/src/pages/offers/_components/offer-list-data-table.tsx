import { toast, usePrompt } from "@medusajs/ui"
import { keepPreviousData } from "@tanstack/react-query"
import { RowSelectionState } from "@tanstack/react-table"
import { useState } from "react"
import { useTranslation } from "react-i18next"

import { _DataTable } from "../../../components/table/data-table"
import { useDataTable } from "../../../hooks/use-data-table"
import {
  useBulkDeleteOffers,
  useGroupedOffers,
} from "../../../hooks/api/offers"
import { OFFERS_PAGE_SIZE } from "../common/constants"
import { GroupedOfferRow } from "../common/types"
import { useOfferTableColumns } from "./use-offer-table-columns"
import { useOfferTableFilters } from "./use-offer-table-filters"
import { useOfferTableQuery } from "./use-offer-table-query"

export const OfferListDataTable = () => {
  const { t } = useTranslation()
  const prompt = usePrompt()

  const [selection, setSelection] = useState<RowSelectionState>({})

  const { raw, searchParams } = useOfferTableQuery({
    pageSize: OFFERS_PAGE_SIZE,
  })

  const { offers, count, isLoading, isError, error } = useGroupedOffers(
    searchParams,
    { placeholderData: keepPreviousData },
  )

  const rows = (offers ?? []) as GroupedOfferRow[]

  const filters = useOfferTableFilters()
  const columns = useOfferTableColumns()
  const { mutateAsync: bulkDelete } = useBulkDeleteOffers()

  const { table } = useDataTable({
    data: rows,
    columns,
    count,
    enablePagination: true,
    getRowId: (row) => row.row_id,
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
        { key: "created_at", label: t("fields.createdAt") },
        { key: "updated_at", label: t("fields.updatedAt") },
      ]}
      navigateTo={(row) =>
        `${row.original.id}?seller_id=${row.original.seller_id}`
      }
      noRecords={{
        title: t("offers.empty.heading"),
        message: t("offers.empty.description"),
      }}
      commands={[
        {
          label: t("offers.actions.bulkDelete"),
          shortcut: "d",
          action: async (currentSelection) => {
            const rowIds = Object.keys(currentSelection)
            if (rowIds.length === 0) return

            const selectedRows = rows.filter((r) => rowIds.includes(r.row_id))
            const offerIds = selectedRows.flatMap((r) => r.offer_ids)
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
