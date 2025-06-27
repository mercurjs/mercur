import { Migration } from '@mikro-orm/migrations';

export class Migration20250620110849 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "attribute" add column if not exists "is_filterable" boolean not null default true;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "attribute" drop column if exists "is_filterable";`);
  }

}
