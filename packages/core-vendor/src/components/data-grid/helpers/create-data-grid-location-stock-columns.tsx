import { HttpTypes } from "@medusajs/types"
import { ColumnDef } from "@tanstack/react-table"
import { TFunction } from "i18next"
import { FieldPath, FieldValues } from "react-hook-form"
import { DataGridReadonlyCell } from "../components/data-grid-readonly-cell"
import { DataGridTogglableNumberCell } from "../components/data-grid-toggleable-number-cell"
import { FieldContext } from "../types"
import { createDataGridHelper } from "./create-data-grid-column-helper"

type CreateDataGridLocationStockColumnsProps<
  TData,
  TFieldValues extends FieldValues,
> = {
  stockLocations: HttpTypes.AdminStockLocation[]
  isReadyOnly?: (context: FieldContext<TData>) => boolean
  getFieldName: (
    context: FieldContext<TData>,
    stockLocationIndex: number
  ) => FieldPath<TFieldValues> | null
  t: TFunction
}

export const createDataGridLocationStockColumns = <
  TData,
  TFieldValues extends FieldValues,
>({
  stockLocations,
  isReadyOnly,
  getFieldName,
  t,
}: CreateDataGridLocationStockColumnsProps<TData, TFieldValues>): ColumnDef<
  TData,
  unknown
>[] => {
  const columnHelper = createDataGridHelper<TData, TFieldValues>()

  return [
    ...(stockLocations.map((stockLocation, index) => {
      return columnHelper.column({
        id: `stock_locations.${stockLocation.id}`,
        name: stockLocation.name,
        field: (context) => {
          const isReadyOnlyValue = isReadyOnly?.(context)
          if (isReadyOnlyValue) {
            return null
          }
          return getFieldName(context, index)
        },
        type: "togglable-number",
        header: () => (
          <div className="flex w-full items-center justify-between gap-3">
            <span className="truncate" title={stockLocation.name}>
              {stockLocation.name}
            </span>
          </div>
        ),
        cell: (context) => {
          if (isReadyOnly?.(context)) {
            return <DataGridReadonlyCell context={context} />
          }

          return (
            <DataGridTogglableNumberCell
              context={context}
              disabledToggleTooltip={t("inventory.stock.disabledToggleTooltip")}
              placeholder={t("inventory.stock.placeholder")}
            />
          )
        },
      })
    }) ?? []),
  ]
}
