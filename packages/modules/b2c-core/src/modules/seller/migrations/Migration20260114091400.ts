import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260114091400 extends Migration {
  override async up(): Promise<void> {
    // Index for joining product_variant to product table
    this.addSql(`
      CREATE INDEX IF NOT EXISTS "IDX_product_variant_product_id" 
      ON "product_variant" (product_id);
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
    this.addSql(`DROP INDEX IF EXISTS "IDX_product_variant_product_id";`);
  }
}
