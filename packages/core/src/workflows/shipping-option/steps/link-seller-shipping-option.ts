import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"

import { SELLER_MODULE } from "../../../modules/seller"

type LinkSellerShippingOptionStepInput = {
  seller_id: string
  shipping_option_ids: string[]
}

export const linkSellerShippingOptionStep = createStep(
  "link-seller-shipping-option",
  async (input: LinkSellerShippingOptionStepInput, { container }) => {
    const remoteLink = container.resolve(ContainerRegistrationKeys.REMOTE_LINK)

    const links = input.shipping_option_ids.map((shippingOptionId) => ({
      [SELLER_MODULE]: {
        seller_id: input.seller_id,
      },
      [Modules.FULFILLMENT]: {
        shipping_option_id: shippingOptionId,
      },
    }))

    await remoteLink.create(links)

    return new StepResponse(undefined, {
      seller_id: input.seller_id,
      shipping_option_ids: input.shipping_option_ids,
    })
  },
  async (data, { container }) => {
    if (!data) return

    const remoteLink = container.resolve(ContainerRegistrationKeys.REMOTE_LINK)

    const links = data.shipping_option_ids.map((shippingOptionId) => ({
      [SELLER_MODULE]: {
        seller_id: data.seller_id,
      },
      [Modules.FULFILLMENT]: {
        shipping_option_id: shippingOptionId,
      },
    }))

    await remoteLink.dismiss(links)
  }
)
