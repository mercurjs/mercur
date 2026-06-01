import {
  normalizeOneTimeAuthorizationPricing,
  normalizeRoleTokenPricing,
  type DijieExecutionTokenPricing,
  type DijieRoleTokenPricing,
} from "./execution-token";

export type DijieRoleListingStatus =
  | "draft"
  | "proposed"
  | "published"
  | "delisted"
  | "archived";

export type DijieRoleReviewState = "draft" | "submitted" | "approved" | "rejected";

export type DijieRoleManifestSummary = {
  entrypoint?: string;
  tools?: string[];
  permissions?: string[];
  sandbox?: "readonly" | "workspace-write" | "networked" | "custom";
  inputs?: string[];
  outputs?: string[];
  secretsRequired?: string[];
};

export type DijieRoleProductMetadata = {
  kind: "role_product";
  protocolVersion: string;
  roleListingId?: string;
  packageId: string;
  packageVersion: string;
  developerRef: string;
  listingOwnerRef: string;
  billingBeneficiaryRef: string;
  listingStatus: DijieRoleListingStatus;
  reviewState: DijieRoleReviewState;
  title?: string;
  subtitle?: string;
  description?: string;
  capabilities: string[];
  manifestSummary: DijieRoleManifestSummary;
  pricing: DijieExecutionTokenPricing;
  roleTokenPricing: DijieRoleTokenPricing;
  scopes: string[];
};

export type DijieRoleProductMetadataResult =
  | { ok: true; value: DijieRoleProductMetadata }
  | { ok: false; issues: string[] };

type UnknownRecord = Record<string, unknown>;

const DEFAULT_PROTOCOL_VERSION = "2026-05";
const DEFAULT_SCOPES = ["role.execute", "audit.write"];
const ALLOWED_SCOPES = new Set(DEFAULT_SCOPES);
const LISTING_STATUSES = new Set<DijieRoleListingStatus>([
  "draft",
  "proposed",
  "published",
  "delisted",
  "archived",
]);
const REVIEW_STATES = new Set<DijieRoleReviewState>([
  "draft",
  "submitted",
  "approved",
  "rejected",
]);
const SENSITIVE_KEY_PATTERN =
  /(api[_-]?key|secret|provider[_-]?(auth|key)|access[_-]?token|refresh[_-]?token|bearer|cloud[_-]?bearer|raw[_-]?(execution[_-]?)?token|execution[_-]?token)/i;
const PRIVATE_CLOUD_BRIDGE_FIELD_NAMES = new Set([
  "actorid",
  "actorcontext",
  "chat",
  "chats",
  "conversation",
  "conversations",
  "customerid",
  "developerbuildcontext",
  "developermodecontext",
  "deviceid",
  "entitlement",
  "entitlementid",
  "execution",
  "executionid",
  "history",
  "localgatewayid",
  "message",
  "messages",
  "modestage",
  "order",
  "ordergroupid",
  "orderid",
  "prompt",
  "prompts",
  "rolebuildbrief",
  "buildbrief",
  "sessionid",
  "wallet",
  "walletid",
  "workspace",
  "workspaceref",
]);
const PRIVATE_CLOUD_BRIDGE_KEY_PATTERN =
  /(chat|conversation|message)[_-]?(history|log|transcript)/i;
const PRIVATE_CLOUD_BRIDGE_VALUE_PATTERN =
  /\b(?:exec|cus|ent|ord|ordgrp|wallet|device|workspace|gateway|audit|settlement)_[A-Za-z0-9][A-Za-z0-9_-]*\b/i;
const PROVIDER_SECRET_VALUE_PATTERN =
  /\b(?:sk-[A-Za-z0-9][A-Za-z0-9_-]{12,}|sk-ant-[A-Za-z0-9_-]{12,}|AIza[0-9A-Za-z_-]{20,}|Bearer\s+[A-Za-z0-9._~+/=-]{12,})\b/i;

function asRecord(value: unknown): UnknownRecord {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as UnknownRecord)
    : {};
}

function stringField(record: UnknownRecord, field: string): string | undefined {
  const value = record[field];
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function stringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);
}

function roleMetadataFromProduct(product: UnknownRecord): UnknownRecord {
  const productMetadata = asRecord(product.metadata);
  return asRecord(productMetadata.dijieRole);
}

function pricingFromRoleMetadata(role: UnknownRecord): DijieExecutionTokenPricing | undefined {
  return normalizeOneTimeAuthorizationPricing(role.pricing);
}

function roleTokenPricingFromRoleMetadata(role: UnknownRecord): DijieRoleTokenPricing | undefined {
  return normalizeRoleTokenPricing(role.roleTokenPricing ?? role.role_token_pricing);
}

function listingStatusFromRole(role: UnknownRecord): DijieRoleListingStatus | undefined {
  const raw = stringField(role, "listingStatus") ?? stringField(role, "listing_status");
  const normalized = raw?.toLowerCase();
  return normalized && LISTING_STATUSES.has(normalized as DijieRoleListingStatus)
    ? (normalized as DijieRoleListingStatus)
    : undefined;
}

