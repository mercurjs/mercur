import { MedusaContainer } from "@medusajs/framework/types"
import {
  ContainerRegistrationKeys,
  MedusaError,
} from "@medusajs/framework/utils"

export type AddItemInput = {
  variant_id?: string
  offer_id?: string
  quantity: number
  unit_price?: number | null
  internal_note?: string | null
  allow_backorder?: boolean
  metadata?: Record<string, unknown> | null
}

type ResolvedAddItem = Omit<AddItemInput, "offer_id"> & {
  variant_id: string
  unit_price?: number | null
  requires_shipping?: boolean
  metadata?: Record<string, unknown> | null
}

type OfferRow = {
  id: string
  variant_id: string | null
  seller_id: string | null
  shipping_profile_id?: string | null
  prices?: Array<{ amount: number; currency_code: string }>
}

const OFFER_FIELDS = [
  "id",
  "variant_id",
  "seller_id",
  "shipping_profile_id",
  "prices.amount",
  "prices.currency_code",
]

const RESERVED_ITEM_METADATA_KEYS = ["offer_id", "seller_id"] as const

const stripReservedItemMetadata = (
  metadata: Record<string, unknown> | null | undefined
): Record<string, unknown> => {
  const clean = { ...(metadata ?? {}) }
  for (const key of RESERVED_ITEM_METADATA_KEYS) {
    delete clean[key]
  }
  return clean
}

export const resolveOfferItems = async ({
  container,
  sellerId,
  currencyCode,
  items,
  trustUnitPrice = false,
}: {
  container: MedusaContainer
  sellerId?: string
  currencyCode: string
  items: AddItemInput[]
  /**
   * Only the operator may price an item by hand. Vendor routes leave this
   * off so a captured order's total can't be inflated past the offer price.
   */
  trustUnitPrice?: boolean
}): Promise<ResolvedAddItem[]> => {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)

  const offerIds = items
    .map((i) => i.offer_id)
    .filter((id): id is string => !!id)
  const variantIds = items
    .filter((i) => !i.offer_id && i.variant_id)
    .map((i) => i.variant_id as string)

  const offersById = new Map<string, OfferRow>()
  if (offerIds.length) {
    const { data } = await query.graph({
      entity: "offer",
      fields: OFFER_FIELDS,
      filters: { id: offerIds },
    })
    for (const offer of data as OfferRow[]) {
      offersById.set(offer.id, offer)
    }
  }

  const offersByVariant = new Map<string, OfferRow>()
  if (sellerId && variantIds.length) {
    const { data } = await query.graph({
      entity: "offer",
      fields: OFFER_FIELDS,
      filters: { variant_id: variantIds, seller_id: sellerId },
    })
    for (const offer of data as OfferRow[]) {
      if (offer.variant_id && !offersByVariant.has(offer.variant_id)) {
        offersByVariant.set(offer.variant_id, offer)
      }
    }
  }

  return items.map((item) => {
    const metadata = stripReservedItemMetadata(item.metadata)

    if (!item.offer_id && !item.variant_id) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Each item must include either offer_id or variant_id"
      )
    }

    let offer: OfferRow | undefined
    if (item.offer_id) {
      offer = offersById.get(item.offer_id)
      if (!offer) {
        throw new MedusaError(
          MedusaError.Types.NOT_FOUND,
          `Offer ${item.offer_id} not found`
        )
      }
      if (sellerId && offer.seller_id !== sellerId) {
        throw new MedusaError(
          MedusaError.Types.NOT_ALLOWED,
          `Offer ${item.offer_id} does not belong to this seller`
        )
      }
    } else if (sellerId) {
      offer = offersByVariant.get(item.variant_id as string)
      if (!offer) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          `Variant ${item.variant_id} has no offer owned by this seller`
        )
      }
    }

    if (!offer) {
      return { ...item, variant_id: item.variant_id as string, metadata }
    }

    if (!offer.variant_id) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `Offer ${offer.id} has no linked variant`
      )
    }

    const offerPrice = offer.prices?.find(
      (p) => p.currency_code === currencyCode
    )?.amount
    const customPrice = trustUnitPrice ? item.unit_price : undefined

    if (customPrice == null && offerPrice == null) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `Offer ${offer.id} has no price in ${currencyCode}`
      )
    }

    return {
      variant_id: offer.variant_id,
      quantity: item.quantity,
      unit_price: customPrice ?? offerPrice ?? null,
      // In Mercur the shipping profile is owned by the offer (per-seller),
      // not the product. Medusa's add-items workflow derives a line item's
      // `requires_shipping` from `product.shipping_profile` /
      // `inventory.requires_shipping`, neither of which reflects the offer —
      // so offer items added via order-edit / exchange / claim flows would
      // otherwise default to `requires_shipping: false` and lose the
      // "Mark as Shipped" fulfillment action. Set it explicitly from the
      // offer's shipping profile so it matches checkout behavior.
      requires_shipping: !!offer.shipping_profile_id,
      internal_note: item.internal_note,
      allow_backorder: item.allow_backorder,
      metadata: { ...metadata, offer_id: offer.id },
    }
  })
}
