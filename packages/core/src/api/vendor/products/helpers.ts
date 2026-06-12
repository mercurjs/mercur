import {
  ContainerRegistrationKeys,
  MedusaError,
} from "@medusajs/framework/utils"
import type { MedusaContainer } from "@medusajs/framework/types"

/**
 * Field set pulled for each offer attached by
 * `wrapProductVariantsWithOffers`. Mirrors the offer-detail shape the
 * vendor Offers surface renders (identity + shipping profile + price
 * ladder + inventory-item links), scoped to one seller.
 */
const OFFER_WRAP_FIELDS = [
  "id",
  "seller_id",
  "variant_id",
  "shipping_profile_id",
  "sku",
  "ean",
  "upc",
  "created_at",
  "updated_at",
  "shipping_profile.id",
  "shipping_profile.name",
  "prices.id",
  "prices.amount",
  "prices.currency_code",
  "prices.min_quantity",
  "prices.max_quantity",
  // Offer ↔ inventory-item link (same alias the offer detail uses), with
  // per-location stock levels so the bulk Edit Stock Levels grid can seed.
  "inventory_item_link.id",
  "inventory_item_link.required_quantity",
  "inventory_item_link.inventory_item_id",
  "inventory_item_link.inventory_item.id",
  "inventory_item_link.inventory_item.sku",
  "inventory_item_link.inventory_item.title",
  "inventory_item_link.inventory_item.location_levels.id",
  "inventory_item_link.inventory_item.location_levels.location_id",
  "inventory_item_link.inventory_item.location_levels.stocked_quantity",
]

type WrappableVariant = { id: string; offers?: unknown[] }
type WrappableProduct = { variants?: WrappableVariant[] | null }
type OfferRow = { variant_id: string }

/**
 * Attaches the active seller's offers under each variant of the given
 * products, in place (`variant.offers = [...]`). The Offer ↔ Variant
 * link is shared across sellers, so a raw graph traversal would leak
 * every seller's offers on a master variant — this wrap fetches only
 * `seller_id`'s offers (one bounded query over the page's variant ids)
 * and keys them onto the matching variants. Variants the seller has no
 * offer on get `offers: []`. Mirrors Medusa's
 * `wrapProductsWithTaxPrices` / `wrapVariantsWithInventoryQuantity…`
 * post-query enrichment pattern.
 */
export const wrapProductVariantsWithOffers = async (
  scope: MedusaContainer,
  sellerId: string,
  products: WrappableProduct[]
): Promise<void> => {
  const variantIds = Array.from(
    new Set(
      products.flatMap((p) => (p.variants ?? []).map((v) => v.id))
    )
  )

  if (!variantIds.length) {
    return
  }

  const query = scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data: offers } = await query.graph({
    entity: "offer",
    fields: OFFER_WRAP_FIELDS,
    filters: { seller_id: sellerId, variant_id: variantIds },
  })

  const offersByVariant = new Map<string, unknown[]>()
  for (const offer of offers as OfferRow[]) {
    const existing = offersByVariant.get(offer.variant_id)
    if (existing) {
      existing.push(offer)
    } else {
      offersByVariant.set(offer.variant_id, [offer])
    }
  }

  for (const product of products) {
    for (const variant of product.variants ?? []) {
      variant.offers = offersByVariant.get(variant.id) ?? []
    }
  }
}

/**
 * Throws `NOT_FOUND` (rather than `NOT_ALLOWED`) when the seller does
 * not own the product. The product is technically queryable for them
 * if `status = published`, but mutations require ownership; the 404
 * shape avoids leaking the difference.
 */
export const ensureSellerOwnsProduct = async (
  scope: MedusaContainer,
  sellerId: string,
  productId: string
): Promise<void> => {
  const query = scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data } = await query.graph({
    entity: "product_seller",
    fields: ["product_id"],
    filters: {
      seller_id: sellerId,
      product_id: productId,
    },
  })

  if (!data?.length) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Product with id ${productId} was not found`
    )
  }
}
