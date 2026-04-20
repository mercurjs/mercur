import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260417173000 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "seller" add column if not exists "description" text null;`);
    this.addSql(`alter table if exists "seller" add column if not exists "logo" text null;`);
    this.addSql(`alter table if exists "seller" add column if not exists "banner" text null;`);
    this.addSql(`alter table if exists "seller" add column if not exists "website_url" text null;`);
    this.addSql(`alter table if exists "seller" add column if not exists "external_id" text null;`);
    this.addSql(`alter table if exists "seller" add column if not exists "currency_code" text null;`);
    this.addSql(`alter table if exists "seller" add column if not exists "status_reason" text null;`);
    this.addSql(`alter table if exists "seller" add column if not exists "is_premium" boolean not null default false;`);
    this.addSql(`alter table if exists "seller" add column if not exists "closed_from" timestamptz null;`);
    this.addSql(`alter table if exists "seller" add column if not exists "closed_to" timestamptz null;`);
    this.addSql(`alter table if exists "seller" add column if not exists "metadata" jsonb null;`);

    this.addSql(`alter table if exists "seller" drop constraint if exists "seller_status_check";`);
    this.addSql(`update "seller" set "status" = 'pending_approval' where "status" = 'pending';`);
    this.addSql(`update "seller" set "status" = 'open' where "status" = 'active';`);
    this.addSql(`update "seller" set "currency_code" = '' where "currency_code" is null;`);

    this.addSql(`alter table if exists "seller" add constraint "seller_status_check" check ("status" in ('open', 'pending_approval', 'suspended', 'terminated'));`);
    this.addSql(`alter table if exists "seller" alter column "status" set default 'pending_approval';`);
    this.addSql(`alter table if exists "seller" alter column "currency_code" set not null;`);

    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_seller_email_unique" ON "seller" ("email") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_seller_name_unique" ON "seller" ("name") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_seller_handle_unique" ON "seller" ("handle") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_seller_external_id_unique" ON "seller" ("external_id") WHERE deleted_at IS NULL AND external_id IS NOT NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_seller_active_closure" ON "seller" ("status", "closed_from", "closed_to") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_seller_deleted_at" ON "seller" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`alter table if exists "order_group" add column if not exists "display_id" integer null;`);
    this.addSql(`alter table if exists "order_group" add column if not exists "cart_id" text null;`);
    this.addSql(`alter table if exists "order_group" alter column "customer_id" drop not null;`);

    this.addSql(`create sequence if not exists "order_group_display_id_seq";`);
    this.addSql(`alter sequence "order_group_display_id_seq" owned by "order_group"."display_id";`);
    this.addSql(`alter table if exists "order_group" alter column "display_id" set default nextval('"order_group_display_id_seq"');`);
    this.addSql(`update "order_group" set "display_id" = nextval('"order_group_display_id_seq"') where "display_id" is null;`);
    this.addSql(`select setval('"order_group_display_id_seq"', greatest(coalesce((select max("display_id") from "order_group"), 1), 1), true);`);

    this.addSql(`update "order_group" set "cart_id" = '' where "cart_id" is null;`);
    this.addSql(`alter table if exists "order_group" alter column "cart_id" set not null;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "order_group" alter column "cart_id" drop not null;`);
    this.addSql(`alter table if exists "order_group" alter column "display_id" drop default;`);
    this.addSql(`drop sequence if exists "order_group_display_id_seq";`);

    this.addSql(`drop index if exists "IDX_seller_active_closure";`);
    this.addSql(`drop index if exists "IDX_seller_external_id_unique";`);
    this.addSql(`drop index if exists "IDX_seller_name_unique";`);
    this.addSql(`drop index if exists "IDX_seller_email_unique";`);

    this.addSql(`alter table if exists "seller" alter column "currency_code" drop not null;`);
    this.addSql(`alter table if exists "seller" alter column "status" set default 'pending';`);
    this.addSql(`alter table if exists "seller" drop constraint if exists "seller_status_check";`);
    this.addSql(`alter table if exists "seller" add constraint "seller_status_check" check ("status" in ('pending', 'active', 'suspended'));`);

    this.addSql(`update "seller" set "status" = 'pending' where "status" = 'pending_approval';`);
    this.addSql(`update "seller" set "status" = 'active' where "status" = 'open';`);
  }

}
