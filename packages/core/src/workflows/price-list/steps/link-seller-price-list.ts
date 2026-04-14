import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import { Link } from "@medusajs/framework/modules-sdk"
import { MercurModules } from "@mercurjs/types"

type LinkSellerPriceListStepInput = {
  seller_id: string
  price_list_ids: string[]
}

export const linkSellerPriceListStep = createStep(
  "link-seller-price-list",
  async (input: LinkSellerPriceListStepInput, { container }) => {
    const remoteLink: Link = container.resolve(ContainerRegistrationKeys.REMOTE_LINK)

    const links = input.price_list_ids.map((priceListId) => ({
      [Modules.PRICING]: {
        price_list_id: priceListId,
      },
      [MercurModules.SELLER]: {
        seller_id: input.seller_id,
      },
    }))

    await remoteLink.create(links)

    return new StepResponse(undefined, {
      seller_id: input.seller_id,
      price_list_ids: input.price_list_ids,
    })
  },
  async (data, { container }) => {
    if (!data) return

    const remoteLink: Link = container.resolve(ContainerRegistrationKeys.REMOTE_LINK)

    const links = data.price_list_ids.map((priceListId) => ({
      [Modules.PRICING]: {
        price_list_id: priceListId,
      },
      [MercurModules.SELLER]: {
        seller_id: data.seller_id,
      },
    }))

    await remoteLink.dismiss(links)
  }
)
