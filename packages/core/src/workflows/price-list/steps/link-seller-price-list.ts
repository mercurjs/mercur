import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import { SELLER_MODULE } from "../../../modules/seller"

type LinkSellerPriceListStepInput = {
  seller_id: string
  price_list_ids: string[]
}

export const linkSellerPriceListStep = createStep(
  "link-seller-price-list",
  async (input: LinkSellerPriceListStepInput, { container }) => {
    const remoteLink = container.resolve(ContainerRegistrationKeys.REMOTE_LINK)

    const links = input.price_list_ids.map((priceListId) => ({
      [SELLER_MODULE]: {
        seller_id: input.seller_id,
      },
      [Modules.PRICING]: {
        price_list_id: priceListId,
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

    const remoteLink = container.resolve(ContainerRegistrationKeys.REMOTE_LINK)

    const links = data.price_list_ids.map((priceListId) => ({
      [SELLER_MODULE]: {
        seller_id: data.seller_id,
      },
      [Modules.PRICING]: {
        price_list_id: priceListId,
      },
    }))

    await remoteLink.dismiss(links)
  }
)
