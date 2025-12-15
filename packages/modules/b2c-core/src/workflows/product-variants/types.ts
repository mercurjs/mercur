import { PriceDTO, ProductVariantDTO } from "@medusajs/framework/types";

export interface ProductVariantWithRelations extends ProductVariantDTO {
  prices?: PriceDTO[];
  inventory_items?: Array<{
    id: string;
    inventory_item_id: string;
    variant_id: string;
    required_quantity: number;
  }>;
}
