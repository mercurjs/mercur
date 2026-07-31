import { HttpTypes } from "@medusajs/types"
import { useEffect, useMemo } from "react"
import { useWatch } from "react-hook-form"
import { DataGrid } from "../../../../../components/data-grid"
import { useRouteModal } from "../../../../../components/modals"
import { useTabbedForm } from "../../../../../components/tabbed-form/tabbed-form"
import { defineTabMeta } from "../../../../../components/tabbed-form/types"
import { useProducts } from "../../../../../hooks/api/products"
import { usePriceListGridColumns } from "../../../common/hooks/use-price-list-grid-columns"
import { PriceListCreateProductVariantsSchema } from "../../../common/schemas"
import { isProductRow } from "../../../common/utils"
import { PricingCreateSchemaType } from "./schema"

type PriceListPricesFormProps = {
  currencies: HttpTypes.AdminStoreCurrency[]
  regions: HttpTypes.AdminRegion[]
  pricePreferences: HttpTypes.AdminPricePreference[]
}

const Root = ({
  currencies,
  regions,
  pricePreferences,
}: PriceListPricesFormProps) => {
  const form = useTabbedForm<PricingCreateSchemaType>()

  const ids = useWatch({
    control: form.control,
    name: "product_ids",
  })

  const existingProducts = useWatch({
    control: form.control,
    name: "products",
  })

  const variantOffers = useWatch({
    control: form.control,
    name: "variant_offers",
  })

  const { products, isLoading, isError, error } = useProducts({
    id: ids.map((id) => id.id),
    limit: ids.length,
    fields: "title,thumbnail,*variants",
  })

  // Only the picked offers' variants are priceable; hide the rest so the admin
  // can't enter a price that would be dropped for lacking an offer_id.
  const offeredProducts = useMemo(() => {
    if (!products) {
      return products
    }
    return products
      .map((product) => ({
        ...product,
        variants: (product.variants ?? []).filter(
          (variant) => variantOffers?.[variant.id]
        ),
      }))
      .filter((product) => product.variants.length > 0) as typeof products
  }, [products, variantOffers])

  const { setCloseOnEscape } = useRouteModal()

  const { setValue } = form

  useEffect(() => {
    if (!isLoading && offeredProducts) {
      offeredProducts.forEach((product) => {
        if (existingProducts[product.id] || !product.variants) {
          return
        }

        setValue(`products.${product.id}.variants`, {
          ...product.variants.reduce((variants, variant) => {
            variants[variant.id] = {
              currency_prices: {},
              region_prices: {},
            }
            return variants
          }, {} as PriceListCreateProductVariantsSchema),
        })
      })
    }
  }, [offeredProducts, existingProducts, isLoading, setValue])

  const columns = usePriceListGridColumns({
    currencies,
    regions,
    pricePreferences,
  })

  if (isError) {
    throw error
  }

  return (
    <div className="flex size-full flex-col divide-y overflow-hidden">
      <DataGrid
        isLoading={isLoading}
        columns={columns}
        data={offeredProducts}
        getSubRows={(row) => {
          if (isProductRow(row) && row.variants) {
            return row.variants
          }
        }}
        state={form}
        onEditingChange={(editing) => setCloseOnEscape(!editing)}
      />
    </div>
  )
}

Root._tabMeta = defineTabMeta<PricingCreateSchemaType>({
  id: "price",
  labelKey: "priceLists.create.tabs.prices",
  validationFields: ["products"],
})

export const PriceListPricesForm = Root
