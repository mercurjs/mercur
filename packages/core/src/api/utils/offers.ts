import {
  AuthenticatedMedusaRequest,
  MedusaNextFunction,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import type { MedusaContainer } from "@medusajs/framework/types"

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
 * The `offer ↔ variant` link is shared across sellers, so a raw graph
 * traversal would surface every seller's offers on a master variant.
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
    { variants: { id: variantIds.length ? variantIds : ["__none__"] } },
  ]

  return next()
}
