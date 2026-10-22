import { Migration } from "@medusajs/framework/mikro-orm/migrations"

export class Migration20261021120000 extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      `ALTER TABLE IF EXISTS "order_group" ADD COLUMN IF NOT EXISTS "metadata" jsonb NULL;`
    )
  }

  override async down(): Promise<void> {
    this.addSql(`ALTER TABLE IF EXISTS "order_group" DROP COLUMN IF EXISTS "metadata";`)
  }
}
