import { Children, ReactNode, useMemo } from "react"
import { useWatch } from "react-hook-form"
import { useTranslation } from "react-i18next"

import {
  createDataGridHelper,
  createDataGridPriceColumns,
  DataGrid,
} from "@components/data-grid"
import { useRouteModal } from "@components/modals"
import { useTabbedForm } from "@components/tabbed-form"
import { useStore } from "@hooks/api/store"
import { useRegions } from "@hooks/api"
import { usePricePreferences } from "@hooks/api/price-preferences"
import {
  ProductCreateOptionSchema,
  ProductCreateVariantSchema,
} from "../constants"
import { ProductCreateSchemaType, TabDefinition } from "../types"

type VariantWithIndex = ProductCreateVariantSchema & {
  originalIndex: number
}

const Root = ({ children }: { children?: ReactNode }) => {
  const form = useTabbedForm<ProductCreateSchemaType>()
  const { store } = useStore()
  const { regions } = useRegions({ limit: 9999 })
  const { price_preferences: pricePreferences } = usePricePreferences({ limit: 9999 })
  const { setCloseOnEscape } = useRouteModal()

  const currencyCodes = useMemo(
    () => store?.supported_currencies?.map((c) => c.currency_code) || [],
    [store]
  )

  const variants = useWatch({
    control: form.control,
    name: "variants",
    defaultValue: [],
  })

  const options = useWatch({
    control: form.control,
    name: "options",
    defaultValue: [],
  })

  const columns = useColumns({
    options,
    currencies: currencyCodes,
    regions,
    pricePreferences,
  })

  const variantData = useMemo(() => {
    const ret: VariantWithIndex[] = []

    variants.forEach((v, i) => {
      if (v.should_create) {
        ret.push({ ...v, originalIndex: i })
      }
    })

    return ret
  }, [variants])

  if (Children.count(children) > 0) {
    return <>{children}</>
  }

  return (
    <div className="flex size-full flex-col divide-y overflow-hidden">
      <DataGrid
        columns={columns}
        data={variantData}
        state={form}
        onEditingChange={(editing) => setCloseOnEscape(!editing)}
      />
    </div>
  )
}

Root._tabMeta = {
  id: "variants",
  labelKey: "products.create.tabs.variants",
} satisfies TabDefinition

export const ProductCreateVariantsForm = Object.assign(Root, {
  _tabMeta: Root._tabMeta,
})

const columnHelper = createDataGridHelper<
  VariantWithIndex,
  ProductCreateSchemaType
>()

const useColumns = ({
  options,
  currencies = [],
  regions = [],
  pricePreferences = [],
}: {
  options: ProductCreateOptionSchema[]
  currencies?: string[]
  regions?: import("@medusajs/types").HttpTypes.AdminRegion[]
  pricePreferences?: import("@medusajs/types").HttpTypes.AdminPricePreference[]
}) => {
  const { t } = useTranslation()

  return useMemo(
    () => [
      columnHelper.column({
        id: "options",
        header: () => (
          <div className="flex size-full items-center overflow-hidden">
            <span className="truncate">
              {options.map((o) => o.title).join(" / ")}
            </span>
          </div>
        ),
        cell: (context) => {
          return (
            <DataGrid.ReadonlyCell context={context}>
              {options
                .map((o) => context.row.original.options[o.title])
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

      ...createDataGridPriceColumns<VariantWithIndex, ProductCreateSchemaType>({
        currencies,
        regions,
        pricePreferences,
        getFieldName: (context, value) => {
          return `variants.${context.row.original.originalIndex}.prices.${value}`
        },
        t,
      }),
    ],
    [currencies, regions, options, pricePreferences, t]
  )
}
