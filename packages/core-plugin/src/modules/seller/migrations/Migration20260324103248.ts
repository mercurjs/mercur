import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260324103248 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "member_invite" drop constraint if exists "member_invite_email_seller_id_unique";`);
    this.addSql(`alter table if exists "seller" drop constraint if exists "seller_handle_unique";`);
    this.addSql(`create table if not exists "order_group" ("id" text not null, "display_id" serial, "customer_id" text null, "cart_id" text not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "order_group_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_order_group_deleted_at" ON "order_group" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "seller" ("id" text not null, "name" text not null, "handle" text not null, "email" text not null, "phone" text null, "logo" text null, "cover_image" text null, "address_1" text null, "address_2" text null, "city" text null, "country_code" text null, "province" text null, "postal_code" text null, "status" text check ("status" in ('open', 'pending_approval', 'suspended', 'terminated')) not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "seller_pkey" primary key ("id"));`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_seller_handle_unique" ON "seller" ("handle") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_seller_deleted_at" ON "seller" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "member_invite" ("id" text not null, "email" text not null, "token" text not null, "accepted" boolean not null default false, "expires_at" timestamptz not null, "role_id" text not null, "seller_id" text not null, "metadata" jsonb null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "member_invite_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_member_invite_seller_id" ON "member_invite" ("seller_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_member_invite_deleted_at" ON "member_invite" ("deleted_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_member_invite_email_seller_id_unique" ON "member_invite" ("email", "seller_id") WHERE deleted_at IS NULL AND accepted = false;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_member_invite_token" ON "member_invite" ("token") WHERE deleted_at IS NULL;`);

    this.addSql(`alter table if exists "member_invite" add constraint "member_invite_seller_id_foreign" foreign key ("seller_id") references "seller" ("id") on update cascade;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "member_invite" drop constraint if exists "member_invite_seller_id_foreign";`);

    this.addSql(`drop table if exists "order_group" cascade;`);

    this.addSql(`drop table if exists "seller" cascade;`);

    this.addSql(`drop table if exists "member_invite" cascade;`);
  }

}
