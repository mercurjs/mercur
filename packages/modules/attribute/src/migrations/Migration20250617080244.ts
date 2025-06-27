import { Migration } from '@mikro-orm/migrations';

export class Migration20250617080244 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "attribute" drop constraint if exists "attribute_handle_unique";`);
    this.addSql(`create table if not exists "attribute" ("id" text not null, "name" text not null, "description" text null, "handle" text not null, "metadata" jsonb null, "ui_component" text check ("ui_component" in ('select', 'multivalue', 'unit', 'toggle', 'text_area', 'color_picker')) not null default 'select', "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "attribute_pkey" primary key ("id"));`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_attribute_handle_unique" ON "attribute" (handle) WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_attribute_deleted_at" ON "attribute" (deleted_at) WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "attribute_possible_value" ("id" text not null, "value" text not null, "rank" integer not null, "metadata" jsonb null, "attribute_id" text not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "attribute_possible_value_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_attribute_possible_value_attribute_id" ON "attribute_possible_value" (attribute_id) WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_attribute_possible_value_deleted_at" ON "attribute_possible_value" (deleted_at) WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "UQ_attribute_id_value" ON "attribute_possible_value" (attribute_id, value) WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "attribute_value" ("id" text not null, "value" text not null, "rank" integer not null, "metadata" jsonb null, "attribute_id" text not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "attribute_value_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_attribute_value_attribute_id" ON "attribute_value" (attribute_id) WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_attribute_value_deleted_at" ON "attribute_value" (deleted_at) WHERE deleted_at IS NULL;`);

    this.addSql(`alter table if exists "attribute_possible_value" add constraint "attribute_possible_value_attribute_id_foreign" foreign key ("attribute_id") references "attribute" ("id") on update cascade on delete cascade;`);

    this.addSql(`alter table if exists "attribute_value" add constraint "attribute_value_attribute_id_foreign" foreign key ("attribute_id") references "attribute" ("id") on update cascade on delete cascade;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "attribute_possible_value" drop constraint if exists "attribute_possible_value_attribute_id_foreign";`);

    this.addSql(`alter table if exists "attribute_value" drop constraint if exists "attribute_value_attribute_id_foreign";`);

    this.addSql(`drop table if exists "attribute" cascade;`);

    this.addSql(`drop table if exists "attribute_possible_value" cascade;`);

    this.addSql(`drop table if exists "attribute_value" cascade;`);
  }

}
