import { Checkbox, StatusBadge, Text } from "@medusajs/ui"
import { createColumnHelper } from "@tanstack/react-table"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"

import { Thumbnail } from "../../../components/common/thumbnail"
import { PlaceholderCell } from "../../../components/table/table-cells/common/placeholder-cell"
import { getLocaleAmount } from "../../../lib/money-amount-helpers"
import {
  computeEffectiveStock,
  getStockStatus,
  getStockStatusColor,
  OfferStockShape,
} from "../common/utils"
import { OfferActions } from "./offer-actions"

export type OfferTableRow = OfferStockShape & {
  id: string
  sku?: string | null
  updated_at?: string | null
  product_variant?: {
    id?: string | null
    title?: string | null
    sku?: string | null
    product?: {
      title?: string | null
      thumbnail?: string | null
    } | null
  } | null
  shipping_profile?: {
    name?: string | null
    type?: string | null
  } | null
  price_set?: {
    prices?: {
      amount: number
      currency_code: string
      min_quantity?: number | null
      max_quantity?: number | null
      rules_count?: number | null
    }[] | null
  } | null
}

const columnHelper = createColumnHelper<OfferTableRow>()

const formatRelative = (iso?: string | null) => {
  if (!iso) return null
  try {
    const date = new Date(iso)
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: "medium",
    }).format(date)
  } catch {
    return null
  }
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
        id: "variant",
        header: t("offers.fields.variant"),
        cell: ({ row }) => {
          const variant = row.original.product_variant
          const productTitle = variant?.product?.title
          const variantTitle = variant?.title

          if (!productTitle && !variantTitle) {
            return <PlaceholderCell />
          }

          return (
            <div className="flex items-center gap-x-3 overflow-hidden">
              <Thumbnail src={variant?.product?.thumbnail ?? null} />
              <div className="flex flex-col overflow-hidden">
                <Text
                  size="small"
                  weight="plus"
                  leading="compact"
                  className="truncate"
                >
                  {productTitle ?? variantTitle}
                </Text>
                {productTitle && variantTitle && (
                  <Text
                    size="xsmall"
                    leading="compact"
                    className="text-ui-fg-subtle truncate"
                  >
                    {variantTitle}
                  </Text>
                )}
              </div>
            </div>
          )
        },
      }),
      columnHelper.accessor("sku", {
        header: t("offers.fields.sku"),
        cell: ({ getValue }) => {
          const sku = getValue()
          if (!sku) return <PlaceholderCell />
          return (
            <div className="flex items-center overflow-hidden">
              <span className="font-mono truncate text-xs">{sku}</span>
            </div>
          )
        },
      }),
      columnHelper.display({
        id: "price",
        header: t("fields.price"),
        cell: ({ row }) => {
          const prices = row.original.price_set?.prices ?? []
          if (prices.length === 0) return <PlaceholderCell />

          const cheapest = [...prices].sort((a, b) => a.amount - b.amount)[0]

          return (
            <span className="truncate">
              {getLocaleAmount(cheapest.amount, cheapest.currency_code)}
            </span>
          )
        },
      }),
      columnHelper.display({
        id: "stock",
        header: t("offers.fields.stockStatus"),
        cell: ({ row }) => {
          const status = getStockStatus(row.original)
          const available = computeEffectiveStock(row.original)
          return (
            <div className="flex items-center gap-x-2 overflow-hidden">
              <StatusBadge color={getStockStatusColor(status)}>
                {t(`offers.stockStatus.${status}`)}
              </StatusBadge>
              <Text size="small" className="text-ui-fg-subtle">
                {available}
              </Text>
            </div>
          )
        },
      }),
      columnHelper.display({
        id: "shipping_profile",
        header: t("offers.fields.shippingProfile"),
        cell: ({ row }) => {
          const profile = row.original.shipping_profile
          if (!profile?.name) return <PlaceholderCell />
          return (
            <div className="flex flex-col overflow-hidden">
              <Text size="small" leading="compact" className="truncate">
                {profile.name}
              </Text>
              {profile.type && (
                <Text
                  size="xsmall"
                  leading="compact"
                  className="text-ui-fg-subtle truncate"
                >
                  {profile.type}
                </Text>
              )}
            </div>
          )
        },
      }),
      columnHelper.accessor("updated_at", {
        header: t("fields.updatedAt"),
        cell: ({ getValue }) => {
          const formatted = formatRelative(getValue())
          if (!formatted) return <PlaceholderCell />
          return (
            <Text size="small" className="text-ui-fg-subtle">
              {formatted}
            </Text>
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
    [t],
  )
}
