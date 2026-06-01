import { describe, expect, it } from "bun:test";
import { GET } from "./route";

const roleTokenPricing = {
  inputTokenCentsPerMillion: 120,
  outputTokenCentsPerMillion: 360,
  currency: "CNY",
  developerReceivableBps: 10000,
  platformFeeBps: 0,
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

function request(actorId?: string) {
  return {
    auth_context: actorId ? { actor_id: actorId } : undefined,
    scope: {
      resolve() {
        return {
          graph: async ({ entity }: { entity: string }) => {
            if (entity === "product") {
              return {
                data: [
                  {
                    id: "prod_role_developer",
                    title: "开发岗位",
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
                        capabilities: ["代码生成"],
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
                  },
                ],
              };
            }
            if (entity === "order_group") {
              return {
                data: [
                  {
                    id: "ordgrp_001",
                    customer_id: actorId,
                    orders: [
                      {
                        id: "order_001",
                        status: "completed",
                        payment_collections: [
                          { status: "captured", amount: 29900, captured_amount: 29900 },
                        ],
                        items: [{ product_id: "prod_role_developer" }],
                      },
                    ],
                  },
                ],
              };
            }
            return { data: [] };
          },
        };
      },
    },
  };
}

describe("GET /dijie/my-roles", () => {
  it("requires an authenticated Dijie customer actor", async () => {
    const res = response();
    await GET(request() as never, res as never);

    expect(res.statusCode).toBe(401);
    expect(res.body).toMatchObject({ ok: false });
  });

  it("returns roles installed through paid marketplace orders", async () => {
    const res = response();
    await GET(request("cus_001") as never, res as never);

    expect(res.statusCode).toBe(200);
    expect(res.body).toMatchObject({
      ok: true,
      roles: [
        {
          entitlementId: "ordgrp_001",
          entitlementSource: "order_group",
          orderId: "order_001",
          role: {
            id: "prod_role_developer",
            title: "开发岗位",
            packageId: "pkg_developer",
            packageVersion: "1.0.0",
          },
        },
      ],
    });
  });
});
