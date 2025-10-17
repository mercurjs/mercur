import { Migration } from '@mikro-orm/migrations';

export class Migration20250307091819 extends Migration {

  async up(): Promise<void> {
    this.addSql('alter table if exists "seller" add column if not exists "email" text null, add column if not exists "phone" text null, add column if not exists "state" text null;');
  }

  async down(): Promise<void> {
    this.addSql('alter table if exists "seller" drop column if exists "email";');
    this.addSql('alter table if exists "seller" drop column if exists "phone";');
    this.addSql('alter table if exists "seller" drop column if exists "state";');
  }

}
