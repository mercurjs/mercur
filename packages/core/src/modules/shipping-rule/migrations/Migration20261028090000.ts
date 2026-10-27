import { Migration } from "@medusajs/framework/mikro-orm/migrations"

export class Migration20261028090000 extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      `alter table if exists "marketplace_shipping_method" add column if not exists "cutoff_time" text null;`
    )
  }

  override async down(): Promise<void> {
    this.addSql(
      `alter table if exists "marketplace_shipping_method" drop column if exists "cutoff_time";`
    )
  }
}
