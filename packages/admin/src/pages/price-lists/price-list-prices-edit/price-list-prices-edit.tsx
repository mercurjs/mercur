import { useMemo } from "react"
import { useParams, useSearchParams } from "react-router-dom"
import { PriceListPricesEditForm } from "./components/price-list-prices-edit-form"
import { usePriceList, useProducts } from "@hooks/api"
import { OfferDTO } from "@mercurjs/types"
import { useOffers } from "../../../hooks/api/offers"
import { RouteFocusModal } from "@components/modals"
import { buildOfferGridData } from "../common/build-offer-grid-data"
import { usePriceListCurrencyData } from "../common/hooks/use-price-list-currency-data"

export const PriceListPricesEdit = () => {
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const ids = searchParams.get("ids[]")
  const productFilter = useMemo(() => (ids ? ids.split(",") : undefined), [ids])

  const { price_list, isLoading, isError, error } = usePriceList(id!, {
    fields:
      "id,title,+prices.amount,+prices.currency_code,+prices.price_set.variant.id,+prices.price_rules.attribute,+prices.price_rules.value",
  })

  // offer_ids currently priced in this list.
  const offerIds = useMemo(() => {
    const set = new Set<string>()
    for (const price of price_list?.prices ?? []) {
      const offerId = (price as { rules?: Record<string, string> }).rules
        ?.offer_id
      if (offerId) {
        set.add(offerId)
      }
    }
    return Array.from(set)
  }, [price_list])

  // Resolve the priced offers to their (seller, product) pairs; we then show
  // every one of that seller's offers for those products, not only the priced
  // variants, so the admin can price the seller's other variants too.
  const { offers: pricedOffers } = useOffers(
    {
      id: offerIds,
      limit: offerIds.length || 1,
      fields: "id,seller_id,product_id",
    },
    { enabled: offerIds.length > 0 }
  )

  const { pairs, sellerIds } = useMemo(() => {
    const p = new Set<string>()
    const s = new Set<string>()
    for (const offer of (pricedOffers ?? []) as OfferDTO[]) {
      p.add(`${offer.seller_id}::${offer.product_id}`)
      s.add(offer.seller_id)
    }
    return { pairs: p, sellerIds: Array.from(s) }
  }, [pricedOffers])

  const { offers } = useOffers(
    {
      seller_id: sellerIds,
      limit: 1000,
      fields:
        "id,variant_id,product_id,seller_id,sku,seller.name,product.title,product.thumbnail",
    },
    { enabled: sellerIds.length > 0 }
  )

  const scopedOffers = useMemo(() => {
    const allowedProducts = productFilter ? new Set(productFilter) : undefined
    return ((offers ?? []) as OfferDTO[]).filter(
      (o) =>
        pairs.has(`${o.seller_id}::${o.product_id}`) &&
        (!allowedProducts || allowedProducts.has(o.product_id))
    )
  }, [offers, pairs, productFilter])

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
        products ?? []
      ),
    [scopedOffers, products]
  )

  const currencyData = usePriceListCurrencyData()

  const ready =
    currencyData.isReady &&
    !isLoading &&
    !!price_list &&
    !isProductsLoading &&
    !!products

  if (isError) {
    throw error
  }

  if (isProductsError) {
    throw productError
  }

  return (
    <RouteFocusModal prev={`/price-lists/${id}`}>
      <RouteFocusModal.Title asChild>
        <span className="sr-only">Edit Prices for {price_list?.title}</span>
      </RouteFocusModal.Title>
      <RouteFocusModal.Description className="sr-only">
        Update prices for offers in the price list
      </RouteFocusModal.Description>
      {ready && (
        <PriceListPricesEditForm
          priceList={price_list}
          gridData={gridData}
          variantIdByOffer={variantIdByOffer}
          {...currencyData}
        />
      )}
    </RouteFocusModal>
  )
}
