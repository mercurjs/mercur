import { Migration } from '@mikro-orm/migrations';

export class Migration20250102142456 extends Migration {

  async up(): Promise<void> {
    this.addSql('create table if not exists "request" ("id" text not null, "type" text not null, "data" jsonb not null, "submitter_id" text not null, "reviewer_id" text null, "reviewer_note" text null, "status" text check ("status" in (\'pending\', \'accepted\', \'rejected\')) not null default \'pending\', "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "request_pkey" primary key ("id"));');
    this.addSql('CREATE INDEX IF NOT EXISTS "IDX_request_deleted_at" ON "request" (deleted_at) WHERE deleted_at IS NULL;');
  }

  async down(): Promise<void> {
    this.addSql('drop table if exists "request" cascade;');
  }

}
