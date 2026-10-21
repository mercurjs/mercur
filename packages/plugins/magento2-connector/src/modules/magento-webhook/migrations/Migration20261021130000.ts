import { Migration } from "@medusajs/framework/mikro-orm/migrations"

export class Migration20261021130000 extends Migration {
  override async up(): Promise<void> {
    this.addSql(`
      CREATE TABLE IF NOT EXISTS "magento_webhook_endpoint" (
        "id" text NOT NULL,
        "url" text NOT NULL,
        "secret" text NOT NULL,
        "events" text[] NOT NULL,
        "is_active" boolean NOT NULL DEFAULT true,
        "description" text NULL,
        "metadata" jsonb NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        "deleted_at" timestamptz NULL,
        CONSTRAINT "magento_webhook_endpoint_pkey" PRIMARY KEY ("id")
      );
    `)
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_magento_webhook_endpoint_deleted_at" ON "magento_webhook_endpoint" ("deleted_at") WHERE deleted_at IS NULL;`
    )
    this.addSql(`
      CREATE TABLE IF NOT EXISTS "magento_webhook_delivery" (
        "id" text NOT NULL,
        "event" text NOT NULL,
        "payload" jsonb NOT NULL,
        "status" text CHECK ("status" IN ('pending', 'delivered', 'failed', 'dead')) NOT NULL DEFAULT 'pending',
        "attempts" integer NOT NULL DEFAULT 0,
        "next_attempt_at" timestamptz NULL,
        "response_status" integer NULL,
        "response_body" text NULL,
        "delivered_at" timestamptz NULL,
        "endpoint_id" text NOT NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        "deleted_at" timestamptz NULL,
        CONSTRAINT "magento_webhook_delivery_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "magento_webhook_delivery_endpoint_id_foreign" FOREIGN KEY ("endpoint_id") REFERENCES "magento_webhook_endpoint" ("id") ON UPDATE CASCADE ON DELETE CASCADE
      );
    `)
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_magento_webhook_delivery_deleted_at" ON "magento_webhook_delivery" ("deleted_at") WHERE deleted_at IS NULL;`
    )
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_magento_webhook_delivery_due" ON "magento_webhook_delivery" ("status", "next_attempt_at") WHERE deleted_at IS NULL;`
    )
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_magento_webhook_delivery_endpoint_id" ON "magento_webhook_delivery" ("endpoint_id") WHERE deleted_at IS NULL;`
    )
  }

  override async down(): Promise<void> {
    this.addSql(`DROP TABLE IF EXISTS "magento_webhook_delivery" CASCADE;`)
    this.addSql(`DROP TABLE IF EXISTS "magento_webhook_endpoint" CASCADE;`)
  }
}
