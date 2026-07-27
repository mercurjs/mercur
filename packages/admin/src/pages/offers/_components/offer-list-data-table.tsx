import { keepPreviousData } from "@tanstack/react-query"
import { ColumnDef, RowSelectionState } from "@tanstack/react-table"
import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { OfferDTO } from "@mercurjs/types"
import { useExtendableTable } from "@mercurjs/dashboard-shared"

import { _DataTable } from "../../../components/table/data-table"
import { useDataTable } from "../../../hooks/use-data-table"
import { useOffers } from "../../../hooks/api/offers"
import { OFFERS_PAGE_SIZE } from "../common/constants"
import { useOfferTableColumns } from "./use-offer-table-columns"
import { useOfferTableCommands } from "./use-offer-table-commands"
import { useOfferTableFilters } from "./use-offer-table-filters"
import { useOfferTableQuery } from "./use-offer-table-query"

export const OfferListDataTable = () => {
  const { t } = useTranslation()

  const [selection, setSelection] = useState<RowSelectionState>({})

  const { raw, searchParams } = useOfferTableQuery({
    pageSize: OFFERS_PAGE_SIZE,
  })

  const { offers, count, isLoading, isError, error } = useOffers(searchParams, {
    placeholderData: keepPreviousData,
  })

  const rows = (offers ?? []) as OfferDTO[]

  const baseFilters = useOfferTableFilters()
  const baseColumns = useOfferTableColumns()
  const actionColumn = baseColumns[baseColumns.length - 1]
  const { columns: extended, filters: extFilters } =
    useExtendableTable<OfferDTO>({
      model: "offer",
      columns: baseColumns.slice(0, -1) as unknown as ColumnDef<
        OfferDTO,
        unknown
      >[],
    })
  const columns = useMemo(
    () => [...extended, actionColumn as (typeof extended)[number]],
    [extended, actionColumn],
  )
  const filters = useMemo(
    () => [...baseFilters, ...(extFilters as typeof baseFilters)],
    [baseFilters, extFilters],
  )
  const commands = useOfferTableCommands({
    onDeleted: () => setSelection({}),
  })

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
        { key: "created_at", label: t("fields.createdAt") },
        { key: "updated_at", label: t("fields.updatedAt") },
      ]}
      defaultOrder="-created_at"
      navigateTo={(row) =>
        `${row.original.product_id}?seller_id=${row.original.seller_id}`
      }
      noRecords={{
        title: t("offers.empty.heading"),
        message: t("offers.empty.description"),
      }}
      commands={commands}
    />
  )
}
