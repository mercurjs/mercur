import {
  AdminOrderLineItem,
  DateComparisonOperator,
  NumericalComparisonOperator,
} from "@medusajs/types"
import { OnChangeFn, RowSelectionState } from "@tanstack/react-table"
import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"

import { _DataTable } from "@components/table/data-table"
import { useDataTable } from "@hooks/use-data-table"
import { getStylizedAmount } from "@lib/money-amount-helpers"
import { getReturnableQuantity } from "@lib/rma"

import { useClaimItemTableColumns } from "./use-claim-item-table-columns"
import { useClaimItemTableFilters } from "./use-claim-item-table-filters"
import { useClaimItemTableQuery } from "./use-claim-item-table-query"

const PAGE_SIZE = 50
const PREFIX = "rit"

type AddClaimItemsTableProps = {
  onSelectionChange: (ids: string[]) => void
  selectedItems: string[]
  items: AdminOrderLineItem[]
  currencyCode: string
}

/**
 * Inbound picker for the claim flow. Identical to admin's
 * `AddClaimItemsTable` — operates on the order's line items
 * (already vendor-scoped at the API boundary), filters/sorts
 * client-side, and surfaces selection back as line item ids.
 */
export const AddClaimItemsTable = ({
  onSelectionChange,
  selectedItems,
  items,
  currencyCode,
}: AddClaimItemsTableProps) => {
  const { t } = useTranslation()

  const [rowSelection, setRowSelection] = useState<RowSelectionState>(
    selectedItems.reduce<RowSelectionState>((acc, id) => {
      acc[id] = true
      return acc
    }, {})
  )

  const updater: OnChangeFn<RowSelectionState> = (fn) => {
    const newState: RowSelectionState =
      typeof fn === "function" ? fn(rowSelection) : fn

    setRowSelection(newState)
    onSelectionChange(Object.keys(newState))
  }

  const { searchParams, raw } = useClaimItemTableQuery({
    pageSize: PAGE_SIZE,
    prefix: PREFIX,
  })

  const queriedItems = useMemo(() => {
    const {
      order,
      offset,
      limit,
      q,
      created_at,
      updated_at,
      refundable_amount,
      returnable_quantity,
    } = searchParams

    let results: AdminOrderLineItem[] = items

    if (q) {
      const needle = q.toLowerCase()
      results = results.filter((i) => {
        return (
          i.product_title?.toLowerCase().includes(needle) ||
          i.variant_title?.toLowerCase().includes(needle) ||
          i.variant_sku?.toLowerCase().includes(needle)
        )
      })
    }

    if (order) {
      const direction = order[0] === "-" ? "desc" : "asc"
      const field = order.replace("-", "")

      results = sortItems(results, field, direction)
    }

    if (created_at) {
      results = filterByDate(results, created_at, "created_at")
    }

    if (updated_at) {
      results = filterByDate(results, updated_at, "updated_at")
    }

    if (returnable_quantity) {
      results = filterByNumber(
        results,
        returnable_quantity,
        "returnable_quantity",
        currencyCode
      )
    }

    if (refundable_amount) {
      results = filterByNumber(
        results,
        refundable_amount,
        "refundable_amount",
        currencyCode
      )
    }

    return results.slice(offset, offset + limit)
  }, [items, currencyCode, searchParams])

  const columns = useClaimItemTableColumns(currencyCode)
  const filters = useClaimItemTableFilters()

  const { table } = useDataTable({
    data: queriedItems,
    columns,
    count: queriedItems.length,
    enablePagination: true,
    getRowId: (row) => row.id,
    pageSize: PAGE_SIZE,
    enableRowSelection: (row) => {
      return getReturnableQuantity(row.original) > 0
    },
    rowSelection: {
      state: rowSelection,
      updater,
    },
  })

  return (
    <div
      className="flex size-full flex-col overflow-hidden"
      data-testid="add-claim-items-picker"
    >
      <_DataTable
        table={table}
        columns={columns}
        pageSize={PAGE_SIZE}
        count={queriedItems.length}
        filters={filters}
        pagination
        layout="fill"
        search
        orderBy={[
          { key: "product_title", label: t("fields.product") },
          { key: "variant_title", label: t("fields.variant") },
          { key: "sku", label: t("fields.sku") },
          {
            key: "returnable_quantity",
            label: t("orders.fields.returnableQuantity"),
          },
          {
            key: "refundable_amount",
            label: t("orders.fields.refundableAmount"),
          },
        ]}
        prefix={PREFIX}
        queryObject={raw}
      />
    </div>
  )
}

