import { Migration } from "@medusajs/framework/mikro-orm/migrations"

export class Migration20261030000000 extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      `ALTER TABLE IF EXISTS "telemetry_installation" ADD COLUMN IF NOT EXISTS "demo_data_seeded_at" timestamptz NULL;`,
    )
  }

  override async down(): Promise<void> {
    this.addSql(`ALTER TABLE IF EXISTS "telemetry_installation" DROP COLUMN IF EXISTS "demo_data_seeded_at";`)
  }
}
