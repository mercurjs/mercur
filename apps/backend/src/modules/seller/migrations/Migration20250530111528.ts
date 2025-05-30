import { Migration } from '@mikro-orm/migrations';

export class Migration20250530111528 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "seller" add column if not exists "store_status" text check ("store_status" in ('ACTIVE', 'INACTIVE', 'SUSPENDED')) not null default 'ACTIVE';`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "seller" drop column if exists "store_status";`);
  }

}
