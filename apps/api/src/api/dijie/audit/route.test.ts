import crypto from "node:crypto";
import { afterEach, describe, expect, it } from "bun:test";
import {
  DIJIE_AUDIT_MODULE,
  recordDijieAuditSummaryWithRepository,
} from "../../../lib/dijie/audit-store";
import { createDijieExecutionToken, type DijieExecutionTokenClaims } from "../../../lib/dijie/execution-token";
import { POST } from "./route";

const keyPair = crypto.generateKeyPairSync("ed25519");
const privateKeyPem = keyPair.privateKey.export({ format: "pem", type: "pkcs8" }).toString();
const publicKeyPem = keyPair.publicKey.export({ format: "pem", type: "spki" }).toString();
const roleTokenPricing = {
  inputTokenCentsPerMillion: 120,
  outputTokenCentsPerMillion: 360,
  currency: "CNY",
  developerReceivableBps: 10000 as const,
  platformFeeBps: 0 as const,
};

type TestResponse = {
  statusCode: number;
  body: unknown;
  status: (statusCode: number) => TestResponse;
  json: (body: unknown) => unknown;
};

function response(): TestResponse {
  return {
    statusCode: 200,
    body: undefined,
    status(statusCode: number) {
      this.statusCode = statusCode;
      return this;
    },
    json(body: unknown) {
      this.body = body;
      return body;
    },
  };
}

function token(scopes = ["role.execute", "audit.write"]) {
  const signed = createDijieExecutionToken(
    {
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
      scopes,
      pricing: {
        kind: "one_time_authorization",
        authorizationFeeCents: 29900,
        currency: "CNY",
        platformFeeBps: 0,
        developerReceivableCents: 29900,
      },
      roleTokenPricing,
      nowMs: Date.now(),
      ttlSeconds: 300,
    },
    privateKeyPem,
  );
  if (!signed.ok) {
    throw new Error(signed.error);
  }
  return signed.token;
}

function request(body: Record<string, unknown>, bearer = token(), store?: unknown) {
  return {
    body,
    headers: {
      authorization: `Bearer ${bearer}`,
    },
    scope: {
      resolve(name: string) {
        if (store && name === DIJIE_AUDIT_MODULE) {
          return store;
        }
        throw new Error(`Unknown dependency: ${name}`);
      },
    },
  };
}

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
      inputTokens: 1_000_000,
      outputTokens: 500_000,
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
      changedFiles: ["role_package/manifest.json"],
      artifacts: [],
    },
    ...overrides,
  };
}

describe("POST /dijie/audit", () => {
  afterEach(() => {
    delete process.env.DIJIE_EXECUTION_TOKEN_PUBLIC_KEY_PEM;
  });

  it("fails closed when token verification key is missing", async () => {
    const res = response();
    await POST(request({ auditSummary: auditSummary() }) as never, res as never);

    expect(res.statusCode).toBe(503);
    expect(res.body).toMatchObject({
      ok: false,
      error: "DIJIE_EXECUTION_TOKEN_PUBLIC_KEY_PEM is required for audit upload.",
    });
  });

  it("records an audit summary through the configured audit record store", async () => {
    process.env.DIJIE_EXECUTION_TOKEN_PUBLIC_KEY_PEM = publicKeyPem;
    let persisted:
      | {
          execution_id?: string;
          actor_id?: string;
          package_id?: string;
          package_version?: string;
          developer_ref?: string;
          listing_owner_ref?: string;
          billing_beneficiary_ref?: string;
          role_usage_ledger?: { developerReceivableCents?: number };
          changed_files?: string[];
        }
      | undefined;
    const store = {
      recordDijieAuditSummary: (record: never) =>
        recordDijieAuditSummaryWithRepository(
          {
            async createDijieAuditRecords(data) {
              persisted = data;
              return { id: "djaudit_123" };
            },
          },
          record,
        ),
    };

    const res = response();
    await POST(request({ auditSummary: auditSummary() }, token(), store) as never, res as never);

    expect(res.statusCode).toBe(200);
    expect(res.body).toMatchObject({
      ok: true,
      executionId: "exec_123",
      auditRecordId: "djaudit_123",
      billingSummary: {
        source: "role_usage",
        inputTokens: 1_000_000,
        outputTokens: 500_000,
        developerReceivableCents: 300,
        platformReceivableCents: 0,
      },
    });
    expect(persisted).toMatchObject({
      execution_id: "exec_123",
      actor_id: "cus_123",
      package_id: "pkg_role_123",
      package_version: "1.0.0",
      developer_ref: "dev_001",
      listing_owner_ref: "seller_001",
      billing_beneficiary_ref: "dev_001",
      role_usage_ledger: {
        executionId: "exec_123",
        developerReceivableCents: 300,
      },
      changed_files: ["role_package/manifest.json"],
    });
  });

  it("rejects audit uploads without model proxy usage for role token settlement", async () => {
    process.env.DIJIE_EXECUTION_TOKEN_PUBLIC_KEY_PEM = publicKeyPem;

    const { modelProxyUsage: _modelProxyUsage, ...summaryWithoutModelUsage } = auditSummary();
    const res = response();
    await POST(
      request({
        auditSummary: summaryWithoutModelUsage,
      }) as never,
      res as never,
    );

    expect(res.statusCode).toBe(400);
    expect(res.body).toMatchObject({
      ok: false,
    });
    expect((res.body as { error: string }).error).toContain("modelProxyUsage");
  });

  it("rejects audit uploads without audit.write scope", async () => {
    process.env.DIJIE_EXECUTION_TOKEN_PUBLIC_KEY_PEM = publicKeyPem;

    const res = response();
    await POST(request({ auditSummary: auditSummary() }, token(["role.execute"])) as never, res as never);

    expect(res.statusCode).toBe(400);
    expect(res.body).toMatchObject({
      ok: false,
      error: "Dijie execution token is missing audit.write scope.",
    });
  });

  it("rejects audit summaries that do not match the execution token", async () => {
    process.env.DIJIE_EXECUTION_TOKEN_PUBLIC_KEY_PEM = publicKeyPem;

    const res = response();
    await POST(
      request({
        auditSummary: auditSummary({
          entitlementId: "ent_other",
        }),
      }) as never,
      res as never,
    );

    expect(res.statusCode).toBe(400);
    expect(res.body).toMatchObject({
      ok: false,
    });
    expect((res.body as { error: string }).error).toContain("entitlementId");
  });

  it("fails closed when no audit record store is configured", async () => {
    process.env.DIJIE_EXECUTION_TOKEN_PUBLIC_KEY_PEM = publicKeyPem;

    const res = response();
    await POST(request({ auditSummary: auditSummary() }) as never, res as never);

    expect(res.statusCode).toBe(503);
    expect(res.body).toMatchObject({
      ok: false,
      error: "Dijie audit record store is not configured.",
    });
  });
});
