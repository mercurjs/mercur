import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260616120000 extends Migration {
  override async up(): Promise<void> {
    this.addSql(`alter table if exists "payment_details" alter column "country_code" drop not null;`);
    this.addSql(`alter table if exists "payment_details" alter column "holder_name" drop not null;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "payment_details" alter column "country_code" set not null;`);
    this.addSql(`alter table if exists "payment_details" alter column "holder_name" set not null;`);
  }
}
