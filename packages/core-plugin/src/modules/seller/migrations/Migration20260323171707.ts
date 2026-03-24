import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260323171707 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "seller_address" drop constraint if exists "seller_address_seller_id_unique";`);
    this.addSql(`alter table if exists "member_invite" drop constraint if exists "member_invite_email_seller_id_unique";`);
    this.addSql(`alter table if exists "payment_details" drop constraint if exists "payment_details_seller_id_unique";`);
    this.addSql(`alter table if exists "professional_details" drop constraint if exists "professional_details_seller_id_unique";`);
    this.addSql(`alter table if exists "seller" drop constraint if exists "seller_external_id_unique";`);
    this.addSql(`alter table if exists "seller" drop constraint if exists "seller_handle_unique";`);
    this.addSql(`alter table if exists "seller" drop constraint if exists "seller_name_unique";`);
    this.addSql(`alter table if exists "seller" drop constraint if exists "seller_email_unique";`);
    this.addSql(`alter table if exists "member" drop constraint if exists "member_email_unique";`);
    this.addSql(`create table if not exists "member" ("id" text not null, "email" text not null, "locale" text null, "is_active" boolean not null default true, "metadata" jsonb null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "member_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_member_deleted_at" ON "member" ("deleted_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_member_email_unique" ON "member" ("email") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "order_group" ("id" text not null, "display_id" serial, "customer_id" text null, "cart_id" text not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "order_group_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_order_group_deleted_at" ON "order_group" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "seller" ("id" text not null, "name" text not null, "handle" text not null, "email" text not null, "description" text null, "logo" text null, "banner" text null, "website_url" text null, "external_id" text null, "currency_code" text not null, "status" text check ("status" in ('open', 'pending_approval', 'suspended', 'terminated')) not null default 'pending_approval', "status_reason" text null, "is_premium" boolean not null default false, "closed_from" timestamptz null, "closed_to" timestamptz null, "metadata" jsonb null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "seller_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_seller_deleted_at" ON "seller" ("deleted_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_seller_email_unique" ON "seller" ("email") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_seller_name_unique" ON "seller" ("name") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_seller_handle_unique" ON "seller" ("handle") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_seller_external_id_unique" ON "seller" ("external_id") WHERE deleted_at IS NULL AND external_id IS NOT NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_seller_active_closure" ON "seller" ("status", "closed_from", "closed_to") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "professional_details" ("id" text not null, "corporate_name" text not null, "registration_number" text null, "tax_id" text null, "seller_id" text not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "professional_details_pkey" primary key ("id"));`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_professional_details_seller_id_unique" ON "professional_details" ("seller_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_professional_details_deleted_at" ON "professional_details" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "payment_details" ("id" text not null, "holder_name" text not null, "bank_name" text null, "iban" text null, "bic" text null, "routing_number" text null, "account_number" text null, "seller_id" text not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "payment_details_pkey" primary key ("id"));`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_payment_details_seller_id_unique" ON "payment_details" ("seller_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_payment_details_deleted_at" ON "payment_details" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "member_invite" ("id" text not null, "email" text not null, "token" text not null, "accepted" boolean not null default false, "expires_at" timestamptz not null, "role_id" text not null, "seller_id" text not null, "metadata" jsonb null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "member_invite_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_member_invite_seller_id" ON "member_invite" ("seller_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_member_invite_deleted_at" ON "member_invite" ("deleted_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_member_invite_email_seller_id_unique" ON "member_invite" ("email", "seller_id") WHERE deleted_at IS NULL AND accepted = false;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_member_invite_token" ON "member_invite" ("token") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "seller_address" ("id" text not null, "company" text null, "first_name" text null, "last_name" text null, "address_1" text null, "address_2" text null, "city" text null, "country_code" text null, "province" text null, "postal_code" text null, "phone" text null, "metadata" jsonb null, "seller_id" text not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "seller_address_pkey" primary key ("id"));`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_seller_address_seller_id_unique" ON "seller_address" ("seller_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_seller_address_deleted_at" ON "seller_address" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "seller_member" ("id" text not null, "seller_id" text not null, "member_id" text not null, "role_id" text null, "is_owner" boolean not null default false, "metadata" jsonb null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "seller_member_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_seller_member_seller_id" ON "seller_member" ("seller_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_seller_member_member_id" ON "seller_member" ("member_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_seller_member_deleted_at" ON "seller_member" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`alter table if exists "professional_details" add constraint "professional_details_seller_id_foreign" foreign key ("seller_id") references "seller" ("id") on update cascade on delete cascade;`);

    this.addSql(`alter table if exists "payment_details" add constraint "payment_details_seller_id_foreign" foreign key ("seller_id") references "seller" ("id") on update cascade on delete cascade;`);

    this.addSql(`alter table if exists "member_invite" add constraint "member_invite_seller_id_foreign" foreign key ("seller_id") references "seller" ("id") on update cascade on delete cascade;`);

    this.addSql(`alter table if exists "seller_address" add constraint "seller_address_seller_id_foreign" foreign key ("seller_id") references "seller" ("id") on update cascade on delete cascade;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "professional_details" drop constraint if exists "professional_details_seller_id_foreign";`);

    this.addSql(`alter table if exists "payment_details" drop constraint if exists "payment_details_seller_id_foreign";`);

    this.addSql(`alter table if exists "member_invite" drop constraint if exists "member_invite_seller_id_foreign";`);

    this.addSql(`alter table if exists "seller_address" drop constraint if exists "seller_address_seller_id_foreign";`);

    this.addSql(`drop table if exists "member" cascade;`);

    this.addSql(`drop table if exists "order_group" cascade;`);

    this.addSql(`drop table if exists "seller" cascade;`);

    this.addSql(`drop table if exists "professional_details" cascade;`);

    this.addSql(`drop table if exists "payment_details" cascade;`);

    this.addSql(`drop table if exists "member_invite" cascade;`);

    this.addSql(`drop table if exists "seller_address" cascade;`);

    this.addSql(`drop table if exists "seller_member" cascade;`);
  }

}
