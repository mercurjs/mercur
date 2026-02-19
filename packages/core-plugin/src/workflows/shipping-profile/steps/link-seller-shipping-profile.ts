import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import { Link } from "@medusajs/framework/modules-sdk"
import { MercurModules } from "@mercurjs/types"

type LinkSellerShippingProfileStepInput = {
  seller_id: string
  shipping_profile_ids: string[]
}

export const linkSellerShippingProfileStep = createStep(
  "link-seller-shipping-profile",
  async (input: LinkSellerShippingProfileStepInput, { container }) => {
    const remoteLink: Link = container.resolve(ContainerRegistrationKeys.REMOTE_LINK)

    const links = input.shipping_profile_ids.map((shippingProfileId) => ({
      [Modules.FULFILLMENT]: {
        shipping_profile_id: shippingProfileId,
      },
      [MercurModules.SELLER]: {
        seller_id: input.seller_id,
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

    const remoteLink: Link = container.resolve(ContainerRegistrationKeys.REMOTE_LINK)

    const links = data.shipping_profile_ids.map((shippingProfileId) => ({
      [Modules.FULFILLMENT]: {
        shipping_profile_id: shippingProfileId,
      },
      [MercurModules.SELLER]: {
        seller_id: data.seller_id,
      },
    }))

    await remoteLink.dismiss(links)
  }
)
