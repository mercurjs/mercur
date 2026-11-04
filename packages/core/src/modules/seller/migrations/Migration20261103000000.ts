import { Migration } from "@medusajs/framework/mikro-orm/migrations"

export class Migration20261103000000 extends Migration {
  override async up(): Promise<void> {
    this.addSql(`DROP INDEX IF EXISTS "IDX_member_invite_token";`)
    this.addSql(
      `ALTER TABLE "member_invite" RENAME COLUMN "token" TO "token_hash";`,
    )
    this.addSql(
      `UPDATE "member_invite" SET "token_hash" = encode(sha256(convert_to("token_hash", 'UTF8')), 'hex');`,
    )
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_member_invite_token_hash" ON "member_invite" ("token_hash") WHERE deleted_at IS NULL;`,
    )
  }

  override async down(): Promise<void> {
    this.addSql(`DROP INDEX IF EXISTS "IDX_member_invite_token_hash";`)
    this.addSql(
      `ALTER TABLE "member_invite" RENAME COLUMN "token_hash" TO "token";`,
    )
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_member_invite_token" ON "member_invite" ("token") WHERE deleted_at IS NULL;`,
    )
  }
}
