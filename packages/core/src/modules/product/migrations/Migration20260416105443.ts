import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260416105443 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "product_attribute" alter column "handle" type text using ("handle"::text);`);
    this.addSql(`alter table if exists "product_attribute" alter column "handle" drop not null;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "product_attribute" alter column "handle" type text using ("handle"::text);`);
    this.addSql(`alter table if exists "product_attribute" alter column "handle" set not null;`);
  }

}
