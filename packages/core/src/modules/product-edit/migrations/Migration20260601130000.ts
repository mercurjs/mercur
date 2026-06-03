import { Migration } from "@medusajs/framework/mikro-orm/migrations"

export class Migration20260601130000 extends Migration {
  override async up(): Promise<void> {
    this.addSql(`
      CREATE TABLE IF NOT EXISTS "product_change" (
        "id" text NOT NULL PRIMARY KEY,
        "product_id" text NOT NULL,
        "status" text NOT NULL DEFAULT 'pending',
        "internal_note" text NULL,
        "external_note" text NULL,
        "created_by" text NULL,
        "confirmed_by" text NULL,
        "confirmed_at" timestamptz NULL,
        "declined_by" text NULL,
        "declined_at" timestamptz NULL,
        "declined_reason" text NULL,
        "canceled_by" text NULL,
        "canceled_at" timestamptz NULL,
        "requires_action_by" text NULL,
        "requires_action_at" timestamptz NULL,
        "requires_action_reason" text NULL,
        "metadata" jsonb NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        "deleted_at" timestamptz NULL
      );
    `)
    this.addSql(`
      CREATE INDEX IF NOT EXISTS "IDX_product_change_status"
        ON "product_change" ("status")
        WHERE "deleted_at" IS NULL;
    `)
    this.addSql(`
      CREATE INDEX IF NOT EXISTS "IDX_product_change_product_id"
        ON "product_change" ("product_id")
        WHERE "deleted_at" IS NULL;
    `)

    this.addSql(`
      CREATE TABLE IF NOT EXISTS "product_change_action" (
        "id" text NOT NULL PRIMARY KEY,
        "product_id" text NOT NULL,
        "ordering" bigserial NOT NULL,
        "action" text NOT NULL,
        "details" jsonb NOT NULL DEFAULT '{}'::jsonb,
        "internal_note" text NULL,
        "applied" boolean NOT NULL DEFAULT false,
        "product_change_id" text NULL REFERENCES "product_change"("id") ON DELETE SET NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        "deleted_at" timestamptz NULL
      );
    `)
    this.addSql(`
      CREATE INDEX IF NOT EXISTS "IDX_prodchact_product_change_id"
        ON "product_change_action" ("product_change_id")
        WHERE "deleted_at" IS NULL;
    `)
    this.addSql(`
      CREATE INDEX IF NOT EXISTS "IDX_prodchact_product_id"
        ON "product_change_action" ("product_id")
        WHERE "deleted_at" IS NULL;
    `)
    this.addSql(`
      CREATE INDEX IF NOT EXISTS "IDX_prodchact_ordering"
        ON "product_change_action" ("ordering")
        WHERE "deleted_at" IS NULL;
    `)
  }

  override async down(): Promise<void> {
    this.addSql(`DROP TABLE IF EXISTS "product_change_action";`)
    this.addSql(`DROP TABLE IF EXISTS "product_change";`)
  }
}
