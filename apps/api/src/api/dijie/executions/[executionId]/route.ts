import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import {
  createDijieAuditExecutionReadModel,
  DIJIE_AUDIT_MODULE,
  type DijieAuditExecutionReadModel,
  type DijieAuditExecutionRecordReader,
  type DijieAuditStorageRecord,
} from "../../../../lib/dijie/audit-store";

type UnknownRecord = Record<string, unknown>;

type QueryGraph = {
  graph: (input: {
    entity: string;
    fields: string[];
    filters: { execution_id: string };
    pagination: { take: number };
  }) => Promise<{ data?: unknown[] }>;
};

function asRecord(value: unknown): UnknownRecord {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as UnknownRecord)
    : {};
}

function stringField(record: UnknownRecord, field: string): string | undefined {
  const value = record[field];
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function actorIdFromRequest(req: MedusaRequest): string | undefined {
  const authContext = (req as MedusaRequest & { auth_context?: UnknownRecord }).auth_context;
  return authContext ? stringField(authContext, "actor_id") : undefined;
}

function arrayField(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function redactSensitiveText(value: string): string {
  return value
    .replace(/\bBearer\s+[A-Za-z0-9._~+/=-]+/gi, "Bearer [redacted-secret]")
    .replace(/\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/g, "[redacted-token]")
    .replace(/\bsk-[A-Za-z0-9_-]{8,}\b/g, "[redacted-secret]")
    .replace(
      /\b(api[_-]?key|secret|provider[_ -]?auth|access[_-]?token|refresh[_-]?token)\s*[:=]\s*["']?[^"'\s,;]+/gi,
      "$1=[redacted-secret]",
    )
    .replace(/\bfile:\/\/[^\s)]+/g, "[redacted-local-path]")
    .replace(/\b[A-Za-z]:[\\/][^\s)]+/g, "[redacted-local-path]")
    .replace(/(^|[\s(["'])(\/(?:Users|home|private|var|tmp|Volumes)\/[^\s)"']+)/g, "$1[redacted-local-path]");
}

function sanitizeReadModelForGateway(
  readModel: DijieAuditExecutionReadModel,
): DijieAuditExecutionReadModel {
  return {
    ...readModel,
    changedFiles: readModel.changedFiles.map(redactSensitiveText),
    artifacts: readModel.artifacts.map((artifact) => ({
      ...artifact,
      id: redactSensitiveText(artifact.id),
      type: redactSensitiveText(artifact.type),
      title: redactSensitiveText(artifact.title),
    })),
    errorSummary:
      readModel.errorSummary === null ? null : redactSensitiveText(readModel.errorSummary),
  };
}

function isAuditRecordReader(value: unknown): value is DijieAuditExecutionRecordReader {
  return (
    value !== null &&
    typeof value === "object" &&
    typeof (value as { retrieveDijieAuditRecordByExecutionId?: unknown })
      .retrieveDijieAuditRecordByExecutionId === "function"
  );
}

function resolveAuditRecordReader(
  req: MedusaRequest,
): DijieAuditExecutionRecordReader | undefined {
  try {
    const store = req.scope.resolve(DIJIE_AUDIT_MODULE) as unknown;
    if (isAuditRecordReader(store)) {
      return store;
    }
  } catch {
    // Query graph fallback below keeps the read endpoint usable in tests and admin surfaces.
  }

  try {
    const legacyStore = req.scope.resolve("dijieAuditSink") as unknown;
    if (isAuditRecordReader(legacyStore)) {
      return legacyStore;
    }
    return undefined;
  } catch {
    return undefined;
  }
}

function resolveQueryGraph(req: MedusaRequest): QueryGraph | undefined {
  try {
    const query = req.scope.resolve("query") as unknown;
    if (
      query &&
      typeof query === "object" &&
      typeof (query as { graph?: unknown }).graph === "function"
    ) {
      return query as QueryGraph;
    }
    return undefined;
  } catch {
    return undefined;
  }
}

function storageRecordFromGraphResult(value: unknown): DijieAuditStorageRecord | undefined {
  const record = asRecord(value);
  const executionId = stringField(record, "execution_id");
  const actorId = stringField(record, "actor_id");
  const roleListingId = stringField(record, "role_listing_id");
  const packageId = stringField(record, "package_id");
  const packageVersion = stringField(record, "package_version");
  const developerRef = stringField(record, "developer_ref");
  const listingOwnerRef = stringField(record, "listing_owner_ref");
  const billingBeneficiaryRef = stringField(record, "billing_beneficiary_ref");
  const entitlementId = stringField(record, "entitlement_id");
  const deviceId = stringField(record, "device_id");
  const workspaceRef = stringField(record, "workspace_ref");
  const localGatewayId = stringField(record, "local_gateway_id");
  const status = stringField(record, "status");
  const receivedAt = record.received_at;

  if (
    !executionId ||
    !actorId ||
    !roleListingId ||
    !packageId ||
    !packageVersion ||
    !developerRef ||
    !listingOwnerRef ||
    !billingBeneficiaryRef ||
    !entitlementId ||
    !deviceId ||
    !workspaceRef ||
    !localGatewayId ||
    !status ||
    !(receivedAt instanceof Date || typeof receivedAt === "string")
  ) {
    return undefined;
  }

  return {
    execution_id: executionId,
    actor_id: actorId,
    role_listing_id: roleListingId,
    package_id: packageId,
    package_version: packageVersion,
    developer_ref: developerRef,
    listing_owner_ref: listingOwnerRef,
    billing_beneficiary_ref: billingBeneficiaryRef,
    entitlement_id: entitlementId,
    device_id: deviceId,
    workspace_ref: workspaceRef,
    local_gateway_id: localGatewayId,
    status,
    execution_token_issued_at: new Date(0),
    execution_token_expires_at: new Date(0),
    received_at: receivedAt instanceof Date ? receivedAt : new Date(receivedAt),
    pricing: record.pricing as DijieAuditStorageRecord["pricing"],
    role_token_pricing: record.role_token_pricing as DijieAuditStorageRecord["role_token_pricing"],
    role_usage_ledger:
      record.role_usage_ledger === undefined || record.role_usage_ledger === null
        ? null
        : (record.role_usage_ledger as DijieAuditStorageRecord["role_usage_ledger"]),
    model_proxy_usage:
      record.model_proxy_usage === undefined
        ? null
        : (record.model_proxy_usage as DijieAuditStorageRecord["model_proxy_usage"]),
    tool_usage: record.tool_usage as DijieAuditStorageRecord["tool_usage"],
    changed_files: arrayField(record.changed_files) as string[],
    artifacts: arrayField(record.artifacts) as DijieAuditStorageRecord["artifacts"],
    error_summary:
      record.error_summary === undefined || record.error_summary === null
        ? null
        : String(record.error_summary),
    payload: {} as DijieAuditStorageRecord["payload"],
  };
}

async function retrieveAuditRecord(
  req: MedusaRequest,
  executionId: string,
): Promise<{ configured: boolean; record?: DijieAuditStorageRecord }> {
  const reader = resolveAuditRecordReader(req);
  if (reader) {
    return {
      configured: true,
      record: await reader.retrieveDijieAuditRecordByExecutionId(executionId),
    };
  }

  const query = resolveQueryGraph(req);
  if (!query) {
    return { configured: false };
  }

  const { data = [] } = await query.graph({
    entity: "dijie_audit_record",
    fields: [
      "execution_id",
      "actor_id",
      "role_listing_id",
      "package_id",
      "package_version",
      "developer_ref",
      "listing_owner_ref",
      "billing_beneficiary_ref",
      "entitlement_id",
      "device_id",
      "workspace_ref",
      "local_gateway_id",
      "status",
      "pricing",
      "role_token_pricing",
      "role_usage_ledger",
      "model_proxy_usage",
      "tool_usage",
      "changed_files",
      "artifacts",
      "error_summary",
      "received_at",
    ],
    filters: {
      execution_id: executionId,
    },
    pagination: {
      take: 1,
    },
  });

  return {
    configured: true,
    record: storageRecordFromGraphResult(data[0]),
  };
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const actorId = actorIdFromRequest(req);
  if (!actorId) {
    return res.status(401).json({
      ok: false,
      error: "Dijie execution audit reads require an authenticated Mercur actor.",
    });
  }

  const params = (req as MedusaRequest & { params?: Record<string, string> }).params ?? {};
  const executionId = params.executionId?.trim();

  if (!executionId) {
    return res.status(400).json({
      ok: false,
      error: "Dijie executionId path parameter is required.",
    });
  }

  let result: { configured: boolean; record?: DijieAuditStorageRecord };
  try {
    result = await retrieveAuditRecord(req, executionId);
  } catch {
    return res.status(502).json({
      ok: false,
      error: "Dijie audit record store failed to read the execution audit record.",
    });
  }

  if (!result.configured) {
    return res.status(503).json({
      ok: false,
      error: "Dijie audit record store is not configured.",
    });
  }

  if (!result.record) {
    return res.status(404).json({
      ok: false,
      error: "Dijie execution audit record was not found.",
    });
  }

  if (result.record.actor_id !== actorId) {
    return res.status(403).json({
      ok: false,
      error: "Dijie execution audit record is not available to this actor.",
    });
  }

  return res.status(200).json({
    ok: true,
    ...sanitizeReadModelForGateway(createDijieAuditExecutionReadModel(result.record)),
  });
}
