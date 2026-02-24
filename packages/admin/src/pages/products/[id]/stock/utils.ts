import { HttpTypes } from "@medusajs/types"

/**
 * Type guard to check if an item is a ProductVariant
 */
export function isProductVariant(
  item: HttpTypes.AdminProductVariant | HttpTypes.AdminProductVariantInventoryItemLink
): item is HttpTypes.AdminProductVariant {
  return "product" in item || "product_id" in item
}

/**
 * Type guard to check if a variant has inventory items (for sub-row expansion)
 */
export function isProductVariantWithInventoryPivot(
  row: HttpTypes.AdminProductVariant | HttpTypes.AdminProductVariantInventoryItemLink
): row is HttpTypes.AdminProductVariant & {
  inventory_items: HttpTypes.AdminProductVariantInventoryItemLink[]
} {
  return isProductVariant(row) && Array.isArray(row.inventory_items)
}

type DisabledItem = { id: string; title: string; sku: string }

/**
 * Returns a map of inventory items that are already managed by another variant,
 * used to disable editing for those rows
 */
export function getDisabledInventoryRows(
  variants: HttpTypes.AdminProductVariant[]
): Record<string, DisabledItem> {
  const disabled: Record<string, DisabledItem> = {}
  const inventoryItemToVariant: Record<
    string,
    { variantId: string; title: string; sku: string }
  > = {}

  for (const variant of variants) {
    if (!variant.inventory_items) continue

    for (const item of variant.inventory_items) {
      const existingMapping = inventoryItemToVariant[item.inventory_item_id]

      if (existingMapping && existingMapping.variantId !== variant.id) {
        // This inventory item is already managed by another variant
        disabled[item.inventory_item_id] = {
          id: existingMapping.variantId,
          title: existingMapping.title,
          sku: existingMapping.sku,
        }
      } else if (!existingMapping) {
        // Record which variant manages this inventory item
        inventoryItemToVariant[item.inventory_item_id] = {
          variantId: variant.id,
          title: variant.title || "",
          sku: variant.sku || "",
        }
      }
    }
  }

  return disabled
}
