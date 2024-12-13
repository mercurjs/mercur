import { Migration } from '@mikro-orm/migrations';

export class Migration20241213132905 extends Migration {

  async up(): Promise<void> {
    this.addSql('alter table if exists "payout_account" add column if not exists "context" jsonb null;');
  }

  async down(): Promise<void> {
    this.addSql('alter table if exists "payout_account" drop column if exists "context";');
  }

}
