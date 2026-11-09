import { Checkbox, Text } from "@medusajs/ui"
import { createColumnHelper } from "@tanstack/react-table"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"

import { Thumbnail } from "@components/common/thumbnail"
import { PlaceholderCell } from "@components/table/table-cells/common/placeholder-cell"
import { CategoryCell } from "@components/table/table-cells/product/category-cell/category-cell"

export type OfferPickerRow = {
  id: string
  sku?: string | null
  variant_id?: string | null
  created_at?: string | null
  updated_at?: string | null
  product_variant?: {
    id?: string | null
    title?: string | null
    product?: {
      title?: string | null
      thumbnail?: string | null
      categories?: { id: string; name: string }[] | null
      collection?: { title?: string | null } | null
    } | null
  } | null
}

const columnHelper = createColumnHelper<OfferPickerRow>()

const TextCell = ({ value }: { value?: string | null }) => {
  if (!value) {
    return <PlaceholderCell />
  }

  return (
    <Text size="small" leading="compact" className="truncate" title={value}>
      {value}
    </Text>
  )
}

export const useOrderEditItemsTableColumns = () => {
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
        cell: ({ row }) => (
          <Checkbox
            disabled={!row.getCanSelect()}
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            onClick={(e) => {
              e.stopPropagation()
            }}
          />
        ),
      }),
      columnHelper.display({
        id: "offer",
        header: t("fields.offer"),
        cell: ({ row }) => {
          const product = row.original.product_variant?.product
          if (!product?.title) {
            return <PlaceholderCell />
          }

          return (
            <div className="flex h-full w-full max-w-[300px] items-center gap-x-3 overflow-hidden">
              <Thumbnail src={product.thumbnail} />
              <TextCell value={product.title} />
            </div>
          )
        },
      }),
      columnHelper.display({
        id: "variant_title",
        header: t("fields.variantTitle"),
        cell: ({ row }) => (
          <TextCell value={row.original.product_variant?.title} />
        ),
      }),
      columnHelper.accessor("sku", {
        header: t("fields.sku"),
        cell: ({ getValue }) => <TextCell value={getValue()} />,
      }),
      columnHelper.display({
        id: "category",
        header: t("fields.category"),
        cell: ({ row }) => (
          <CategoryCell
            categories={row.original.product_variant?.product?.categories}
          />
        ),
      }),
      columnHelper.display({
        id: "collection",
        header: t("fields.collection"),
        cell: ({ row }) => (
          <TextCell
            value={row.original.product_variant?.product?.collection?.title}
          />
        ),
      }),
    ],
    [t]
  )
}
