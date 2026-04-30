import { OnChangeFn, RowSelectionState } from "@tanstack/react-table"
import { useState } from "react"

import { useTranslation } from "react-i18next"
import { _DataTable } from "../../../../../components/table/data-table"
import { useAddableVariants } from "../../../../../hooks/api/seller-scoped-orders"
import { useDataTable } from "../../../../../hooks/use-data-table"
import { useClaimOutboundItemTableColumns } from "./use-claim-outbound-item-table-columns"
import { useClaimOutboundItemTableFilters } from "./use-claim-outbound-item-table-filters"
import { useClaimOutboundItemTableQuery } from "./use-claim-outbound-item-table-query"

const PAGE_SIZE = 50
const PREFIX = "rit"

type AddClaimOutboundItemsTableProps = {
  orderId: string
  onSelectionChange: (ids: string[]) => void
  selectedItems: string[]
  currencyCode: string
}

export const AddClaimOutboundItemsTable = ({
  orderId,
  onSelectionChange,
  selectedItems,
  currencyCode,
}: AddClaimOutboundItemsTableProps) => {
  const { t } = useTranslation()

  const [rowSelection, setRowSelection] = useState<RowSelectionState>(
    selectedItems.reduce((acc, id) => {
      acc[id] = true
      return acc
    }, {} as RowSelectionState)
  )

  const updater: OnChangeFn<RowSelectionState> = (fn) => {
    const newState: RowSelectionState =
      typeof fn === "function" ? fn(rowSelection) : fn

    setRowSelection(newState)
    onSelectionChange(Object.keys(newState))
  }

  const { searchParams, raw } = useClaimOutboundItemTableQuery({
    pageSize: PAGE_SIZE,
    prefix: PREFIX,
  })

  // Spec 006 T019 — replace global useVariants with seller-scoped
  // useAddableVariants. Backend (T011) also rejects cross-seller
  // variant_id on POST /admin/claims/:id/outbound/items.
  const { variants = [], count = 0 } = useAddableVariants(orderId, {
    search: searchParams.q,
    limit: searchParams.limit,
    offset: searchParams.offset,
  })

  const columns = useClaimOutboundItemTableColumns(currencyCode)
  const filters = useClaimOutboundItemTableFilters()

  const { table } = useDataTable({
    data: variants,
    columns: columns,
    count,
    enablePagination: true,
    getRowId: (row) => row.id,
    pageSize: PAGE_SIZE,
    enableRowSelection: (row) => {
      // Disable selection for variants that fail seller-valid eligibility
      // (no_price / no_inventory). Same pattern as T018.
      return row.original.eligibility?.can_add !== false
    },
    rowSelection: {
      state: rowSelection,
      updater,
    },
    prefix: PREFIX,
  })

  return (
    <div className="flex size-full flex-col overflow-hidden">
      <_DataTable
        table={table}
        columns={columns}
        pageSize={PAGE_SIZE}
        count={count}
        filters={filters}
        pagination
        layout="fill"
        search
        orderBy={[
          { key: "product_id", label: t("fields.product") },
          { key: "title", label: t("fields.title") },
          { key: "sku", label: t("fields.sku") },
        ]}
        prefix={PREFIX}
        queryObject={raw}
      />
    </div>
  )
}
