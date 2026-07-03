import {
  ContainerRegistrationKeys,
  Modules,
} from "@medusajs/framework/utils"
import { refreshCartItemsWorkflow } from "@medusajs/medusa/core-flows"
import { MercurModules } from "@mercurjs/types"

type CartLineWithOffer = {
  id: string
  offer?: { id?: string } | null
  metadata?: Record<string, unknown> | null
}

refreshCartItemsWorkflow.hooks.beforeRefreshingPaymentCollection(
  async ({ input }, { container }) => {
    const cartId = input.cart_id
    if (!cartId) return

    const query = container.resolve(ContainerRegistrationKeys.QUERY)
    const link = container.resolve(ContainerRegistrationKeys.LINK)

    const { data: cartRows } = await query.graph({
      entity: "cart",
      fields: ["id", "items.id", "items.offer.id", "items.metadata"],
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
      const offerId = item.metadata?.offer_id
      if (typeof offerId !== "string" || !offerId.length) continue
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
