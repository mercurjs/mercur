import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260430144500 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "product_change_rejection_reason" drop constraint if exists "product_change_rejection_reason_product_rejectio_8c955_foreign";`);
    this.addSql(`alter table if exists "product_change_rejection_reason" drop constraint if exists "product_change_rejection_reason_product_change_id_foreign";`);
    this.addSql(`drop table if exists "product_change_rejection_reason" cascade;`);
    this.addSql(`drop table if exists "product_rejection_reason" cascade;`);
  }

  override async down(): Promise<void> {
    this.addSql(`create table if not exists "product_rejection_reason" ("id" text not null, "code" text not null, "label" text not null, "type" text check ("type" in ('temporary', 'permanent')) not null, "is_active" boolean not null default true, "metadata" jsonb null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "product_rejection_reason_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_product_rejection_reason_deleted_at" ON "product_rejection_reason" ("deleted_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_product_rejection_reason_code_unique" ON "product_rejection_reason" ("code") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_product_rejection_reason_type" ON "product_rejection_reason" ("type") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "product_change_rejection_reason" ("product_change_id" text not null, "product_rejection_reason_id" text not null, constraint "product_change_rejection_reason_pkey" primary key ("product_change_id", "product_rejection_reason_id"));`);
    this.addSql(`alter table if exists "product_change_rejection_reason" add constraint "product_change_rejection_reason_product_change_id_foreign" foreign key ("product_change_id") references "product_change" ("id") on update cascade on delete cascade;`);
    this.addSql(`alter table if exists "product_change_rejection_reason" add constraint "product_change_rejection_reason_product_rejectio_8c955_foreign" foreign key ("product_rejection_reason_id") references "product_rejection_reason" ("id") on update cascade on delete cascade;`);
  }

}
