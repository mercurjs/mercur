import { Checkbox, Text } from "@medusajs/ui"
import { createColumnHelper } from "@tanstack/react-table"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"

import { Thumbnail } from "@components/common/thumbnail"
import { PlaceholderCell } from "@components/table/table-cells/common/placeholder-cell"

/**
 * Row shape coming from `sdk.vendor.offers.query` (subset).
 * Mirrors the order-edit picker so the same backend fields feed
 * both surfaces.
 */
export type OfferPickerRow = {
  id: string
  sku?: string | null
  variant_id?: string | null
  product_variant?: {
    id?: string | null
    title?: string | null
    product?: {
      title?: string | null
      thumbnail?: string | null
    } | null
  } | null
}

const columnHelper = createColumnHelper<OfferPickerRow>()

export const useClaimOutboundItemTableColumns = () => {
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
          const variant = row.original.product_variant
          const productTitle = variant?.product?.title
          if (!productTitle) {
            return <PlaceholderCell />
          }
          return (
            <div className="flex h-full w-full max-w-[300px] items-center gap-x-3 overflow-hidden">
              <Thumbnail src={variant?.product?.thumbnail} />
              <Text
                size="small"
                leading="compact"
                className="truncate"
                title={productTitle}
              >
                {productTitle}
              </Text>
            </div>
          )
        },
      }),
      columnHelper.accessor("sku", {
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
          const title = row.original.product_variant?.title
          if (!title) return <PlaceholderCell />
          return (
            <Text size="small" leading="compact" className="truncate">
              {title}
            </Text>
          )
        },
      }),
    ],
    [t]
  )
}
