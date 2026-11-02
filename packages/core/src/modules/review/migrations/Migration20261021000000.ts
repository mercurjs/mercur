import { Migration } from "@medusajs/framework/mikro-orm/migrations"

export class Migration20261021000000 extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_review_reference_status_created_at" ON "review" ("reference", "status", "created_at") WHERE deleted_at IS NULL;`
    )
  }

  override async down(): Promise<void> {
    this.addSql(`DROP INDEX IF EXISTS "IDX_review_reference_status_created_at";`)
  }
}
