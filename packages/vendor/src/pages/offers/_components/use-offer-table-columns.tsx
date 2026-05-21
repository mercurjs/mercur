import { Checkbox, StatusBadge, Text } from "@medusajs/ui"
import { createColumnHelper } from "@tanstack/react-table"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"

import { Thumbnail } from "../../../components/common/thumbnail"
import { PlaceholderCell } from "../../../components/table/table-cells/common/placeholder-cell"
import { OfferActions } from "./offer-actions"

export type OfferTableRow = {
  id: string
  sku?: string | null
  updated_at?: string | null
  deleted_at?: string | null
  product_variant?: {
    id?: string | null
    title?: string | null
    sku?: string | null
    product_id?: string | null
    product?: {
      id?: string | null
      title?: string | null
      thumbnail?: string | null
      status?: string | null
      categories?: { id?: string | null; name?: string | null }[] | null
      collection?: { id?: string | null; title?: string | null } | null
    } | null
  } | null
}

const columnHelper = createColumnHelper<OfferTableRow>()

const isPublished = (row: OfferTableRow) =>
  row.product_variant?.product?.status === "published" && !row.deleted_at

export const useOfferTableColumns = (
  variantsCountByProduct?: Record<string, number>,
) => {
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
            onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
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
        id: "offer",
        header: t("offers.fields.offer"),
        cell: ({ row }) => {
          const variant = row.original.product_variant
          const productTitle = variant?.product?.title
          const variantTitle = variant?.title
          const title = productTitle ?? variantTitle

          if (!title) {
            return <PlaceholderCell />
          }

          return (
            <div className="flex items-center gap-x-3 overflow-hidden">
              <Thumbnail src={variant?.product?.thumbnail ?? null} />
              <Text
                size="small"
                weight="plus"
                leading="compact"
                className="truncate"
              >
                {title}
              </Text>
            </div>
          )
        },
      }),
      columnHelper.display({
        id: "category",
        header: t("offers.fields.category"),
        cell: ({ row }) => {
          const name = row.original.product_variant?.product?.categories?.[0]?.name
          if (!name) return <PlaceholderCell />
          return (
            <Text size="small" leading="compact" className="truncate">
              {name}
            </Text>
          )
        },
      }),
      columnHelper.display({
        id: "collection",
        header: t("offers.fields.collection"),
        cell: ({ row }) => {
          const title = row.original.product_variant?.product?.collection?.title
          if (!title) return <PlaceholderCell />
          return (
            <Text size="small" leading="compact" className="truncate">
              {title}
            </Text>
          )
        },
      }),
      columnHelper.display({
        id: "variants",
        header: t("offers.fields.variants"),
        cell: ({ row }) => {
          const productId = row.original.product_variant?.product_id
          const count = productId ? variantsCountByProduct?.[productId] ?? 1 : 1
          return (
            <Text size="small" leading="compact" className="truncate">
              {t("offers.fields.variantsCount", { count })}
            </Text>
          )
        },
      }),
      columnHelper.display({
        id: "status",
        header: t("offers.fields.status"),
        cell: ({ row }) => {
          const status = row.original.product_variant?.product?.status
          const published = isPublished(row.original)

          if (published) {
            return (
              <StatusBadge color="green">{t("offers.status.published")}</StatusBadge>
            )
          }

          if (!status) return <PlaceholderCell />

          return (
            <StatusBadge color="grey">
              {t(`offers.status.${status}`, { defaultValue: status })}
            </StatusBadge>
          )
        },
      }),
      columnHelper.display({
        id: "actions",
        cell: ({ row }) => (
          <OfferActions
            offer={{
              id: row.original.id,
              sku: row.original.sku ?? "",
            }}
          />
        ),
      }),
    ],
    [t, variantsCountByProduct],
  )
}
