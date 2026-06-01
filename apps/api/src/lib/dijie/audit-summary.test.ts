import { describe, expect, it } from "bun:test";
import { createDijieAuditRecord } from "./audit-summary";
import type { DijieExecutionTokenClaims } from "./execution-token";

const claims: DijieExecutionTokenClaims = {
  iss: "dijie-cloud",
  typ: "dijie_execution",
  executionId: "exec_123",
  actorId: "cus_123",
  roleListingId: "role_123",
  packageId: "pkg_role_123",
  packageVersion: "1.0.0",
  developerRef: "dev_001",
  listingOwnerRef: "seller_001",
  billingBeneficiaryRef: "dev_001",
  entitlementId: "ent_123",
  deviceId: "device_123",
  workspaceRef: "workspace_123",
  localGatewayId: "gateway_123",
  scopes: ["role.execute", "audit.write"],
  pricing: {
    kind: "one_time_authorization",
    authorizationFeeCents: 29900,
    currency: "CNY",
    platformFeeBps: 0,
    developerReceivableCents: 29900,
  },
  roleTokenPricing: {
    inputTokenCentsPerMillion: 120,
    outputTokenCentsPerMillion: 360,
    currency: "CNY",
    developerReceivableBps: 10000,
    platformFeeBps: 0,
  },
  iat: 1_800_000_000,
  exp: 1_800_000_300,
};

function auditSummary(overrides: Record<string, unknown> = {}) {
  return {
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
    status: "completed",
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
      status: "completed",
      startedAt: "2026-05-31T08:00:00.000Z",
      endedAt: "2026-05-31T08:01:00.000Z",
      summary: "Generated role package.",
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
    },
    ...overrides,
  };
}

describe("Dijie audit summaries", () => {
  it("creates an audit record when summary matches the execution token", () => {
    const result = createDijieAuditRecord({
      claims,
      summary: auditSummary(),
      receivedAt: "2026-05-31T08:02:00.000Z",
    });

    expect(result.ok).toBe(true);
    if (!result.ok) {
      throw new Error(result.error);
    }
    expect(result.record).toMatchObject({
      auditRecordVersion: 1,
      actorId: "cus_123",
      packageId: "pkg_role_123",
      packageVersion: "1.0.0",
      developerRef: "dev_001",
      listingOwnerRef: "seller_001",
      billingBeneficiaryRef: "dev_001",
      roleTokenPricing: {
        inputTokenCentsPerMillion: 120,
        outputTokenCentsPerMillion: 360,
      },
      receivedAt: "2026-05-31T08:02:00.000Z",
      summary: {
        executionId: "exec_123",
        result: {
          changedFiles: ["role_package/manifest.json"],
        },
      },
    });
  });

  it("rejects summaries when token scope is missing audit.write", () => {
    const result = createDijieAuditRecord({
      claims: {
        ...claims,
        scopes: ["role.execute"],
      },
      summary: auditSummary(),
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain("audit.write");
    }
  });

  it("rejects summaries that do not match the execution token", () => {
    const result = createDijieAuditRecord({
      claims,
      summary: auditSummary({
        roleListingId: "role_other",
      }),
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain("roleListingId");
    }
  });

  it("rejects empty changed file placeholders", () => {
    const result = createDijieAuditRecord({
      claims,
      summary: auditSummary({
        result: {
          executionId: "exec_123",
          roleListingId: "role_123",
          packageId: "pkg_role_123",
          packageVersion: "1.0.0",
          developerRef: "dev_001",
          listingOwnerRef: "seller_001",
          billingBeneficiaryRef: "dev_001",
          status: "completed",
          startedAt: "2026-05-31T08:00:00.000Z",
          endedAt: "2026-05-31T08:01:00.000Z",
          changedFiles: [""],
          artifacts: [],
        },
      }),
    });

    expect(result.ok).toBe(false);
  });
});
