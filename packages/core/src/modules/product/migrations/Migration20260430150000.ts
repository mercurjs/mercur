import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260430150000 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "product_change" add column if not exists "external_note" text null;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "product_change" drop column if exists "external_note";`);
  }

}
