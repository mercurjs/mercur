import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260126130937 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "order_group" add column if not exists "cart_id" text not null;`);
    this.addSql(`alter table if exists "order_group" alter column "customer_id" type text using ("customer_id"::text);`);
    this.addSql(`alter table if exists "order_group" alter column "customer_id" drop not null;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "order_group" drop column if exists "cart_id";`);

    this.addSql(`alter table if exists "order_group" alter column "customer_id" type text using ("customer_id"::text);`);
    this.addSql(`alter table if exists "order_group" alter column "customer_id" set not null;`);
  }

}
