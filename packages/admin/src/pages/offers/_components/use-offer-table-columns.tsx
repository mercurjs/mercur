import { Checkbox, Text } from "@medusajs/ui"
import { createColumnHelper } from "@tanstack/react-table"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { OfferDTO, ProductStatus } from "@mercurjs/types"

import { PlaceholderCell } from "../../../components/table/table-cells/common/placeholder-cell"
import {
  CategoryCell,
  CategoryHeader,
} from "../../../components/table/table-cells/product/category-cell/category-cell"
import {
  ProductCell,
  ProductHeader,
} from "../../../components/table/table-cells/product/product-cell"
import {
  ProductStatusCell,
  ProductStatusHeader,
} from "../../../components/table/table-cells/product/product-status-cell"
import { OfferActions } from "./offer-actions"

const columnHelper = createColumnHelper<OfferDTO>()

export const useOfferTableColumns = (options?: {
  hideStoreAction?: boolean
}) => {
  const { t } = useTranslation()
  const hideStoreAction = options?.hideStoreAction ?? false

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
        id: "product",
        header: () => <ProductHeader />,
        cell: ({ row }) => (
          <ProductCell
            product={{
              title: row.original.product?.title ?? "",
              thumbnail: row.original.product?.thumbnail ?? null,
            }}
          />
        ),
      }),
      ...(hideStoreAction
        ? []
        : [
            columnHelper.display({
              id: "store",
              header: t("offers.fields.store"),
              cell: ({ row }) => {
                const name = row.original.seller?.name
                if (!name) return <PlaceholderCell />
                return (
                  <Text size="small" leading="compact" className="truncate">
                    {name}
                  </Text>
                )
              },
            }),
          ]),
      columnHelper.display({
        id: "categories",
        header: () => <CategoryHeader />,
        cell: ({ row }) => (
          <CategoryCell
            categories={(row.original.product?.categories ?? undefined) as never}
          />
        ),
      }),
      columnHelper.display({
        id: "collection",
        header: t("fields.collection"),
        cell: ({ row }) => {
          const collection = row.original.product?.collection
          if (!collection?.title) return <PlaceholderCell />
          return (
            <Text size="small" leading="compact" className="truncate">
              {collection.title}
            </Text>
          )
        },
      }),
      columnHelper.display({
        id: "variants",
        header: () => (
          <div className="flex h-full w-full items-center">
            <span>{t("fields.variants")}</span>
          </div>
        ),
        cell: ({ row }) => {
          const count = row.original.variant_count
          if (!count) return <PlaceholderCell />
          return (
            <Text size="small" leading="compact" className="truncate">
              {t("products.variantCount", { count })}
            </Text>
          )
        },
      }),
      columnHelper.display({
        id: "status",
        header: () => <ProductStatusHeader />,
        cell: ({ row }) => {
          const status = row.original.product?.status
          if (!status) return <PlaceholderCell />
          return <ProductStatusCell status={status as ProductStatus} />
        },
      }),
      columnHelper.display({
        id: "actions",
        cell: ({ row }) => (
          <OfferActions
            product={{
              id: row.original.product_id,
              offerIds:
                row.original.offer_ids?.length
                  ? row.original.offer_ids
                  : [row.original.id],
              sellerId: hideStoreAction ? null : row.original.seller_id ?? null,
              storeName: row.original.seller?.name ?? null,
            }}
          />
        ),
      }),
    ],
    [t, hideStoreAction],
  )
}
