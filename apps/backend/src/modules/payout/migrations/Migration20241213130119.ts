import { Migration } from '@mikro-orm/migrations';

export class Migration20241213130119 extends Migration {

  async up(): Promise<void> {
    this.addSql('create table if not exists "onboarding" ("id" text not null, "data" jsonb null, "context" jsonb null, "payout_account_id" text not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "onboarding_pkey" primary key ("id"));');
    this.addSql('alter table if exists "onboarding" add constraint "onboarding_payout_account_id_unique" unique ("payout_account_id");');
    this.addSql('CREATE INDEX IF NOT EXISTS "IDX_onboarding_payout_account_id" ON "onboarding" (payout_account_id) WHERE deleted_at IS NULL;');
    this.addSql('CREATE INDEX IF NOT EXISTS "IDX_onboarding_deleted_at" ON "onboarding" (deleted_at) WHERE deleted_at IS NULL;');

    this.addSql('alter table if exists "onboarding" add constraint "onboarding_payout_account_id_foreign" foreign key ("payout_account_id") references "payout_account" ("id") on update cascade;');
  }

  async down(): Promise<void> {
    this.addSql('drop table if exists "onboarding" cascade;');
  }

}
