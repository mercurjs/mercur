import { keepPreviousData } from "@tanstack/react-query"
import { RowSelectionState } from "@tanstack/react-table"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { toast, usePrompt } from "@medusajs/ui"

import { _DataTable } from "../../../components/table/data-table"
import { useDataTable } from "../../../hooks/use-data-table"
import {
  useBulkDeleteOffers,
  useOffers,
} from "../../../hooks/api/offers"
import { OFFERS_PAGE_SIZE, OFFER_LIST_FIELDS } from "../common/constants"
import { useOfferTableColumns, OfferTableRow } from "./use-offer-table-columns"
import { useOfferTableFilters } from "./use-offer-table-filters"
import { useOfferTableQuery } from "./use-offer-table-query"

export const OfferListDataTable = () => {
  const { t } = useTranslation()
  const prompt = usePrompt()

  const [selection, setSelection] = useState<RowSelectionState>({})

  const { raw, searchParams } = useOfferTableQuery({
    pageSize: OFFERS_PAGE_SIZE,
  })

  const {
    offers,
    count,
    isPending: isLoading,
    isError,
    error,
  } = useOffers(
    { ...searchParams, fields: OFFER_LIST_FIELDS },
    { placeholderData: keepPreviousData },
  )

  const rows = (offers ?? []) as OfferTableRow[]

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
      navigateTo={(row) => `${row.id}`}
      noRecords={{
        title: t("offers.empty.heading"),
        message: t("offers.empty.description"),
        action: {
          to: "create",
          label: t("offers.actions.create"),
        },
      }}
      commands={[
        {
          label: t("offers.actions.bulkDelete"),
          shortcut: "d",
          action: async (currentSelection) => {
            const ids = Object.keys(currentSelection)
            if (ids.length === 0) return

            const confirmed = await prompt({
              title: t("general.areYouSure"),
              description: t("offers.bulkDelete.description", {
                count: ids.length,
              }),
              confirmText: t("actions.delete"),
              cancelText: t("actions.cancel"),
              variant: "danger",
            })

            if (!confirmed) return

            const result = await bulkDelete(ids)
            const succeededCount = result.succeeded.length
            const failedCount = result.failed.length

            if (failedCount === 0) {
              toast.success(
                t("offers.bulkDelete.successToast", { count: succeededCount }),
              )
              setSelection({})
            } else {
              toast.warning(
                t("offers.bulkDelete.partialToast", {
                  succeeded: succeededCount,
                  total: ids.length,
                  failed: failedCount,
                }),
              )
              const failedIds = new Set(result.failed.map((f) => f.id))
              setSelection((prev) => {
                const next: RowSelectionState = {}
                for (const id of Object.keys(prev)) {
                  if (failedIds.has(id)) next[id] = true
                }
                return next
              })
            }
          },
        },
      ]}
    />
  )
}
