import { Migration } from "@medusajs/framework/mikro-orm/migrations"

export class Migration20260616000000 extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      `create table if not exists "media_image" ("id" text not null, "url" text not null, "type" text null, "is_thumbnail" boolean not null default false, "is_banner" boolean not null default false, "rank" integer not null default 0, "metadata" jsonb null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "media_image_pkey" primary key ("id"));`
    )
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_media_image_type" ON "media_image" ("type") WHERE deleted_at IS NULL;`
    )
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_media_image_deleted_at" ON "media_image" ("deleted_at") WHERE deleted_at IS NULL;`
    )
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "media_image" cascade;`)
  }
}
