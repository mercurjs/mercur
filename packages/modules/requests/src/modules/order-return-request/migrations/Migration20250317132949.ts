import { Migration } from '@mikro-orm/migrations'

export class Migration20250317132949 extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      `alter table if exists "order_return_request" add column if not exists "shipping_option_id" text null;`
    )
  }

  override async down(): Promise<void> {
    this.addSql(
      `alter table if exists "order_return_request" drop column if exists "shipping_option_id";`
    )
  }
}
