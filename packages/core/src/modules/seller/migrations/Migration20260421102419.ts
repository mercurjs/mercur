import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260421102419 extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      `alter table if exists "seller" add column if not exists "phone" text null;`
    );
    this.addSql(
      `alter table if exists "seller_address" add column if not exists "name" text null;`
    );
  }

  override async down(): Promise<void> {
    this.addSql(
      `alter table if exists "seller_address" drop column if exists "name";`
    );
    this.addSql(
      `alter table if exists "seller" drop column if exists "phone";`
    );
  }
}
