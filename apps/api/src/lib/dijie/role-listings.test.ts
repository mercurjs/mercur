import { describe, expect, it } from "bun:test";
import {
  createDijieInstalledRolesFromMarketplaceFacts,
  createDijieRoleListingFromProduct,
} from "./role-listings";

const roleTokenPricing = {
  inputTokenCentsPerMillion: 120,
  outputTokenCentsPerMillion: 360,
  currency: "CNY",
  developerReceivableBps: 10000,
  platformFeeBps: 0,
};

const roleProduct = {
  id: "prod_role_researcher",
  title: "资料研究岗位",
  subtitle: "整理资料并输出简报",
  description: "适合做资料收集和结构化总结。",
  handle: "research-role",
  status: "published",
  seller: {
    id: "dev_001",
    name: "迭界开发者",
  },
  metadata: {
    dijieRole: {
      kind: "role_product",
      protocolVersion: "2026-05",
      packageId: "pkg_researcher",
      packageVersion: "1.0.0",
      developerRef: "dev_001",
      listingStatus: "published",
      reviewState: "approved",
      capabilities: ["资料收集"],
      pricing: {
        kind: "one_time_authorization",
        authorizationFeeCents: 19900,
        currency: "CNY",
        platformFeeBps: 0,
        developerReceivableCents: 19900,
      },
      roleTokenPricing,
    },
  },
};

describe("Dijie role listing projection", () => {
  it("creates a public role listing from Mercur product facts", () => {
    expect(createDijieRoleListingFromProduct(roleProduct)).toEqual({
      id: "prod_role_researcher",
      title: "资料研究岗位",
      subtitle: "整理资料并输出简报",
      description: "适合做资料收集和结构化总结。",
      handle: "research-role",
      listingStatus: "published",
      reviewState: "approved",
      developerId: "dev_001",
      developerName: "迭界开发者",
      packageId: "pkg_researcher",
      packageVersion: "1.0.0",
      protocolVersion: "2026-05",
      capabilities: ["资料收集"],
      pricing: {
        kind: "one_time_authorization",
        authorizationFeeCents: 19900,
        currency: "CNY",
        platformFeeBps: 0,
        developerReceivableCents: 19900,
      },
      roleTokenPricing,
      scopes: ["role.execute", "audit.write"],
    });
  });

  it("does not publish products without one-time role authorization pricing", () => {
    expect(
      createDijieRoleListingFromProduct({
        id: "prod_regular",
        title: "普通商品",
        status: "published",
        metadata: {},
      }),
    ).toBeUndefined();
  });

  it("derives installed roles from paid orders only", () => {
    const installed = createDijieInstalledRolesFromMarketplaceFacts({
      products: [roleProduct],
      orderGroups: [
        {
          id: "ordgrp_paid",
          customer_id: "cus_001",
          orders: [
            {
              id: "order_paid",
              status: "completed",
              created_at: "2026-05-31T00:00:00.000Z",
              payment_collections: [
                { status: "captured", amount: 19900, captured_amount: 19900 },
              ],
              items: [{ product_id: "prod_role_researcher" }],
            },
            {
              id: "order_unpaid",
              status: "pending",
              items: [{ product_id: "prod_role_researcher" }],
            },
          ],
        },
      ],
      orders: [],
    });

    expect(installed).toHaveLength(1);
    expect(installed[0]).toMatchObject({
      entitlementId: "ordgrp_paid",
      entitlementSource: "order_group",
      orderId: "order_paid",
      authorizedAt: "2026-05-31T00:00:00.000Z",
      role: {
        id: "prod_role_researcher",
        title: "资料研究岗位",
      },
    });
  });
});
