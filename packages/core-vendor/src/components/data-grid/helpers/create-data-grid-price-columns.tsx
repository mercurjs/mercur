import { HttpTypes } from "@medusajs/types"
import { ColumnDef } from "@tanstack/react-table"
import { TFunction } from "i18next"
import { FieldPath, FieldValues } from "react-hook-form"
import { IncludesTaxTooltip } from "../../common/tax-badge/tax-badge"
import { DataGridCurrencyCell } from "../components/data-grid-currency-cell"
import { DataGridReadonlyCell } from "../components/data-grid-readonly-cell"
import { FieldContext } from "../types"
import { createDataGridHelper } from "./create-data-grid-column-helper"
import { formatCurrency } from "../../../lib/format-currency"

type CreateDataGridPriceColumnsProps<
  TData,
  TFieldValues extends FieldValues,
> = {
  currencies?: string[]
  pricePreferences?: HttpTypes.AdminPricePreference[]
  isReadyOnly?: (context: FieldContext<TData>) => boolean
  getFieldName: (
    context: FieldContext<TData>,
    value: string
  ) => FieldPath<TFieldValues> | null
  t: TFunction
  showCurrentPriceCell?: boolean
}

export const createDataGridPriceColumns = <
  TData,
  TFieldValues extends FieldValues,
>({
  currencies,
  pricePreferences,
  isReadyOnly,
  getFieldName,
  t,
  showCurrentPriceCell = false,
}: CreateDataGridPriceColumnsProps<TData, TFieldValues>): ColumnDef<
  TData,
  unknown
>[] => {
  const columnHelper = createDataGridHelper<TData, TFieldValues>()

  return [
    ...(currencies?.flatMap((currency) => {
      const preference = pricePreferences?.find(
        (p) => p.attribute === "currency_code" && p.value === currency
      )

      const translatedCurrencyName = t("fields.priceTemplate", {
        regionOrCurrency: currency.toUpperCase(),
      })

      const translatedCurrentCurrencyName = t("fields.currentPriceTemplate", {
        regionOrCurrency: currency.toUpperCase(),
      })

      const editableCol = columnHelper.column({
        id: `currency_prices.${currency}`,
        name: t("fields.priceTemplate", {
          regionOrCurrency: currency.toUpperCase(),
        }),
        field: (context) => {
          const isReadyOnlyValue = isReadyOnly?.(context)

          if (isReadyOnlyValue) {
            return null
          }

          return getFieldName(context, currency)
        },
        type: "number",
        header: () => (
          <div className="flex w-full items-center justify-between gap-3">
            <span className="truncate" title={translatedCurrencyName}>
              {translatedCurrencyName}
            </span>
            <IncludesTaxTooltip includesTax={preference?.is_tax_inclusive} />
          </div>
        ),
        cell: (context) => {
          if (isReadyOnly?.(context)) {
            return <DataGridReadonlyCell context={context} />
          }

          return <DataGridCurrencyCell code={currency} context={context} />
        },
      })

      const currentPriceCol = showCurrentPriceCell
        ? columnHelper.column({
            id: `currency_current_price.${currency}`,
            name: translatedCurrentCurrencyName,
            field: () => null,
            type: "number",
            header: () => (
              <div className="flex w-full items-center justify-between gap-3">
                <span
                  className="truncate"
                  title={translatedCurrentCurrencyName}
                >
                  {translatedCurrentCurrencyName}
                </span>
              </div>
            ),
            cell: (context) => {
              const prices = (
                context.row.original as HttpTypes.AdminProductVariant
              ).prices

              const currentPrice = prices?.find(
                ({ currency_code }) => currency_code === currency
              )

              const amount = currentPrice?.amount

              return (
                <DataGridReadonlyCell context={context}>
                  {typeof amount === "number"
                    ? formatCurrency(amount, currency.toUpperCase())
                    : isReadyOnly?.(context)
                      ? ""
                      : "—"}
                </DataGridReadonlyCell>
              )
            },
          })
        : null

      return [editableCol, currentPriceCol].filter(Boolean) as ColumnDef<
        TData,
        unknown
      >[]
    }) ?? []),
  ]
}
