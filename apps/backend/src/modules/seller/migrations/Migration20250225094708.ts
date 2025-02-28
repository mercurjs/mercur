import { Migration } from '@mikro-orm/migrations'

export class Migration20250225094708 extends Migration {
  async up(): Promise<void> {
    this.addSql(
      'create table if not exists "seller_onboarding" ("id" text not null, "store_information" boolean not null default false, "stripe_connection" boolean not null default false, "locations_shipping" boolean not null default false, "products" boolean not null default false, "seller_id" text not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "seller_onboarding_pkey" primary key ("id"));'
    )
    this.addSql(
      'alter table if exists "seller_onboarding" add constraint "seller_onboarding_seller_id_unique" unique ("seller_id");'
    )
    this.addSql(
      'CREATE INDEX IF NOT EXISTS "IDX_seller_onboarding_seller_id" ON "seller_onboarding" (seller_id) WHERE deleted_at IS NULL;'
    )
    this.addSql(
      'CREATE INDEX IF NOT EXISTS "IDX_seller_onboarding_deleted_at" ON "seller_onboarding" (deleted_at) WHERE deleted_at IS NULL;'
    )

    this.addSql(
      'alter table if exists "seller_onboarding" add constraint "seller_onboarding_seller_id_foreign" foreign key ("seller_id") references "seller" ("id") on update cascade;'
    )
  }

  async down(): Promise<void> {
    this.addSql('drop table if exists "seller_onboarding" cascade;')
  }
}
