import type { DijieExecutionTokenClaims } from "./execution-token";
import type { DijieRoleUsageLedgerEntry } from "./ledgers";

export type DijieExecutionStatus = "completed" | "failed" | "cancelled" | "timed_out";

export type DijieRoleArtifact = {
  id: string;
  type: string;
  title: string;
  sizeBytes?: number;
  sha256?: string;
};

export type DijieRoleResult = {
  executionId: string;
  roleListingId: string;
  packageId: string;
  packageVersion: string;
  developerRef: string;
  listingOwnerRef: string;
  billingBeneficiaryRef: string;
  status: DijieExecutionStatus;
  startedAt: string | number;
  endedAt: string | number;
  summary?: string;
  changedFiles: string[];
  artifacts: DijieRoleArtifact[];
  error?: string;
};

export type DijieAuditSummary = {
  executionId: string;
  deviceId: string;
  workspaceRef: string;
  roleListingId: string;
  packageId: string;
  packageVersion: string;
  developerRef: string;
  listingOwnerRef: string;
  billingBeneficiaryRef: string;
  entitlementId: string;
  localGatewayId: string;
  status: DijieExecutionStatus;
  startedAt: string | number;
  endedAt: string | number;
  modelProxyUsage?: {
    requestCount: number;
    inputTokens: number;
    outputTokens: number;
  };
  toolUsage: {
    shellCommands: number;
    testsRun: number;
    filesRead: number;
    filesChanged: number;
  };
  result: DijieRoleResult;
};

export type DijieAuditRecord = {
  auditRecordVersion: 1;
  actorId: string;
  packageId: string;
  packageVersion: string;
  developerRef: string;
  listingOwnerRef: string;
  billingBeneficiaryRef: string;
  receivedAt: string;
  executionTokenIssuedAt: string;
  executionTokenExpiresAt: string;
  pricing: DijieExecutionTokenClaims["pricing"];
  roleTokenPricing: DijieExecutionTokenClaims["roleTokenPricing"];
  roleUsageLedger?: DijieRoleUsageLedgerEntry;
  summary: DijieAuditSummary;
};

export type DijieAuditSummaryResult =
  | {
      ok: true;
      record: DijieAuditRecord;
    }
  | {
      ok: false;
      error: string;
    };

const STATUSES = new Set<DijieExecutionStatus>(["completed", "failed", "cancelled", "timed_out"]);

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function nonEmptyString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function timestamp(value: unknown): string | number | undefined {
  if (typeof value === "string" && value.trim()) {
    return value.trim();
  }
  return Number.isInteger(value) && Number(value) >= 0 ? Number(value) : undefined;
}

function nonNegativeInteger(value: unknown): number | undefined {
  return Number.isInteger(value) && Number(value) >= 0 ? Number(value) : undefined;
}

function stringArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) {
    return undefined;
  }

  const normalized = value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);
  return normalized.length === value.length ? normalized : undefined;
}

function normalizeArtifacts(value: unknown): DijieRoleArtifact[] | undefined {
  if (!Array.isArray(value)) {
    return undefined;
  }

  const artifacts = value.map((item) => {
    const record = asRecord(item);
    const id = nonEmptyString(record.id);
    const type = nonEmptyString(record.type);
    const title = nonEmptyString(record.title);
    const sizeBytes = record.sizeBytes === undefined ? undefined : nonNegativeInteger(record.sizeBytes);
    const sha256 = record.sha256 === undefined ? undefined : nonEmptyString(record.sha256);
    if (
      !id ||
      !type ||
      !title ||
      (sizeBytes === undefined && record.sizeBytes !== undefined) ||
      (!sha256 && record.sha256 !== undefined)
    ) {
      return undefined;
    }
    return {
      id,
      type,
      title,
      ...(sizeBytes === undefined ? {} : { sizeBytes }),
      ...(sha256 === undefined ? {} : { sha256 }),
    };
  });

  return artifacts.every(Boolean) ? (artifacts as DijieRoleArtifact[]) : undefined;
}

