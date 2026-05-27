import {
  ContainerRegistrationKeys,
  MedusaError,
} from "@medusajs/framework/utils"
import { StepResponse } from "@medusajs/framework/workflows-sdk"
import {
  addToCartWorkflow,
  refreshCartItemsWorkflow,
  updateLineItemInCartWorkflow,
} from "@medusajs/medusa/core-flows"

const collectFromInputItems = (
  items: Array<{ offer_id?: string }> | undefined,
): string[] => {
  if (!items?.length) return []
  const ids: string[] = []
  for (const item of items) {
    if (typeof item.offer_id === "string" && item.offer_id.length > 0) {
      ids.push(item.offer_id)
    }
  }
  return ids
}

const collectFromCartItems = async (
  cartId: string,
  container: Parameters<
    Parameters<typeof addToCartWorkflow.hooks.setPricingContext>[0]
  >[1]["container"],
): Promise<string[]> => {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const { data: rows } = await query.graph({
    entity: "cart",
    fields: ["id", "items.offer.id"],
    filters: { id: cartId },
  })
  const cart = rows[0] as
    | { items?: Array<{ offer?: { id?: string } | null }> }
    | undefined
  const ids: string[] = []
  for (const item of cart?.items ?? []) {
    if (item.offer?.id) {
      ids.push(item.offer.id)
    }
  }
  return ids
}

addToCartWorkflow.hooks.setPricingContext(async ({ cart, items }) => {
  const ids = new Set<string>()
  for (const id of collectFromInputItems(items)) ids.add(id)
  for (const item of (cart?.items ?? []) as Array<{
    offer?: { id?: string } | null
  }>) {
    if (item.offer?.id) ids.add(item.offer.id)
  }
  if (!ids.size) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "Every cart line item must resolve to an offer_id",
    )
  }
  return new StepResponse({ offer_id: Array.from(ids) })
})

updateLineItemInCartWorkflow.hooks.setPricingContext(
  async ({ cart, item }, { container }) => {
    const ids = new Set<string>()
    for (const cartItem of (cart?.items ?? []) as Array<{
      id: string
      offer?: { id?: string } | null
    }>) {
      if (cartItem.offer?.id) ids.add(cartItem.offer.id)
    }
    const updatedOffer = (item as { offer?: { id?: string } } | null)?.offer
      ?.id
    if (updatedOffer) ids.add(updatedOffer)

    if (!ids.size && cart?.id) {
      for (const id of await collectFromCartItems(cart.id, container)) {
        ids.add(id)
      }
    }
    if (!ids.size) {
      return new StepResponse({})
    }
    return new StepResponse({ offer_id: Array.from(ids) })
  },
)

refreshCartItemsWorkflow.hooks.setPricingContext(
  async ({ cart_id, items }, { container }) => {
    const ids = new Set<string>()
    for (const id of collectFromInputItems(items)) ids.add(id)
    if (cart_id) {
      for (const id of await collectFromCartItems(cart_id, container)) {
        ids.add(id)
      }
    }
    if (!ids.size) {
      return new StepResponse({})
    }
    return new StepResponse({ offer_id: Array.from(ids) })
  },
)
