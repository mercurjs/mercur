import type { HttpTypes, PaginatedResponse, ProductVariantDTO, StockLocationDTO } from "@medusajs/types";

export type ExtendedAdminInventoryItem = HttpTypes.AdminInventoryItem & {
  stocked_quantity: number;
  reserved_quantity: number;
  variants?: ProductVariantDTO[];
};

export type ExtendedAdminInventoryItemResponse = {
  inventory_item: ExtendedAdminInventoryItem;
};

export type ExtendedInventoryItemLevel = Omit<HttpTypes.AdminInventoryLevel, 'stocked_quantity' | 'reserved_quantity' | 'available_quantity'> & {
  stock_locations: StockLocationDTO[];
  reserved_quantity: number;
  stocked_quantity: number;
  available_quantity: number;
};

export type ExtendedInventoryItemLevelsResponse = PaginatedResponse<{
  inventory_levels: ExtendedInventoryItemLevel[];
}>