function normalizeRoleResult(value: unknown): DijieRoleResult | undefined {
  const record = asRecord(value);
  const executionId = nonEmptyString(record.executionId);
  const roleListingId = nonEmptyString(record.roleListingId);
  const packageId = nonEmptyString(record.packageId);
  const packageVersion = nonEmptyString(record.packageVersion);
  const developerRef = nonEmptyString(record.developerRef);
  const listingOwnerRef = nonEmptyString(record.listingOwnerRef);
  const billingBeneficiaryRef = nonEmptyString(record.billingBeneficiaryRef);
  const status = nonEmptyString(record.status) as DijieExecutionStatus | undefined;
  const startedAt = timestamp(record.startedAt);
  const endedAt = timestamp(record.endedAt);
  const changedFiles = stringArray(record.changedFiles);
  const artifacts = normalizeArtifacts(record.artifacts);
  const summary = record.summary === undefined ? undefined : String(record.summary);
  const error = record.error === undefined ? undefined : String(record.error);

  if (
    !executionId ||
    !roleListingId ||
    !packageId ||
    !packageVersion ||
    !developerRef ||
    !listingOwnerRef ||
    !billingBeneficiaryRef ||
    !status ||
    !STATUSES.has(status) ||
    startedAt === undefined ||
    endedAt === undefined ||
    !changedFiles ||
    !artifacts
  ) {
    return undefined;
  }

  return {
    executionId,
    roleListingId,
    packageId,
    packageVersion,
    developerRef,
    listingOwnerRef,
    billingBeneficiaryRef,
    status,
    startedAt,
    endedAt,
    ...(summary === undefined ? {} : { summary }),
    changedFiles,
    artifacts,
    ...(error === undefined ? {} : { error }),
  };
}

function normalizeToolUsage(value: unknown): DijieAuditSummary["toolUsage"] | undefined {
  const record = asRecord(value);
  const shellCommands = nonNegativeInteger(record.shellCommands);
  const testsRun = nonNegativeInteger(record.testsRun);
  const filesRead = nonNegativeInteger(record.filesRead);
  const filesChanged = nonNegativeInteger(record.filesChanged);
  if (
    shellCommands === undefined ||
    testsRun === undefined ||
    filesRead === undefined ||
    filesChanged === undefined
  ) {
    return undefined;
  }
  return { shellCommands, testsRun, filesRead, filesChanged };
}

function normalizeModelProxyUsage(value: unknown): DijieAuditSummary["modelProxyUsage"] | undefined {
  if (value === undefined) {
    return undefined;
  }

  const record = asRecord(value);
  const requestCount = nonNegativeInteger(record.requestCount);
  const inputTokens = nonNegativeInteger(record.inputTokens);
  const outputTokens = nonNegativeInteger(record.outputTokens);
  if (requestCount === undefined || inputTokens === undefined || outputTokens === undefined) {
    return undefined;
  }
  return { requestCount, inputTokens, outputTokens };
}

export function normalizeDijieAuditSummary(value: unknown): DijieAuditSummary | undefined {
  const record = asRecord(value);
  const executionId = nonEmptyString(record.executionId);
  const deviceId = nonEmptyString(record.deviceId);
  const workspaceRef = nonEmptyString(record.workspaceRef);
  const roleListingId = nonEmptyString(record.roleListingId);
  const packageId = nonEmptyString(record.packageId);
  const packageVersion = nonEmptyString(record.packageVersion);
  const developerRef = nonEmptyString(record.developerRef);
  const listingOwnerRef = nonEmptyString(record.listingOwnerRef);
  const billingBeneficiaryRef = nonEmptyString(record.billingBeneficiaryRef);
  const entitlementId = nonEmptyString(record.entitlementId);
  const localGatewayId = nonEmptyString(record.localGatewayId);
  const status = nonEmptyString(record.status) as DijieExecutionStatus | undefined;
  const startedAt = timestamp(record.startedAt);
  const endedAt = timestamp(record.endedAt);
  const modelProxyUsage = normalizeModelProxyUsage(record.modelProxyUsage);
  const toolUsage = normalizeToolUsage(record.toolUsage);
  const result = normalizeRoleResult(record.result);

  if (
    !executionId ||
    !deviceId ||
    !workspaceRef ||
    !roleListingId ||
    !packageId ||
    !packageVersion ||
    !developerRef ||
    !listingOwnerRef ||
    !billingBeneficiaryRef ||
    !entitlementId ||
    !localGatewayId ||
    !status ||
    !STATUSES.has(status) ||
    startedAt === undefined ||
    endedAt === undefined ||
    !toolUsage ||
    !result ||
    modelProxyUsage === undefined && record.modelProxyUsage !== undefined
  ) {
    return undefined;
  }

  return {
    executionId,
    deviceId,
    workspaceRef,
    roleListingId,
    packageId,
    packageVersion,
    developerRef,
    listingOwnerRef,
    billingBeneficiaryRef,
    entitlementId,
    localGatewayId,
    status,
    startedAt,
    endedAt,
    ...(modelProxyUsage === undefined ? {} : { modelProxyUsage }),
    toolUsage,
    result,
  };
}

