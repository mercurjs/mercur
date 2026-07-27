import { Migration } from "@medusajs/framework/mikro-orm/migrations"

export class Migration20260722120000 extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      `create table if not exists "promotion_cost" ("id" text not null, "promotion_id" text not null, "cost_bearer" text check ("cost_bearer" in ('store', 'marketplace', 'shared')) not null default 'store', "shared_marketplace_percentage" integer null, "metadata" jsonb null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "promotion_cost_pkey" primary key ("id"));`
    )
    this.addSql(
      `CREATE UNIQUE INDEX IF NOT EXISTS "IDX_promotion_cost_promotion_id_unique" ON "promotion_cost" ("promotion_id") WHERE deleted_at IS NULL;`
    )
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_promotion_cost_deleted_at" ON "promotion_cost" ("deleted_at") WHERE deleted_at IS NULL;`
    )
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "promotion_cost" cascade;`)
  }
}
