import { useMemo } from "react"
import { useWatch } from "react-hook-form"
import { useTranslation } from "react-i18next"

import { createDataGridHelper, DataGrid } from "@components/data-grid"
import { useRouteModal } from "@components/modals"
import { useTabbedForm } from "@components/tabbed-form/tabbed-form"
import { defineTabMeta } from "@components/tabbed-form/types"

import { ProductCreateVariantSchema } from "../../constants"
import { ProductCreateSchemaType } from "../../types"

const Root = () => {
  const form = useTabbedForm<ProductCreateSchemaType>()
  const { setCloseOnEscape } = useRouteModal()

  const variants = useWatch({
    control: form.control,
    name: "variants",
    defaultValue: [],
  })

  const watchedAttributes = useWatch({
    control: form.control,
    name: "attributes",
    defaultValue: [],
  })

  const variantAxes = useMemo(() => {
    return (watchedAttributes ?? [])
      .filter((attr) => attr.use_for_variants && attr.title)
      .map((attr) => ({
        title: attr.title,
      }))
  }, [watchedAttributes])

  const columns = useColumns({ variantAxes })

  const variantData = useMemo(() => {
    const ret: (ProductCreateVariantSchema & { originalIndex: number })[] = []

    variants.forEach((v, i) => {
      if (v.should_create) {
        ret.push({ ...v, originalIndex: i })
      }
    })

    return ret
  }, [variants])

  return (
    <div
      className="flex size-full flex-col divide-y overflow-hidden"
      data-testid="product-create-variants-form"
    >
      <div data-testid="product-create-variants-form-datagrid">
        <DataGrid
          columns={columns}
          data={variantData}
          state={form}
          onEditingChange={(editing) => setCloseOnEscape(!editing)}
        />
      </div>
    </div>
  )
}

Root._tabMeta = defineTabMeta<ProductCreateSchemaType>({
  id: "variants",
  labelKey: "products.create.tabs.variants",
  validationFields: ["variants"],
})

export const ProductCreateVariantsForm = Root

type VariantRow = ProductCreateVariantSchema & { originalIndex: number }

const columnHelper = createDataGridHelper<VariantRow, ProductCreateSchemaType>()

const useColumns = ({
  variantAxes,
}: {
  variantAxes: { title: string }[]
}) => {
  const { t } = useTranslation()

  return useMemo(
    () => [
      columnHelper.column({
        id: "attributes",
        header: () => (
          <div className="flex size-full items-center overflow-hidden">
            <span className="truncate">
              {variantAxes.map((a) => a.title).join(" / ")}
            </span>
          </div>
        ),
        cell: (context) => {
          return (
            <DataGrid.ReadonlyCell context={context}>
              {variantAxes
                .map((a) => context.row.original.attribute_values?.[a.title])
                .join(" / ")}
            </DataGrid.ReadonlyCell>
          )
        },
        disableHiding: true,
      }),
      columnHelper.column({
        id: "title",
        name: t("fields.title"),
        header: t("fields.title"),
        field: (context) =>
          `variants.${context.row.original.originalIndex}.title`,
        type: "text",
        cell: (context) => {
          return <DataGrid.TextCell context={context} />
        },
      }),
      columnHelper.column({
        id: "sku",
        name: t("fields.sku"),
        header: t("fields.sku"),
        field: (context) =>
          `variants.${context.row.original.originalIndex}.sku`,
        type: "text",
        cell: (context) => {
          return <DataGrid.TextCell context={context} />
        },
      }),
    ],
    [variantAxes, t]
  )
}
