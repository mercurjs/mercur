import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260323170925 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "subscription_plan" ("id" text not null, "currency_code" text not null, "monthly_amount" numeric not null, "free_months" integer not null default 0, "requires_orders" boolean not null default false, "metadata" jsonb null, "raw_monthly_amount" jsonb not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "subscription_plan_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_subscription_plan_deleted_at" ON "subscription_plan" ("deleted_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_subscription_plan_unique_currency" ON "subscription_plan" ("currency_code") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "subscription_override" ("id" text not null, "reference" text not null, "reference_id" text not null, "plan_id" text not null, "monthly_amount" numeric null, "free_months" integer null, "free_from" timestamptz null, "free_to" timestamptz null, "metadata" jsonb null, "raw_monthly_amount" jsonb null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "subscription_override_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_subscription_override_plan_id" ON "subscription_override" ("plan_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_subscription_override_deleted_at" ON "subscription_override" ("deleted_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_subscription_override_unique_reference" ON "subscription_override" ("reference", "reference_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_subscription_override_reference_id" ON "subscription_override" ("reference_id") WHERE deleted_at IS NULL;`);

    this.addSql(`alter table if exists "subscription_override" add constraint "subscription_override_plan_id_foreign" foreign key ("plan_id") references "subscription_plan" ("id") on update cascade on delete cascade;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "subscription_override" drop constraint if exists "subscription_override_plan_id_foreign";`);

    this.addSql(`drop table if exists "subscription_plan" cascade;`);

    this.addSql(`drop table if exists "subscription_override" cascade;`);
  }

}
