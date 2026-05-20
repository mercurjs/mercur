import {
  ContainerRegistrationKeys,
  MedusaError,
  Modules,
} from "@medusajs/framework/utils"
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { MercurModules } from "@mercurjs/types"

export type LinkLineItemToOfferInput = Array<{
  line_item_id: string
  offer_id: string
}>

export const linkLineItemToOfferStepId = "link-line-item-to-offer"

export const linkLineItemToOfferStep = createStep(
  linkLineItemToOfferStepId,
  async (input: LinkLineItemToOfferInput, { container }) => {
    if (!input?.length) {
      return new StepResponse([], [])
    }

    for (const row of input) {
      if (!row.line_item_id || !row.offer_id) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          "linkLineItemToOfferStep requires both line_item_id and offer_id on every entry",
        )
      }
    }

    const link = container.resolve(ContainerRegistrationKeys.LINK)

    const links = input.map((row) => ({
      [Modules.CART]: { line_item_id: row.line_item_id },
      [MercurModules.OFFER]: { offer_id: row.offer_id },
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
