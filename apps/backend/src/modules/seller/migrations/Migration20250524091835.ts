import { Migration } from '@mikro-orm/migrations';

export class Migration20250524091835 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "seller" drop constraint if exists "seller_gstin_unique";`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_seller_gstin_unique" ON "seller" (gstin) WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop index if exists "IDX_seller_gstin_unique";`);
  }

}
