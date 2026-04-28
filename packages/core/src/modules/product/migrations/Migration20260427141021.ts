import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260427141021 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "product" alter column "status" type text using ("status"::text);`);
    this.addSql(`alter table if exists "product" alter column "status" set default 'proposed';`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "product" alter column "status" drop default;`);
    this.addSql(`alter table if exists "product" alter column "status" type text using ("status"::text);`);
  }

}
