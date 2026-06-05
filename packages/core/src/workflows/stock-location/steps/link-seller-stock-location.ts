import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import { MercurModules } from "@mercurjs/types"
import { Link } from "@medusajs/framework/modules-sdk"

type LinkSellerStockLocationStepInput = {
  seller_id: string
  stock_location_ids: string[]
}

export const linkSellerStockLocationStep = createStep(
  "link-seller-stock-location",
  async (input: LinkSellerStockLocationStepInput, { container }) => {
    const remoteLink: Link = container.resolve(ContainerRegistrationKeys.LINK)

    const links = input.stock_location_ids.map((stockLocationId) => ({
      [Modules.STOCK_LOCATION]: {
        stock_location_id: stockLocationId,
      },
      [MercurModules.SELLER]: {
        seller_id: input.seller_id,
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

    const remoteLink: Link = container.resolve(ContainerRegistrationKeys.LINK)

    const links = data.stock_location_ids.map((stockLocationId) => ({
      [Modules.STOCK_LOCATION]: {
        stock_location_id: stockLocationId,
      },
      [MercurModules.SELLER]: {
        seller_id: data.seller_id,
      },
    }))

    await remoteLink.dismiss(links)
  }
)
