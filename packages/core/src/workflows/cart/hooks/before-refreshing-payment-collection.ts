import {
  ContainerRegistrationKeys,
  Modules,
} from "@medusajs/framework/utils"
import { refreshCartItemsWorkflow } from "@medusajs/medusa/core-flows"
import { MercurModules } from "@mercurjs/types"

type AdditionalDataPayload = {
  mercur?: {
    offer_ids_by_variant?: Record<string, string>
  }
}

type CartLineWithOffer = {
  id: string
  variant_id: string | null
  offer?: { id?: string } | null
}

const readCarrier = (
  additional_data: Record<string, unknown> | undefined,
): Record<string, string> => {
  const carrier = (additional_data as AdditionalDataPayload | undefined)
    ?.mercur?.offer_ids_by_variant
  if (!carrier || typeof carrier !== "object") {
    return {}
  }
  return carrier
}

/**
 * Cart-line ↔ offer link writer. Fires inside `refreshCartItemsWorkflow`
 * after line items, taxes, and promotions have settled. Writes the
 * `cart_line_item ↔ offer` link for any new line item that doesn't have
 * one yet — the `additional_data.mercur.offer_ids_by_variant` carrier
 * (stamped by Mercur's storefront route) provides the mapping.
 *
 * SPEC-007 note: stock reservation lives in
 * `completeCartWithSplitOrdersWorkflow` (the order-split workflow's
 * `reserveInventoryStep` call), not here. The hook documented in SPEC-007
 * §"Hook 3" — diff/create/adjust/release reservation sets — is deferred
 * to a follow-up session; this lighter handler preserves the existing
 * order-placement reservation flow without double-reserving.
 */
refreshCartItemsWorkflow.hooks.beforeRefreshingPaymentCollection(
  async ({ input }, { container }) => {
    const cartId = input.cart_id
    if (!cartId) return

    const carrier = readCarrier(input.additional_data)
    if (!Object.keys(carrier).length) return

    const query = container.resolve(ContainerRegistrationKeys.QUERY)
    const link = container.resolve(ContainerRegistrationKeys.LINK)

    const { data: cartRows } = await query.graph({
      entity: "cart",
      fields: [
        "id",
        "items.id",
        "items.variant_id",
        "items.offer.id",
      ],
      filters: { id: cartId },
    })
    const cart = cartRows[0] as
      | { id: string; items?: CartLineWithOffer[] }
      | undefined
    if (!cart?.items?.length) return

    const linksToCreate: Array<{
      line_item_id: string
      offer_id: string
    }> = []
    for (const item of cart.items) {
      if (item.offer?.id) continue
      const variantId = item.variant_id
      if (!variantId) continue
      const offerId = carrier[variantId]
      if (!offerId) continue
      linksToCreate.push({ line_item_id: item.id, offer_id: offerId })
    }

    if (!linksToCreate.length) return

    await link.create(
      linksToCreate.map((row) => ({
        [Modules.CART]: { line_item_id: row.line_item_id },
        [MercurModules.OFFER]: { offer_id: row.offer_id },
      })),
    )
  },
)
