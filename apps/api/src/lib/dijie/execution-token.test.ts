import crypto from "node:crypto";
import { describe, expect, it } from "bun:test";
import {
  createDijieExecutionToken,
  normalizeOneTimeAuthorizationPricing,
  normalizeRoleTokenPricing,
  verifyDijieExecutionToken,
} from "./execution-token";

const keyPair = crypto.generateKeyPairSync("ed25519");
const privateKeyPem = keyPair.privateKey.export({ format: "pem", type: "pkcs8" }).toString();
const publicKeyPem = keyPair.publicKey.export({ format: "pem", type: "spki" }).toString();
const pricing = {
  kind: "one_time_authorization" as const,
  authorizationFeeCents: 19900,
  currency: "CNY",
  platformFeeBps: 0,
  developerReceivableCents: 19900,
};
const roleTokenPricing = {
  inputTokenCentsPerMillion: 120,
  outputTokenCentsPerMillion: 360,
  currency: "CNY",
  developerReceivableBps: 10000 as const,
  platformFeeBps: 0 as const,
};

const input = {
  executionId: "exec_123",
  actorId: "cus_123",
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
  scopes: ["role.execute"],
  pricing,
  roleTokenPricing,
  nowMs: 1_800_000_000_000,
  ttlSeconds: 300,
};

describe("Dijie execution tokens", () => {
  it("normalizes one-time authorization pricing", () => {
    expect(normalizeOneTimeAuthorizationPricing(pricing)).toEqual(pricing);
  });

  it("rejects runtime-duration pricing", () => {
    expect(
      normalizeOneTimeAuthorizationPricing({
        kind: "runtime_duration",
        centsPerMinute: 10,
        currency: "CNY",
      }),
    ).toBeUndefined();
  });

  it("rejects marketplace platform cuts", () => {
    expect(
      normalizeOneTimeAuthorizationPricing({
        kind: "one_time_authorization",
        authorizationFeeCents: 19900,
        currency: "CNY",
        platformFeeBps: 1500,
        developerReceivableCents: 16915,
      }),
    ).toBeUndefined();
  });

  it("rejects non-CNY one-time authorization pricing", () => {
    expect(
      normalizeOneTimeAuthorizationPricing({
        ...pricing,
        currency: "USD",
      }),
    ).toBeUndefined();
  });

  it("normalizes developer role token pricing", () => {
    expect(normalizeRoleTokenPricing(roleTokenPricing)).toEqual(roleTokenPricing);
  });

  it("rejects role token pricing with platform revenue", () => {
    expect(
      normalizeRoleTokenPricing({
        ...roleTokenPricing,
        platformFeeBps: 500,
      }),
    ).toBeUndefined();
  });

  it("rejects non-CNY role token pricing", () => {
    expect(
      normalizeRoleTokenPricing({
        ...roleTokenPricing,
        currency: "USD",
      }),
    ).toBeUndefined();
  });

  it("refuses missing private signing keys", () => {
    const result = createDijieExecutionToken(input, undefined);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain("PRIVATE_KEY_PEM");
    }
  });

  it("refuses missing immutable business snapshot claims before signing", () => {
    const result = createDijieExecutionToken(
      {
        ...input,
        packageVersion: "",
        billingBeneficiaryRef: "",
      },
      privateKeyPem,
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain("packageVersion");
      expect(result.error).toContain("billingBeneficiaryRef");
    }
  });

  it("refuses missing role token pricing before signing", () => {
    const result = createDijieExecutionToken(
      {
        ...input,
        roleTokenPricing: undefined as never,
      },
      privateKeyPem,
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain("roleTokenPricing");
    }
  });

  it("creates and verifies a short-lived execution token", () => {
    const signed = createDijieExecutionToken(input, privateKeyPem);

    expect(signed.ok).toBe(true);
    if (!signed.ok) {
      throw new Error(signed.error);
    }

    const verified = verifyDijieExecutionToken(signed.token, publicKeyPem, input.nowMs + 1_000);
    expect(verified.ok).toBe(true);
    if (!verified.ok) {
      throw new Error(verified.error);
    }
    expect(verified.claims.actorId).toBe(input.actorId);
    expect(verified.claims.packageVersion).toBe("1.0.0");
    expect(verified.claims.billingBeneficiaryRef).toBe("dev_001");
    expect(verified.claims.pricing.kind).toBe("one_time_authorization");
    expect(verified.claims.roleTokenPricing).toEqual(roleTokenPricing);
  });

  it("accepts escaped PEM newlines from environment variables", () => {
    const signed = createDijieExecutionToken(input, privateKeyPem.replace(/\n/g, "\\n"));

    expect(signed.ok).toBe(true);
    if (!signed.ok) {
      throw new Error(signed.error);
    }
    expect(
      verifyDijieExecutionToken(signed.token, publicKeyPem.replace(/\n/g, "\\n"), input.nowMs + 1_000)
        .ok,
    ).toBe(true);
  });

  it("rejects a tampered token", () => {
    const signed = createDijieExecutionToken(input, privateKeyPem);
    if (!signed.ok) {
      throw new Error(signed.error);
    }

    const tampered = `${signed.token.slice(0, -2)}xx`;
    const verified = verifyDijieExecutionToken(tampered, publicKeyPem, input.nowMs + 1_000);

    expect(verified.ok).toBe(false);
    if (!verified.ok) {
      expect(verified.error).toContain("signature");
    }
  });

  it("rejects expired tokens", () => {
    const signed = createDijieExecutionToken(input, privateKeyPem);
    if (!signed.ok) {
      throw new Error(signed.error);
    }

    const verified = verifyDijieExecutionToken(signed.token, publicKeyPem, input.nowMs + 301_000);

    expect(verified.ok).toBe(false);
    if (!verified.ok) {
      expect(verified.error).toContain("expired");
    }
  });
});
