import { describe, expect, it } from "bun:test";
import {
  findDijieRoleMetadataPrivacyIssues,
  normalizeDijieRoleProductMetadataFromProduct,
} from "./role-product-metadata";

function productWithRole(overrides: Record<string, unknown> = {}) {
  return {
    id: "prod_role_researcher",
    title: "资料研究岗位",
    status: "published",
    seller: { id: "dev_001" },
    metadata: {
      dijieRole: {
        kind: "role_product",
        protocolVersion: "2026-05",
        packageId: "pkg_researcher",
        packageVersion: "1.0.0",
        developerRef: "dev_001",
        listingStatus: "published",
        reviewState: "approved",
        capabilities: ["资料收集", "简报生成"],
        manifestSummary: {
          entrypoint: "role_package/manifest.json",
          tools: ["browser.search"],
          sandbox: "workspace-write",
          secretsRequired: ["BROWSER_API_KEY"],
        },
        pricing: {
          kind: "one_time_authorization",
          authorizationFeeCents: 19900,
          currency: "CNY",
          platformFeeBps: 0,
          developerReceivableCents: 19900,
        },
        roleTokenPricing: {
          inputTokenCentsPerMillion: 120,
          outputTokenCentsPerMillion: 360,
          currency: "CNY",
          developerReceivableBps: 10000,
          platformFeeBps: 0,
        },
        ...overrides,
      },
    },
  };
}

