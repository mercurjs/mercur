import { useMemo } from "react"

import { useTranslation } from "react-i18next"

import { createDataGridHelper } from "@components/data-grid"
import {
  DataGridBooleanWithTextCell,
  DataGridStatusCell,
  DataGridTextCell,
} from "../../../../components/data-grid/components"
import { ExtendedAdminProduct } from "../../types"
import { ProductBulkEditSchema } from "../schema"

const helper = createDataGridHelper<
  ExtendedAdminProduct,
  ProductBulkEditSchema
>()

export const useProductBulkEditColumns = () => {
  const { t } = useTranslation()

  return useMemo(
    () => [
      helper.column({
        id: "title",
        name: t("fields.title"),
        header: t("fields.title"),
        field: (context) => {
          const product = context.row.original
          return `products.${product.id}.title` as const
        },
        type: "text",
        cell: (context) => {
          return <DataGridTextCell context={context} />
        },
        disableHiding: true,
      }),
      helper.column({
        id: "status",
        name: t("fields.status"),
        header: t("fields.status"),
        field: (context) => {
          const product = context.row.original
          return `products.${product.id}.status` as const
        },
        type: "select",
        cell: (context) => {
          return <DataGridStatusCell context={context} />
        },
      }),
      helper.column({
        id: "discountable",
        name: t("fields.discountable"),
        header: t("fields.discountable"),
        field: (context) => {
          const product = context.row.original
          return `products.${product.id}.discountable` as const
        },
        type: "boolean",
        cell: (context) => {
          return (
            <DataGridBooleanWithTextCell
              context={context}
              trueLabel="True"
              falseLabel="False"
            />
          )
        },
      }),
    ],
    [t]
  )
}
