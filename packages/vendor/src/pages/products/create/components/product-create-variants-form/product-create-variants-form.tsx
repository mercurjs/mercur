import { Input } from "@medusajs/ui"
import { useMemo, useState } from "react"
import { useWatch } from "react-hook-form"
import { useTranslation } from "react-i18next"

import { createDataGridHelper, DataGrid } from "@components/data-grid"
import { useRouteModal } from "@components/modals"
import { useTabbedForm } from "@components/tabbed-form/tabbed-form"
import { defineTabMeta } from "@components/tabbed-form/types"

import { ProductCreateVariantSchema } from "../../constants"
import { ProductCreateSchemaType } from "../../types"

const Root = () => {
  const { t } = useTranslation()
  const form = useTabbedForm<ProductCreateSchemaType>()
  const { setCloseOnEscape } = useRouteModal()

  const [search, setSearch] = useState("")

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

  const filteredVariantData = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) {
      return variantData
    }

    return variantData.filter((variant) => {
      const haystack = [
        variant.title,
        variant.sku,
        ...Object.values(variant.options ?? {}),
      ]

      return haystack.some((value) => value?.toLowerCase().includes(query))
    })
  }, [variantData, search])

  const headerContent = (
    <Input
      type="search"
      size="small"
      autoComplete="off"
      value={search}
      onChange={(event) => setSearch(event.target.value)}
      placeholder={t(
        "products.create.variants.productVariants.searchPlaceholder"
      )}
      data-testid="product-create-variants-search-input"
    />
  )

  return (
    <div
      className="flex size-full flex-col divide-y overflow-hidden"
      data-testid="product-create-variants-form"
    >
      <div data-testid="product-create-variants-form-datagrid">
        <DataGrid
          columns={columns}
          data={filteredVariantData}
          state={form}
          onEditingChange={(editing) => setCloseOnEscape(!editing)}
          headerContent={headerContent}
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
                .map((a) => context.row.original.options?.[a.title])
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
