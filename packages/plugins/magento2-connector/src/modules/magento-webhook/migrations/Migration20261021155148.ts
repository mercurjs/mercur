import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20261021155148 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "magento_webhook_endpoint" ("id" text not null, "url" text not null, "secret" text not null, "events" text[] not null, "is_active" boolean not null default true, "description" text null, "metadata" jsonb null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "magento_webhook_endpoint_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_magento_webhook_endpoint_deleted_at" ON "magento_webhook_endpoint" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "magento_webhook_delivery" ("id" text not null, "event" text not null, "payload" jsonb not null, "status" text check ("status" in ('pending', 'delivered', 'failed', 'dead')) not null default 'pending', "attempts" integer not null default 0, "next_attempt_at" timestamptz null, "response_status" integer null, "response_body" text null, "delivered_at" timestamptz null, "endpoint_id" text not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "magento_webhook_delivery_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_magento_webhook_delivery_endpoint_id" ON "magento_webhook_delivery" ("endpoint_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_magento_webhook_delivery_deleted_at" ON "magento_webhook_delivery" ("deleted_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_magento_webhook_delivery_due" ON "magento_webhook_delivery" ("status", "next_attempt_at") WHERE deleted_at IS NULL;`);

    this.addSql(`alter table if exists "magento_webhook_delivery" add constraint "magento_webhook_delivery_endpoint_id_foreign" foreign key ("endpoint_id") references "magento_webhook_endpoint" ("id") on update cascade on delete cascade;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "magento_webhook_delivery" drop constraint if exists "magento_webhook_delivery_endpoint_id_foreign";`);

    this.addSql(`drop table if exists "magento_webhook_endpoint" cascade;`);

    this.addSql(`drop table if exists "magento_webhook_delivery" cascade;`);
  }

}
