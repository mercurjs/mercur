import { Checkbox, Text } from "@medusajs/ui"
import { createColumnHelper } from "@tanstack/react-table"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"

import { Thumbnail } from "../../../components/common/thumbnail"
import { PlaceholderCell } from "../../../components/table/table-cells/common/placeholder-cell"
import {
  CategoryCell,
  CategoryHeader,
} from "../../../components/table/table-cells/product/category-cell/category-cell"
import {
  ProductStatusCell,
  ProductStatusHeader,
} from "../../../components/table/table-cells/product/product-status-cell"
import { ProductStatus } from "@mercurjs/types"
import { OfferActions } from "./offer-actions"

export type OfferTableRow = {
  id: string
  sku?: string | null
  updated_at?: string | null
  deleted_at?: string | null
  seller_id?: string | null
  product_variant?: {
    id?: string | null
    title?: string | null
    product_id?: string | null
    product?: {
      id?: string | null
      title?: string | null
      thumbnail?: string | null
      status?: string | null
      categories?: Array<{
        id: string
        name: string
      }> | null
    } | null
  } | null
  shipping_profile?: {
    id?: string | null
    name?: string | null
  } | null
  seller?: {
    id?: string | null
    name?: string | null
    handle?: string | null
  } | null
}

const columnHelper = createColumnHelper<OfferTableRow>()

export const useOfferTableColumns = () => {
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
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            onClick={(e) => e.stopPropagation()}
          />
        ),
      }),
      columnHelper.display({
        id: "title",
        header: t("fields.title"),
        cell: ({ row }) => {
          const variant = row.original.product_variant
          const title = variant?.title ?? ""

          if (!title) {
            return <PlaceholderCell />
          }

          return (
            <div className="flex h-full w-full max-w-[250px] items-center gap-x-3 overflow-hidden">
              <div className="w-fit flex-shrink-0">
                <Thumbnail src={variant?.product?.thumbnail} />
              </div>
              <span title={variant?.product?.title ?? ""} className="truncate">
                {variant?.title}
              </span>
            </div>
          )
        },
      }),
      columnHelper.display({
        id: "categories",
        header: () => <CategoryHeader />,
        cell: ({ row }) => (
          <CategoryCell
            categories={
              (row.original.product_variant?.product?.categories ??
                undefined) as never
            }
          />
        ),
      }),
      columnHelper.accessor("sku", {
        header: t("offers.fields.sku"),
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
        id: "shipping_profile",
        header: t("shippingProfile.domain"),
        cell: ({ row }) => {
          const name = row.original.shipping_profile?.name
          if (!name) return <PlaceholderCell />
          return (
            <Text size="small" leading="compact" className="truncate">
              {name}
            </Text>
          )
        },
      }),
      columnHelper.display({
        id: "status",
        header: () => <ProductStatusHeader />,
        cell: ({ row }) => {
          const status = row.original.product_variant?.product?.status
          if (!status) return <PlaceholderCell />
          return <ProductStatusCell status={status as ProductStatus} />
        },
      }),
      columnHelper.display({
        id: "actions",
        cell: ({ row }) => (
          <OfferActions
            offer={{
              id: row.original.id,
              sellerId: row.original.seller?.id ?? row.original.seller_id ?? null,
            }}
          />
        ),
      }),
    ],
    [t],
  )
}
