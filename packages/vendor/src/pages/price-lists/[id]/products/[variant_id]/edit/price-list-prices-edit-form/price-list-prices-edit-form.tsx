import { HttpTypes } from "@medusajs/types"
import { Button, toast } from "@medusajs/ui"
import { useRef } from "react"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { z } from "zod"

import { ExtendedAdminProduct } from "@custom-types/products"
import { DataGrid } from "@components/data-grid"
import {
  RouteFocusModal,
  useRouteModal,
} from "@components/modals"
import { KeyboundForm } from "@components/utilities/keybound-form"
import { usePriceListLinkProducts } from "@hooks/api/price-lists"
import { castNumber } from "@lib/cast-number"
import { usePriceListGridColumns } from "@pages/price-lists/common/hooks/use-price-list-grid-columns"
import {
  PriceListUpdateProductVariantsSchema,
  PriceListUpdateProductsSchema,
} from "@pages/price-lists/common/schemas"
import { isProductRow } from "@pages/price-lists/common/utils"
import { ExtendedPriceList } from "@custom-types/price-list"

type PriceListPricesEditFormProps = {
  priceList: ExtendedPriceList
  products: ExtendedAdminProduct[]
  regions: HttpTypes.AdminRegion[]
  currencies: HttpTypes.AdminStoreCurrency[]
  pricePreferences: HttpTypes.AdminPricePreference[]
}

const PricingProductPricesSchema = z.object({
  products: PriceListUpdateProductsSchema,
})

export const PriceListPricesEditForm = ({
  priceList,
  products,
  regions,
  currencies,
  pricePreferences,
}: PriceListPricesEditFormProps) => {
  const { t } = useTranslation()
  const { handleSuccess, setCloseOnEscape } = useRouteModal()

  const initialValue = useRef(initRecord(priceList, products))

  const form = useForm<z.infer<typeof PricingProductPricesSchema>>({
    defaultValues: {
      products: initialValue.current,
    },
    // resolver: zodResolver(PricingProductPricesSchema),
  })

  const { mutateAsync, isPending } = usePriceListLinkProducts(priceList.id)

  const handleSubmit = form.handleSubmit(async (values) => {
    const { products } = values

    const { pricesToDelete, pricesToCreate, pricesToUpdate } = sortPrices(
      products,
      initialValue.current,
      regions
    )

    mutateAsync(
      {
        remove: pricesToDelete,
        update: pricesToUpdate,
        create: pricesToCreate,
      },
      {
        onSuccess: () => {
          toast.success(t("priceLists.products.edit.successToast"))

          handleSuccess()
        },
        onError: (error) => {
          toast.error(error.message)
        },
      }
    )
  })

  const columns = usePriceListGridColumns({
    currencies,
    regions,
    pricePreferences,
  })

  return (
    <RouteFocusModal.Form form={form}>
      <KeyboundForm onSubmit={handleSubmit} className="flex size-full flex-col">
        <RouteFocusModal.Header />
        <RouteFocusModal.Body className="flex flex-col overflow-hidden">
          <DataGrid
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
        </RouteFocusModal.Body>
        <RouteFocusModal.Footer>
          <div className="flex items-center justify-end gap-x-2">
            <RouteFocusModal.Close asChild>
              <Button size="small" variant="secondary">
                {t("actions.cancel")}
              </Button>
            </RouteFocusModal.Close>
            <Button size="small" type="submit" isLoading={isPending}>
              {t("actions.save")}
            </Button>
          </div>
        </RouteFocusModal.Footer>
      </KeyboundForm>
    </RouteFocusModal.Form>
  )
}

function initRecord(
  priceList: ExtendedPriceList,
  products: ExtendedAdminProduct[]
): PriceListUpdateProductsSchema {
  const record: PriceListUpdateProductsSchema = {}

  const variantPrices = priceList.prices?.reduce((variants, price) => {
    const variantObject = variants[price.price_set.variant.id] || {}

    const regionPrice = price.price_rules.find(
      (item: { attribute: string }) => item.attribute === "region_id"
    )

    if (!!regionPrice) {
      const regionId = regionPrice.value

      variantObject.region_prices = {
        ...variantObject.region_prices,
        [regionId]: {
          amount: price.amount.toString(),
          id: price.id,
        },
      }
    } else {
      variantObject.currency_prices = {
        ...variantObject.currency_prices,
        [price.currency_code]: {
          amount: price.amount.toString(),
          id: price.id,
        },
      }
    }

    const variantId = price.price_set.variant.id

    variants[variantId] = variantObject

    return variants
  }, {} as PriceListUpdateProductVariantsSchema)

  for (const product of products) {
    record[product.id] = {
      variants:
        product.variants?.reduce((variants, variant) => {
          const prices = variantPrices?.[variant.id] || {}
          variants[variant.id] = prices

          return variants
        }, {} as PriceListUpdateProductVariantsSchema) || {},
    }
  }

  return record
}

