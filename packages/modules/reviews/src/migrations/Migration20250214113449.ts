import { Migration } from '@mikro-orm/migrations';

export class Migration20250214113449 extends Migration {

  async up(): Promise<void> {
    this.addSql('alter table if exists "review" drop column if exists "customer_id";');
  }

  async down(): Promise<void> {
    this.addSql('alter table if exists "review" add column if not exists "customer_id" text not null;');
  }

}
