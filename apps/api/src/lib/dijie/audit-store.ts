import type { DijieAuditRecord } from "./audit-summary";

export const DIJIE_AUDIT_MODULE = "dijieAuditRecordStore";

export type DijieAuditStorageRecord = {
  execution_id: string;
  actor_id: string;
  role_listing_id: string;
  package_id: string;
  package_version: string;
  developer_ref: string;
  listing_owner_ref: string;
  billing_beneficiary_ref: string;
  entitlement_id: string;
  device_id: string;
  workspace_ref: string;
  local_gateway_id: string;
  status: string;
  execution_token_issued_at: Date;
  execution_token_expires_at: Date;
  received_at: Date;
  pricing: DijieAuditRecord["pricing"];
  role_token_pricing: DijieAuditRecord["roleTokenPricing"];
  role_usage_ledger: DijieAuditRecord["roleUsageLedger"] | null;
  model_proxy_usage: DijieAuditRecord["summary"]["modelProxyUsage"] | null;
  tool_usage: DijieAuditRecord["summary"]["toolUsage"];
  changed_files: string[];
  artifacts: DijieAuditRecord["summary"]["result"]["artifacts"];
  error_summary: string | null;
  payload: DijieAuditRecord;
};

export type DijieAuditRecordRepository = {
  createDijieAuditRecords: (
    data: DijieAuditStorageRecord,
  ) => Promise<{ id?: string }>;
};

export type DijieAuditRecordLookupRepository = {
  listDijieAuditRecords: (
    filters: { execution_id: string },
    config?: {
      take?: number;
      order?: Record<string, "ASC" | "DESC">;
    },
  ) => Promise<DijieAuditStorageRecord[]>;
};

export type DijieAuditRecordStore = {
  recordDijieAuditSummary: (
    record: DijieAuditRecord,
  ) => Promise<{ auditRecordId?: string }>;
};

export type DijieAuditExecutionRecordReader = {
  retrieveDijieAuditRecordByExecutionId: (
    executionId: string,
  ) => Promise<DijieAuditStorageRecord | undefined>;
};

export type DijieAuditExecutionReadModel = {
  roleListingId: string;
  packageId: string;
  packageVersion: string;
  developerRef: string;
  listingOwnerRef: string;
  billingBeneficiaryRef: string;
  status: string;
  pricing: DijieAuditRecord["pricing"];
  roleTokenPricing: DijieAuditRecord["roleTokenPricing"];
  billingSummary: {
    source: "role_usage";
    roleListingId: string;
    packageId: string;
    packageVersion: string;
    developerRef: string;
    billingBeneficiaryRef: string;
    inputTokens: number;
    outputTokens: number;
    inputTokenCentsPerMillion: number;
    outputTokenCentsPerMillion: number;
    currency: string;
    platformReceivableCents: 0;
    developerReceivableCents: number;
  } | null;
  toolUsage: DijieAuditRecord["summary"]["toolUsage"];
  modelProxyUsage: DijieAuditRecord["summary"]["modelProxyUsage"] | null;
  changedFiles: string[];
  artifacts: DijieAuditRecord["summary"]["result"]["artifacts"];
  errorSummary: string | null;
  receivedAt: string;
};

export function createDijieAuditStorageRecord(
  record: DijieAuditRecord,
): DijieAuditStorageRecord {
  const sanitizedPayload = sanitizeAuditRecordForStorage(record);
  return {
    execution_id: record.summary.executionId,
    actor_id: record.actorId,
    role_listing_id: record.summary.roleListingId,
    package_id: record.packageId,
    package_version: record.packageVersion,
    developer_ref: record.developerRef,
    listing_owner_ref: record.listingOwnerRef,
    billing_beneficiary_ref: record.billingBeneficiaryRef,
    entitlement_id: record.summary.entitlementId,
    device_id: record.summary.deviceId,
    workspace_ref: sanitizeSensitiveText(record.summary.workspaceRef),
    local_gateway_id: record.summary.localGatewayId,
    status: record.summary.status,
    execution_token_issued_at: new Date(record.executionTokenIssuedAt),
    execution_token_expires_at: new Date(record.executionTokenExpiresAt),
    received_at: new Date(record.receivedAt),
    pricing: record.pricing,
    role_token_pricing: record.roleTokenPricing,
    role_usage_ledger: record.roleUsageLedger
      ? (sanitizeStorageValue(record.roleUsageLedger) as DijieAuditRecord["roleUsageLedger"])
      : null,
    model_proxy_usage: record.summary.modelProxyUsage ?? null,
    tool_usage: record.summary.toolUsage,
    changed_files: sanitizeChangedFiles(record.summary.result.changedFiles),
    artifacts: sanitizeStorageArtifacts(record.summary.result.artifacts),
    error_summary: record.summary.result.error ? sanitizeSensitiveText(record.summary.result.error) : null,
    payload: sanitizedPayload,
  };
}

function toIsoString(value: Date | string): string {
  return value instanceof Date ? value.toISOString() : value;
}

function sanitizePathReference(value: string): string {
  const trimmed = value.trim();
  const normalized = trimmed.replace(/\\/g, "/");
  const isLocalAbsolutePath =
    normalized.startsWith("/") ||
    /^[a-zA-Z]:\//.test(normalized) ||
    normalized.startsWith("//") ||
    normalized.startsWith("file://");

  if (!isLocalAbsolutePath) {
    return trimmed;
  }

  const basename = normalized.split("/").filter(Boolean).at(-1);
  return basename ?? "[redacted-local-path]";
}

