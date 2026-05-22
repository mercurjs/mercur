import {
  ContainerRegistrationKeys,
  MedusaError,
  Modules,
} from "@medusajs/framework/utils"
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { MercurModules } from "@mercurjs/types"

export type OrderLineItemOfferPair = {
  order_line_item_id: string
  offer_id: string
}

export type MirrorLineItemOfferLinksToOrderInput = {
  pairs: OrderLineItemOfferPair[]
}

export const mirrorLineItemOfferLinksToOrderStepId =
  "mirror-line-item-offer-links-to-order"

export const mirrorLineItemOfferLinksToOrderStep = createStep(
  mirrorLineItemOfferLinksToOrderStepId,
  async (input: MirrorLineItemOfferLinksToOrderInput, { container }) => {
    const pairs = input.pairs ?? []
    if (!pairs.length) {
      return new StepResponse([], [])
    }

    for (const pair of pairs) {
      if (!pair.order_line_item_id || !pair.offer_id) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          "mirrorLineItemOfferLinksToOrderStep received a pair missing order_line_item_id or offer_id",
        )
      }
    }

    const link = container.resolve(ContainerRegistrationKeys.LINK)
    const links = pairs.map((pair) => ({
      [Modules.ORDER]: { order_line_item_id: pair.order_line_item_id },
      [MercurModules.OFFER]: { offer_id: pair.offer_id },
    }))

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
