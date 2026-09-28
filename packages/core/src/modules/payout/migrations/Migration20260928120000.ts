import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260928120000 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "payout_account" alter column "data" set default '{}';`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "payout_account" alter column "data" drop default;`);
  }

}
