import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import { Link } from "@medusajs/framework/modules-sdk"
import { MercurModules } from "@mercurjs/types"

type LinkSellerInventoryItemStepInput = {
  seller_id: string
  inventory_item_ids: string[]
}

type LinkSellerInventoryItemsStepInput = LinkSellerInventoryItemStepInput[]

const toLinks = (groups: LinkSellerInventoryItemsStepInput) =>
  groups.flatMap((group) =>
    group.inventory_item_ids.map((inventoryItemId) => ({
      [Modules.INVENTORY]: {
        inventory_item_id: inventoryItemId,
      },
      [MercurModules.SELLER]: {
        seller_id: group.seller_id,
      },
    }))
  )

export const linkSellerInventoryItemsStep = createStep(
  "link-seller-inventory-items",
  async (input: LinkSellerInventoryItemsStepInput, { container }) => {
    const groups = input.filter((group) => group.inventory_item_ids.length)
    if (!groups.length) {
      return new StepResponse(undefined, undefined)
    }

    const remoteLink: Link = container.resolve(ContainerRegistrationKeys.REMOTE_LINK)

    await remoteLink.create(toLinks(groups))

    return new StepResponse(undefined, groups)
  },
  async (groups, { container }) => {
    if (!groups) return

    const remoteLink: Link = container.resolve(ContainerRegistrationKeys.REMOTE_LINK)

    await remoteLink.dismiss(toLinks(groups))
  }
)

export const linkSellerInventoryItemStep = createStep(
  "link-seller-inventory-item",
  async (input: LinkSellerInventoryItemStepInput, { container }) => {
    if (!input.inventory_item_ids.length) {
      return new StepResponse(undefined, undefined)
    }

    const remoteLink: Link = container.resolve(ContainerRegistrationKeys.REMOTE_LINK)

    await remoteLink.create(toLinks([input]))

    return new StepResponse(undefined, input)
  },
  async (data, { container }) => {
    if (!data) return

    const remoteLink: Link = container.resolve(ContainerRegistrationKeys.REMOTE_LINK)

    await remoteLink.dismiss(toLinks([data]))
  }
)
