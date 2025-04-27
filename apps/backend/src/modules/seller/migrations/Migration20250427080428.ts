import { Migration } from '@mikro-orm/migrations';

export class Migration20250427080428 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "seller_verification" drop constraint if exists "seller_verification_seller_id_unique";`);
    this.addSql(`create table if not exists "seller_verification" ("id" text not null, "seller_id" text not null, "gstin" text null, "company_registration" text null, "msme_registration" text null, "pan_number" text null, "tan_number" text null, "manufacturing_license" text null, "factory_license" text null, "manufacturing_capacity" text null, "iso_certificates" text null, "industry_certifications" text null, "quality_control_certificates" text null, "environmental_clearance" text null, "safety_certificates" text null, "labor_compliance" text null, "verification_status" text check ("verification_status" in ('pending', 'in_progress', 'verified', 'rejected')) not null default 'pending', "verification_notes" text null, "verified_at" timestamptz null, "verified_by" text null, "documents" jsonb null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "seller_verification_pkey" primary key ("id"));`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_seller_verification_seller_id_unique" ON "seller_verification" (seller_id) WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_seller_verification_deleted_at" ON "seller_verification" (deleted_at) WHERE deleted_at IS NULL;`);

    this.addSql(`alter table if exists "seller_verification" add constraint "seller_verification_seller_id_foreign" foreign key ("seller_id") references "seller" ("id") on update cascade;`);

    this.addSql(`alter table if exists "seller" add column if not exists "type" text check ("type" in ('manufacturer', 'reseller')) not null default 'reseller';`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "seller_verification" cascade;`);

    this.addSql(`alter table if exists "seller" drop column if exists "type";`);
  }

}
