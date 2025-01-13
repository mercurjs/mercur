import { Migration } from '@mikro-orm/migrations';

export class Migration20250107130821 extends Migration {

  async up(): Promise<void> {
    this.addSql('CREATE TABLE if not exists "seller" ("id" text not null, "email" text not null, "name" text not null, "lastName" text not null, "shopName" text not null, "address1" text not null, "address2" text not null, "zip" text not null, "city" text not null, "country" text not null, "phone" text not null, "status" text not null, "handle" text not null, "description" text null, "photo" text null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "seller_pkey" primary key ("id"));');
		this.addSql('ALTER TABLE if exists "seller" ADD COLUMN if not exists "email" TEXT NOT NULL, ADD COLUMN if not exists "lastName" TEXT NOT NULL, ADD COLUMN if not exists "shopName" TEXT NOT NULL, ADD COLUMN if not exists "address1" TEXT NOT NULL, ADD COLUMN if not exists "address2" TEXT NOT NULL, ADD COLUMN if not exists "zip" TEXT NOT NULL, ADD COLUMN if not exists "city" TEXT NOT NULL, ADD COLUMN if not exists "country" TEXT NOT NULL, ADD COLUMN if not exists "phone" TEXT NOT NULL, ADD COLUMN if not exists "status" TEXT NOT NULL')
    this.addSql('CREATE UNIQUE INDEX IF NOT EXISTS "IDX_seller_handle_unique" ON "seller" (handle) WHERE deleted_at IS NULL;');
    this.addSql('CREATE INDEX IF NOT EXISTS "IDX_seller_deleted_at" ON "seller" (deleted_at) WHERE deleted_at IS NULL;');

    this.addSql('CREATE TABLE if not exists "member_invite" ("id" text not null, "email" text not null, "role" text check ("role" in (\'owner\', \'admin\', \'member\')) not null default \'owner\', "seller_id" text not null, "token" text not null, "expires_at" timestamptz not null, "accepted" boolean not null default false, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "member_invite_pkey" primary key ("id"));');
    this.addSql('CREATE INDEX IF NOT EXISTS "IDX_member_invite_seller_id" ON "member_invite" (seller_id) WHERE deleted_at IS NULL;');
    this.addSql('CREATE INDEX IF NOT EXISTS "IDX_member_invite_deleted_at" ON "member_invite" (deleted_at) WHERE deleted_at IS NULL;');

    this.addSql('CREATE TABLE if not exists "member" ("id" text not null, "role" text check ("role" in (\'owner\', \'admin\', \'member\')) not null default \'owner\', "name" text not null, "bio" text null, "phone" text null, "photo" text null, "seller_id" text not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "member_pkey" primary key ("id"));');
    this.addSql('CREATE INDEX IF NOT EXISTS "IDX_member_seller_id" ON "member" (seller_id) WHERE deleted_at IS NULL;');
    this.addSql('CREATE INDEX IF NOT EXISTS "IDX_member_deleted_at" ON "member" (deleted_at) WHERE deleted_at IS NULL;');

		this.addSql('ALTER TABLE if exists "member_invite" DROP constraint if exists "member_invite_seller_id_foreign";');
    this.addSql('ALTER TABLE if exists "member" DROP constraint if exists "member_seller_id_foreign";');
    this.addSql('ALTER TABLE if exists "member_invite" ADD constraint "member_invite_seller_id_foreign" foreign key ("seller_id") references "seller" ("id") on update cascade;');
    this.addSql('ALTER TABLE if exists "member" ADD constraint "member_seller_id_foreign" foreign key ("seller_id") references "seller" ("id") on update cascade;');
  }

  async down(): Promise<void> {
    this.addSql('ALTER TABLE if exists "member_invite" drop constraint if exists "member_invite_seller_id_foreign";');
    this.addSql('ALTER TABLE if exists "member" drop constraint if exists "member_seller_id_foreign";');
    this.addSql('ALTER TABLE "seller" DROP COLUMN if exists "email", DROP COLUMN if exists "lastName", DROP COLUMN if exists "shopName", DROP COLUMN if exists "address1", DROP COLUMN if exists "address2", DROP COLUMN if exists "zip", DROP COLUMN if exists "city", DROP COLUMN if exists "country", DROP COLUMN if exists "phone", DROP COLUMN if exists "status";')
    this.addSql('DROP TABLE if exists "member_invite" cascade;');
    this.addSql('DROP TABLE if exists "member" cascade;');
  }
}

