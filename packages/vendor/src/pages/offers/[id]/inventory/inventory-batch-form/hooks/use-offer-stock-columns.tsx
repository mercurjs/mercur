import { HttpTypes } from "@medusajs/types"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"

import { Thumbnail } from "../../../../../../components/common/thumbnail"
import { createDataGridHelper } from "../../../../../../components/data-grid"
import { DataGridReadOnlyCell } from "../../../../../../components/data-grid/components"
import { DataGridTogglableNumberCell } from "../../../../../../components/data-grid/components/data-grid-toggleable-number-cell"
import { OfferStockFormValues } from "../schema"
import { OfferInventoryItemRow } from "../types"

const helper = createDataGridHelper<OfferInventoryItemRow, OfferStockFormValues>()

export const useOfferStockColumns = (
  locations: HttpTypes.AdminStockLocation[] = [],
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
              <div className="flex items-center gap-x-2 overflow-hidden">
                <Thumbnail src={item.thumbnail ?? null} />
                <span className="truncate" title={item.title ?? ""}>
                  {item.title || "-"}
                </span>
              </div>
            </DataGridReadOnlyCell>
          )
        },
        disableHiding: true,
      }),
      helper.column({
        id: "sku",
        name: t("offers.fields.sku"),
        header: t("offers.fields.sku"),
        cell: (context) => {
          const item = context.row.original
          return (
            <DataGridReadOnlyCell context={context} color="normal">
              {item.sku || "-"}
            </DataGridReadOnlyCell>
          )
        },
        disableHiding: true,
      }),
      ...locations.map((location) =>
        helper.column({
          id: `location_${location.id}`,
          name: location.name,
          header: location.name,
          field: (context) =>
            `inventory_items.${context.row.original.id}.locations.${location.id}` as const,
          type: "togglable-number",
          cell: (context) => (
            <DataGridTogglableNumberCell
              context={context}
              disabledToggleTooltip={t("inventory.stock.disabledToggleTooltip")}
              placeholder={t("inventory.stock.placeholder")}
            />
          ),
        }),
      ),
    ],
    [locations, t],
  )
}
