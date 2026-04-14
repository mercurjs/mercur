import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260331113435 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "seller_member" drop constraint if exists "seller_member_seller_id_member_id_unique";`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_seller_member_seller_id_member_id_unique" ON "seller_member" ("seller_id", "member_id") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop index if exists "IDX_seller_member_seller_id_member_id_unique";`);
  }

}