function reviewStateFromRole(role: UnknownRecord): DijieRoleReviewState | undefined {
  const raw = stringField(role, "reviewState") ?? stringField(role, "review_state");
  const normalized = raw?.toLowerCase();
  return normalized && REVIEW_STATES.has(normalized as DijieRoleReviewState)
    ? (normalized as DijieRoleReviewState)
    : undefined;
}

function manifestSummaryFromRole(role: UnknownRecord): DijieRoleManifestSummary {
  const manifest = asRecord(role.manifestSummary ?? role.manifest_summary);
  const sandbox = stringField(manifest, "sandbox");
  return {
    ...(stringField(manifest, "entrypoint") ? { entrypoint: stringField(manifest, "entrypoint") } : {}),
    ...(stringArray(manifest.tools).length > 0 ? { tools: stringArray(manifest.tools) } : {}),
    ...(stringArray(manifest.permissions).length > 0
      ? { permissions: stringArray(manifest.permissions) }
      : {}),
    ...(sandbox === "readonly" ||
    sandbox === "workspace-write" ||
    sandbox === "networked" ||
    sandbox === "custom"
      ? { sandbox }
      : {}),
    ...(stringArray(manifest.inputs).length > 0 ? { inputs: stringArray(manifest.inputs) } : {}),
    ...(stringArray(manifest.outputs).length > 0 ? { outputs: stringArray(manifest.outputs) } : {}),
    ...(stringArray(manifest.secretsRequired ?? manifest.secrets_required).length > 0
      ? { secretsRequired: stringArray(manifest.secretsRequired ?? manifest.secrets_required) }
      : {}),
  };
}

