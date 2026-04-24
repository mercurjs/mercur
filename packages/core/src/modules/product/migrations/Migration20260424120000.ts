import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260424120000 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`DROP INDEX IF EXISTS "IDX_product_attribute_handle_unique";`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_product_attribute_handle_unique" ON "product_attribute" ("product_id", "handle") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`DROP INDEX IF EXISTS "IDX_product_attribute_handle_unique";`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_product_attribute_handle_unique" ON "product_attribute" ("handle") WHERE deleted_at IS NULL;`);
  }

}
