import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260302150223 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "order_group" add column if not exists "display_id" serial;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "order_group" drop column if exists "display_id";`);
  }

}
