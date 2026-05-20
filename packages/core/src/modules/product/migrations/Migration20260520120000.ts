import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260520120000 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "product_variant" add column if not exists "sku" text null;`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_product_variant_sku_unique" ON "product_variant" ("sku") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop index if exists "IDX_product_variant_sku_unique";`);
    this.addSql(`alter table if exists "product_variant" drop column if exists "sku";`);
  }

}
