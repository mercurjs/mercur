import { Migration } from '@mikro-orm/migrations';

export class Migration20241206125415 extends Migration {

  async up(): Promise<void> {
    this.addSql('create table if not exists "seller" ("id" text not null, "name" text not null, "handle" text not null, "description" text null, "photo" text null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "seller_pkey" primary key ("id"));');
    this.addSql('CREATE UNIQUE INDEX IF NOT EXISTS "IDX_seller_handle_unique" ON "seller" (handle) WHERE deleted_at IS NULL;');
    this.addSql('CREATE INDEX IF NOT EXISTS "IDX_seller_deleted_at" ON "seller" (deleted_at) WHERE deleted_at IS NULL;');

    this.addSql('create table if not exists "member_invite" ("id" text not null, "email" text not null, "role" text check ("role" in (\'owner\', \'admin\', \'member\')) not null default \'owner\', "seller_id" text not null, "token" text not null, "expires_at" timestamptz not null, "accepted" boolean not null default false, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "member_invite_pkey" primary key ("id"));');
    this.addSql('CREATE INDEX IF NOT EXISTS "IDX_member_invite_seller_id" ON "member_invite" (seller_id) WHERE deleted_at IS NULL;');
    this.addSql('CREATE INDEX IF NOT EXISTS "IDX_member_invite_deleted_at" ON "member_invite" (deleted_at) WHERE deleted_at IS NULL;');

    this.addSql('create table if not exists "member" ("id" text not null, "role" text check ("role" in (\'owner\', \'admin\', \'member\')) not null default \'owner\', "name" text not null, "bio" text null, "phone" text null, "photo" text null, "seller_id" text not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "member_pkey" primary key ("id"));');
    this.addSql('CREATE INDEX IF NOT EXISTS "IDX_member_seller_id" ON "member" (seller_id) WHERE deleted_at IS NULL;');
    this.addSql('CREATE INDEX IF NOT EXISTS "IDX_member_deleted_at" ON "member" (deleted_at) WHERE deleted_at IS NULL;');

    this.addSql('alter table if exists "member_invite" add constraint "member_invite_seller_id_foreign" foreign key ("seller_id") references "seller" ("id") on update cascade on delete cascade;');

    this.addSql('alter table if exists "member" add constraint "member_seller_id_foreign" foreign key ("seller_id") references "seller" ("id") on update cascade on delete cascade;');
  }

  async down(): Promise<void> {
    this.addSql('alter table if exists "member_invite" drop constraint if exists "member_invite_seller_id_foreign";');

    this.addSql('alter table if exists "member" drop constraint if exists "member_seller_id_foreign";');

    this.addSql('drop table if exists "seller" cascade;');

    this.addSql('drop table if exists "member_invite" cascade;');

    this.addSql('drop table if exists "member" cascade;');
  }

}