describe("Dijie role product metadata", () => {
  it("normalizes a valid role product metadata payload", () => {
    expect(normalizeDijieRoleProductMetadataFromProduct(productWithRole())).toMatchObject({
      ok: true,
      value: {
        kind: "role_product",
        protocolVersion: "2026-05",
        roleListingId: "prod_role_researcher",
        packageId: "pkg_researcher",
        packageVersion: "1.0.0",
        developerRef: "dev_001",
        listingStatus: "published",
        reviewState: "approved",
        capabilities: ["资料收集", "简报生成"],
        pricing: {
          kind: "one_time_authorization",
          authorizationFeeCents: 19900,
          platformFeeBps: 0,
          developerReceivableCents: 19900,
        },
        roleTokenPricing: {
          inputTokenCentsPerMillion: 120,
          outputTokenCentsPerMillion: 360,
          developerReceivableBps: 10000,
          platformFeeBps: 0,
        },
      },
    });
  });

  it("rejects role products without developer token pricing", () => {
    expect(
      normalizeDijieRoleProductMetadataFromProduct(
        productWithRole({ roleTokenPricing: undefined }),
      ),
    ).toMatchObject({
      ok: false,
      issues: [
        "metadata.dijieRole.roleTokenPricing must define CNY input/output token cents per million with platformFeeBps=0 and developerReceivableBps=10000.",
      ],
    });
  });

  it("rejects role token pricing platform cuts", () => {
    expect(
      normalizeDijieRoleProductMetadataFromProduct(
        productWithRole({
          roleTokenPricing: {
            inputTokenCentsPerMillion: 120,
            outputTokenCentsPerMillion: 360,
            currency: "CNY",
            developerReceivableBps: 9500,
            platformFeeBps: 500,
          },
        }),
      ),
    ).toMatchObject({
      ok: false,
      issues: [
        "metadata.dijieRole.roleTokenPricing must define CNY input/output token cents per million with platformFeeBps=0 and developerReceivableBps=10000.",
      ],
    });
  });

  it("rejects role products without package identity fields", () => {
    expect(
      normalizeDijieRoleProductMetadataFromProduct(
        productWithRole({ packageId: undefined, packageVersion: undefined }),
      ),
    ).toMatchObject({
      ok: false,
      issues: [
        "metadata.dijieRole.packageId is required.",
        "metadata.dijieRole.packageVersion is required.",
      ],
    });
  });

  it("rejects marketplace platform cuts", () => {
    expect(
      normalizeDijieRoleProductMetadataFromProduct(
        productWithRole({
          pricing: {
            kind: "one_time_authorization",
            authorizationFeeCents: 19900,
            currency: "CNY",
            platformFeeBps: 1000,
            developerReceivableCents: 17910,
          },
        }),
      ),
    ).toMatchObject({
      ok: false,
      issues: ["metadata.dijieRole.pricing must be one_time_authorization in CNY with platformFeeBps=0."],
    });
  });

  it("requires explicit review state and listing status in role metadata", () => {
    expect(
      normalizeDijieRoleProductMetadataFromProduct(
        productWithRole({ listingStatus: undefined, reviewState: undefined }),
      ),
    ).toMatchObject({
      ok: false,
      issues: [
        "metadata.dijieRole.listingStatus is required.",
        "metadata.dijieRole.reviewState is required.",
      ],
    });
  });

  it("rejects non-CNY authorization and role token pricing", () => {
    expect(
      normalizeDijieRoleProductMetadataFromProduct(
        productWithRole({
          pricing: {
            kind: "one_time_authorization",
            authorizationFeeCents: 19900,
            currency: "USD",
            platformFeeBps: 0,
            developerReceivableCents: 19900,
          },
          roleTokenPricing: {
            inputTokenCentsPerMillion: 120,
            outputTokenCentsPerMillion: 360,
            currency: "USD",
            developerReceivableBps: 10000,
            platformFeeBps: 0,
          },
        }),
      ),
    ).toMatchObject({
      ok: false,
      issues: [
        "metadata.dijieRole.pricing must be one_time_authorization in CNY with platformFeeBps=0.",
        "metadata.dijieRole.roleTokenPricing must define CNY input/output token cents per million with platformFeeBps=0 and developerReceivableBps=10000.",
      ],
    });
  });

  it("rejects legacy product-level pricing outside metadata.dijieRole.pricing", () => {
    const product = productWithRole({ pricing: undefined });
    const result = normalizeDijieRoleProductMetadataFromProduct({
      ...product,
      metadata: {
        ...product.metadata,
        dijie_pricing: {
          kind: "one_time_authorization",
          authorizationFeeCents: 19900,
          currency: "CNY",
          platformFeeBps: 0,
          developerReceivableCents: 19900,
        },
      },
    });

    expect(result).toMatchObject({
      ok: false,
      issues: ["metadata.dijieRole.pricing must be one_time_authorization in CNY with platformFeeBps=0."],
    });
  });

  it("rejects local absolute entrypoints", () => {
    const result = normalizeDijieRoleProductMetadataFromProduct(
      productWithRole({
        manifestSummary: {
          entrypoint: "/Users/weizuo/private/role_package/manifest.json",
        },
      }),
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.issues).toContain(
        "metadata.dijieRole.manifestSummary.entrypoint must not be a local absolute path.",
      );
      expect(result.issues).toContain("metadata.dijieRole must not contain local absolute paths.");
    }
  });

  it("rejects secret or token field names in role metadata", () => {
    expect(
      normalizeDijieRoleProductMetadataFromProduct(
        productWithRole({
          providerAuth: "raw-secret",
          providerKey: "raw-provider-key",
          cloudBearer: "cloud-bearer",
          rawExecutionToken: "raw-token",
        }),
      ),
    ).toMatchObject({
      ok: false,
      issues: ["metadata.dijieRole must not contain secret, token, or provider auth field names."],
    });
  });

  it("rejects private execution and developer-mode context fields in role metadata", () => {
    expect(
      normalizeDijieRoleProductMetadataFromProduct(
        productWithRole({
          executionId: "exec_123",
          entitlementId: "order_group_123",
          deviceId: "device_123",
          workspaceRef: "workspace_123",
          localGatewayId: "gateway_123",
          roleBuildBrief: "Internal developer-mode prompt summary.",
          modeStage: "developer-role-builder",
          developerModePrompt: "Create a role from the user's private chat.",
          conversation: "private developer conversation",
          messages: ["user described private business context"],
          orderTotalCents: 19900,
          walletBalanceCents: 5000,
        }),
      ),
    ).toMatchObject({
      ok: false,
      issues: [
        "metadata.dijieRole must not contain execution, entitlement, device, workspace, order, wallet, mode stage, prompt, or chat context field names.",
      ],
    });
  });

  it("exposes privacy-only validation for product create and update guards", () => {
    expect(
      findDijieRoleMetadataPrivacyIssues({
        kind: "role_product",
        entitlement: "ent_123",
        execution: "exec_123",
        history: "private chat transcript",
        modeStage: "intake",
        prompt: "private developer-mode prompt",
        workspace: "workspace_123",
        workspaceRef: "/Users/alice/private/workspace",
      }),
    ).toEqual(
      expect.arrayContaining([
        "metadata.dijieRole must not contain local absolute paths.",
        "metadata.dijieRole must not contain execution, entitlement, device, workspace, order, wallet, mode stage, prompt, or chat context field names.",
      ]),
    );
  });

  it("rejects nested local absolute paths outside the manifest entrypoint", () => {
    expect(
      normalizeDijieRoleProductMetadataFromProduct(
        productWithRole({
          reviewMaterials: {
            sampleOutputPath: "file:///Users/weizuo/private/output.json",
          },
        }),
      ),
    ).toMatchObject({
      ok: false,
      issues: ["metadata.dijieRole must not contain local absolute paths."],
    });
  });

  it("rejects private execution ids or provider secret values hidden in public-looking fields", () => {
    expect(
      normalizeDijieRoleProductMetadataFromProduct(
        productWithRole({
          description:
            "Public listing text accidentally includes exec_123 and sk-testsecretvalue1234567890.",
        }),
      ),
    ).toMatchObject({
      ok: false,
      issues: ["metadata.dijieRole must not contain private execution ids, raw tokens, or provider secrets."],
    });
  });

  it("rejects product-level metadata outside the dijieRole namespace", () => {
    const product = productWithRole();
    const result = normalizeDijieRoleProductMetadataFromProduct({
      ...product,
      metadata: {
        dijie: product.metadata.dijieRole,
      },
    });

    expect(result).toMatchObject({
      ok: false,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.issues).toContain("metadata.dijieRole.kind must be role_product.");
    }
  });

  it("rejects role products that request privileged scopes", () => {
    expect(
      normalizeDijieRoleProductMetadataFromProduct(
        productWithRole({
          scopes: ["role.execute", "audit.write", "operator.write"],
        }),
      ),
    ).toMatchObject({
      ok: false,
      issues: ["metadata.dijieRole.scopes may only include role.execute and audit.write."],
    });
  });
});
