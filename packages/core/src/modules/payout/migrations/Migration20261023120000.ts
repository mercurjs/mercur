import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20261023120000 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "settlement" add column if not exists "display_id" serial;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "settlement" drop column if exists "display_id";`);
  }

}
