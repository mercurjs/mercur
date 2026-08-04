import { OfferDTO } from "@mercurjs/types"

/**
 * The Prices grid is keyed by **offer**, not variant: the same product sold by
 * two sellers must show as two separate groups (product + seller) with their own
 * variant rows, never merged. Each offer row binds prices to `offers.<offer_id>`.
 */
export type PriceListGridGroupRow = {
  __group: true
  id: string
  product_title: string
  product_thumbnail?: string | null
  seller_name: string
}

export type PriceListGridOfferRow = {
  __group: false
  id: string
  offer_id: string
  variant_id: string
  variant_title: string
  product_id: string
  seller_name: string
  sku: string
}

export type PriceListGridRow = PriceListGridGroupRow | PriceListGridOfferRow

export const isPriceListGroupRow = (
  row: PriceListGridRow
): row is PriceListGridGroupRow =>
  (row as PriceListGridGroupRow).__group === true

type ProductWithVariants = {
  variants?: { id: string; title?: string | null }[] | null
}

/**
 * Turn the selected offers + their products into the interleaved grid rows for
 * the Prices grid: one group header per (product, seller) followed by that
 * seller's variant/offer rows. The same product from two sellers yields two
 * separate groups. Also returns offer_id -> variant_id for seeding the form.
 */
export const buildOfferGridData = (
  offers: OfferDTO[],
  products: ProductWithVariants[]
) => {
  const variantTitle: Record<string, string> = {}
  // Canonical variant order per product, so rows sort like the variant column.
  const variantOrder: Record<string, number> = {}
  for (const product of products) {
    ;(product.variants ?? []).forEach((variant, index) => {
      variantTitle[variant.id] = variant.title ?? ""
      variantOrder[variant.id] = index
    })
  }

  const variantIdByOffer: Record<string, string> = {}

  const groups = new Map<
    string,
    {
      product_title: string
      product_thumbnail?: string | null
      seller_name: string
      offers: OfferDTO[]
    }
  >()

  for (const offer of offers) {
    variantIdByOffer[offer.id] = offer.variant_id
    const key = `${offer.product_id}::${offer.seller_id}`
    const group = groups.get(key)
    if (group) {
      group.offers.push(offer)
    } else {
      groups.set(key, {
        product_title: offer.product?.title ?? "",
        product_thumbnail: offer.product?.thumbnail ?? null,
        seller_name: offer.seller?.name ?? "",
        offers: [offer],
      })
    }
  }

  const gridData: PriceListGridRow[] = []
  for (const [key, group] of groups) {
    gridData.push({
      __group: true,
      id: `group-${key}`,
      product_title: group.product_title,
      product_thumbnail: group.product_thumbnail,
      seller_name: group.seller_name,
    })
    const sortedOffers = [...group.offers].sort((a, b) => {
      const oa = variantOrder[a.variant_id]
      const ob = variantOrder[b.variant_id]
      if (oa !== undefined && ob !== undefined && oa !== ob) {
        return oa - ob
      }
      return (variantTitle[a.variant_id] ?? a.sku ?? "").localeCompare(
        variantTitle[b.variant_id] ?? b.sku ?? ""
      )
    })
    for (const offer of sortedOffers) {
      gridData.push({
        __group: false,
        id: offer.id,
        offer_id: offer.id,
        variant_id: offer.variant_id,
        variant_title: variantTitle[offer.variant_id] ?? offer.sku ?? "",
        product_id: offer.product_id,
        seller_name: group.seller_name,
        sku: offer.sku ?? "",
      })
    }
  }

  return { gridData, variantIdByOffer }
}