function sanitizeSensitiveText(value: string): string {
  return sanitizePathReference(value)
    .replace(
      /(?:file:\/\/)?\/(?:Users|private|var|tmp|Volumes)\/[^\s"',)]+/giu,
      (match) => sanitizePathReference(match),
    )
    .replace(/[A-Za-z]:\/[^\s"',)]+/giu, (match) => sanitizePathReference(match))
    .replace(/\bBearer\s+[A-Za-z0-9._~+/=-]+/giu, "Bearer [redacted-token]")
    .replace(/\bsk-[A-Za-z0-9_-]{8,}\b/gu, "[redacted-model-key]")
    .replace(
      /\b(api[_-]?key|provider[_-]?auth|secret|token)\s*[:=]\s*["']?[^"',}\s]+/giu,
      "$1=[redacted-secret]",
    )
    .replace(
      /\b[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\b/gu,
      "[redacted-jwt]",
    );
}

function sanitizeStorageValue(value: unknown): unknown {
  if (typeof value === "string") {
    return sanitizeSensitiveText(value);
  }
  if (Array.isArray(value)) {
    return value.map(sanitizeStorageValue);
  }
  if (!value || typeof value !== "object") {
    return value;
  }

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(([key, entry]) => {
      const normalizedKey = key.replaceAll("_", "").toLowerCase();
      if (
        normalizedKey.includes("secret") ||
        normalizedKey.includes("apikey") ||
        normalizedKey.includes("providerauth") ||
        normalizedKey === "authorization" ||
        normalizedKey === "token"
      ) {
        return [key, "[redacted-secret]"];
      }
      return [key, sanitizeStorageValue(entry)];
    }),
  );
}

function sanitizeAuditRecordForStorage(record: DijieAuditRecord): DijieAuditRecord {
  return sanitizeStorageValue(record) as DijieAuditRecord;
}

function sanitizeChangedFiles(value: string[]): string[] {
  return value
    .filter((item): item is string => typeof item === "string")
    .map(sanitizePathReference)
    .filter(Boolean);
}

function sanitizeArtifacts(
  value: DijieAuditStorageRecord["artifacts"],
): DijieAuditExecutionReadModel["artifacts"] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((artifact) => {
      if (!artifact || typeof artifact !== "object" || Array.isArray(artifact)) {
        return undefined;
      }

      return {
        id: String(artifact.id),
        type: String(artifact.type),
        title: String(artifact.title),
        ...(artifact.sizeBytes === undefined ? {} : { sizeBytes: artifact.sizeBytes }),
        ...(artifact.sha256 === undefined ? {} : { sha256: artifact.sha256 }),
      };
    })
    .filter((artifact): artifact is DijieAuditExecutionReadModel["artifacts"][number] =>
      Boolean(artifact?.id && artifact.type && artifact.title),
    );
}

function sanitizeStorageArtifacts(
  value: DijieAuditStorageRecord["artifacts"],
): DijieAuditStorageRecord["artifacts"] {
  return sanitizeStorageValue(value) as DijieAuditStorageRecord["artifacts"];
}

function createBillingSummary(
  record: DijieAuditStorageRecord,
): DijieAuditExecutionReadModel["billingSummary"] {
  if (!record.role_usage_ledger || !record.model_proxy_usage) {
    return null;
  }

  return {
    source: "role_usage",
    roleListingId: record.role_usage_ledger.roleListingId,
    packageId: record.role_usage_ledger.packageId,
    packageVersion: record.role_usage_ledger.packageVersion,
    developerRef: record.role_usage_ledger.developerRef,
    billingBeneficiaryRef: record.role_usage_ledger.billingBeneficiaryRef,
    inputTokens: record.model_proxy_usage.inputTokens,
    outputTokens: record.model_proxy_usage.outputTokens,
    inputTokenCentsPerMillion: record.role_token_pricing.inputTokenCentsPerMillion,
    outputTokenCentsPerMillion: record.role_token_pricing.outputTokenCentsPerMillion,
    currency: record.role_usage_ledger.currency,
    platformReceivableCents: 0,
    developerReceivableCents: record.role_usage_ledger.developerReceivableCents,
  };
}

export function createDijieAuditExecutionReadModel(
  record: DijieAuditStorageRecord,
): DijieAuditExecutionReadModel {
  return {
    roleListingId: record.role_listing_id,
    packageId: record.package_id,
    packageVersion: record.package_version,
    developerRef: record.developer_ref,
    listingOwnerRef: record.listing_owner_ref,
    billingBeneficiaryRef: record.billing_beneficiary_ref,
    status: record.status,
    pricing: record.pricing,
    roleTokenPricing: record.role_token_pricing,
    billingSummary: createBillingSummary(record),
    toolUsage: record.tool_usage,
    modelProxyUsage: record.model_proxy_usage,
    changedFiles: sanitizeChangedFiles(record.changed_files),
    artifacts: sanitizeArtifacts(record.artifacts),
    errorSummary: record.error_summary,
    receivedAt: toIsoString(record.received_at),
  };
}

export async function recordDijieAuditSummaryWithRepository(
  repository: DijieAuditRecordRepository,
  record: DijieAuditRecord,
): Promise<{ auditRecordId?: string }> {
  const stored = await repository.createDijieAuditRecords(
    createDijieAuditStorageRecord(record),
  );

  return {
    auditRecordId: stored.id,
  };
}

export async function retrieveDijieAuditRecordByExecutionIdWithRepository(
  repository: DijieAuditRecordLookupRepository,
  executionId: string,
): Promise<DijieAuditStorageRecord | undefined> {
  const [record] = await repository.listDijieAuditRecords(
    { execution_id: executionId },
    {
      take: 1,
      order: {
        received_at: "DESC",
      },
    },
  );

  return record;
}
