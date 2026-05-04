import { OnChangeFn, RowSelectionState } from "@tanstack/react-table"
import { useState } from "react"

import { useTranslation } from "react-i18next"
import { _DataTable } from "../../../../../components/table/data-table"
import { useAddableVariants } from "../../../../../hooks/api/seller-scoped-orders"
import { useDataTable } from "../../../../../hooks/use-data-table"
import { useExchangeOutboundItemTableColumns } from "./use-exchange-outbound-item-table-columns"
import { useExchangeOutboundItemTableFilters } from "./use-exchange-outbound-item-table-filters"
import { useExchangeOutboundItemTableQuery } from "./use-exchange-outbound-item-table-query"

const PAGE_SIZE = 50
const PREFIX = "rit"

type AddExchangeOutboundItemsTableProps = {
  orderId: string
  onSelectionChange: (ids: string[]) => void
  selectedItems: string[]
  currencyCode: string
}

export const AddExchangeOutboundItemsTable = ({
  orderId,
  onSelectionChange,
  selectedItems,
  currencyCode,
}: AddExchangeOutboundItemsTableProps) => {
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

  const { searchParams, raw } = useExchangeOutboundItemTableQuery({
    pageSize: PAGE_SIZE,
    prefix: PREFIX,
  })

  // Seller-scoped variants. Backend also rejects cross-seller
  // variant_id on POST /admin/exchanges/:id/outbound/items.
  const { variants = [], count = 0 } = useAddableVariants(orderId, {
    search: searchParams.q,
    limit: searchParams.limit,
    offset: searchParams.offset,
  })

  const columns = useExchangeOutboundItemTableColumns(currencyCode)
  const filters = useExchangeOutboundItemTableFilters()

  const { table } = useDataTable({
    data: variants,
    columns: columns,
    count,
    enablePagination: true,
    getRowId: (row) => row.id,
    pageSize: PAGE_SIZE,
    enableRowSelection: (row) => {
      // Disable selection for variants that fail seller-valid eligibility
      // (no_price / no_inventory).
      return row.original.eligibility?.can_add !== false
    },
    rowSelection: {
      state: rowSelection,
      updater,
    },
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
