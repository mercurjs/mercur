import { Migration } from '@mikro-orm/migrations';

export class Migration20250313065552 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "seller_onboarding" drop constraint if exists "seller_onboarding_seller_id_unique";`);
    this.addSql(`drop index if exists "seller_onboarding_seller_id_unique";`);
    this.addSql(`drop index if exists "IDX_seller_onboarding_seller_id";`);

    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_seller_onboarding_seller_id_unique" ON "seller_onboarding" (seller_id) WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop index if exists "IDX_seller_onboarding_seller_id_unique";`);

    this.addSql(`alter table if exists "seller_onboarding" add constraint "seller_onboarding_seller_id_unique" unique ("seller_id");`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_seller_onboarding_seller_id" ON "seller_onboarding" (seller_id) WHERE deleted_at IS NULL;`);
  }

}
