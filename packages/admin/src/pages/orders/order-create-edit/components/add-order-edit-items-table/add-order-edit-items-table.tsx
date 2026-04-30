import { OnChangeFn, RowSelectionState } from "@tanstack/react-table"
import { useState } from "react"

import { useTranslation } from "react-i18next"
import { _DataTable } from "../../../../../components/table/data-table"
import { useAddableVariants } from "../../../../../hooks/api/seller-scoped-orders"
import { useDataTable } from "../../../../../hooks/use-data-table"
import { useOrderEditItemsTableColumns } from "./use-order-edit-item-table-columns"
import { useOrderEditItemTableFilters } from "./use-order-edit-item-table-filters"
import { useOrderEditItemTableQuery } from "./use-order-edit-item-table-query"

const PAGE_SIZE = 50
const PREFIX = "rit"

type AddExchangeOutboundItemsTableProps = {
  orderId: string
  onSelectionChange: (ids: string[]) => void
  currencyCode: string
}

export const AddOrderEditItemsTable = ({
  orderId,
  onSelectionChange,
  currencyCode,
}: AddExchangeOutboundItemsTableProps) => {
  const { t } = useTranslation()

  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})

  const updater: OnChangeFn<RowSelectionState> = (fn) => {
    const newState: RowSelectionState =
      typeof fn === "function" ? fn(rowSelection) : fn

    setRowSelection(newState)
    onSelectionChange(Object.keys(newState))
  }

  const { searchParams, raw } = useOrderEditItemTableQuery({
    pageSize: PAGE_SIZE,
    prefix: PREFIX,
  })

  // Spec 006 T018 — replace global useVariants with seller-scoped
  // useAddableVariants. Each row carries an `eligibility` discriminator
  // ({ can_add, reason }) so we can disable ineligible rows below.
  // Backend (T010) also rejects cross-seller variant_id on
  // POST /admin/order-edits/:id/items as defense-in-depth.
  const { variants = [], count = 0 } = useAddableVariants(orderId, {
    search: searchParams.q,
    limit: searchParams.limit,
    offset: searchParams.offset,
  })

  const columns = useOrderEditItemsTableColumns(currencyCode)
  const filters = useOrderEditItemTableFilters()

  const { table } = useDataTable({
    data: variants,
    columns: columns,
    count,
    enablePagination: true,
    getRowId: (row) => row.id,
    pageSize: PAGE_SIZE,
    enableRowSelection: (row) => {
      // Disable selection for variants that fail seller-valid eligibility
      // (no_price / no_inventory). The reason is surfaced on the row via
      // the typed eligibility field for column-level UI to act on.
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
