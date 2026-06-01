import { describe, expect, it } from "bun:test";
import {
  type DijieQueryGraph,
  verifyDijieEntitlement,
} from "./entitlement-verifier";

const input = {
  actorId: "cus_123",
  roleListingId: "prod_role_developer_agent",
  entitlementId: "ordgrp_123",
  deviceId: "device_123",
  workspaceRef: "workspace_123",
  localGatewayId: "gateway_123",
};
const roleTokenPricing = {
  inputTokenCentsPerMillion: 120,
  outputTokenCentsPerMillion: 360,
  currency: "CNY",
  developerReceivableBps: 10000,
  platformFeeBps: 0,
};

function product(overrides: Record<string, unknown> = {}) {
  return {
    id: input.roleListingId,
    status: "published",
    metadata: {
      dijieRole: {
        kind: "role_product",
        protocolVersion: "2026-05",
        packageId: "pkg_developer",
        packageVersion: "1.0.0",
        developerRef: "dev_001",
        listingStatus: "published",
        reviewState: "approved",
        pricing: {
          kind: "one_time_authorization",
          authorizationFeeCents: 29900,
          currency: "CNY",
          platformFeeBps: 0,
          developerReceivableCents: 29900,
        },
        roleTokenPricing,
        scopes: ["role.execute", "audit.write"],
      },
    },
    ...overrides,
  };
}

function paidOrder(overrides: Record<string, unknown> = {}) {
  return {
    id: "order_123",
    customer_id: input.actorId,
    status: "completed",
    payment_collections: [{ status: "captured", amount: 29900, captured_amount: 29900 }],
    items: [{ product_id: input.roleListingId }],
    ...overrides,
  };
}

function queryGraph(fixtures: {
  products?: unknown[];
  orderGroups?: unknown[];
  orders?: unknown[];
}): DijieQueryGraph {
  return async ({ entity }) => {
    if (entity === "product") {
      return { data: fixtures.products ?? [product()] };
    }
    if (entity === "order_group") {
      return { data: fixtures.orderGroups ?? [{ id: input.entitlementId, orders: [paidOrder()] }] };
    }
    if (entity === "order") {
      return { data: fixtures.orders ?? [] };
    }
    return { data: [] };
  };
}

describe("verifyDijieEntitlement", () => {
  it("approves a paid one-time role authorization", async () => {
    const result = await verifyDijieEntitlement(input, queryGraph({}));

    expect(result).toEqual({
      ok: true,
      packageId: "pkg_developer",
      packageVersion: "1.0.0",
      developerRef: "dev_001",
      listingOwnerRef: "dev_001",
      billingBeneficiaryRef: "dev_001",
      pricing: {
        kind: "one_time_authorization",
        authorizationFeeCents: 29900,
        currency: "CNY",
        platformFeeBps: 0,
        developerReceivableCents: 29900,
      },
      roleTokenPricing,
      scopes: ["role.execute", "audit.write"],
    });
  });

  it("rejects role listings that include a marketplace platform cut", async () => {
    const result = await verifyDijieEntitlement(
      input,
      queryGraph({
        products: [
          product({
            metadata: {
              dijieRole: {
                kind: "role_product",
                protocolVersion: "2026-05",
                packageId: "pkg_developer",
                packageVersion: "1.0.0",
                developerRef: "dev_001",
                listingStatus: "published",
                reviewState: "approved",
                pricing: {
                  kind: "one_time_authorization",
                  authorizationFeeCents: 29900,
                  currency: "CNY",
                  platformFeeBps: 1500,
                  developerReceivableCents: 25300,
                },
                roleTokenPricing,
              },
            },
          }),
        ],
      }),
    );

    expect(result).toEqual({
      ok: false,
      status: 422,
      error: "Role listing metadata is not a valid Dijie role product.",
    });
  });

  it("rejects non-purchased role listings", async () => {
    const result = await verifyDijieEntitlement(
      input,
      queryGraph({ orderGroups: [{ id: input.entitlementId, orders: [paidOrder({ items: [] })] }] }),
    );

    expect(result).toEqual({
      ok: false,
      status: 403,
      error: "No paid one-time role authorization was found for this customer.",
    });
  });

  it("rejects unpaid orders", async () => {
    const result = await verifyDijieEntitlement(
      input,
      queryGraph({
        orderGroups: [
          {
            id: input.entitlementId,
            orders: [paidOrder({ status: "pending", payment_collections: [] })],
          },
        ],
      }),
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe(403);
    }
  });

  it("rejects non-executable listing states", async () => {
    const result = await verifyDijieEntitlement(
      input,
      queryGraph({
        products: [
          product({
            status: "draft",
            metadata: {
              dijieRole: {
                kind: "role_product",
                protocolVersion: "2026-05",
                packageId: "pkg_developer",
                packageVersion: "1.0.0",
                developerRef: "dev_001",
                listingStatus: "draft",
                reviewState: "approved",
                pricing: {
                  kind: "one_time_authorization",
                  authorizationFeeCents: 29900,
                  currency: "CNY",
                  platformFeeBps: 0,
                  developerReceivableCents: 29900,
                },
                roleTokenPricing,
              },
            },
          }),
        ],
      }),
    );

    expect(result).toEqual({
      ok: false,
      status: 403,
      error: "Role listing is not executable.",
    });
  });

  it("rejects listings without one-time authorization pricing", async () => {
    const result = await verifyDijieEntitlement(
      input,
      queryGraph({
        products: [
          product({
            metadata: {
              dijieRole: {
                kind: "role_product",
                protocolVersion: "2026-05",
                packageId: "pkg_developer",
                packageVersion: "1.0.0",
                developerRef: "dev_001",
                listingStatus: "published",
                reviewState: "approved",
                roleTokenPricing,
              },
            },
          }),
        ],
      }),
    );

    expect(result).toEqual({
      ok: false,
      status: 422,
      error: "Role listing metadata is not a valid Dijie role product.",
    });
  });

  it("rejects privileged role product scopes before execution token minting", async () => {
    const result = await verifyDijieEntitlement(
      input,
      queryGraph({
        products: [
          product({
            metadata: {
              dijieRole: {
                kind: "role_product",
                protocolVersion: "2026-05",
                packageId: "pkg_developer",
                packageVersion: "1.0.0",
                developerRef: "dev_001",
                listingStatus: "published",
                reviewState: "approved",
                pricing: {
                  kind: "one_time_authorization",
                  authorizationFeeCents: 29900,
                  currency: "CNY",
                  platformFeeBps: 0,
                  developerReceivableCents: 29900,
                },
                roleTokenPricing,
                scopes: ["role.execute", "operator.write"],
              },
            },
          }),
        ],
      }),
    );

    expect(result).toEqual({
      ok: false,
      status: 422,
      error: "Role listing metadata is not a valid Dijie role product.",
    });
  });
});
