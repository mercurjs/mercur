import { Migration } from "@medusajs/framework/mikro-orm/migrations"

export class Migration20261021000000 extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_order_group_cart_id" ON "order_group" ("cart_id") WHERE deleted_at IS NULL;`
    )
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_order_group_customer_id_created_at" ON "order_group" ("customer_id", "created_at") WHERE deleted_at IS NULL;`
    )
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_order_group_created_at" ON "order_group" ("created_at") WHERE deleted_at IS NULL;`
    )
  }

  override async down(): Promise<void> {
    this.addSql(`DROP INDEX IF EXISTS "IDX_order_group_cart_id";`)
    this.addSql(`DROP INDEX IF EXISTS "IDX_order_group_customer_id_created_at";`)
    this.addSql(`DROP INDEX IF EXISTS "IDX_order_group_created_at";`)
  }
}
