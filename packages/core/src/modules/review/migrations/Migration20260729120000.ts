import { Migration } from "@medusajs/framework/mikro-orm/migrations"

export class Migration20260729120000 extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      `create table if not exists "review" ("id" text not null, "display_id" serial, "reference" text check ("reference" in ('product', 'seller')) not null, "rating" integer not null, "customer_note" text null, "seller_note" text null, "status" text check ("status" in ('pending', 'published', 'rejected')) not null default 'pending', "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "review_pkey" primary key ("id"));`
    )
    this.addSql(
      `alter table if exists "review" add column if not exists "display_id" serial;`
    )
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_review_deleted_at" ON "review" ("deleted_at") WHERE deleted_at IS NULL;`
    )
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "review" cascade;`)
  }
}
