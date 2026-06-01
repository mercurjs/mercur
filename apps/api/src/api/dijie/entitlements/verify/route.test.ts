import { afterEach, describe, expect, it } from "bun:test";
import { POST } from "./route";

const validBody = {
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

function request(options: {
  body?: Record<string, unknown>;
  authorization?: string;
  queryGraph?: (query: { entity: string }) => Promise<{ data: unknown[] }>;
}) {
  return {
    body: options.body ?? validBody,
    headers: {
      authorization: options.authorization,
    },
    scope: {
      resolve() {
        return {
          graph: options.queryGraph ?? (async ({ entity }) => {
            if (entity === "product") {
              return {
                data: [
                  {
                    id: validBody.roleListingId,
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
                    id: validBody.entitlementId,
                    customer_id: validBody.actorId,
                    orders: [
                      {
                        id: "order_123",
                        status: "completed",
                        payment_collections: [
                          { status: "captured", amount: 29900, captured_amount: 29900 },
                        ],
                        items: [{ product_id: validBody.roleListingId }],
                      },
                    ],
                  },
                ],
              };
            }
            return { data: [] };
          }),
        };
      },
    },
  };
}

describe("POST /dijie/entitlements/verify", () => {
  afterEach(() => {
    delete process.env.DIJIE_INTERNAL_BRIDGE_BEARER;
  });

  it("fails closed when the internal bearer is not configured", async () => {
    const res = response();
    await POST(request({ authorization: "Bearer bridge-secret" }) as never, res as never);

    expect(res.statusCode).toBe(503);
    expect(res.body).toMatchObject({ ok: false });
  });

  it("rejects callers without the internal bearer", async () => {
    process.env.DIJIE_INTERNAL_BRIDGE_BEARER = "bridge-secret";

    const res = response();
    await POST(request({ authorization: "Bearer wrong" }) as never, res as never);

    expect(res.statusCode).toBe(401);
    expect(res.body).toMatchObject({ ok: false });
  });

  it("approves paid one-time role entitlements", async () => {
    process.env.DIJIE_INTERNAL_BRIDGE_BEARER = "bridge-secret";

    const res = response();
    await POST(request({ authorization: "Bearer bridge-secret" }) as never, res as never);

    expect(res.statusCode).toBe(200);
    expect(res.body).toMatchObject({
      ok: true,
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
});
