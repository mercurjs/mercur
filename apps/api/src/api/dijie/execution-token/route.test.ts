import crypto from "node:crypto";
import { afterEach, describe, expect, it } from "bun:test";
import { verifyDijieExecutionToken } from "../../../lib/dijie/execution-token";
import { POST } from "./route";

const keyPair = crypto.generateKeyPairSync("ed25519");
const privateKeyPem = keyPair.privateKey.export({ format: "pem", type: "pkcs8" }).toString();
const publicKeyPem = keyPair.publicKey.export({ format: "pem", type: "spki" }).toString();
const pricing = {
  kind: "one_time_authorization",
  authorizationFeeCents: 29900,
  currency: "CNY",
  platformFeeBps: 0,
  developerReceivableCents: 29900,
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

function request(body: Record<string, unknown>, actorId = "cus_123") {
  return {
    body,
    auth_context: {
      actor_id: actorId,
    },
  };
}

function validBody() {
  return {
    roleListingId: "role_developer_agent",
    entitlementId: "ent_123",
    deviceId: "device_123",
    workspaceRef: "workspace_123",
    localGatewayId: "gateway_123",
  };
}

describe("POST /dijie/execution-token", () => {
  afterEach(() => {
    delete process.env.DIJIE_EXECUTION_TOKEN_ISSUER_ENABLED;
    delete process.env.DIJIE_EXECUTION_TOKEN_PRIVATE_KEY_PEM;
    delete process.env.DIJIE_ENTITLEMENT_VERIFY_URL;
    delete process.env.DIJIE_EXECUTION_TOKEN_TTL_SECONDS;
  });

  it("fails closed when the entitlement verifier is not configured", async () => {
    process.env.DIJIE_EXECUTION_TOKEN_ISSUER_ENABLED = "true";
    process.env.DIJIE_EXECUTION_TOKEN_PRIVATE_KEY_PEM = privateKeyPem;

    const res = response();
    await POST(request(validBody()) as never, res as never);

    expect(res.statusCode).toBe(503);
    expect(res.body).toMatchObject({
      ok: false,
      error: "DIJIE_ENTITLEMENT_VERIFY_URL is required before minting execution tokens.",
    });
  });

  it("mints a signed grant only after entitlement verifier approval", async () => {
    process.env.DIJIE_EXECUTION_TOKEN_ISSUER_ENABLED = "true";
    process.env.DIJIE_EXECUTION_TOKEN_PRIVATE_KEY_PEM = privateKeyPem;
    process.env.DIJIE_ENTITLEMENT_VERIFY_URL = "https://dijie.test/verify-entitlement";
    process.env.DIJIE_EXECUTION_TOKEN_TTL_SECONDS = "120";

    const originalFetch = globalThis.fetch;
    globalThis.fetch = async () =>
      new Response(
        JSON.stringify({
          ok: true,
          packageId: "pkg_developer_agent",
          packageVersion: "1.0.0",
          developerRef: "dev_001",
          listingOwnerRef: "seller_001",
          billingBeneficiaryRef: "dev_001",
          pricing,
          roleTokenPricing,
          scopes: ["role.execute", "audit.write"],
        }),
        { status: 200 },
      );

    try {
      const res = response();
      await POST(request(validBody()) as never, res as never);

      expect(res.statusCode).toBe(200);
      expect(res.body).toMatchObject({
        ok: true,
        grant: {
          roleListingId: "role_developer_agent",
          packageId: "pkg_developer_agent",
          packageVersion: "1.0.0",
          developerRef: "dev_001",
          listingOwnerRef: "seller_001",
          billingBeneficiaryRef: "dev_001",
          entitlementId: "ent_123",
          deviceId: "device_123",
          workspaceRef: "workspace_123",
          localGatewayId: "gateway_123",
          pricing,
          roleTokenPricing,
          scopes: ["role.execute", "audit.write"],
        },
      });

      const grant = (res.body as { grant: { token: string } }).grant;
      const verified = verifyDijieExecutionToken(grant.token, publicKeyPem);
      expect(verified.ok).toBe(true);
      if (verified.ok) {
        expect(verified.claims.packageId).toBe("pkg_developer_agent");
        expect(verified.claims.developerRef).toBe("dev_001");
        expect(verified.claims.roleTokenPricing).toEqual(roleTokenPricing);
      }
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it("defaults execution-token scopes to local execution and audit upload", async () => {
    process.env.DIJIE_EXECUTION_TOKEN_ISSUER_ENABLED = "true";
    process.env.DIJIE_EXECUTION_TOKEN_PRIVATE_KEY_PEM = privateKeyPem;
    process.env.DIJIE_ENTITLEMENT_VERIFY_URL = "https://dijie.test/verify-entitlement";

    const originalFetch = globalThis.fetch;
    globalThis.fetch = async () =>
      new Response(
        JSON.stringify({
          ok: true,
          packageId: "pkg_developer_agent",
          packageVersion: "1.0.0",
          developerRef: "dev_001",
          listingOwnerRef: "seller_001",
          billingBeneficiaryRef: "dev_001",
          pricing,
          roleTokenPricing,
        }),
        { status: 200 },
      );

    try {
      const res = response();
      await POST(request(validBody()) as never, res as never);

      expect(res.statusCode).toBe(200);
      expect(res.body).toMatchObject({
        ok: true,
        grant: {
          scopes: ["role.execute", "audit.write"],
        },
      });

      const grant = (res.body as { grant: { token: string } }).grant;
      const verified = verifyDijieExecutionToken(grant.token, publicKeyPem);
      expect(verified.ok).toBe(true);
      if (verified.ok) {
        expect(verified.claims.scopes).toEqual(["role.execute", "audit.write"]);
      }
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it("fails closed when entitlement verifier omits role token pricing", async () => {
    process.env.DIJIE_EXECUTION_TOKEN_ISSUER_ENABLED = "true";
    process.env.DIJIE_EXECUTION_TOKEN_PRIVATE_KEY_PEM = privateKeyPem;
    process.env.DIJIE_ENTITLEMENT_VERIFY_URL = "https://dijie.test/verify-entitlement";

    const originalFetch = globalThis.fetch;
    globalThis.fetch = async () =>
      new Response(
        JSON.stringify({
          ok: true,
          packageId: "pkg_developer_agent",
          packageVersion: "1.0.0",
          developerRef: "dev_001",
          listingOwnerRef: "seller_001",
          billingBeneficiaryRef: "dev_001",
          pricing,
        }),
        { status: 200 },
      );

    try {
      const res = response();
      await POST(request(validBody()) as never, res as never);

      expect(res.statusCode).toBe(502);
      expect(res.body).toMatchObject({
        ok: false,
      });
      expect((res.body as { error: string }).error).toContain("roleTokenPricing");
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
