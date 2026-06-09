import { HttpTypes } from "@medusajs/types"
import { OnChangeFn, RowSelectionState } from "@tanstack/react-table"
import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"

import { _DataTable } from "@components/table/data-table"
import { useDataTable } from "@hooks/use-data-table"

import {
  ReturnItemPickerRow,
  useReturnItemTableColumns,
} from "./use-return-item-table-columns"

const PAGE_SIZE = 50

/**
 * Returns can only target items the customer actually purchased on this
 * order, so the picker sources from `order.items` (filtered to items that
 * still have a returnable quantity remaining) — not from the seller's
 * offer catalog. The previous offers-sourced picker was wrong: its row id
 * was an `offer_*` id, which the vendor `add-return-items` route would
 * reject with `items with ids offer_… does not exist in order with id …`.
 *
 * "Remaining quantity" = `fulfilled_quantity - return_requested_quantity -
 * returned_quantity`. Items with 0 remaining are filtered out so the
 * seller can't pick something already in the return draft.
 */
type AddReturnItemsTableProps = {
  /**
   * The order whose line items can be returned.
   */
  order: HttpTypes.AdminOrder
  /**
   * Receives the picked **order line item ids** (the `id` field on each
   * `order.items[]` row). These are what
   * `POST /vendor/returns/:id/request-items` expects.
   */
  onSelectionChange: (lineItemIds: string[]) => void
  /**
   * Pre-selected ids (line item ids) — used when the picker is reopened
   * after the user already added some items to the draft.
   */
  selectedItems?: string[]
}

type OrderLineItem = HttpTypes.AdminOrder["items"][number] & {
  detail?: {
    fulfilled_quantity?: number
    return_requested_quantity?: number
    returned_quantity?: number
  } | null
}

const getRemainingQuantity = (item: OrderLineItem): number => {
  const detail = item.detail ?? {}
  const fulfilled = detail.fulfilled_quantity ?? 0
  const requested = detail.return_requested_quantity ?? 0
  const returned = detail.returned_quantity ?? 0
  return fulfilled - requested - returned
}

export const AddReturnItemsTable = ({
  order,
  onSelectionChange,
  selectedItems = [],
}: AddReturnItemsTableProps) => {
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

  const rows = useMemo<ReturnItemPickerRow[]>(() => {
    return (order.items ?? [])
      .map((item) => {
        const remainingQuantity = getRemainingQuantity(item as OrderLineItem)
        if (remainingQuantity <= 0) {
          return null
        }
        return {
          id: item.id,
          title: item.title,
          product_title: item.product_title,
          variant_sku: item.variant_sku,
          variant_title: item.variant_title,
          thumbnail: item.thumbnail,
          remainingQuantity,
        }
      })
      .filter((r): r is ReturnItemPickerRow => r !== null)
  }, [order.items])

  const count = rows.length

  const columns = useReturnItemTableColumns()

  const { table } = useDataTable({
    data: rows,
    columns,
    count,
    enablePagination: true,
    // Row id = order line item id; `onSelectionChange` yields the ids the
    // vendor add-return-items route accepts.
    getRowId: (row) => row.id,
    pageSize: PAGE_SIZE,
    enableRowSelection: () => true,
    rowSelection: {
      state: rowSelection,
      updater,
    },
  })

  return (
    <div
      className="flex size-full flex-col overflow-hidden"
      data-testid="add-return-items-picker"
    >
      <_DataTable
        table={table}
        columns={columns}
        pageSize={PAGE_SIZE}
        count={count}
        pagination
        layout="fill"
        search={false}
        orderBy={[
          { key: "product_title", label: t("fields.product") },
          { key: "variant_title", label: t("fields.title") },
        ]}
      />
    </div>
  )
}
