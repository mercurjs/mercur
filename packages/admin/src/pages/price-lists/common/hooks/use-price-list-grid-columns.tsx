import { HttpTypes } from "@medusajs/types"
import { ColumnDef } from "@tanstack/react-table"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"

import { Thumbnail } from "../../../../components/common/thumbnail"
import {
  createDataGridHelper,
  DataGrid,
} from "../../../../components/data-grid"
import { createDataGridPriceColumns } from "../../../../components/data-grid/helpers/create-data-grid-price-columns"

/**
 * The Prices grid is keyed by **offer**, not variant: the same product sold by
 * two sellers must show as two separate groups (product + seller) with their own
 * variant rows, never merged. Each offer row binds prices to `offers.<offer_id>`.
 */
export type PriceListGridGroupRow = {
  __group: true
  id: string
  product_title: string
  product_thumbnail?: string | null
  seller_name: string
}

export type PriceListGridOfferRow = {
  __group: false
  id: string
  offer_id: string
  variant_id: string
  variant_title: string
  product_id: string
  seller_name: string
  sku: string
}

export type PriceListGridRow = PriceListGridGroupRow | PriceListGridOfferRow

export const isPriceListGroupRow = (
  row: PriceListGridRow
): row is PriceListGridGroupRow => (row as PriceListGridGroupRow).__group === true

const columnHelper = createDataGridHelper<PriceListGridRow, any>()

export const usePriceListGridColumns = ({
  currencies = [],
  regions = [],
  pricePreferences = [],
}: {
  currencies?: HttpTypes.AdminStoreCurrency[]
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
        id: "store",
        name: t("offers.fields.store"),
        header: t("offers.fields.store"),
        cell: (context) => {
          const row = context.row.original
          return (
            <DataGrid.ReadonlyCell context={context}>
              <span className="text-ui-fg-subtle truncate">
                {row.seller_name}
              </span>
            </DataGrid.ReadonlyCell>
          )
        },
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
        currencies: currencies.map((c) => c.currency_code),
        regions,
        pricePreferences,
        isReadyOnly: (context) =>
          isPriceListGroupRow(context.row.original),
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