export function createDijieAuditRecord(input: {
  claims: DijieExecutionTokenClaims;
  summary: unknown;
  receivedAt?: string;
}): DijieAuditSummaryResult {
  if (!input.claims.scopes.includes("audit.write")) {
    return { ok: false, error: "Dijie execution token is missing audit.write scope." };
  }

  const summary = normalizeDijieAuditSummary(input.summary);
  if (!summary) {
    return { ok: false, error: "Invalid Dijie audit summary." };
  }

  const mismatches = [
    ["executionId", input.claims.executionId, summary.executionId],
    ["roleListingId", input.claims.roleListingId, summary.roleListingId],
    ["packageId", input.claims.packageId, summary.packageId],
    ["packageVersion", input.claims.packageVersion, summary.packageVersion],
    ["developerRef", input.claims.developerRef, summary.developerRef],
    ["listingOwnerRef", input.claims.listingOwnerRef, summary.listingOwnerRef],
    ["billingBeneficiaryRef", input.claims.billingBeneficiaryRef, summary.billingBeneficiaryRef],
    ["entitlementId", input.claims.entitlementId, summary.entitlementId],
    ["deviceId", input.claims.deviceId, summary.deviceId],
    ["workspaceRef", input.claims.workspaceRef, summary.workspaceRef],
    ["localGatewayId", input.claims.localGatewayId, summary.localGatewayId],
    ["result.executionId", summary.executionId, summary.result.executionId],
    ["result.roleListingId", summary.roleListingId, summary.result.roleListingId],
    ["result.packageId", summary.packageId, summary.result.packageId],
    ["result.packageVersion", summary.packageVersion, summary.result.packageVersion],
    ["result.developerRef", summary.developerRef, summary.result.developerRef],
    ["result.listingOwnerRef", summary.listingOwnerRef, summary.result.listingOwnerRef],
    ["result.billingBeneficiaryRef", summary.billingBeneficiaryRef, summary.result.billingBeneficiaryRef],
    ["result.status", summary.status, summary.result.status],
  ].filter(([, expected, actual]) => expected !== actual);

  if (mismatches.length > 0) {
    return {
      ok: false,
      error: `Dijie audit summary does not match execution token: ${mismatches
        .map(([field]) => field)
        .join(", ")}`,
    };
  }

  return {
    ok: true,
    record: {
      auditRecordVersion: 1,
      actorId: input.claims.actorId,
      packageId: input.claims.packageId,
      packageVersion: input.claims.packageVersion,
      developerRef: input.claims.developerRef,
      listingOwnerRef: input.claims.listingOwnerRef,
      billingBeneficiaryRef: input.claims.billingBeneficiaryRef,
      receivedAt: input.receivedAt ?? new Date().toISOString(),
      executionTokenIssuedAt: new Date(input.claims.iat * 1000).toISOString(),
      executionTokenExpiresAt: new Date(input.claims.exp * 1000).toISOString(),
      pricing: input.claims.pricing,
      roleTokenPricing: input.claims.roleTokenPricing,
      summary,
    },
  };
}
