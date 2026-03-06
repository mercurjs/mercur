import { Migration } from '@mikro-orm/migrations';

export class Migration20260115205349 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`DROP INDEX IF EXISTS "IDX_vendor_product_attribute_title";`);
    this.addSql(`alter table if exists "vendor_product_attribute" rename column "title" to "name";`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_vendor_product_attribute_name" ON "vendor_product_attribute" ("name") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`DROP INDEX IF EXISTS "IDX_vendor_product_attribute_name";`);
    this.addSql(`alter table if exists "vendor_product_attribute" rename column "name" to "title";`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_vendor_product_attribute_title" ON "vendor_product_attribute" ("title") WHERE deleted_at IS NULL;`);
  }

}
