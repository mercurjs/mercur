import { describe, expect, it } from "bun:test";
import {
  createDijieMarketplaceRoleLedgerEntries,
  createDijieRoleTokenUsageLedgerEntryFromAudit,
  createDijieRoleUsageLedgerEntry,
  createDijieUsageLedgerEntry,
} from "./ledgers";
import type { DijieAuditRecord } from "./audit-summary";

const pricing = {
  kind: "one_time_authorization" as const,
  authorizationFeeCents: 29900,
  currency: "CNY",
  platformFeeBps: 0,
  developerReceivableCents: 29900,
};
const roleTokenPricing = {
  inputTokenCentsPerMillion: 120,
  outputTokenCentsPerMillion: 360,
  currency: "CNY",
  developerReceivableBps: 10000 as const,
  platformFeeBps: 0 as const,
};

function auditRecord(overrides: Partial<DijieAuditRecord> = {}): DijieAuditRecord {
  return {
    auditRecordVersion: 1,
    actorId: "cus_123",
    packageId: "pkg_123",
    packageVersion: "1.0.0",
    developerRef: "dev_123",
    listingOwnerRef: "seller_123",
    billingBeneficiaryRef: "dev_123",
    receivedAt: "2026-05-31T08:20:00.000Z",
    executionTokenIssuedAt: "2026-05-31T08:00:00.000Z",
    executionTokenExpiresAt: "2026-05-31T08:05:00.000Z",
    pricing,
    roleTokenPricing,
    summary: {
      executionId: "exec_123",
      deviceId: "device_123",
      workspaceRef: "workspace_123",
      roleListingId: "role_123",
      packageId: "pkg_123",
      packageVersion: "1.0.0",
      developerRef: "dev_123",
      listingOwnerRef: "seller_123",
      billingBeneficiaryRef: "dev_123",
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
        shellCommands: 1,
        testsRun: 0,
        filesRead: 0,
        filesChanged: 0,
      },
      result: {
        executionId: "exec_123",
        roleListingId: "role_123",
        packageId: "pkg_123",
        packageVersion: "1.0.0",
        developerRef: "dev_123",
        listingOwnerRef: "seller_123",
        billingBeneficiaryRef: "dev_123",
        status: "completed",
        startedAt: "2026-05-31T08:00:00.000Z",
        endedAt: "2026-05-31T08:01:00.000Z",
        changedFiles: [],
        artifacts: [],
      },
    },
    ...overrides,
  };
}

