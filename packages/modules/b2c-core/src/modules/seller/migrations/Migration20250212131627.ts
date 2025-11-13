import { Migration } from "@mikro-orm/migrations";

export class Migration20250212131627 extends Migration {
  async up(): Promise<void> {
    this.addSql(
      'alter table if exists "member" add column if not exists "email" text null;'
    );
  }

  async down(): Promise<void> {
    this.addSql(
      'alter table if exists "member" drop column if exists "email";'
    );
  }
}
