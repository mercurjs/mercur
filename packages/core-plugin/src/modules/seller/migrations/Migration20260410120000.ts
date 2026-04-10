import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260410120000 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "seller" add column if not exists "closure_note" text null;`);
    this.addSql(`alter table if exists "professional_details" alter column "corporate_name" type text, alter column "corporate_name" drop not null;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "seller" drop column if exists "closure_note";`);
    this.addSql(`alter table if exists "professional_details" alter column "corporate_name" type text, alter column "corporate_name" set not null;`);
  }

}
