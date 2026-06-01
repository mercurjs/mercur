import { describe, expect, it } from "bun:test";
import {
  createDijieAuditExecutionReadModel,
  createDijieAuditStorageRecord,
  retrieveDijieAuditRecordByExecutionIdWithRepository,
  recordDijieAuditSummaryWithRepository,
  type DijieAuditStorageRecord,
} from "./audit-store";
import type { DijieAuditRecord } from "./audit-summary";

const roleTokenPricing = {
  inputTokenCentsPerMillion: 120,
  outputTokenCentsPerMillion: 360,
  currency: "CNY",
  developerReceivableBps: 10000 as const,
  platformFeeBps: 0 as const,
};

const record: DijieAuditRecord = {
  auditRecordVersion: 1,
  actorId: "cus_123",
  packageId: "pkg_role_123",
  packageVersion: "1.0.0",
  developerRef: "dev_001",
  listingOwnerRef: "seller_001",
  billingBeneficiaryRef: "dev_001",
  receivedAt: "2026-05-31T08:02:00.000Z",
  executionTokenIssuedAt: "2026-05-31T08:00:00.000Z",
  executionTokenExpiresAt: "2026-05-31T08:05:00.000Z",
  pricing: {
    kind: "one_time_authorization",
    authorizationFeeCents: 29900,
    currency: "CNY",
    platformFeeBps: 0,
    developerReceivableCents: 29900,
  },
  roleTokenPricing,
  roleUsageLedger: {
    ledger: "usage",
    source: "role_usage",
    entryId: "role_usage_exec_123",
    executionId: "exec_123",
    actorId: "cus_123",
    developerId: "dev_001",
    developerRef: "dev_001",
    billingBeneficiaryRef: "dev_001",
    roleListingId: "role_123",
    packageId: "pkg_role_123",
    packageVersion: "1.0.0",
    entitlementId: "ent_123",
    workspaceRef: "workspace_123",
    usageKind: "model_tokens",
    meters: [
      { name: "request_count", quantity: 1, unit: "request" },
      { name: "input_tokens", quantity: 1000, unit: "token" },
      { name: "output_tokens", quantity: 500, unit: "token" },
    ],
    currency: "CNY",
    grossAmountCents: 1,
    platformReceivableCents: 0,
    developerReceivableCents: 1,
    occurredAt: "2026-05-31T08:02:00.000Z",
  },
  summary: {
    executionId: "exec_123",
    deviceId: "device_123",
    workspaceRef: "workspace_123",
    roleListingId: "role_123",
    packageId: "pkg_role_123",
    packageVersion: "1.0.0",
    developerRef: "dev_001",
    listingOwnerRef: "seller_001",
    billingBeneficiaryRef: "dev_001",
    entitlementId: "ent_123",
    localGatewayId: "gateway_123",
    status: "failed",
    startedAt: "2026-05-31T08:00:00.000Z",
    endedAt: "2026-05-31T08:01:00.000Z",
    modelProxyUsage: {
      requestCount: 1,
      inputTokens: 1000,
      outputTokens: 500,
    },
    toolUsage: {
      shellCommands: 2,
      testsRun: 1,
      filesRead: 4,
      filesChanged: 2,
    },
    result: {
      executionId: "exec_123",
      roleListingId: "role_123",
      packageId: "pkg_role_123",
      packageVersion: "1.0.0",
      developerRef: "dev_001",
      listingOwnerRef: "seller_001",
      billingBeneficiaryRef: "dev_001",
      status: "failed",
      startedAt: "2026-05-31T08:00:00.000Z",
      endedAt: "2026-05-31T08:01:00.000Z",
      changedFiles: ["role_package/manifest.json"],
      artifacts: [
        {
          id: "artifact_123",
          type: "role_package",
          title: "Role package",
          sizeBytes: 2048,
          sha256: "abc123",
        },
      ],
      error: "Validation failed.",
    },
  },
};

