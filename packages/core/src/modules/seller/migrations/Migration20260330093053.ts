import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260330093053 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "payment_details" drop column if exists "type";`);
    this.addSql(`alter table if exists "payment_details" add column if not exists "country_code" text not null default '';`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "payment_details" drop column if exists "country_code";`);
    this.addSql(`alter table if exists "payment_details" add column if not exists "type" text not null default 'iban';`);
  }

}