type SortableValue = string | number | null | undefined

const sortItems = (
  items: AdminOrderLineItem[],
  field: string,
  direction: "asc" | "desc"
) => {
  return [...items].sort((a, b) => {
    let aValue: SortableValue
    let bValue: SortableValue

    if (field === "product_title") {
      aValue = a.product_title
      bValue = b.product_title
    } else if (field === "variant_title") {
      aValue = a.variant_title
      bValue = b.variant_title
    } else if (field === "sku") {
      aValue = a.variant_sku
      bValue = b.variant_sku
    } else if (field === "returnable_quantity") {
      aValue = getReturnableQuantity(a)
      bValue = getReturnableQuantity(b)
    } else if (field === "refundable_amount") {
      aValue =
        (a as AdminOrderLineItem & { refundable_total?: number })
          .refundable_total ?? 0
      bValue =
        (b as AdminOrderLineItem & { refundable_total?: number })
          .refundable_total ?? 0
    }

    if (aValue === undefined || aValue === null) return 1
    if (bValue === undefined || bValue === null) return -1

    if (aValue < bValue) {
      return direction === "asc" ? -1 : 1
    }
    if (aValue > bValue) {
      return direction === "asc" ? 1 : -1
    }
    return 0
  })
}

const filterByDate = (
  items: AdminOrderLineItem[],
  date: DateComparisonOperator,
  field: "created_at" | "updated_at"
) => {
  const { gt, gte, lt, lte } = date

  return items.filter((i) => {
    const itemDate = new Date(i[field])
    let isValid = true

    if (gt) {
      isValid = isValid && itemDate > new Date(gt)
    }

    if (gte) {
      isValid = isValid && itemDate >= new Date(gte)
    }

    if (lt) {
      isValid = isValid && itemDate < new Date(lt)
    }

    if (lte) {
      isValid = isValid && itemDate <= new Date(lte)
    }

    return isValid
  })
}

const defaultOperators: NumericalComparisonOperator = {
  eq: undefined,
  gt: undefined,
  gte: undefined,
  lt: undefined,
  lte: undefined,
}

const filterByNumber = (
  items: AdminOrderLineItem[],
  value: NumericalComparisonOperator | number,
  field: "returnable_quantity" | "refundable_amount",
  currency_code: string
) => {
  const { eq, gt, lt, gte, lte } =
    typeof value === "object"
      ? { ...defaultOperators, ...value }
      : { ...defaultOperators, eq: value }

  return items.filter((i) => {
    const returnableQuantity = getReturnableQuantity(i)
    const refundableAmount = getStylizedAmount(
      (i as AdminOrderLineItem & { refundable_total?: number })
        .refundable_total ?? 0,
      currency_code
    )

    const itemValue =
      field === "returnable_quantity" ? returnableQuantity : refundableAmount

    if (eq !== undefined) {
      return itemValue === eq
    }

    let isValid = true

    if (gt !== undefined) {
      isValid = isValid && Number(itemValue) > gt
    }

    if (gte !== undefined) {
      isValid = isValid && Number(itemValue) >= gte
    }

    if (lt !== undefined) {
      isValid = isValid && Number(itemValue) < lt
    }

    if (lte !== undefined) {
      isValid = isValid && Number(itemValue) <= lte
    }

    return isValid
  })
}
