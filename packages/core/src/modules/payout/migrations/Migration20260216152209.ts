import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260216152209 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "payout" add column if not exists "display_id" serial;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "payout" drop column if exists "display_id";`);
  }

}
