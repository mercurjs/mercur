import {
  ContainerRegistrationKeys,
  MedusaError,
  Modules,
} from "@medusajs/framework/utils"
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { MercurModules } from "@mercurjs/types"

export type MirrorLineItemOfferLinksToOrderInput = {
  cart_id: string
  order_line_item_ids: string[]
}

export const mirrorLineItemOfferLinksToOrderStepId =
  "mirror-line-item-offer-links-to-order"

export const mirrorLineItemOfferLinksToOrderStep = createStep(
  mirrorLineItemOfferLinksToOrderStepId,
  async (input: MirrorLineItemOfferLinksToOrderInput, { container }) => {
    if (!input.order_line_item_ids?.length) {
      return new StepResponse([], [])
    }

    const query = container.resolve(ContainerRegistrationKeys.QUERY)
    const link = container.resolve(ContainerRegistrationKeys.LINK)

    const { data: orderItems } = await query.graph({
      entity: "order_line_item",
      fields: ["id", "metadata"],
      filters: { id: input.order_line_item_ids },
    })

    const cartLineItemIds = orderItems
      .map((item) => (item.metadata as Record<string, unknown> | null)?.cart_line_item_id)
      .filter((id): id is string => typeof id === "string" && !!id)

    if (!cartLineItemIds.length) {
      return new StepResponse([], [])
    }

    const { data: cartItems } = await query.graph({
      entity: "line_item",
      fields: ["id", "offer.id"],
      filters: { id: cartLineItemIds },
    })

    const offerByCartLine = new Map<string, string>()
    for (const row of cartItems) {
      const offerId = (row as { offer?: { id?: string } | null }).offer?.id
      if (offerId) {
        offerByCartLine.set(row.id, offerId)
      }
    }

    const links = orderItems
      .map((item) => {
        const cartLineId = (item.metadata as Record<string, unknown> | null)
          ?.cart_line_item_id
        if (typeof cartLineId !== "string") {
          return null
        }
        const offerId = offerByCartLine.get(cartLineId)
        if (!offerId) {
          return null
        }
        return {
          [Modules.ORDER]: { order_line_item_id: item.id },
          [MercurModules.OFFER]: { offer_id: offerId },
        }
      })
      .filter((row): row is NonNullable<typeof row> => row !== null)

    if (!links.length) {
      return new StepResponse([], [])
    }

    if (links.length !== orderItems.length) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `mirrorLineItemOfferLinksToOrderStep could not resolve an offer for every order line: ${links.length}/${orderItems.length} matched`,
      )
    }

    await link.create(links)
    return new StepResponse(links, links)
  },
  async (createdLinks, { container }) => {
    if (!createdLinks?.length) {
      return
    }
    const link = container.resolve(ContainerRegistrationKeys.LINK)
    await link.dismiss(createdLinks)
  },
)
