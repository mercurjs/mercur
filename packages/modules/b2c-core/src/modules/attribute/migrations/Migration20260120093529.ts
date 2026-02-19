import { Migration } from '@mikro-orm/migrations';

export class Migration20260120093529 extends Migration {

  override async up(): Promise<void> {
    // Add source column to attribute table
    this.addSql(`ALTER TABLE IF EXISTS "attribute" ADD COLUMN IF NOT EXISTS "source" text NOT NULL DEFAULT 'admin';`);

    // Add source column to attribute_value table
    this.addSql(`ALTER TABLE IF EXISTS "attribute_value" ADD COLUMN IF NOT EXISTS "source" text NOT NULL DEFAULT 'admin';`);

    // Change is_filterable default from true to false
    this.addSql(`ALTER TABLE IF EXISTS "attribute" ALTER COLUMN "is_filterable" SET DEFAULT false;`);

    // Add index for attribute source + name
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_attribute_source_name" ON "attribute" ("source", "name") WHERE deleted_at IS NULL;`);

    // Add index for attribute_value attribute_id + source
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_attribute_value_attribute_source" ON "attribute_value" ("attribute_id", "source") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`DROP INDEX IF EXISTS "IDX_attribute_value_attribute_source";`);
    this.addSql(`DROP INDEX IF EXISTS "IDX_attribute_source_name";`);
    this.addSql(`ALTER TABLE IF EXISTS "attribute" ALTER COLUMN "is_filterable" SET DEFAULT true;`);
    this.addSql(`ALTER TABLE IF EXISTS "attribute_value" DROP COLUMN IF EXISTS "source";`);
    this.addSql(`ALTER TABLE IF EXISTS "attribute" DROP COLUMN IF EXISTS "source";`);
  }

}
