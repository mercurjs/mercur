import { ProductDTO } from "@mercurjs/types"
import { Select, Switch, clx } from "@medusajs/ui"
import { useMemo } from "react"
import { Controller } from "react-hook-form"
import { useTranslation } from "react-i18next"

import { createDataGridHelper } from "../../../../components/data-grid"
import {
  DataGridReadOnlyCell,
} from "../../../../components/data-grid/components"
import { DataGridCellContainer } from "../../../../components/data-grid/components/data-grid-cell-container"
import { useDataGridCell, useDataGridCellError } from "../../../../components/data-grid/hooks"
import { DataGridCellProps } from "../../../../components/data-grid/types"
import { ProductBulkEditSchema } from "../schema"

const STATUS_OPTIONS = [
  "draft",
  "proposed",
  "published",
  "requires_action",
  "rejected",
] as const

const helper = createDataGridHelper<ProductDTO, ProductBulkEditSchema>()

export const useProductBulkEditColumns = () => {
  const { t } = useTranslation()

  return useMemo(
    () => [
      helper.column({
        id: "title",
        name: t("fields.title"),
        header: t("fields.title"),
        cell: (context) => {
          const product = context.row.original
          return (
            <DataGridReadOnlyCell context={context} color="normal">
              <span title={product.title || undefined}>
                {product.title || "-"}
              </span>
            </DataGridReadOnlyCell>
          )
        },
        disableHiding: true,
      }),
      helper.column({
        id: "status",
        name: t("fields.status"),
        header: t("fields.status"),
        field: (context) => {
          const index = context.row.index
          return `products.${index}.status` as const
        },
        type: "text",
        cell: (context) => <BulkEditStatusCell context={context} t={t} />,
      }),
      helper.column({
        id: "discountable",
        name: t("fields.discountable"),
        header: t("fields.discountable"),
        field: (context) => {
          const index = context.row.index
          return `products.${index}.discountable` as const
        },
        type: "boolean",
        cell: (context) => <BulkEditDiscountableCell context={context} t={t} />,
      }),
    ],
    [t]
  )
}

const BulkEditStatusCell = <TData,>({
  context,
  t,
}: DataGridCellProps<TData> & { t: (key: string) => string }) => {
  const { field, control, renderProps } = useDataGridCell({ context })
  const errorProps = useDataGridCellError({ context })
  const { container } = renderProps

  return (
    <Controller
      control={control}
      name={field}
      render={({ field: { value, onChange, ref } }) => (
        <DataGridCellContainer
          {...container}
          {...errorProps}
          showOverlay={false}
        >
          <Select value={value} onValueChange={onChange}>
            <Select.Trigger
              ref={ref}
              className={clx(
                "h-full w-full rounded-none border-none bg-transparent px-0 shadow-none",
                "hover:bg-transparent focus:shadow-none data-[state=open]:!shadow-none"
              )}
            >
              <Select.Value />
            </Select.Trigger>
            <Select.Content>
              {STATUS_OPTIONS.map((status) => (
                <Select.Item key={status} value={status}>
                  {t(`products.productStatus.${status}`)}
                </Select.Item>
              ))}
            </Select.Content>
          </Select>
        </DataGridCellContainer>
      )}
    />
  )
}

const BulkEditDiscountableCell = <TData,>({
  context,
  t,
}: DataGridCellProps<TData> & { t: (key: string) => string }) => {
  const { field, control, renderProps } = useDataGridCell({ context })
  const errorProps = useDataGridCellError({ context })
  const { container } = renderProps

  return (
    <Controller
      control={control}
      name={field}
      render={({ field: { value, onChange, ref } }) => (
        <DataGridCellContainer
          {...container}
          {...errorProps}
          showOverlay={false}
        >
          <div className="flex w-full items-center justify-between">
            <Switch
              ref={ref}
              checked={value}
              onCheckedChange={onChange}
              size="small"
            />
            <span className="txt-compact-small text-ui-fg-base">
              {value ? t("fields.true") : t("fields.false")}
            </span>
          </div>
        </DataGridCellContainer>
      )}
    />
  )
}
