import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import { Link } from "@medusajs/framework/modules-sdk"
import { MercurModules } from "@mercurjs/types"

type LinkSellerShippingOptionStepInput = {
  seller_id: string
  shipping_option_ids: string[]
}

export const linkSellerShippingOptionStep = createStep(
  "link-seller-shipping-option",
  async (input: LinkSellerShippingOptionStepInput, { container }) => {
    const remoteLink: Link = container.resolve(ContainerRegistrationKeys.REMOTE_LINK)

    const links = input.shipping_option_ids.map((shippingOptionId) => ({
      [Modules.FULFILLMENT]: {
        shipping_option_id: shippingOptionId,
      },
      [MercurModules.SELLER]: {
        seller_id: input.seller_id,
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

    const remoteLink: Link = container.resolve(ContainerRegistrationKeys.REMOTE_LINK)

    const links = data.shipping_option_ids.map((shippingOptionId) => ({
      [Modules.FULFILLMENT]: {
        shipping_option_id: shippingOptionId,
      },
      [MercurModules.SELLER]: {
        seller_id: data.seller_id,
      },
    }))

    await remoteLink.dismiss(links)
  }
)
