import { Migration } from "@medusajs/framework/mikro-orm/migrations"

export class Migration20260601000000 extends Migration {
  override async up(): Promise<void> {
    this.addSql(`
      CREATE TABLE IF NOT EXISTS "product_attribute" (
        "id" text NOT NULL PRIMARY KEY,
        "handle" text NULL,
        "name" text NOT NULL,
        "description" text NULL,
        "type" text NOT NULL,
        "is_required" boolean NOT NULL DEFAULT false,
        "is_filterable" boolean NOT NULL DEFAULT false,
        "is_variant_axis" boolean NOT NULL DEFAULT false,
        "rank" integer NOT NULL DEFAULT 0,
        "is_active" boolean NOT NULL DEFAULT true,
        "created_by" text NULL,
        "metadata" jsonb NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        "deleted_at" timestamptz NULL
      );
    `)
    this.addSql(`
      CREATE UNIQUE INDEX IF NOT EXISTS "IDX_product_attribute_handle_unique"
        ON "product_attribute" ("handle")
        WHERE "deleted_at" IS NULL AND "handle" IS NOT NULL;
    `)
    this.addSql(`
      CREATE INDEX IF NOT EXISTS "IDX_product_attribute_type"
        ON "product_attribute" ("type")
        WHERE "deleted_at" IS NULL;
    `)

    this.addSql(`
      CREATE TABLE IF NOT EXISTS "product_attribute_value" (
        "id" text NOT NULL PRIMARY KEY,
        "handle" text NULL,
        "name" text NOT NULL,
        "rank" integer NOT NULL DEFAULT 0,
        "is_active" boolean NOT NULL DEFAULT true,
        "metadata" jsonb NULL,
        "attribute_id" text NOT NULL REFERENCES "product_attribute"("id") ON DELETE CASCADE,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        "deleted_at" timestamptz NULL
      );
    `)
    this.addSql(`
      CREATE UNIQUE INDEX IF NOT EXISTS "IDX_product_attribute_value_handle_unique"
        ON "product_attribute_value" ("attribute_id", "handle")
        WHERE "deleted_at" IS NULL AND "handle" IS NOT NULL;
    `)
  }

  override async down(): Promise<void> {
    this.addSql(`DROP TABLE IF EXISTS "product_attribute_value";`)
    this.addSql(`DROP TABLE IF EXISTS "product_attribute";`)
  }
}
