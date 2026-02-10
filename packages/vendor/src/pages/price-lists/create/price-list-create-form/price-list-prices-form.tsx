import { HttpTypes } from "@medusajs/types"
import { useEffect } from "react"
import { UseFormReturn, useWatch } from "react-hook-form"
import { DataGrid } from "@components/data-grid"
import { useRouteModal } from "@components/modals"
import { useProducts } from "@hooks/api/products"
import { usePriceListGridColumns } from "@pages/price-lists/common/hooks/use-price-list-grid-columns"
import { PriceListCreateProductVariantsSchema } from "@pages/price-lists/common/schemas"
import { isProductRow } from "@pages/price-lists/common/utils"
import { PricingCreateSchemaType } from "./schema"

type PriceListPricesFormProps = {
  form: UseFormReturn<PricingCreateSchemaType>
  currencies: HttpTypes.AdminStoreCurrency[]
  regions: HttpTypes.AdminRegion[]
  pricePreferences: HttpTypes.AdminPricePreference[]
}

export const PriceListPricesForm = ({
  form,
  currencies,
  regions,
  pricePreferences,
}: PriceListPricesFormProps) => {
  const ids = useWatch({
    control: form.control,
    name: "product_ids",
  })

  const existingProducts = useWatch({
    control: form.control,
    name: "products",
  })

  const {
    products: productsRaw,
    isLoading,
    isError,
    error,
  } = useProducts({
    fields: "title,thumbnail,*variants,+status,*variants.prices",
  })

  const products = productsRaw?.filter((product) =>
    ids.some((id) => id.id === product.id)
  )

  const { setCloseOnEscape } = useRouteModal()

  const { setValue } = form

  useEffect(() => {
    if (!isLoading && products) {
      products.forEach((product) => {
        /**
         * If the product already exists in the form, we don't want to overwrite it.
         */
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
  }, [products, existingProducts, isLoading, setValue])

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
        data={products}
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
