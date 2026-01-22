import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"

import { SELLER_MODULE } from "../../../modules/seller"

type LinkSellerStockLocationStepInput = {
  seller_id: string
  stock_location_ids: string[]
}

export const linkSellerStockLocationStep = createStep(
  "link-seller-stock-location",
  async (input: LinkSellerStockLocationStepInput, { container }) => {
    const remoteLink = container.resolve(ContainerRegistrationKeys.REMOTE_LINK)

    const links = input.stock_location_ids.map((stockLocationId) => ({
      [SELLER_MODULE]: {
        seller_id: input.seller_id,
      },
      [Modules.STOCK_LOCATION]: {
        stock_location_id: stockLocationId,
      },
    }))

    await remoteLink.create(links)

    return new StepResponse(undefined, {
      seller_id: input.seller_id,
      stock_location_ids: input.stock_location_ids,
    })
  },
  async (data, { container }) => {
    if (!data) return

    const remoteLink = container.resolve(ContainerRegistrationKeys.REMOTE_LINK)

    const links = data.stock_location_ids.map((stockLocationId) => ({
      [SELLER_MODULE]: {
        seller_id: data.seller_id,
      },
      [Modules.STOCK_LOCATION]: {
        stock_location_id: stockLocationId,
      },
    }))

    await remoteLink.dismiss(links)
  }
)
