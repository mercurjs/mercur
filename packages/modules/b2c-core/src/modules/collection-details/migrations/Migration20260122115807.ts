import { Migration } from '@mikro-orm/migrations';

export class Migration20260122115807 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "collection_detail" ("id" text not null, "thumbnail_id" text null, "icon_id" text null, "banner_id" text null, "rank" integer not null default 0, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "collection_detail_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_collection_detail_deleted_at" ON "collection_detail" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "collection_media" ("id" text not null, "collection_detail_id" text null, "url" text not null, "alt_text" text null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "collection_media_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_collection_media_collection_detail_id" ON "collection_media" ("collection_detail_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_collection_media_deleted_at" ON "collection_media" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`alter table if exists "collection_media" add constraint "collection_media_collection_detail_id_foreign" foreign key ("collection_detail_id") references "collection_detail" ("id") on update cascade on delete cascade;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "collection_media" drop constraint if exists "collection_media_collection_detail_id_foreign";`);

    this.addSql(`drop table if exists "collection_detail" cascade;`);

    this.addSql(`drop table if exists "collection_media" cascade;`);
  }

}
