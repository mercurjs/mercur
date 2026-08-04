import { HttpTypes } from "@medusajs/types"
import { ColumnDef } from "@tanstack/react-table"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"

import {
  isPriceListGroupRow,
  type PriceListGridRow,
} from "@mercurjs/dashboard-shared"

import { Thumbnail } from "@components/common/thumbnail"
import { createDataGridHelper, DataGrid } from "@components/data-grid"
import { createDataGridPriceColumns } from "@components/data-grid/helpers/create-data-grid-price-columns"

export type { PriceListGridRow } from "@mercurjs/dashboard-shared"

/**
 * The Prices grid is keyed by **offer**, not variant: the same product sold by
 * two sellers stays as two separate groups (product + seller) with their own
 * variant rows. Each offer row binds prices to `offers.<offer_id>`.
 */
const columnHelper = createDataGridHelper<PriceListGridRow, any>()

export const usePriceListGridColumns = ({
  currencies = [],
  regions = [],
  pricePreferences = [],
}: {
  currencies?: string[]
  regions?: HttpTypes.AdminRegion[]
  pricePreferences?: HttpTypes.AdminPricePreference[]
}) => {
  const { t } = useTranslation()

  const colDefs: ColumnDef<PriceListGridRow>[] = useMemo(() => {
    return [
      columnHelper.column({
        id: t("priceLists.fields.offerVariant"),
        header: t("priceLists.fields.offerVariant"),
        cell: (context) => {
          const row = context.row.original
          if (isPriceListGroupRow(row)) {
            return (
              <DataGrid.ReadonlyCell context={context}>
                <div className="flex h-full w-full items-center gap-x-2 overflow-hidden">
                  <Thumbnail src={row.product_thumbnail} size="small" />
                  <span className="truncate font-medium">
                    {row.product_title}
                  </span>
                </div>
              </DataGrid.ReadonlyCell>
            )
          }

          return (
            <DataGrid.ReadonlyCell context={context} color="normal">
              <div className="flex h-full w-full items-center gap-x-2 overflow-hidden">
                <span className="truncate">{row.variant_title}</span>
              </div>
            </DataGrid.ReadonlyCell>
          )
        },
        disableHiding: true,
      }),
      columnHelper.column({
        id: "offer_sku",
        name: t("fields.sku"),
        header: t("fields.sku"),
        cell: (context) => {
          const row = context.row.original
          const sku = isPriceListGroupRow(row) ? "" : row.sku
          return (
            <DataGrid.ReadonlyCell context={context}>
              <span className="text-ui-fg-subtle truncate">{sku}</span>
            </DataGrid.ReadonlyCell>
          )
        },
      }),
      ...createDataGridPriceColumns<PriceListGridRow, any>({
        currencies,
        regions,
        pricePreferences,
        isReadyOnly: (context) => isPriceListGroupRow(context.row.original),
        getFieldName: (context, value) => {
          const row = context.row.original
          if (isPriceListGroupRow(row)) {
            return null
          }
          if (context.column.id?.startsWith("currency_prices")) {
            return `offers.${row.offer_id}.currency_prices.${value}.amount`
          }
          return `offers.${row.offer_id}.region_prices.${value}.amount`
        },
        t,
      }),
    ]
  }, [t, currencies, regions, pricePreferences])

  return colDefs
}
