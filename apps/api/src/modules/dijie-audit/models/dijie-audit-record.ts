import { model } from "@medusajs/framework/utils";

const DijieAuditRecord = model.define("dijie_audit_record", {
  id: model.id({ prefix: "djaudit" }).primaryKey(),
  execution_id: model.text().searchable(),
  actor_id: model.text().searchable(),
  role_listing_id: model.text().searchable(),
  package_id: model.text().searchable(),
  package_version: model.text(),
  developer_ref: model.text().searchable(),
  listing_owner_ref: model.text().searchable(),
  billing_beneficiary_ref: model.text().searchable(),
  entitlement_id: model.text().searchable(),
  device_id: model.text(),
  workspace_ref: model.text(),
  local_gateway_id: model.text(),
  status: model.enum(["completed", "failed", "cancelled", "timed_out"]),
  execution_token_issued_at: model.dateTime(),
  execution_token_expires_at: model.dateTime(),
  received_at: model.dateTime(),
  pricing: model.json(),
  role_token_pricing: model.json(),
  role_usage_ledger: model.json().nullable(),
  model_proxy_usage: model.json().nullable(),
  tool_usage: model.json(),
  changed_files: model.json(),
  artifacts: model.json(),
  error_summary: model.text().nullable(),
  payload: model.json(),
});

export default DijieAuditRecord;
