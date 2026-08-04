import { OfferDTO } from "@mercurjs/types"
import { buildOfferGridData } from "@mercurjs/dashboard-shared"
import { useMemo } from "react"

import { useOffers } from "@hooks/api/offers"
import { usePriceList } from "@hooks/api/price-lists"
import { useProducts } from "@hooks/api/products"
import { usePriceListCurrencyData } from "@pages/price-lists/common/hooks/use-price-list-currency-data"

type PriceRuleShape = {
  rules?: Record<string, string> | null
  price_rules?: { attribute?: string | null; value?: string | null }[] | null
}

const extractOfferId = (price: PriceRuleShape) =>
  price.rules?.offer_id ??
  price.price_rules?.find((r) => r.attribute === "offer_id")?.value ??
  undefined

/**
 * Builds the offer-keyed grid for the edit-prices flow: resolve the priced
 * offers → their products, then show every one of the seller's offers for those
 * products (so untouched variants can also be priced). Prices carry `offer_id`
 * so overrides stay scoped to the seller's offer.
 */
export const usePriceListEditGrid = (
  id: string,
  productFilter?: string[]
) => {
  const { price_list, isLoading, isError, error } = usePriceList(id, {
    fields:
      "id,title,+prices.amount,+prices.currency_code,+prices.price_set.variant.id,+prices.price_rules.attribute,+prices.price_rules.value",
  })

  const offerIds = useMemo(() => {
    const set = new Set<string>()
    for (const price of (price_list?.prices ?? []) as PriceRuleShape[]) {
      const offerId = extractOfferId(price)
      if (offerId) {
        set.add(offerId)
      }
    }
    return Array.from(set)
  }, [price_list])

  const { offers: pricedOffers } = useOffers(
    {
      id: offerIds,
      limit: offerIds.length || 1,
      fields: "id,product_id",
    },
    { enabled: offerIds.length > 0 }
  )

  const pricedProductIds = useMemo(() => {
    const set = new Set<string>()
    for (const offer of (pricedOffers ?? []) as OfferDTO[]) {
      set.add(offer.product_id)
    }
    return set
  }, [pricedOffers])

  // Vendor offers are auto seller-scoped by the API; fetch them all and filter
  // to the priced products client-side (the route has no product_id filter).
  const { offers: allOffers } = useOffers(
    {
      limit: 1000,
      fields:
        "id,variant_id,product_id,sku,product.title,product.thumbnail",
    },
    { enabled: pricedProductIds.size > 0 }
  )

  const scopedOffers = useMemo(() => {
    const allowed = productFilter ? new Set(productFilter) : undefined
    return ((allOffers ?? []) as OfferDTO[]).filter(
      (o) =>
        pricedProductIds.has(o.product_id) &&
        (!allowed || allowed.has(o.product_id))
    )
  }, [allOffers, pricedProductIds, productFilter])

  const productIds = useMemo(
    () => Array.from(new Set(scopedOffers.map((o) => o.product_id))),
    [scopedOffers]
  )

  const {
    products,
    isLoading: isProductsLoading,
    isError: isProductsError,
    error: productError,
  } = useProducts(
    {
      id: productIds,
      limit: productIds.length || 1,
      fields: "id,*variants",
    },
    { enabled: productIds.length > 0 }
  )

  const { gridData, variantIdByOffer } = useMemo(
    () =>
      buildOfferGridData(
        scopedOffers,
        (products ?? []) as {
          variants?: { id: string; title?: string | null }[] | null
        }[]
      ),
    [scopedOffers, products]
  )

  const currencyData = usePriceListCurrencyData()

  // Only render once the grid data is fully built, so the form/DataGrid doesn't
  // mount with an empty grid and then flicker as the staged fetches resolve.
  const gridDataReady =
    offerIds.length === 0 ||
    (allOffers !== undefined &&
      (productIds.length === 0 || products !== undefined))

  const ready =
    currencyData.isReady &&
    !isLoading &&
    !!price_list &&
    !isProductsLoading &&
    gridDataReady

  return {
    price_list,
    gridData,
    variantIdByOffer,
    currencyData,
    ready,
    isError,
    error,
    isProductsError,
    productError,
  }
}
