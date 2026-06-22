import { Checkbox, Text } from "@medusajs/ui"
import { createColumnHelper } from "@tanstack/react-table"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"

import { Thumbnail } from "@components/common/thumbnail"
import { PlaceholderCell } from "@components/table/table-cells/common/placeholder-cell"

/**
 * Row shape for the return-items picker. The picker now sources from the
 * **order's own line items** (not the seller's offer catalog) because a
 * return can only ever target items the customer actually purchased.
 * `id` here is the order line item id and is what the
 * `POST /vendor/returns/:id/request-items` route's validator expects.
 */
export type ReturnItemPickerRow = {
  id: string
  title?: string | null
  product_title?: string | null
  variant_sku?: string | null
  variant_title?: string | null
  thumbnail?: string | null
  remainingQuantity: number
}

const columnHelper = createColumnHelper<ReturnItemPickerRow>()

export const useReturnItemTableColumns = () => {
  const { t } = useTranslation()

  return useMemo(
    () => [
      columnHelper.display({
        id: "select",
        header: ({ table }) => (
          <Checkbox
            checked={
              table.getIsSomePageRowsSelected()
                ? "indeterminate"
                : table.getIsAllPageRowsSelected()
            }
            onCheckedChange={(value) =>
              table.toggleAllPageRowsSelected(!!value)
            }
          />
        ),
        cell: ({ row }) => {
          const isSelectable = row.getCanSelect()

          return (
            <Checkbox
              disabled={!isSelectable}
              checked={row.getIsSelected()}
              onCheckedChange={(value) => row.toggleSelected(!!value)}
              onClick={(e) => {
                e.stopPropagation()
              }}
            />
          )
        },
      }),
      columnHelper.display({
        id: "product",
        header: t("fields.product"),
        cell: ({ row }) => {
          const title = row.original.product_title ?? row.original.title
          if (!title) {
            return <PlaceholderCell />
          }
          return (
            <div className="flex h-full w-full max-w-[300px] items-center gap-x-3 overflow-hidden">
              <Thumbnail src={row.original.thumbnail} />
              <Text
                size="small"
                leading="compact"
                className="truncate"
                title={title}
              >
                {title}
              </Text>
            </div>
          )
        },
      }),
      columnHelper.accessor("variant_sku", {
        header: t("fields.sku"),
        cell: ({ getValue }) => {
          const sku = getValue()
          if (!sku) return <PlaceholderCell />
          return (
            <Text size="small" leading="compact" className="truncate">
              {sku}
            </Text>
          )
        },
      }),
      columnHelper.display({
        id: "variant_title",
        header: t("fields.title"),
        cell: ({ row }) => {
          const title = row.original.variant_title
          if (!title) return <PlaceholderCell />
          return (
            <Text size="small" leading="compact" className="truncate">
              {title}
            </Text>
          )
        },
      }),
      columnHelper.accessor("remainingQuantity", {
        header: t("orders.returns.remainingQuantity", {
          defaultValue: "Remaining",
        }),
        cell: ({ getValue }) => (
          <Text size="small" leading="compact" className="tabular-nums">
            {getValue()}
          </Text>
        ),
      }),
    ],
    [t]
  )
}
