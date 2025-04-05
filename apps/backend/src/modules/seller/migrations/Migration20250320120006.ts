import { Migration } from '@mikro-orm/migrations';

export class Migration20250320120006 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "seller_api_key" ("id" text not null, "seller_id" text not null, "token" text not null, "redacted" text not null, "title" text not null, "created_by" text not null, "revoked_by" text null, "revoked_at" timestamptz null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "seller_api_key_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_seller_api_key_deleted_at" ON "seller_api_key" (deleted_at) WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "seller_api_key" cascade;`);
  }

}
