import { Migration } from "@medusajs/framework/mikro-orm/migrations"

export class Migration20261023000000 extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      `ALTER TABLE "seller" ALTER COLUMN "default_leadtime_to_ship" DROP NOT NULL, ALTER COLUMN "default_leadtime_to_ship" DROP DEFAULT;`,
    )
    // No dashboard could set this until now, so 2 is the old column default
    // rather than a seller's choice; clearing it lets the marketplace default apply.
    this.addSql(
      `UPDATE "seller" SET "default_leadtime_to_ship" = NULL WHERE "default_leadtime_to_ship" = 2;`,
    )
  }

  override async down(): Promise<void> {
    this.addSql(
      `UPDATE "seller" SET "default_leadtime_to_ship" = 2 WHERE "default_leadtime_to_ship" IS NULL;`,
    )
    this.addSql(
      `ALTER TABLE "seller" ALTER COLUMN "default_leadtime_to_ship" SET DEFAULT 2, ALTER COLUMN "default_leadtime_to_ship" SET NOT NULL;`,
    )
  }
}
