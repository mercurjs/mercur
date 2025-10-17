import { Migration } from "@mikro-orm/migrations";

export class Migration20250716063044 extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      `alter table if exists "order_return_request_line_item" add column if not exists "reason_id" text null;`
    );
  }

  override async down(): Promise<void> {
    this.addSql(
      `alter table if exists "order_return_request_line_item" drop column if exists "reason_id";`
    );
  }
}
