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

export const resolveOfferItems = async ({
  container,
  sellerId,
  currencyCode,
  items,
}: {
  container: MedusaContainer
  sellerId?: string
  currencyCode: string
  items: AddItemInput[]
}): Promise<ResolvedAddItem[]> => {
  const offerIds = items
    .map((i) => i.offer_id)
    .filter((id): id is string => !!id)

  if (offerIds.length === 0) {
    return items.map((i) => {
      if (!i.variant_id) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          "Each item must include either offer_id or variant_id"
        )
      }
      return { ...i, variant_id: i.variant_id }
    })
  }

  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const { data: offers } = await query.graph({
    entity: "offer",
    fields: [
      "id",
      "variant_id",
      "seller_id",
      "shipping_profile_id",
      "prices.amount",
      "prices.currency_code",
    ],
    filters: { id: offerIds },
  })

  const offersById = new Map(
    (offers as Array<{
      id: string
      variant_id: string | null
      seller_id: string | null
      shipping_profile_id?: string | null
      prices?: Array<{ amount: number; currency_code: string }>
    }>).map((o) => [o.id, o])
  )

  return items.map((item) => {
    if (!item.offer_id) {
      if (!item.variant_id) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          "Each item must include either offer_id or variant_id"
        )
      }
      return { ...item, variant_id: item.variant_id }
    }

    const offer = offersById.get(item.offer_id)
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
    if (!offer.variant_id) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `Offer ${item.offer_id} has no linked variant`
      )
    }

    const offerPrice = offer.prices?.find(
      (p) => p.currency_code === currencyCode
    )?.amount

    if (item.unit_price == null && offerPrice == null) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `Offer ${item.offer_id} has no price in ${currencyCode}`
      )
    }

    return {
      variant_id: offer.variant_id,
      quantity: item.quantity,
      unit_price: item.unit_price ?? offerPrice ?? null,
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
      metadata: {
        ...(item.metadata ?? {}),
        offer_id: item.offer_id,
      },
    }
  })
}
