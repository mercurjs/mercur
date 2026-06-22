import { Checkbox, Text } from "@medusajs/ui"
import { createColumnHelper } from "@tanstack/react-table"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { SellerDTO } from "@mercurjs/types"

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
import { ProductStatus } from "@mercurjs/types"
import { OfferProduct } from "../common/types"
import { OfferActions } from "./offer-actions"

/**
 * A row on the product-backed admin Offers list (SPEC-010): a product
 * with every seller's offers wrapped under each variant. Row identity is
 * the product; `variants[].offers[]` drive the offered-variant count, the
 * single-store "Open store" action, and the product-level delete.
 */
const columnHelper = createColumnHelper<OfferProduct>()

const countOfferedVariants = (row: OfferProduct) =>
  (row.variants ?? []).filter((v) => (v.offers?.length ?? 0) > 0).length

/** All offer ids across the product's offered variants (every seller). */
export const collectOfferIds = (row: OfferProduct) =>
  (row.variants ?? []).flatMap((v) => (v.offers ?? []).map((o) => o.id))

/** Distinct stores (sellers) that offer this product. */
const collectOfferSellers = (row: OfferProduct): SellerDTO[] => {
  const seen = new Map<string, SellerDTO>()
  for (const variant of row.variants ?? []) {
    for (const offer of variant.offers ?? []) {
      const seller = offer.seller
      if (seller?.id && !seen.has(seller.id)) {
        seen.set(seller.id, seller as SellerDTO)
      }
    }
  }
  return Array.from(seen.values())
}

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
        id: "product",
        header: () => <ProductHeader />,
        cell: ({ row }) => (
          <ProductCell
            product={{
              title: row.original.title ?? "",
              thumbnail: row.original.thumbnail ?? null,
            }}
          />
        ),
      }),
      columnHelper.display({
        id: "categories",
        header: () => <CategoryHeader />,
        cell: ({ row }) => (
          <CategoryCell
            categories={(row.original.categories ?? undefined) as never}
          />
        ),
      }),
      columnHelper.display({
        id: "collection",
        header: t("fields.collection"),
        cell: ({ row }) => {
          const collection = row.original.collection
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
        header: t("offers.fields.variants"),
        cell: ({ row }) => (
          <Text size="small" leading="compact" className="truncate">
            {t("offers.fields.variantsCount", {
              count: countOfferedVariants(row.original),
            })}
          </Text>
        ),
      }),
      columnHelper.display({
        id: "status",
        header: () => <ProductStatusHeader />,
        cell: ({ row }) => {
          const status = row.original.status
          if (!status) return <PlaceholderCell />
          return <ProductStatusCell status={status as ProductStatus} />
        },
      }),
      columnHelper.display({
        id: "actions",
        cell: ({ row }) => {
          const sellers = collectOfferSellers(row.original)
          return (
            <OfferActions
              product={{
                id: row.original.id,
                offerIds: collectOfferIds(row.original),
                sellerId: sellers.length === 1 ? sellers[0].id ?? null : null,
              }}
            />
          )
        },
      }),
    ],
    [t],
  )
}
