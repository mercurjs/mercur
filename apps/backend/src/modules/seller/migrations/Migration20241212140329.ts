import { Migration } from '@mikro-orm/migrations';

export class Migration20241212140329 extends Migration {

  async up(): Promise<void> {
    this.addSql('create table if not exists "onboarding" ("id" text not null, "is_payment_account_setup_completed" boolean not null default false, "seller_id" text not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "onboarding_pkey" primary key ("id"));');
    this.addSql('alter table if exists "onboarding" add constraint "onboarding_seller_id_unique" unique ("seller_id");');
    this.addSql('CREATE INDEX IF NOT EXISTS "IDX_onboarding_seller_id" ON "onboarding" (seller_id) WHERE deleted_at IS NULL;');
    this.addSql('CREATE INDEX IF NOT EXISTS "IDX_onboarding_deleted_at" ON "onboarding" (deleted_at) WHERE deleted_at IS NULL;');

    this.addSql('alter table if exists "onboarding" add constraint "onboarding_seller_id_foreign" foreign key ("seller_id") references "seller" ("id") on update cascade;');

    this.addSql('alter table if exists "member_invite" drop constraint if exists "member_invite_seller_id_foreign";');

    this.addSql('alter table if exists "member" drop constraint if exists "member_seller_id_foreign";');

    this.addSql('alter table if exists "member_invite" add constraint "member_invite_seller_id_foreign" foreign key ("seller_id") references "seller" ("id") on update cascade;');

    this.addSql('alter table if exists "member" add constraint "member_seller_id_foreign" foreign key ("seller_id") references "seller" ("id") on update cascade;');
  }

  async down(): Promise<void> {
    this.addSql('drop table if exists "onboarding" cascade;');

    this.addSql('alter table if exists "member_invite" drop constraint if exists "member_invite_seller_id_foreign";');

    this.addSql('alter table if exists "member" drop constraint if exists "member_seller_id_foreign";');

    this.addSql('alter table if exists "member_invite" add constraint "member_invite_seller_id_foreign" foreign key ("seller_id") references "seller" ("id") on update cascade on delete cascade;');

    this.addSql('alter table if exists "member" add constraint "member_seller_id_foreign" foreign key ("seller_id") references "seller" ("id") on update cascade on delete cascade;');
  }

}
