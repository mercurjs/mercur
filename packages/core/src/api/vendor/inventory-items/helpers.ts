import { MedusaContainer } from "@medusajs/framework"
import {
  ContainerRegistrationKeys,
  MedusaError,
} from "@medusajs/framework/utils"

export const refetchInventoryItem = async (
  inventoryItemId: string,
  scope: MedusaContainer,
  fields: string[]
) => {
  const query = scope.resolve(ContainerRegistrationKeys.QUERY)

  const {
    data: [inventoryItem],
  } = await query.graph({
    entity: "inventory_item",
    filters: { id: inventoryItemId },
    fields,
  })

  return inventoryItem
}

export const validateSellerInventoryItems = async (
  scope: MedusaContainer,
  sellerId: string,
  inventoryItemIds: string[]
) => {
  const ids = Array.from(new Set(inventoryItemIds))
  if (!ids.length) {
    return
  }

  const query = scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data: links } = await query.graph({
    entity: "inventory_item_seller",
    filters: {
      seller_id: sellerId,
      inventory_item_id: ids,
    },
    fields: ["inventory_item_id"],
  })

  const owned = new Set(
    links.map(
      (link) => (link as { inventory_item_id?: string }).inventory_item_id
    )
  )
  const missing = ids.find((id) => !owned.has(id))

  if (missing) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Inventory item with id: ${missing} was not found`
    )
  }
}

export const validateSellerInventoryItem = (
  scope: MedusaContainer,
  sellerId: string,
  inventoryItemId: string
) => validateSellerInventoryItems(scope, sellerId, [inventoryItemId])

export const validateSellerInventoryLevels = async (
  scope: MedusaContainer,
  sellerId: string,
  inventoryLevelIds: string[]
) => {
  const ids = Array.from(new Set(inventoryLevelIds))
  if (!ids.length) {
    return
  }

  const query = scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data: levels } = await query.graph({
    entity: "inventory_level",
    filters: { id: ids },
    fields: ["id", "inventory_item_id"],
  })

  const found = new Set(levels.map((level) => level.id))
  const missing = ids.find((id) => !found.has(id))

  if (missing) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Inventory level with id: ${missing} was not found`
    )
  }

  await validateSellerInventoryItems(
    scope,
    sellerId,
    levels.map((level) => level.inventory_item_id)
  )
}
