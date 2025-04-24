import { Migration } from '@mikro-orm/migrations'

export class Migration20250424000000 extends Migration {
  async up(): Promise<void> {
    this.addSql(
      'alter table "seller" add column "type" text check ("type" in (\'manufacturer\', \'reseller\')) not null default \'reseller\';'
    )
  }

  async down(): Promise<void> {
    this.addSql('alter table "seller" drop column "type";')
  }
} 