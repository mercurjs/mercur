import { Migration } from "@medusajs/framework/mikro-orm/migrations"

export class Migration20261021000000 extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_commission_rule_reference_reference_id" ON "commission_rule" ("reference", "reference_id") WHERE deleted_at IS NULL;`
    )
  }

  override async down(): Promise<void> {
    this.addSql(`DROP INDEX IF EXISTS "IDX_commission_rule_reference_reference_id";`)
  }
}
