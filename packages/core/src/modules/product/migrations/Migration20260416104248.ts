import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260416104248 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "product_variant" drop column if exists "manage_inventory";`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "product_variant" add column if not exists "manage_inventory" boolean not null default true;`);
  }

}
