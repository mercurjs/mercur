import { Migration } from '@mikro-orm/migrations';

export class Migration20260129105857 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "featured_collection" drop constraint if exists "featured_collection_handle_unique";`);
    this.addSql(`create table if not exists "featured_collection" ("id" text not null, "name" text not null, "handle" text not null, "min_items" integer not null default 4, "max_items" integer not null default 8, "is_active" boolean not null default false, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "featured_collection_pkey" primary key ("id"));`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_featured_collection_handle_unique" ON "featured_collection" ("handle") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_featured_collection_deleted_at" ON "featured_collection" ("deleted_at") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "featured_collection" cascade;`);
  }

}
