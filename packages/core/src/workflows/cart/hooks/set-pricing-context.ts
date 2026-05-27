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

type AdditionalDataPayload = {
  mercur?: {
    offer_ids_by_variant?: Record<string, string>
  }
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

/**
 * Bind one shared handler to `addToCartWorkflow`,
 * `updateLineItemInCartWorkflow`, and `refreshCartItemsWorkflow`. The
 * returned `{ offer_id: <string[]> }` is spread into the shared base
 * context that `getVariantsAndItemsWithPrices` then overlays per-item.
 *
 * Resolution sources, in priority order:
 *  1. `input.items[i].offer_id` — present on add-to-cart inputs.
 *  2. `additional_data.mercur.offer_ids_by_variant` — bootstrap carrier
 *     stamped by the storefront route for first-add refresh runs.
 *  3. `cart.items[*].offer.id` — the writable `cart_line_item ↔ offer`
 *     link; the steady-state source for any line that has been linked.
 *
 * The handler does NOT call `pricingModule.calculatePrices` itself —
 * Medusa's stock infrastructure handles that downstream.
 */
addToCartWorkflow.hooks.setPricingContext(
  async ({ cart, items, additional_data }) => {
    const ids = new Set<string>()
    for (const id of collectFromInputItems(items)) ids.add(id)
    const carrier = readCarrier(additional_data)
    for (const id of Object.values(carrier)) {
      if (typeof id === "string" && id.length > 0) ids.add(id)
    }
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
  },
)

updateLineItemInCartWorkflow.hooks.setPricingContext(
  async ({ cart, item, additional_data }, { container }) => {
    const ids = new Set<string>()
    const carrier = readCarrier(additional_data)
    for (const id of Object.values(carrier)) {
      if (typeof id === "string" && id.length > 0) ids.add(id)
    }
    for (const cartItem of (cart?.items ?? []) as Array<{
      id: string
      offer?: { id?: string } | null
    }>) {
      if (cartItem.offer?.id) ids.add(cartItem.offer.id)
    }
    const updatedOffer = (item as { offer?: { id?: string } } | null)?.offer
      ?.id
    if (updatedOffer) ids.add(updatedOffer)

    // Fallback: Medusa's `cart` payload may not include the offer
    // relation. Resolve via Query when nothing else surfaced an
    // offer_id.
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
  async ({ cart_id, items, additional_data }, { container }) => {
    const ids = new Set<string>()
    for (const id of collectFromInputItems(items)) ids.add(id)
    const carrier = readCarrier(additional_data)
    for (const id of Object.values(carrier)) {
      if (typeof id === "string" && id.length > 0) ids.add(id)
    }
    if (cart_id) {
      for (const id of await collectFromCartItems(cart_id, container)) {
        ids.add(id)
      }
    }
    if (!ids.size) {
      // No items in the cart yet; let Medusa proceed without an offer_id
      // override. Pricing will fall back to variant-level rows (which
      // are empty in the marketplace model, so no rows resolve — but
      // that is fine because there are no items to price either).
      return new StepResponse({})
    }
    return new StepResponse({ offer_id: Array.from(ids) })
  },
)
