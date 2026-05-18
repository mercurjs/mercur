import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260422140000 extends Migration {
  override async up(): Promise<void> {
    this.addSql(`alter table if exists "seller" add column if not exists "approved_at" timestamptz null;`);
    // Backfill approved_at for stores that are already past the initial approval gate.
    this.addSql(`update "seller" set "approved_at" = coalesce("updated_at", now()) where "approved_at" is null and "status" in ('open', 'suspended');`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "seller" drop column if exists "approved_at";`);
  }
}
