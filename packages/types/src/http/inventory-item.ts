import { DeleteResponse, InventoryItemDTO, InventoryLevelDTO, PaginatedResponse } from "@medusajs/types"

export type VendorInventoryItem = InventoryItemDTO

export type VendorInventoryLevel = InventoryLevelDTO

export type VendorInventoryItemResponse = {
  inventory_item: VendorInventoryItem
}

export type VendorInventoryItemListResponse = PaginatedResponse<{
  inventory_items: VendorInventoryItem[]
}>

export type VendorInventoryItemDeleteResponse = DeleteResponse<"inventory_item">

export type VendorInventoryLevelListResponse = PaginatedResponse<{
  inventory_levels: VendorInventoryLevel[]
}>

export type VendorInventoryLevelDeleteResponse = {
  id: string
  object: "inventory-level"
  deleted: true
  parent: VendorInventoryItem
}

export type VendorBatchInventoryItemLevelResponse = {
  created: InventoryLevelDTO[]
  updated: InventoryLevelDTO[]
  deleted: string[]
}
