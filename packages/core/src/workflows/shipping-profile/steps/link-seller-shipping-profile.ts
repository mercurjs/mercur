import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"

import { SELLER_MODULE } from "../../../modules/seller"

type LinkSellerShippingProfileStepInput = {
  seller_id: string
  shipping_profile_ids: string[]
}

export const linkSellerShippingProfileStep = createStep(
  "link-seller-shipping-profile",
  async (input: LinkSellerShippingProfileStepInput, { container }) => {
    const remoteLink = container.resolve(ContainerRegistrationKeys.REMOTE_LINK)

    const links = input.shipping_profile_ids.map((shippingProfileId) => ({
      [SELLER_MODULE]: {
        seller_id: input.seller_id,
      },
      [Modules.FULFILLMENT]: {
        shipping_profile_id: shippingProfileId,
      },
    }))

    await remoteLink.create(links)

    return new StepResponse(undefined, {
      seller_id: input.seller_id,
      shipping_profile_ids: input.shipping_profile_ids,
    })
  },
  async (data, { container }) => {
    if (!data) return

    const remoteLink = container.resolve(ContainerRegistrationKeys.REMOTE_LINK)

    const links = data.shipping_profile_ids.map((shippingProfileId) => ({
      [SELLER_MODULE]: {
        seller_id: data.seller_id,
      },
      [Modules.FULFILLMENT]: {
        shipping_profile_id: shippingProfileId,
      },
    }))

    await remoteLink.dismiss(links)
  }
)