type PriceObject = {
  variantId: string
  currencyCode: string
  regionId?: string
  amount: number
  id?: string | null
}

function convertToPriceArray(
  data: PriceListUpdateProductsSchema,
  regions: HttpTypes.AdminRegion[]
) {
  const prices: PriceObject[] = []

  const regionCurrencyMap = regions.reduce(
    (map, region) => {
      map[region.id] = region.currency_code
      return map
    },
    {} as Record<string, string>
  )

  for (const [_productId, product] of Object.entries(data || {})) {
    const { variants } = product || {}

    for (const [variantId, variant] of Object.entries(variants || {})) {
      const { currency_prices: currencyPrices, region_prices: regionPrices } =
        variant || {}

      for (const [currencyCode, currencyPrice] of Object.entries(
        currencyPrices || {}
      )) {
        if (
          currencyPrice?.amount !== "" &&
          typeof currencyPrice?.amount !== "undefined"
        ) {
          prices.push({
            variantId,
            currencyCode,
            amount: castNumber(currencyPrice.amount),
            id: currencyPrice.id,
          })
        }
      }

      for (const [regionId, regionPrice] of Object.entries(
        regionPrices || {}
      )) {
        if (
          regionPrice?.amount !== "" &&
          typeof regionPrice?.amount !== "undefined"
        ) {
          prices.push({
            variantId,
            regionId,
            currencyCode: regionCurrencyMap[regionId],
            amount: castNumber(regionPrice.amount),
            id: regionPrice.id,
          })
        }
      }
    }
  }

  return prices
}

function createMapKey(obj: PriceObject) {
  return `${obj.variantId}-${obj.currencyCode}-${obj.regionId || "none"}-${
    obj.id || "none"
  }`
}

function comparePrices(initialPrices: PriceObject[], newPrices: PriceObject[]) {
  const pricesToUpdate: HttpTypes.AdminUpdatePriceListPrice[] = []
  const pricesToCreate: HttpTypes.AdminCreatePriceListPrice[] = []
  const pricesToDelete: string[] = []

  const initialPriceMap = initialPrices.reduce(
    (map, price) => {
      map[createMapKey(price)] = price
      return map
    },
    {} as Record<string, (typeof initialPrices)[0]>
  )

  const newPriceMap = newPrices.reduce(
    (map, price) => {
      map[createMapKey(price)] = price
      return map
    },
    {} as Record<string, (typeof newPrices)[0]>
  )

  const keys = new Set([
    ...Object.keys(initialPriceMap),
    ...Object.keys(newPriceMap),
  ])

  for (const key of keys) {
    const initialPrice = initialPriceMap[key]
    const newPrice = newPriceMap[key]

    if (initialPrice && newPrice) {
      if (isNaN(newPrice.amount) && newPrice.id) {
        pricesToDelete.push(newPrice.id)
      }

      if (initialPrice.amount !== newPrice.amount && newPrice.id) {
        pricesToUpdate.push({
          id: newPrice.id,
          variant_id: newPrice.variantId,
          currency_code: newPrice.currencyCode,
          rules: newPrice.regionId
            ? { region_id: newPrice.regionId }
            : undefined,
          amount: newPrice.amount,
        })
      }
    }

    if (!initialPrice && newPrice) {
      pricesToCreate.push({
        variant_id: newPrice.variantId,
        currency_code: newPrice.currencyCode,
        rules: newPrice.regionId ? { region_id: newPrice.regionId } : undefined,
        amount: newPrice.amount,
      })
    }

    if (initialPrice && !newPrice && initialPrice.id) {
      pricesToDelete.push(initialPrice.id)
    }
  }

  return { pricesToDelete, pricesToCreate, pricesToUpdate }
}

function sortPrices(
  data: PriceListUpdateProductsSchema,
  initialValue: PriceListUpdateProductsSchema,
  regions: HttpTypes.AdminRegion[]
) {
  const initialPrices = convertToPriceArray(initialValue, regions)
  const newPrices = convertToPriceArray(data, regions)

  return comparePrices(initialPrices, newPrices)
}
