import { HttpTypes } from "@medusajs/types"
import { useMemo } from "react"
import { useWatch } from "react-hook-form"
import { useTranslation } from "react-i18next"

import {
  createDataGridHelper,
  createDataGridPriceColumns,
  DataGrid,
} from "../../../../../components/data-grid"
import { useRouteModal } from "../../../../../components/modals"
import { useTabbedForm } from "../../../../../components/tabbed-form/tabbed-form"
import { defineTabMeta } from "../../../../../components/tabbed-form/types"
import { useRegions } from "../../../../../hooks/api"
import { usePricePreferences } from "../../../../../hooks/api/price-preferences"
import { useStore } from "../../../../../hooks/api/store"
import {
  ProductCreateOptionSchema,
  ProductCreateVariantSchema,
} from "../../constants"
import { ProductCreateSchemaType } from "../../types"

const Root = () => {
  const form = useTabbedForm<ProductCreateSchemaType>()
  const { setCloseOnEscape } = useRouteModal()

  const { store } = useStore({
    fields: "+default_sales_channel",
  })

  const { regions } = useRegions({ limit: 9999 })

  const { price_preferences: pricePreferences } = usePricePreferences({
    limit: 9999,
  })

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

  /**
   * NOTE: anything that goes to the datagrid component needs to be memoised otherwise DataGrid will rerender and inputs will loose focus
   */
  const columns = useColumns({
    options,
    currencies: currencyCodes,
    regions: regions ?? [],
    pricePreferences: pricePreferences ?? [],
  })

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
    <div className="flex size-full flex-col divide-y overflow-hidden" data-testid="product-create-variants-form">
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

const columnHelper = createDataGridHelper<
  VariantRow,
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
  regions?: HttpTypes.AdminRegion[]
  pricePreferences?: HttpTypes.AdminPricePreference[]
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
      columnHelper.column({
        id: "manage_inventory",
        name: t("fields.managedInventory"),
        header: t("fields.managedInventory"),
        field: (context) =>
          `variants.${context.row.original.originalIndex}.manage_inventory`,
        type: "boolean",
        cell: (context) => {
          return <DataGrid.BooleanCell context={context} />
        },
      }),
      columnHelper.column({
        id: "allow_backorder",
        name: t("fields.allowBackorder"),
        header: t("fields.allowBackorder"),
        field: (context) =>
          `variants.${context.row.original.originalIndex}.allow_backorder`,
        type: "boolean",
        cell: (context) => {
          return <DataGrid.BooleanCell context={context} />
        },
      }),

      columnHelper.column({
        id: "inventory_kit",
        name: t("fields.inventoryKit"),
        header: t("fields.inventoryKit"),
        field: (context) =>
          `variants.${context.row.original.originalIndex}.inventory_kit`,
        type: "boolean",
        cell: (context) => {
          return (
            <DataGrid.BooleanCell
              context={context}
              disabled={!context.row.original.manage_inventory}
            />
          )
        },
      }),

      ...createDataGridPriceColumns<
        VariantRow,
        ProductCreateSchemaType
      >({
        currencies,
        regions,
        pricePreferences,
        getFieldName: (context, value) => {
          if (context.column.id?.startsWith("currency_prices")) {
            return `variants.${context.row.original.originalIndex}.prices.${value}`
          }
          return `variants.${context.row.original.originalIndex}.prices.${value}`
        },
        t,
      }),
    ],
    [currencies, regions, options, pricePreferences, t]
  )
}
