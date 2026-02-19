import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import { Link } from "@medusajs/framework/modules-sdk"
import { MercurModules } from "@mercurjs/types"

type LinkSellerInventoryItemStepInput = {
  seller_id: string
  inventory_item_ids: string[]
}

export const linkSellerInventoryItemStep = createStep(
  "link-seller-inventory-item",
  async (input: LinkSellerInventoryItemStepInput, { container }) => {
    const remoteLink: Link = container.resolve(ContainerRegistrationKeys.REMOTE_LINK)

    const links = input.inventory_item_ids.map((inventoryItemId) => ({
      [Modules.INVENTORY]: {
        inventory_item_id: inventoryItemId,
      },
      [MercurModules.SELLER]: {
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

    const remoteLink: Link = container.resolve(ContainerRegistrationKeys.REMOTE_LINK)

    const links = data.inventory_item_ids.map((inventoryItemId) => ({
      [Modules.INVENTORY]: {
        inventory_item_id: inventoryItemId,
      },
      [MercurModules.SELLER]: {
        seller_id: data.seller_id,
      },
    }))

    await remoteLink.dismiss(links)
  }
)
