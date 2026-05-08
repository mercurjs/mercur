import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260427140959 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "product" drop constraint if exists "product_status_check";`);

    this.addSql(`alter table if exists "product" alter column "status" drop default;`);
    this.addSql(`alter table if exists "product" alter column "status" type text using ("status"::text);`);
    this.addSql(`alter table if exists "product" add constraint "product_status_check" check("status" in ('draft', 'proposed', 'published', 'requires_action', 'rejected'));`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "product" drop constraint if exists "product_status_check";`);

    this.addSql(`alter table if exists "product" alter column "status" type text using ("status"::text);`);
    this.addSql(`alter table if exists "product" alter column "status" set default 'pending';`);
    this.addSql(`alter table if exists "product" add constraint "product_status_check" check("status" in ('pending', 'accepted', 'requires_action', 'rejected'));`);
  }

}
