import { Knex } from "@mikro-orm/postgresql";

export interface ProductVariantFilters {
  seller_id?: string;
  has_price?: boolean;
  has_inventory?: boolean;
  /**
   * Whether the variant has at least one inventory level (inventory_item at any location).
   * This follows the chain: ProductVariant -> InventoryItem (pivot) -> InventoryLevel(location_id).
   */
  has_stock_location?: boolean;
  /**
   * Whether the variant has at least one admin-owned stock location.
   * Admin-owned stock location = stock location that is NOT linked to any seller.
   *
   * Note: This filter requires looking up seller-stock-location links, so it's applied
   * in the workflow step (not purely in this helper) where both Knex and Query are available.
   */
  has_admin_stock_location?: boolean;
}

export class ProductVariantFilterHelper {
  constructor(private knex: Knex) {}

  async getFilteredVariantIds(
    filters: ProductVariantFilters
  ): Promise<string[]> {
    let query = this.knex
      .select("pv.id")
      .from("product_variant as pv")
      .distinct();

    if (filters.seller_id) {
      query = query
        .join(
          "seller_seller_product_product as sspp",
          "sspp.product_id",
          "pv.product_id"
        )
        .where("sspp.seller_id", filters.seller_id)
        .whereNull("sspp.deleted_at");
    }

    if (filters.has_price !== undefined) {
      query = query.whereRaw(
        filters.has_price
          ? "EXISTS (SELECT 1 FROM product_variant_price_set pvps INNER JOIN price p ON p.price_set_id = pvps.price_set_id WHERE pvps.variant_id = pv.id AND p.deleted_at IS NULL AND pvps.deleted_at IS NULL)"
          : "NOT EXISTS (SELECT 1 FROM product_variant_price_set pvps INNER JOIN price p ON p.price_set_id = pvps.price_set_id WHERE pvps.variant_id = pv.id AND p.deleted_at IS NULL AND pvps.deleted_at IS NULL)"
      );
    }

    if (filters.has_inventory !== undefined) {
      query = query.whereRaw(
        filters.has_inventory
          ? "EXISTS (SELECT 1 FROM product_variant_inventory_item WHERE product_variant_inventory_item.variant_id = pv.id AND product_variant_inventory_item.deleted_at IS NULL)"
          : "NOT EXISTS (SELECT 1 FROM product_variant_inventory_item WHERE product_variant_inventory_item.variant_id = pv.id AND product_variant_inventory_item.deleted_at IS NULL)"
      );
    }

    if (filters.has_stock_location !== undefined) {
      query = query.whereRaw(
        filters.has_stock_location
          ? "EXISTS (SELECT 1 FROM product_variant_inventory_item pvii INNER JOIN inventory_level il ON il.inventory_item_id = pvii.inventory_item_id WHERE pvii.variant_id = pv.id AND pvii.deleted_at IS NULL AND il.location_id IS NOT NULL)"
          : "NOT EXISTS (SELECT 1 FROM product_variant_inventory_item pvii INNER JOIN inventory_level il ON il.inventory_item_id = pvii.inventory_item_id WHERE pvii.variant_id = pv.id AND pvii.deleted_at IS NULL AND il.location_id IS NOT NULL)"
      );
    }

    const results = await query;
    return results.map((r: any) => r.id);
  }
}
