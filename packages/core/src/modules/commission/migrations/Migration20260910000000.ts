import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260910000000 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "commission_line" add column if not exists "provider_id" text not null default 'system';`);
    this.addSql(`alter table if exists "commission_line" add column if not exists "data" jsonb null;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "commission_line" drop column if exists "data";`);
    this.addSql(`alter table if exists "commission_line" drop column if exists "provider_id";`);
  }

}
