import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260421093258 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "product_attribute" alter column "handle" type text using ("handle"::text);`);
    this.addSql(`alter table if exists "product_attribute" alter column "handle" drop not null;`);

    this.addSql(`alter table if exists "product_attribute_value" alter column "handle" type text using ("handle"::text);`);
    this.addSql(`alter table if exists "product_attribute_value" alter column "handle" drop not null;`);

    this.addSql(`alter table if exists "product_variant" drop column if exists "manage_inventory";`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "product_attribute" alter column "handle" type text using ("handle"::text);`);
    this.addSql(`alter table if exists "product_attribute" alter column "handle" set not null;`);

    this.addSql(`alter table if exists "product_attribute_value" alter column "handle" type text using ("handle"::text);`);
    this.addSql(`alter table if exists "product_attribute_value" alter column "handle" set not null;`);

    this.addSql(`alter table if exists "product_variant" add column if not exists "manage_inventory" boolean not null default true;`);
  }

}
