import { Buildings } from "@medusajs/icons"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { createDataGridHelper } from "../../../../components/data-grid"
import { DataGridReadOnlyCell } from "../../../../components/data-grid/components"
import { DataGridTogglableNumberCell } from "../../../../components/data-grid/components/data-grid-toggleable-number-cell"
import { ForeignLocationCell } from "../components/foreign-location-cell"
import { InventoryStockSchema } from "../schema"
import {
  StockGridItem,
  StockGridLocation,
  getOfferTitle,
  isForeignLocation,
} from "../utils"

const helper = createDataGridHelper<StockGridItem, InventoryStockSchema>()

export const useInventoryStockColumns = (
  locations: StockGridLocation[] = []
) => {
  const { t } = useTranslation()

  return useMemo(
    () => [
      helper.column({
        id: "title",
        name: t("fields.title"),
        header: t("fields.title"),
        cell: (context) => {
          const item = context.row.original
          return (
            <DataGridReadOnlyCell context={context} color="normal">
              <span title={item.title || undefined}>{item.title || "-"}</span>
            </DataGridReadOnlyCell>
          )
        },
        disableHiding: true,
      }),
      helper.column({
        id: "sku",
        name: t("fields.sku"),
        header: t("fields.sku"),
        cell: (context) => {
          const item = context.row.original

          return (
            <DataGridReadOnlyCell context={context} color="normal">
              <span title={item.sku || undefined}>{item.sku || "-"}</span>
            </DataGridReadOnlyCell>
          )
        },
        disableHiding: true,
      }),
      helper.column({
        id: "offer",
        name: t("fields.offer"),
        header: t("fields.offer"),
        cell: (context) => {
          const offerTitle = getOfferTitle(context.row.original)

          return (
            <DataGridReadOnlyCell context={context} color="normal">
              <span title={offerTitle}>{offerTitle || "-"}</span>
            </DataGridReadOnlyCell>
          )
        },
        disableHiding: true,
      }),
      ...locations.map((location) =>
        helper.column({
          id: `location_${location.id}`,
          name: location.name,
          header: () => (
            <div className="flex w-full items-center justify-between gap-x-2">
              <span className="truncate">{location.name}</span>
              <Buildings className="text-ui-fg-subtle shrink-0" />
            </div>
          ),
          field: (context) => {
            const item = context.row.original

            return `inventory_items.${item.id}.locations.${location.id}` as const
          },
          type: "togglable-number",
          cell: (context) => {
            if (isForeignLocation(context.row.original, location)) {
              return <ForeignLocationCell context={context} />
            }

            return (
              <DataGridTogglableNumberCell
                context={context}
                placeholder={t("inventory.stock.placeholder")}
                disabledToggleTooltip={t(
                  "inventory.stock.disabledToggleTooltip"
                )}
              />
            )
          },
        })
      ),
    ],
    [locations, t]
  )
}
