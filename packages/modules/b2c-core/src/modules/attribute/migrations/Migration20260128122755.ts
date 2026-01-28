import { Migration } from '@mikro-orm/migrations';

export class Migration20260128122755 extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      `alter table "attribute_value" alter column "value" drop not null;`
    );
  }

  override async down(): Promise<void> {
    this.addSql(
      `alter table "attribute_value" alter column "value" set not null;`
    );
  }
}