describe("Dijie ledgers", () => {
  it("records main-system usage as platform receivable", () => {
    const result = createDijieUsageLedgerEntry({
      entryId: "usage_123",
      actorId: "cus_123",
      workspaceRef: "workspace_123",
      usageKind: "model_tokens",
      meters: [
        { name: "input_tokens", quantity: 1200, unit: "token" },
        { name: "output_tokens", quantity: 800, unit: "token" },
      ],
      currency: "CNY",
      amountCents: 88,
      occurredAt: "2026-05-31T08:00:00.000Z",
    });

    expect(result.ok).toBe(true);
    if (!result.ok) {
      throw new Error(result.error);
    }
    expect(result.value).toMatchObject({
      ledger: "usage",
      source: "main_system_usage",
      grossAmountCents: 88,
      platformReceivableCents: 88,
      developerReceivableCents: 0,
    });
  });

  it("records role authorization revenue as 100% developer receivable", () => {
    const result = createDijieMarketplaceRoleLedgerEntries({
      entryId: "market_123",
      payoutEntryId: "payout_123",
      eventKind: "role_authorization",
      actorId: "cus_123",
      developerId: "dev_123",
      roleListingId: "role_123",
      entitlementId: "ent_123",
      pricing,
      occurredAt: "2026-05-31T08:00:00.000Z",
    });

    expect(result.ok).toBe(true);
    if (!result.ok) {
      throw new Error(result.error);
    }
    expect(result.value.marketplaceOrder).toMatchObject({
      ledger: "marketplace_order",
      source: "role_marketplace",
      grossAmountCents: 29900,
      platformFeeBps: 0,
      platformFeeCents: 0,
      developerReceivableCents: 29900,
    });
    expect(result.value.developerPayout).toMatchObject({
      ledger: "developer_payout",
      source: "role_marketplace",
      developerId: "dev_123",
      amountCents: 29900,
      status: "pending",
    });
  });

  it("records model token usage inside a role run as developer receivable", () => {
    const result = createDijieRoleUsageLedgerEntry({
      entryId: "role_usage_123",
      executionId: "exec_123",
      actorId: "cus_123",
      developerId: "dev_123",
      developerRef: "dev_123",
      billingBeneficiaryRef: "dev_123",
      roleListingId: "role_123",
      packageId: "pkg_123",
      packageVersion: "1.0.0",
      entitlementId: "ent_123",
      workspaceRef: "workspace_123",
      usageKind: "model_tokens",
      meters: [
        { name: "input_tokens", quantity: 3000, unit: "token" },
        { name: "output_tokens", quantity: 1200, unit: "token" },
      ],
      currency: "CNY",
      amountCents: 126,
      occurredAt: "2026-05-31T08:20:00.000Z",
    });

    expect(result.ok).toBe(true);
    if (!result.ok) {
      throw new Error(result.error);
    }
    expect(result.value).toMatchObject({
      ledger: "usage",
      source: "role_usage",
      executionId: "exec_123",
      developerId: "dev_123",
      developerRef: "dev_123",
      billingBeneficiaryRef: "dev_123",
      roleListingId: "role_123",
      packageVersion: "1.0.0",
      usageKind: "model_tokens",
      grossAmountCents: 126,
      platformReceivableCents: 0,
      developerReceivableCents: 126,
    });
  });

  it("derives developer role token receivable from audit model usage", () => {
    const result = createDijieRoleTokenUsageLedgerEntryFromAudit(auditRecord());

    expect(result.ok).toBe(true);
    if (!result.ok) {
      throw new Error(result.error);
    }
    expect(result.value).toMatchObject({
      ledger: "usage",
      source: "role_usage",
      entryId: "role_usage_exec_123",
      executionId: "exec_123",
      developerRef: "dev_123",
      billingBeneficiaryRef: "dev_123",
      packageId: "pkg_123",
      packageVersion: "1.0.0",
      entitlementId: "ent_123",
      currency: "CNY",
      grossAmountCents: 300,
      platformReceivableCents: 0,
      developerReceivableCents: 300,
    });
  });

  it("refuses to settle role token usage without model proxy usage", () => {
    const record = auditRecord({
      summary: {
        ...auditRecord().summary,
        modelProxyUsage: undefined,
      },
    });
    const result = createDijieRoleTokenUsageLedgerEntryFromAudit(record);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain("modelProxyUsage");
    }
  });

  it("rejects role pricing with a marketplace platform cut", () => {
    const result = createDijieMarketplaceRoleLedgerEntries({
      entryId: "market_bad",
      payoutEntryId: "payout_bad",
      eventKind: "role_authorization",
      actorId: "cus_123",
      developerId: "dev_123",
      roleListingId: "role_123",
      entitlementId: "ent_123",
      pricing: {
        kind: "one_time_authorization",
        authorizationFeeCents: 29900,
        currency: "CNY",
        platformFeeBps: 1500,
        developerReceivableCents: 25415,
      },
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain("platformFeeBps = 0");
    }
  });

  it("rejects usage entries without real meters", () => {
    const result = createDijieUsageLedgerEntry({
      entryId: "usage_bad",
      actorId: "cus_123",
      workspaceRef: "workspace_123",
      usageKind: "tool_execution",
      meters: [],
      currency: "CNY",
      amountCents: 10,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain("at least one meter");
    }
  });

  it("rejects role token usage entries without a developer owner", () => {
    const result = createDijieRoleUsageLedgerEntry({
      entryId: "role_usage_bad",
      executionId: "exec_123",
      actorId: "cus_123",
      developerId: "",
      developerRef: "dev_123",
      billingBeneficiaryRef: "dev_123",
      roleListingId: "role_123",
      packageId: "pkg_123",
      packageVersion: "1.0.0",
      entitlementId: "ent_123",
      workspaceRef: "workspace_123",
      usageKind: "model_tokens",
      meters: [{ name: "input_tokens", quantity: 100, unit: "token" }],
      currency: "CNY",
      amountCents: 3,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain("developerId");
    }
  });
});
