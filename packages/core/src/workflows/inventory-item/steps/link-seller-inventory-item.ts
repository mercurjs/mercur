import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"

import { SELLER_MODULE } from "../../../modules/seller"

type LinkSellerInventoryItemStepInput = {
  seller_id: string
  inventory_item_ids: string[]
}

export const linkSellerInventoryItemStep = createStep(
  "link-seller-inventory-item",
  async (input: LinkSellerInventoryItemStepInput, { container }) => {
    const remoteLink = container.resolve(ContainerRegistrationKeys.REMOTE_LINK)

    const links = input.inventory_item_ids.map((inventoryItemId) => ({
      [Modules.INVENTORY]: {
        inventory_item_id: inventoryItemId,
      },
      [SELLER_MODULE]: {
        seller_id: input.seller_id,
      },
    }))

    await remoteLink.create(links)

    return new StepResponse(undefined, {
      seller_id: input.seller_id,
      inventory_item_ids: input.inventory_item_ids,
    })
  },
  async (data, { container }) => {
    if (!data) return

    const remoteLink = container.resolve(ContainerRegistrationKeys.REMOTE_LINK)

    const links = data.inventory_item_ids.map((inventoryItemId) => ({
      [Modules.INVENTORY]: {
        inventory_item_id: inventoryItemId,
      },
      [SELLER_MODULE]: {
        seller_id: data.seller_id,
      },
    }))

    await remoteLink.dismiss(links)
  }
)
