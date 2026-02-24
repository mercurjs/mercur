import { Migration } from '@mikro-orm/migrations';

export class Migration20260127061749 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "category_detail" ("id" text not null, "thumbnail_id" text null, "icon_id" text null, "banner_id" text null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "category_detail_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_category_detail_deleted_at" ON "category_detail" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "category_media" ("id" text not null, "category_detail_id" text null, "url" text not null, "alt_text" text null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "category_media_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_category_media_category_detail_id" ON "category_media" ("category_detail_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_category_media_deleted_at" ON "category_media" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`alter table if exists "category_media" add constraint "category_media_category_detail_id_foreign" foreign key ("category_detail_id") references "category_detail" ("id") on update cascade on delete cascade;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "category_media" drop constraint if exists "category_media_category_detail_id_foreign";`);

    this.addSql(`drop table if exists "category_detail" cascade;`);

    this.addSql(`drop table if exists "category_media" cascade;`);
  }

}
