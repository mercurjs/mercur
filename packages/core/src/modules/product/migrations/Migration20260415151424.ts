import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260415151424 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "product_attribute" add column if not exists "is_global" boolean not null default true;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "product_attribute" drop column if exists "is_global";`);
  }

}
