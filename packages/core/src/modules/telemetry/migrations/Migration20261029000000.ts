import { Migration } from "@medusajs/framework/mikro-orm/migrations"

export class Migration20261029000000 extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      `CREATE TABLE IF NOT EXISTS "telemetry_installation" (
        "id" text NOT NULL,
        "installation_id" text NOT NULL,
        "last_heartbeat_at" timestamptz NULL,
        "last_reported_version" text NULL,
        "milestones" jsonb NOT NULL DEFAULT '{}',
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        "deleted_at" timestamptz NULL,
        CONSTRAINT "telemetry_installation_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "telemetry_installation_singleton" CHECK ("id" = 'singleton')
      );`,
    )
    this.addSql(
      `CREATE UNIQUE INDEX IF NOT EXISTS "IDX_telemetry_installation_installation_id_unique" ON "telemetry_installation" ("installation_id") WHERE deleted_at IS NULL;`,
    )
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_telemetry_installation_deleted_at" ON "telemetry_installation" ("deleted_at") WHERE deleted_at IS NULL;`,
    )
  }

  override async down(): Promise<void> {
    this.addSql(`DROP TABLE IF EXISTS "telemetry_installation" CASCADE;`)
  }
}