describe("Dijie audit store", () => {
  it("maps an audit record to the durable storage shape", () => {
    const storageRecord = createDijieAuditStorageRecord(record);

    expect(storageRecord).toMatchObject({
      execution_id: "exec_123",
      actor_id: "cus_123",
      role_listing_id: "role_123",
      package_id: "pkg_role_123",
      package_version: "1.0.0",
      developer_ref: "dev_001",
      listing_owner_ref: "seller_001",
      billing_beneficiary_ref: "dev_001",
      entitlement_id: "ent_123",
      device_id: "device_123",
      workspace_ref: "workspace_123",
      local_gateway_id: "gateway_123",
      status: "failed",
      pricing: {
        platformFeeBps: 0,
        developerReceivableCents: 29900,
      },
      role_token_pricing: roleTokenPricing,
      role_usage_ledger: {
        developerReceivableCents: 1,
      },
      tool_usage: {
        filesChanged: 2,
      },
      changed_files: ["role_package/manifest.json"],
      error_summary: "Validation failed.",
    });
    expect(storageRecord.execution_token_issued_at.toISOString()).toBe(
      "2026-05-31T08:00:00.000Z",
    );
    expect(storageRecord.payload).toEqual(record);
  });

  it("sanitizes sensitive payload fields before durable storage", () => {
    const storageRecord = createDijieAuditStorageRecord({
      ...record,
      summary: {
        ...record.summary,
        workspaceRef: "/Users/alice/private/workspace",
        result: {
          ...record.summary.result,
          changedFiles: [
            "/Users/alice/private/project/secret.ts",
            "role_package/manifest.json",
          ],
          artifacts: [
            {
              id: "artifact_123",
              type: "role_package",
              title: "file:///Users/alice/private/package.zip",
              sizeBytes: 2048,
              sha256: "abc123",
            },
          ],
          error:
            "Bearer cloud-secret-token sk-local-secret provider_auth=raw-value /Users/alice/private/log.txt",
        },
      },
    });

    const storedJson = JSON.stringify(storageRecord);
    expect(storageRecord.workspace_ref).toBe("workspace");
    expect(storageRecord.changed_files).toEqual(["secret.ts", "role_package/manifest.json"]);
    expect(storageRecord.error_summary).toContain("Bearer [redacted-token]");
    expect(storageRecord.error_summary).toContain("[redacted-model-key]");
    expect(storageRecord.error_summary).toContain("provider_auth=[redacted-secret]");
    expect(storageRecord.error_summary).toContain("log.txt");
    expect(storedJson).not.toContain("/Users/alice");
    expect(storedJson).not.toContain("cloud-secret-token");
    expect(storedJson).not.toContain("sk-local-secret");
    expect(storedJson).not.toContain("raw-value");
  });

  it("persists through a repository-backed store instead of returning a fake success", async () => {
    let persisted: DijieAuditStorageRecord | undefined;
    const result = await recordDijieAuditSummaryWithRepository(
      {
        async createDijieAuditRecords(data) {
          persisted = data;
          return { id: "djaudit_123" };
        },
      },
      record,
    );

    expect(result).toEqual({ auditRecordId: "djaudit_123" });
    expect(persisted).toMatchObject({
      execution_id: "exec_123",
      status: "failed",
      error_summary: "Validation failed.",
    });
  });

  it("reads the latest audit record by execution id", async () => {
    const storageRecord = createDijieAuditStorageRecord(record);
    let filters: { execution_id: string } | undefined;
    let config: { take?: number; order?: Record<string, "ASC" | "DESC"> } | undefined;

    const result = await retrieveDijieAuditRecordByExecutionIdWithRepository(
      {
        async listDijieAuditRecords(inputFilters, inputConfig) {
          filters = inputFilters;
          config = inputConfig;
          return [storageRecord];
        },
      },
      "exec_123",
    );

    expect(result).toBe(storageRecord);
    expect(filters).toEqual({ execution_id: "exec_123" });
    expect(config).toMatchObject({
      take: 1,
      order: {
        received_at: "DESC",
      },
    });
  });

  it("projects a safe execution read model without payload or local absolute paths", () => {
    const storageRecord = createDijieAuditStorageRecord(record);
    storageRecord.changed_files = [
      "/Users/alice/project/secret-local-file.ts",
      "role_package/manifest.json",
    ];
    storageRecord.payload = {
      ...record,
      summary: {
        ...record.summary,
        result: {
          ...record.summary.result,
          error: "provider key sk-local-secret",
        },
      },
    };

    const readModel = createDijieAuditExecutionReadModel(storageRecord);

    expect(readModel).toMatchObject({
      roleListingId: "role_123",
      packageId: "pkg_role_123",
      packageVersion: "1.0.0",
      developerRef: "dev_001",
      listingOwnerRef: "seller_001",
      billingBeneficiaryRef: "dev_001",
      status: "failed",
      roleTokenPricing,
      billingSummary: {
        source: "role_usage",
        developerRef: "dev_001",
        billingBeneficiaryRef: "dev_001",
        inputTokens: 1000,
        outputTokens: 500,
        platformReceivableCents: 0,
        developerReceivableCents: 1,
      },
      changedFiles: ["secret-local-file.ts", "role_package/manifest.json"],
      errorSummary: "Validation failed.",
      receivedAt: "2026-05-31T08:02:00.000Z",
    });
    expect(JSON.stringify(readModel)).not.toContain("/Users/alice");
    expect(JSON.stringify(readModel)).not.toContain("sk-local-secret");
    expect(JSON.stringify(readModel)).not.toContain("exec_123");
    expect(JSON.stringify(readModel)).not.toContain("cus_123");
    expect(JSON.stringify(readModel)).not.toContain("ent_123");
    expect(JSON.stringify(readModel)).not.toContain("device_123");
    expect(JSON.stringify(readModel)).not.toContain("workspace_123");
    expect(JSON.stringify(readModel)).not.toContain("gateway_123");
    expect(readModel).not.toHaveProperty("executionId");
    expect(readModel).not.toHaveProperty("actorId");
    expect(readModel).not.toHaveProperty("entitlementId");
    expect(readModel).not.toHaveProperty("deviceId");
    expect(readModel).not.toHaveProperty("workspaceRef");
    expect(readModel).not.toHaveProperty("localGatewayId");
    expect(readModel).not.toHaveProperty("payload");
  });
});
