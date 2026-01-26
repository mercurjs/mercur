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

export const validateSellerInventoryItem = async (
  scope: MedusaContainer,
  sellerId: string,
  inventoryItemId: string
) => {
  const query = scope.resolve(ContainerRegistrationKeys.QUERY)

  const {
    data: [sellerInventoryItem],
  } = await query.graph({
    entity: "inventory_item_seller",
    filters: {
      seller_id: sellerId,
      inventory_item_id: inventoryItemId,
    },
    fields: ["seller_id"],
  })

  if (!sellerInventoryItem) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Inventory item with id: ${inventoryItemId} was not found`
    )
  }
}

export const validateVariantBySku = async (
  scope: MedusaContainer,
  sellerId: string,
  sku: string
) => {
  const query = scope.resolve(ContainerRegistrationKeys.QUERY)

  const {
    data: [variant],
  } = await query.graph({
    entity: "product_variant",
    filters: { sku },
    fields: ["id", "product.id", 'product.seller.id'],
  })

  if (!variant || variant.product.seller.id !== sellerId) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Variant with sku: ${sku} was not found`
    )
  }

  return variant
}
