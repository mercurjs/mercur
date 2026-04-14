import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260414123048 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "professional_details" alter column "corporate_name" type text using ("corporate_name"::text);`);
    this.addSql(`alter table if exists "professional_details" alter column "corporate_name" drop not null;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "professional_details" alter column "corporate_name" type text using ("corporate_name"::text);`);
    this.addSql(`alter table if exists "professional_details" alter column "corporate_name" set not null;`);
  }

}
