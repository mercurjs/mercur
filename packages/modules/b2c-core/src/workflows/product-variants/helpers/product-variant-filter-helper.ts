import { Knex } from "@mikro-orm/postgresql";

export class ProductVariantFilterHelper {
  constructor(private knex: Knex) {}
  async handlePriceFilter(hasPrice: boolean): Promise<string[]> {
    const query = this.knex
      .select("pv.id")
      .from("product_variant as pv")
      .whereRaw(
        hasPrice
          ? "EXISTS (SELECT 1 FROM product_variant_price_set pvps INNER JOIN price p ON p.price_set_id = pvps.price_set_id WHERE pvps.variant_id = pv.id AND p.deleted_at IS NULL AND pvps.deleted_at IS NULL)"
          : "NOT EXISTS (SELECT 1 FROM product_variant_price_set pvps INNER JOIN price p ON p.price_set_id = pvps.price_set_id WHERE pvps.variant_id = pv.id AND p.deleted_at IS NULL AND pvps.deleted_at IS NULL)"
      );

    const results = await query;
    return results.map((r: any) => r.id);
  }

  async handleInventoryFilter(hasInventory: boolean): Promise<string[]> {
    const query = this.knex
      .select("pv.id")
      .from("product_variant as pv")
      .whereRaw(
        hasInventory
          ? "EXISTS (SELECT 1 FROM product_variant_inventory_item WHERE product_variant_inventory_item.variant_id = pv.id AND product_variant_inventory_item.deleted_at IS NULL)"
          : "NOT EXISTS (SELECT 1 FROM product_variant_inventory_item WHERE product_variant_inventory_item.variant_id = pv.id AND product_variant_inventory_item.deleted_at IS NULL)"
      );

    const results = await query;
    return results.map((r: any) => r.id);
  }
}
