import { Text } from "@medusajs/ui"
import { createColumnHelper } from "@tanstack/react-table"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"

import {
  CategoryCell,
  CategoryHeader,
} from "../../../components/table/table-cells/product/category-cell"
import {
  ProductCell,
  ProductHeader,
} from "../../../components/table/table-cells/product/product-cell"
import {
  ProductStatusCell,
  ProductStatusHeader,
} from "../../../components/table/table-cells/product/product-status-cell"
import { PlaceholderCell } from "../../../components/table/table-cells/common/placeholder-cell"
import { ProductStatus } from "@mercurjs/types"
import { OfferActions } from "./offer-actions"

/**
 * A row on the product-backed Offers list: a product with the active
 * seller's offers wrapped under each variant. The list collapses the
 * seller's offers by product (SPEC-009), so the row identity is the
 * product; `variants[].offers[]` drives the offered-variant count and
 * the product-level delete.
 */
export type OfferProductRow = {
  id: string
  title?: string | null
  thumbnail?: string | null
  status?: string | null
  collection?: { id?: string | null; title?: string | null } | null
  categories?: Array<{ id: string; name: string }> | null
  variants?: Array<{
    id?: string | null
    offers?: Array<{ id: string }> | null
  }> | null
}

const columnHelper = createColumnHelper<OfferProductRow>()

const countOfferedVariants = (row: OfferProductRow) =>
  (row.variants ?? []).filter((v) => (v.offers?.length ?? 0) > 0).length

export const collectOfferIds = (row: OfferProductRow) =>
  (row.variants ?? []).flatMap((v) => (v.offers ?? []).map((o) => o.id))

export const useOfferTableColumns = () => {
  const { t } = useTranslation()

  return useMemo(
    () => [
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
          <CategoryCell categories={row.original.categories} />
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
        cell: ({ row }) => (
          <OfferActions
            product={{
              id: row.original.id,
              title: row.original.title ?? "",
              offerIds: collectOfferIds(row.original),
            }}
          />
        ),
      }),
    ],
    [t],
  )
}
