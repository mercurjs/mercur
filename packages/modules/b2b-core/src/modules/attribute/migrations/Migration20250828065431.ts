import { Migration } from '@mikro-orm/migrations';

export class Migration20250828065431 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "attribute" add column if not exists "is_required" boolean not null default false;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "attribute" drop column if exists "is_required";`);
  }

}
