import { Migration } from "@mikro-orm/migrations";

export class Migration20251014102054 extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      `create table if not exists "secondary_category" ("id" text not null, "category_id" text not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "secondary_category_pkey" primary key ("id"));`
    );
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_secondary_category_deleted_at" ON "secondary_category" (deleted_at) WHERE deleted_at IS NULL;`
    );
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "secondary_category" cascade;`);
  }
}
