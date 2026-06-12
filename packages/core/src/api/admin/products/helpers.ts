import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import type { MedusaContainer } from "@medusajs/framework/types"

/**
 * Field set pulled for each offer attached by
 * `wrapProductVariantsWithOffers`. Mirrors the admin offer-detail shape
 * (identity + seller + shipping profile + price ladder + inventory-item
 * links). Unlike the vendor wrap this is **platform-wide** — every
 * seller's offers are attached, so `seller.*` is included to let the
 * admin Store column / Variants-table Store cell disambiguate rows.
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
  "seller.id",
  "seller.name",
  "seller.handle",
  "shipping_profile.id",
  "shipping_profile.name",
  "prices.id",
  "prices.amount",
  "prices.currency_code",
  "prices.min_quantity",
  "prices.max_quantity",
  // Offer ↔ inventory-item link (same alias the offer detail uses), with
  // per-location stock levels so the read-only Inventory cell can render.
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
 * Attaches offers under each variant of the given products, in place
 * (`variant.offers = [...]`). Admin is **platform-wide**: by default it
 * attaches **every** seller's offers on a variant (the inverse of the
 * seller-scoped vendor wrap), each carrying `offer.seller` so the UI can
 * render the Store dimension. Passing `sellerId` narrows the attach to a
 * single store (used by the per-store offers view). Variants with no
 * offer get `offers: []`.
 *
 * The offers are still fetched via one bounded query over the page's
 * variant ids and keyed onto the matching variants — mirroring Medusa's
 * `wrapProductsWithTaxPrices` post-query enrichment pattern.
 */
export const wrapProductVariantsWithOffers = async (
  scope: MedusaContainer,
  products: WrappableProduct[],
  sellerId?: string
): Promise<void> => {
  const variantIds = Array.from(
    new Set(products.flatMap((p) => (p.variants ?? []).map((v) => v.id)))
  )

  if (!variantIds.length) {
    return
  }

  const query = scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data: offers } = await query.graph({
    entity: "offer",
    fields: OFFER_WRAP_FIELDS,
    filters: {
      variant_id: variantIds,
      ...(sellerId ? { seller_id: sellerId } : {}),
    },
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
