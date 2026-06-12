import { Buildings, CurrencyDollar } from "@medusajs/icons"
import {
  Badge,
  Container,
  createDataTableColumnHelper,
  Heading,
  Text,
} from "@medusajs/ui"
import { OfferDTO } from "@mercurjs/types"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"

import { ActionMenu } from "../../../../components/common/action-menu"
import { DataTable } from "../../../../components/data-table"
import { OfferProductVariant } from "../../common/types"

const PAGE_SIZE = 50

/** The wrap attaches per-location stock under the offer's inventory link. */
type OfferWithInventory = OfferDTO & {
  inventory_item_link?: Array<{
    inventory_item?: {
      location_levels?: Array<{
        location_id?: string | null
        stocked_quantity?: number | null
      }> | null
    } | null
  }> | null
}

/** One row per offer, carrying its parent variant for the shared columns. */
type OfferVariantRow = {
  offerId: string
  variant: OfferProductVariant
  offer: OfferWithInventory
}

const inventoryOf = (offer: OfferWithInventory) => {
  const links = offer.inventory_item_link ?? []
  let available = 0
  const locations = new Set<string>()
  for (const link of links) {
    for (const level of link.inventory_item?.location_levels ?? []) {
      available += level.stocked_quantity ?? 0
      if (level.location_id) {
        locations.add(level.location_id)
      }
    }
  }
  return { hasItems: links.length > 0, available, locationCount: locations.size }
}

const columnHelper = createDataTableColumnHelper<OfferVariantRow>()

const useColumns = (optionTitles: string[]) => {
  const { t } = useTranslation()

  return useMemo(
    () => [
      columnHelper.display({
        id: "title",
        header: t("fields.title"),
        cell: ({ row }) => row.original.variant.title ?? "-",
      }),
      columnHelper.display({
        id: "sku",
        header: t("fields.sku"),
        cell: ({ row }) => {
          const sku = row.original.offer.sku ?? row.original.variant.sku
          return sku ? sku : <span className="text-ui-fg-muted">-</span>
        },
      }),
      ...optionTitles.map((title) =>
        columnHelper.display({
          id: `option-${title}`,
          header: title,
          cell: ({ row }) => {
            const opt = row.original.variant.options?.find(
              (o) => o.option?.title === title,
            )
            return opt?.value ? (
              <Badge size="2xsmall">{opt.value}</Badge>
            ) : (
              <span className="text-ui-fg-muted">-</span>
            )
          },
        }),
      ),
      columnHelper.display({
        id: "inventory",
        header: t("fields.inventory"),
        cell: ({ row }) => {
          const { hasItems, available, locationCount } = inventoryOf(
            row.original.offer,
          )
          if (!hasItems) {
            return <span className="text-ui-fg-muted">-</span>
          }
          return (
            <Text size="small" leading="compact">
              {t("products.variant.tableItem", {
                availableCount: available,
                locationCount,
                count: locationCount,
              })}
            </Text>
          )
        },
      }),
    ],
    [t, optionTitles],
  )
}

/**
 * Variants table of the product-shaped offer detail (Figma
 * `40016500:747473`). Mirrors the product detail's variants table
 * (Title / SKU / per-option columns / Inventory), but is offer-scoped:
 * one row per offer, navigating to the offer-keyed variant detail
 * `variants/:offer_id`.
 */
export const OfferVariantsSection = ({
  variants,
}: {
  variants?: OfferProductVariant[] | null
}) => {
  const { t } = useTranslation()

  const rows: OfferVariantRow[] = useMemo(
    () =>
      (variants ?? []).flatMap((variant) =>
        (variant.offers ?? []).map((offer) => ({
          offerId: offer.id,
          variant,
          offer: offer as OfferWithInventory,
        })),
      ),
    [variants],
  )

  const optionTitles = useMemo(() => {
    const set = new Set<string>()
    for (const variant of variants ?? []) {
      for (const opt of variant.options ?? []) {
        if (opt.option?.title) {
          set.add(opt.option.title)
        }
      }
    }
    return Array.from(set)
  }, [variants])

  const columns = useColumns(optionTitles)

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h2">{t("offers.fields.variants")}</Heading>
        <div className="flex items-center gap-x-4">
          <Text size="small" className="text-ui-fg-subtle">
            {t("offers.fields.variantsCount", { count: rows.length })}
          </Text>
          <ActionMenu
            groups={[
              {
                actions: [
                  {
                    label: t("offers.actions.edit_prices"),
                    icon: <CurrencyDollar />,
                    to: "edit-price",
                  },
                  {
                    label: t("offers.actions.edit_stock_levels"),
                    icon: <Buildings />,
                    to: "edit-stock",
                  },
                ],
              },
            ]}
          />
        </div>
      </div>
      <DataTable
        data={rows}
        columns={columns}
        getRowId={(row) => row.offerId}
        rowHref={(row) => `variants/${row.offerId}`}
        rowCount={rows.length}
        pageSize={PAGE_SIZE}
        compact
        emptyState={{
          empty: {
            heading: t("offers.empty.heading"),
            description: t("offers.empty.description"),
          },
        }}
      />
    </Container>
  )
}
