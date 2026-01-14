import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260114091400 extends Migration {
  override async up(): Promise<void> {
    // Composite index for fast JOIN filtering by seller and product (critical for seller_id filter performance)
    this.addSql(`
      CREATE INDEX IF NOT EXISTS "IDX_seller_product_link_seller_product" 
      ON "seller_seller_product_product" (seller_id, product_id) 
      WHERE deleted_at IS NULL;
    `);

    // Index for joining product_variant to product table
    this.addSql(`
      CREATE INDEX IF NOT EXISTS "IDX_product_variant_product_id" 
      ON "product_variant" (product_id);
    `);

    // Composite index for fast EXISTS subquery checking if variant has prices
    this.addSql(`
      CREATE INDEX IF NOT EXISTS "IDX_product_variant_price_set_variant_price" 
      ON "product_variant_price_set" (variant_id, price_set_id) 
      WHERE deleted_at IS NULL;
    `);

    // Index for fast EXISTS subquery checking if variant has inventory items
    this.addSql(`
      CREATE INDEX IF NOT EXISTS "IDX_product_variant_inventory_item_variant" 
      ON "product_variant_inventory_item" (variant_id) 
      WHERE deleted_at IS NULL;
    `);

    // Index for fast JOIN between price_set and price tables in price filter
    this.addSql(`
      CREATE INDEX IF NOT EXISTS "IDX_price_price_set" 
      ON "price" (price_set_id) 
      WHERE deleted_at IS NULL;
    `);

    // PostgreSQL extension enabling trigram-based fuzzy text search for ILIKE queries
    this.addSql(`CREATE EXTENSION IF NOT EXISTS pg_trgm;`);

    // GIN index for fast case-insensitive ILIKE searches on product variant title
    this.addSql(`
      CREATE INDEX IF NOT EXISTS "IDX_product_variant_title_trgm" 
      ON "product_variant" USING gin (title gin_trgm_ops);
    `);

    // GIN index for fast case-insensitive ILIKE searches on product variant SKU
    this.addSql(`
      CREATE INDEX IF NOT EXISTS "IDX_product_variant_sku_trgm" 
      ON "product_variant" USING gin (sku gin_trgm_ops);
    `);
  }

  override async down(): Promise<void> {
    this.addSql(`DROP INDEX IF EXISTS "IDX_product_variant_sku_trgm";`);
    this.addSql(`DROP INDEX IF EXISTS "IDX_product_variant_title_trgm";`);
    this.addSql(`DROP INDEX IF EXISTS "IDX_price_price_set";`);
    this.addSql(
      `DROP INDEX IF EXISTS "IDX_product_variant_inventory_item_variant";`
    );
    this.addSql(
      `DROP INDEX IF EXISTS "IDX_product_variant_price_set_variant_price";`
    );
    this.addSql(`DROP INDEX IF EXISTS "IDX_product_variant_product_id";`);
    this.addSql(
      `DROP INDEX IF EXISTS "IDX_seller_product_link_seller_product";`
    );
  }
}
