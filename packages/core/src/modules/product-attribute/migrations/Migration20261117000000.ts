import { Migration } from "@medusajs/framework/mikro-orm/migrations"

export class Migration20261117000000 extends Migration {
  override async up(): Promise<void> {
    this.addSql(`
      ALTER TABLE "product_attribute"
        ADD COLUMN IF NOT EXISTS "scope" text CHECK ("scope" IN ('product', 'variant')) NOT NULL DEFAULT 'product';
    `)
    this.addSql(`
      CREATE INDEX IF NOT EXISTS "IDX_product_attribute_scope"
        ON "product_attribute" ("scope") WHERE deleted_at IS NULL;
    `)

    this.addSql(`
      CREATE TABLE IF NOT EXISTS "product_variant_attribute_value" (
        "id" text NOT NULL,
        "variant_id" text NOT NULL,
        "metadata" jsonb NULL,
        "value_id" text NOT NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        "deleted_at" timestamptz NULL,
        CONSTRAINT "product_variant_attribute_value_pkey" PRIMARY KEY ("id")
      );
    `)
    this.addSql(`
      CREATE INDEX IF NOT EXISTS "IDX_product_variant_attribute_value_value_id"
        ON "product_variant_attribute_value" ("value_id") WHERE deleted_at IS NULL;
    `)
    this.addSql(`
      CREATE INDEX IF NOT EXISTS "IDX_product_variant_attribute_value_deleted_at"
        ON "product_variant_attribute_value" ("deleted_at") WHERE deleted_at IS NULL;
    `)
    this.addSql(`
      CREATE INDEX IF NOT EXISTS "IDX_product_variant_attribute_value_variant_id"
        ON "product_variant_attribute_value" ("variant_id") WHERE deleted_at IS NULL;
    `)
    this.addSql(`
      CREATE UNIQUE INDEX IF NOT EXISTS "IDX_product_variant_attribute_value_unique"
        ON "product_variant_attribute_value" ("variant_id", "value_id") WHERE deleted_at IS NULL;
    `)
    this.addSql(`
      ALTER TABLE "product_variant_attribute_value"
        ADD CONSTRAINT "product_variant_attribute_value_value_id_foreign"
        FOREIGN KEY ("value_id") REFERENCES "product_attribute_value" ("id")
        ON UPDATE CASCADE ON DELETE CASCADE;
    `)
  }

  override async down(): Promise<void> {
    this.addSql(`DROP TABLE IF EXISTS "product_variant_attribute_value" CASCADE;`)
    this.addSql(`DROP INDEX IF EXISTS "IDX_product_attribute_scope";`)
    this.addSql(`ALTER TABLE "product_attribute" DROP COLUMN IF EXISTS "scope";`)
  }
}
