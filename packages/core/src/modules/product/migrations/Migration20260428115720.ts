import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260428115720 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`drop index if exists "IDX_product_is_active";`);
    this.addSql(`alter table if exists "product" drop column if exists "is_active";`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "product" add column if not exists "is_active" boolean not null default false;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_product_is_active" ON "product" ("is_active") WHERE deleted_at IS NULL;`);
  }

}
