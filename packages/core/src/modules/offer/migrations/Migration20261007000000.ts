import { Migration } from "@medusajs/framework/mikro-orm/migrations"

export class Migration20261007000000 extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      `create table if not exists "offer_condition" ("id" text not null, "code" text not null, "label" text not null, "is_active" boolean not null default true, "rank" integer not null default 0, "metadata" jsonb null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "offer_condition_pkey" primary key ("id"));`
    )
    this.addSql(
      `CREATE UNIQUE INDEX IF NOT EXISTS "IDX_offer_condition_code_unique" ON "offer_condition" ("code") WHERE deleted_at IS NULL;`
    )
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_offer_condition_deleted_at" ON "offer_condition" ("deleted_at") WHERE deleted_at IS NULL;`
    )

    this.addSql(
      `ALTER TABLE "offer" ADD COLUMN IF NOT EXISTS "condition_id" text NULL;`
    )
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_offer_condition_id" ON "offer" ("condition_id") WHERE deleted_at IS NULL AND condition_id IS NOT NULL;`
    )
    this.addSql(
      `alter table if exists "offer" add constraint "offer_condition_id_foreign" foreign key ("condition_id") references "offer_condition" ("id") on update cascade on delete set null;`
    )

    this.addSql(
      `insert into "offer_condition" ("id", "code", "label", "is_active", "rank") values ('ofcond_new', 'new', 'New', true, 0) on conflict ("id") do nothing;`
    )
  }

  override async down(): Promise<void> {
    this.addSql(
      `alter table if exists "offer" drop constraint if exists "offer_condition_id_foreign";`
    )
    this.addSql(`DROP INDEX IF EXISTS "IDX_offer_condition_id";`)
    this.addSql(`ALTER TABLE "offer" DROP COLUMN IF EXISTS "condition_id";`)
    this.addSql(`drop table if exists "offer_condition" cascade;`)
  }
}
