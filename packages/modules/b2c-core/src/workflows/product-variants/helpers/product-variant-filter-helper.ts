import { Knex } from "@mikro-orm/postgresql";

export interface ProductVariantFilters {
  seller_id?: string;
  has_price?: boolean;
  has_inventory?: boolean;
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

    const results = await query;
    return results.map((r: any) => r.id);
  }
}
