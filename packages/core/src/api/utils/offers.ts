import {
  AuthenticatedMedusaRequest,
  MedusaNextFunction,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import type { MedusaContainer } from "@medusajs/framework/types"

/**
 * Field set pulled for each offer attached by
 * `wrapProductVariantsWithOffers`. Carries the offer identity + seller +
 * shipping profile + price ladder + inventory-item links (with per-location
 * stock). `seller.*` lets the admin (platform-wide) Store column resolve;
 * it is harmless for the seller-scoped vendor reads.
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
 * (`variant.offers = [...]`). The `offer ↔ variant` link is shared across
 * sellers, so a raw graph traversal would surface every seller's offers on
 * a master variant — this fetches them with one bounded query over the
 * page's variant ids and keys them onto the matching variants. Mirrors
 * Medusa's `wrapProductsWithTaxPrices` post-query enrichment pattern.
 *
 * Pass `sellerId` to scope the attach to a single seller (the vendor
 * Offers surface, where a competitor's offers must never leak). Omit it
 * for the platform-wide admin surface, which attaches **every** seller's
 * offers (each carrying `offer.seller`). Variants with no offer get
 * `offers: []`.
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

type OfferAwareRequest = AuthenticatedMedusaRequest & {
  seller_context?: { seller_id?: string }
}

/**
 * Scopes a product list to products carrying at least one offer, when
 * `?has_offer=true`. Shared by the vendor and admin Offers lists, which
 * back their product-grained rows with the product endpoint:
 *
 * - **Vendor** — `req.seller_context.seller_id` is always set, so the scope
 *   is the active seller's offered products (a competitor's offered product
 *   never appears).
 * - **Admin** — no seller context; the optional `seller_id` query param is
 *   the Offers **Store** filter (consumed here so it scopes the offer's
 *   store, not product ownership). Absent it, the scope is every offered
 *   product across the marketplace.
 *
 * Either way it resolves the offered variant ids and constrains the product
 * query to products carrying one of them. The `has_offer` pseudo-filter is
 * consumed and removed so it never reaches the product graph read.
 */
export const applyOfferedProductsFilter = async (
  req: OfferAwareRequest,
  _res: MedusaResponse,
  next: MedusaNextFunction
) => {
  req.filterableFields ??= {}
  const hasOffer = req.filterableFields.has_offer
  delete req.filterableFields.has_offer

  if (hasOffer !== true) {
    return next()
  }

  // Vendor: the active seller. Admin: the optional store filter (consumed
  // here so `seller_id` scopes the offer's store, not product ownership).
  const contextSellerId = req.seller_context?.seller_id
  const sellerId =
    contextSellerId ?? (req.filterableFields.seller_id as string | string[] | undefined)
  if (!contextSellerId) {
    delete req.filterableFields.seller_id
  }

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data: offers } = await query.graph({
    entity: "offer",
    fields: ["variant_id"],
    filters: sellerId ? { seller_id: sellerId } : {},
  })

  const variantIds = Array.from(
    new Set(
      offers
        .map((offer: { variant_id: string | null }) => offer.variant_id)
        .filter((id: string | null): id is string => Boolean(id))
    )
  )

  const existingAnd = (req.filterableFields.$and as object[] | undefined) ?? []
  req.filterableFields.$and = [
    ...existingAnd,
    // No offers → match nothing (empty list) rather than the whole catalogue.
    { variants: { id: variantIds.length ? variantIds : ["__none__"] } },
  ]

  return next()
}
