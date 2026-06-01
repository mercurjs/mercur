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

function request() {
  return {
    scope: {
      resolve() {
        return {
          graph: async () => ({
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
              {
                id: "prod_regular",
                title: "普通商品",
                status: "published",
                metadata: {},
              },
            ],
          }),
        };
      },
    },
  };
}

describe("GET /dijie/roles", () => {
  it("returns public Dijie role listings from marketplace products", async () => {
    const res = response();
    await GET(request() as never, res as never);

    expect(res.statusCode).toBe(200);
    expect(res.body).toMatchObject({
      ok: true,
      roles: [
        {
          id: "prod_role_developer",
          title: "开发岗位",
          listingStatus: "published",
          reviewState: "approved",
          packageId: "pkg_developer",
          packageVersion: "1.0.0",
          protocolVersion: "2026-05",
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
      ],
    });
  });
});
