import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260422130000 extends Migration {
  override async up(): Promise<void> {
    this.addSql(`alter table if exists "member" add column if not exists "first_name" text null;`);
    this.addSql(`alter table if exists "member" add column if not exists "last_name" text null;`);
    this.addSql(`alter table if exists "seller" add column if not exists "approved_at" timestamptz null;`);
    // Backfill approved_at for stores that are already past the initial approval gate.
    this.addSql(`update "seller" set "approved_at" = coalesce("updated_at", now()) where "approved_at" is null and "status" in ('open', 'suspended');`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "member" drop column if exists "first_name";`);
    this.addSql(`alter table if exists "member" drop column if exists "last_name";`);
    this.addSql(`alter table if exists "seller" drop column if exists "approved_at";`);
  }
}
