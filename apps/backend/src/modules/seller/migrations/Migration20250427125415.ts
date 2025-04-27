import { Migration } from '@mikro-orm/migrations';

export class Migration20250427125415 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "seller" rename column "tax_id" to "gstin";`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "seller" rename column "gstin" to "tax_id";`);
  }

}
