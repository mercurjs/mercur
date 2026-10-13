import { Migration } from "@medusajs/framework/mikro-orm/migrations"

export class Migration20261013120000 extends Migration {
  override async up(): Promise<void> {
    this.addSql(`
      CREATE TABLE IF NOT EXISTS "return_request" (
        "id" text NOT NULL PRIMARY KEY,
        "status" text NOT NULL DEFAULT 'pending',
        "return_id" text NOT NULL,
        "order_id" text NOT NULL,
        "seller_id" text NOT NULL,
        "customer_id" text NULL,
        "requested_by" text NULL,
        "requested_by_type" text NOT NULL,
        "attachments" text[] NOT NULL DEFAULT '{}',
        "return_required" boolean NULL,
        "accepted_by" text NULL,
        "accepted_by_type" text NULL,
        "accepted_at" timestamptz NULL,
        "declined_by" text NULL,
        "declined_by_type" text NULL,
        "declined_at" timestamptz NULL,
        "decline_code" text NULL,
        "decline_reason" text NULL,
        "refunded_by" text NULL,
        "refunded_at" timestamptz NULL,
        "refund_amount" numeric NULL,
        "raw_refund_amount" jsonb NULL,
        "refund_note" text NULL,
        "withdrawn_at" timestamptz NULL,
        "metadata" jsonb NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        "deleted_at" timestamptz NULL
      );
    `)
    this.addSql(`
      CREATE UNIQUE INDEX IF NOT EXISTS "IDX_return_request_return_id"
        ON "return_request" ("return_id")
        WHERE "deleted_at" IS NULL;
    `)
    this.addSql(`
      CREATE INDEX IF NOT EXISTS "IDX_return_request_order_id"
        ON "return_request" ("order_id")
        WHERE "deleted_at" IS NULL;
    `)
    this.addSql(`
      CREATE INDEX IF NOT EXISTS "IDX_return_request_seller_id_status"
        ON "return_request" ("seller_id", "status")
        WHERE "deleted_at" IS NULL;
    `)
    this.addSql(`
      CREATE INDEX IF NOT EXISTS "IDX_return_request_customer_id"
        ON "return_request" ("customer_id")
        WHERE "deleted_at" IS NULL;
    `)
    this.addSql(`
      CREATE INDEX IF NOT EXISTS "IDX_return_request_deleted_at"
        ON "return_request" ("deleted_at")
        WHERE "deleted_at" IS NULL;
    `)
  }

  override async down(): Promise<void> {
    this.addSql(`DROP TABLE IF EXISTS "return_request" CASCADE;`)
  }
}
