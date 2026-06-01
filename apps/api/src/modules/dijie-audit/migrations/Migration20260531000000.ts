import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260531000000 extends Migration {
  override async up(): Promise<void> {
    this.addSql(`create table if not exists "dijie_audit_record" ("id" text not null, "execution_id" text not null, "actor_id" text not null, "role_listing_id" text not null, "package_id" text not null, "package_version" text not null, "developer_ref" text not null, "listing_owner_ref" text not null, "billing_beneficiary_ref" text not null, "entitlement_id" text not null, "device_id" text not null, "workspace_ref" text not null, "local_gateway_id" text not null, "status" text check ("status" in ('completed', 'failed', 'cancelled', 'timed_out')) not null, "execution_token_issued_at" timestamptz not null, "execution_token_expires_at" timestamptz not null, "received_at" timestamptz not null, "pricing" jsonb not null, "role_token_pricing" jsonb not null, "role_usage_ledger" jsonb null, "model_proxy_usage" jsonb null, "tool_usage" jsonb not null, "changed_files" jsonb not null, "artifacts" jsonb not null, "error_summary" text null, "payload" jsonb not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "dijie_audit_record_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_dijie_audit_record_execution_id" ON "dijie_audit_record" ("execution_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_dijie_audit_record_actor_id" ON "dijie_audit_record" ("actor_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_dijie_audit_record_role_listing_id" ON "dijie_audit_record" ("role_listing_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_dijie_audit_record_package_id" ON "dijie_audit_record" ("package_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_dijie_audit_record_developer_ref" ON "dijie_audit_record" ("developer_ref") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_dijie_audit_record_listing_owner_ref" ON "dijie_audit_record" ("listing_owner_ref") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_dijie_audit_record_billing_beneficiary_ref" ON "dijie_audit_record" ("billing_beneficiary_ref") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_dijie_audit_record_entitlement_id" ON "dijie_audit_record" ("entitlement_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_dijie_audit_record_deleted_at" ON "dijie_audit_record" ("deleted_at") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "dijie_audit_record" cascade;`);
  }
}
