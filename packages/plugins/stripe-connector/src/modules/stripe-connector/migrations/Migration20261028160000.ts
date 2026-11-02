import { Migration } from "@medusajs/framework/mikro-orm/migrations"

export class Migration20261028160000 extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      `alter table if exists "stripe_settlement" add column if not exists "payout_amount" numeric null, add column if not exists "raw_payout_amount" jsonb null, add column if not exists "payout_currency_code" text null;`
    )
  }

  override async down(): Promise<void> {
    this.addSql(
      `alter table if exists "stripe_settlement" drop column if exists "payout_amount", drop column if exists "raw_payout_amount", drop column if exists "payout_currency_code";`
    )
  }
}