function containsLocalAbsolutePath(value: string): boolean {
  const normalized = value.trim().replace(/\\/g, "/");
  return (
    normalized.startsWith("/") ||
    /^[A-Za-z]:\//.test(normalized) ||
    normalized.startsWith("file://") ||
    /(?:^|[\s"'(])\/(?:Users|home|private|var|tmp|Volumes)\//u.test(normalized)
  );
}

function containsLocalAbsolutePathValue(value: unknown): boolean {
  if (typeof value === "string") {
    return containsLocalAbsolutePath(value);
  }
  if (Array.isArray(value)) {
    return value.some(containsLocalAbsolutePathValue);
  }
  if (!value || typeof value !== "object") {
    return false;
  }

  return Object.values(value as UnknownRecord).some(containsLocalAbsolutePathValue);
}

function containsSensitiveFieldName(value: unknown): boolean {
  if (typeof value === "string") {
    return false;
  }
  if (Array.isArray(value)) {
    return value.some(containsSensitiveFieldName);
  }
  if (!value || typeof value !== "object") {
    return false;
  }
  return Object.entries(value as UnknownRecord).some(
    ([key, entry]) =>
      !["secretsRequired", "secrets_required"].includes(key) &&
      (SENSITIVE_KEY_PATTERN.test(key) || containsSensitiveFieldName(entry)),
  );
}

function containsPrivateCloudBridgeFieldName(value: unknown): boolean {
  if (!value || typeof value !== "object") {
    return false;
  }
  if (Array.isArray(value)) {
    return value.some(containsPrivateCloudBridgeFieldName);
  }

  return Object.entries(value as UnknownRecord).some(([key, entry]) => {
    const normalizedKey = key.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();

    return (
      PRIVATE_CLOUD_BRIDGE_FIELD_NAMES.has(normalizedKey) ||
      normalizedKey.startsWith("order") ||
      normalizedKey.includes("wallet") ||
      normalizedKey.endsWith("prompt") ||
      normalizedKey.endsWith("prompts") ||
      PRIVATE_CLOUD_BRIDGE_KEY_PATTERN.test(key) ||
      containsPrivateCloudBridgeFieldName(entry)
    );
  });
}

function containsPrivateCloudBridgeValue(value: unknown): boolean {
  if (typeof value === "string") {
    return (
      PRIVATE_CLOUD_BRIDGE_VALUE_PATTERN.test(value) ||
      PROVIDER_SECRET_VALUE_PATTERN.test(value)
    );
  }
  if (Array.isArray(value)) {
    return value.some(containsPrivateCloudBridgeValue);
  }
  if (!value || typeof value !== "object") {
    return false;
  }
  return Object.values(value as UnknownRecord).some(containsPrivateCloudBridgeValue);
}

export function findDijieRoleMetadataPrivacyIssues(roleInput: unknown): string[] {
  const role = asRecord(roleInput);
  const issues: string[] = [];
  const hasPrivateCloudBridgeFieldName = containsPrivateCloudBridgeFieldName(role);

  if (containsLocalAbsolutePathValue(role)) {
    issues.push("metadata.dijieRole must not contain local absolute paths.");
  }
  if (containsSensitiveFieldName(role)) {
    issues.push("metadata.dijieRole must not contain secret, token, or provider auth field names.");
  }
  if (hasPrivateCloudBridgeFieldName) {
    issues.push(
      "metadata.dijieRole must not contain execution, entitlement, device, workspace, order, wallet, mode stage, prompt, or chat context field names.",
    );
  }
  if (!hasPrivateCloudBridgeFieldName && containsPrivateCloudBridgeValue(role)) {
    issues.push(
      "metadata.dijieRole must not contain private execution ids, raw tokens, or provider secrets.",
    );
  }

  return issues;
}

export function normalizeDijieRoleProductMetadataFromProduct(
  productInput: unknown,
): DijieRoleProductMetadataResult {
  const product = asRecord(productInput);
  const role = roleMetadataFromProduct(product);
  const issues: string[] = [];

  const pricing = pricingFromRoleMetadata(role);
  const roleTokenPricing = roleTokenPricingFromRoleMetadata(role);
  const listingStatus = listingStatusFromRole(role);
  const reviewState = reviewStateFromRole(role);
  const manifestSummary = manifestSummaryFromRole(role);
  const packageId = stringField(role, "packageId") ?? stringField(role, "package_id");
  const packageVersion = stringField(role, "packageVersion") ?? stringField(role, "package_version") ?? stringField(role, "version");
  const developerRef =
    stringField(role, "developerRef") ??
    stringField(role, "developer_ref") ??
    stringField(role, "developerId") ??
    stringField(role, "developer_id") ??
    stringField(asRecord(product.seller), "id");
  const listingOwnerRef =
    stringField(role, "listingOwnerRef") ??
    stringField(role, "listing_owner_ref") ??
    stringField(asRecord(product.seller), "id") ??
    developerRef;
  const billingBeneficiaryRef =
    stringField(role, "billingBeneficiaryRef") ??
    stringField(role, "billing_beneficiary_ref") ??
    developerRef;
  const protocolVersion =
    stringField(role, "protocolVersion") ??
    stringField(role, "protocol_version") ??
    DEFAULT_PROTOCOL_VERSION;
  const capabilities = stringArray(role.capabilities);
  const scopes = stringArray(role.scopes).length > 0 ? stringArray(role.scopes) : DEFAULT_SCOPES;

  if (stringField(role, "kind") !== "role_product") {
    issues.push("metadata.dijieRole.kind must be role_product.");
  }
  if (!packageId) {
    issues.push("metadata.dijieRole.packageId is required.");
  }
  if (!packageVersion) {
    issues.push("metadata.dijieRole.packageVersion is required.");
  }
  if (!developerRef) {
    issues.push("metadata.dijieRole.developerRef is required.");
  }
  if (!listingOwnerRef) {
    issues.push("metadata.dijieRole.listingOwnerRef is required.");
  }
  if (!billingBeneficiaryRef) {
    issues.push("metadata.dijieRole.billingBeneficiaryRef is required.");
  }
  if (!listingStatus) {
    issues.push("metadata.dijieRole.listingStatus is required.");
  }
  if (!reviewState) {
    issues.push("metadata.dijieRole.reviewState is required.");
  }
  if (!pricing) {
    issues.push("metadata.dijieRole.pricing must be one_time_authorization in CNY with platformFeeBps=0.");
  }
  if (!roleTokenPricing) {
    issues.push(
      "metadata.dijieRole.roleTokenPricing must define CNY input/output token cents per million with platformFeeBps=0 and developerReceivableBps=10000.",
    );
  }
  if (scopes.some((scope) => !ALLOWED_SCOPES.has(scope))) {
    issues.push("metadata.dijieRole.scopes may only include role.execute and audit.write.");
  }
  if (manifestSummary.entrypoint && containsLocalAbsolutePath(manifestSummary.entrypoint)) {
    issues.push("metadata.dijieRole.manifestSummary.entrypoint must not be a local absolute path.");
  }
  issues.push(...findDijieRoleMetadataPrivacyIssues(role));

  if (
    issues.length > 0 ||
    !pricing ||
    !roleTokenPricing ||
    !listingStatus ||
    !reviewState ||
    !packageId ||
    !packageVersion ||
    !developerRef ||
    !listingOwnerRef ||
    !billingBeneficiaryRef
  ) {
    return { ok: false, issues };
  }

  return {
    ok: true,
    value: {
      kind: "role_product",
      protocolVersion,
      roleListingId: stringField(role, "roleListingId") ?? stringField(role, "role_listing_id") ?? stringField(product, "id"),
      packageId,
      packageVersion,
      developerRef,
      listingOwnerRef,
      billingBeneficiaryRef,
      listingStatus,
      reviewState,
      title: stringField(role, "title"),
      subtitle: stringField(role, "subtitle"),
      description: stringField(role, "description"),
      capabilities,
      manifestSummary,
      pricing,
      roleTokenPricing,
      scopes,
    },
  };
}

export function isPublicDijieRoleProduct(metadata: DijieRoleProductMetadata): boolean {
  return metadata.listingStatus === "published" && metadata.reviewState === "approved";
}
