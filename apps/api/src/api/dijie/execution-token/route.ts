import { randomUUID } from "node:crypto";
import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import {
  createDijieExecutionToken,
  normalizeOneTimeAuthorizationPricing,
  normalizeRoleTokenPricing,
  type DijieExecutionTokenPricing,
  type DijieRoleTokenPricing,
} from "../../../lib/dijie/execution-token";

type UnknownRecord = Record<string, unknown>;
type RequiredField = (typeof REQUIRED_FIELDS)[number];

type EntitlementVerificationInput = Record<RequiredField, string> & {
  actorId: string;
};

type EntitlementVerificationResult =
  | {
      ok: true;
      packageId: string;
      packageVersion: string;
      developerRef: string;
      listingOwnerRef: string;
      billingBeneficiaryRef: string;
      pricing: DijieExecutionTokenPricing;
      roleTokenPricing: DijieRoleTokenPricing;
      scopes: string[];
    }
  | {
      ok: false;
      status: number;
      error: string;
    };

const REQUIRED_FIELDS = [
  "roleListingId",
  "entitlementId",
  "deviceId",
  "workspaceRef",
  "localGatewayId",
] as const;

function asRecord(value: unknown): UnknownRecord {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as UnknownRecord)
    : {};
}

function stringField(record: UnknownRecord, field: string): string | undefined {
  const value = record[field];
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function optionalStringArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) {
    return undefined;
  }

  const normalized = value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);

  return normalized.length > 0 ? normalized : undefined;
}

function parseTtlSeconds(value: string | undefined): number | undefined {
  if (!value) {
    return 300;
  }

  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 30 && parsed <= 900 ? parsed : undefined;
}

function actorIdFromRequest(req: MedusaRequest): string | undefined {
  const authContext = (req as MedusaRequest & { auth_context?: UnknownRecord }).auth_context;
  return authContext ? stringField(authContext, "actor_id") : undefined;
}

async function verifyEntitlement(
  input: EntitlementVerificationInput,
): Promise<EntitlementVerificationResult> {
  const verifierUrl = process.env.DIJIE_ENTITLEMENT_VERIFY_URL?.trim();
  if (!verifierUrl) {
    return {
      ok: false,
      status: 503,
      error: "DIJIE_ENTITLEMENT_VERIFY_URL is required before minting execution tokens.",
    };
  }

  const headers: Record<string, string> = {
    "content-type": "application/json",
  };
  const verifierBearer = process.env.DIJIE_ENTITLEMENT_VERIFY_BEARER?.trim();
  if (verifierBearer) {
    headers.authorization = `Bearer ${verifierBearer}`;
  }

  let response: Response;
  try {
    response = await fetch(verifierUrl, {
      method: "POST",
      headers,
      body: JSON.stringify(input),
    });
  } catch {
    return {
      ok: false,
      status: 502,
      error: "Dijie entitlement verifier is unavailable.",
    };
  }

  let payload: UnknownRecord = {};
  try {
    payload = asRecord(await response.json());
  } catch {
    payload = {};
  }

  if (!response.ok) {
    return {
      ok: false,
      status: response.status === 401 ? 401 : 403,
      error:
        stringField(payload, "error") ??
        stringField(payload, "reason") ??
        "Dijie entitlement verifier rejected the execution request.",
    };
  }

  if (payload.ok !== true) {
    return {
      ok: false,
      status: 403,
      error:
        stringField(payload, "error") ??
        stringField(payload, "reason") ??
        "Dijie entitlement verifier did not approve the execution request.",
    };
  }

  const pricing = normalizeOneTimeAuthorizationPricing(payload.pricing);
  const roleTokenPricing = normalizeRoleTokenPricing(payload.roleTokenPricing);
  const packageId = stringField(payload, "packageId");
  const packageVersion = stringField(payload, "packageVersion");
  const developerRef = stringField(payload, "developerRef");
  const listingOwnerRef = stringField(payload, "listingOwnerRef");
  const billingBeneficiaryRef = stringField(payload, "billingBeneficiaryRef");
  if (!pricing) {
    return {
      ok: false,
      status: 502,
      error:
        "Dijie entitlement verifier must return one_time_authorization pricing. Runtime-duration billing is not allowed.",
    };
  }
  if (!roleTokenPricing) {
    return {
      ok: false,
      status: 502,
      error:
        "Dijie entitlement verifier must return roleTokenPricing with input/output token cents per million, platformFeeBps=0, and developerReceivableBps=10000.",
    };
  }
  if (!packageId || !packageVersion || !developerRef || !listingOwnerRef || !billingBeneficiaryRef) {
    return {
      ok: false,
      status: 502,
      error:
        "Dijie entitlement verifier must return packageId, packageVersion, developerRef, listingOwnerRef, and billingBeneficiaryRef.",
    };
  }

  return {
    ok: true,
    packageId,
    packageVersion,
    developerRef,
    listingOwnerRef,
    billingBeneficiaryRef,
    pricing,
    roleTokenPricing,
    scopes: optionalStringArray(payload.scopes) ?? ["role.execute", "audit.write"],
  };
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const actorId = actorIdFromRequest(req);
  if (!actorId) {
    return res.status(401).json({
      ok: false,
      error: "Dijie execution token requests require an authenticated Mercur actor.",
    });
  }

  const body = asRecord(req.body);
  const missing = REQUIRED_FIELDS.filter((field) => !stringField(body, field));
  if (missing.length > 0) {
    return res.status(400).json({
      ok: false,
      error: `Missing required fields: ${missing.join(", ")}`,
    });
  }

  if (process.env.DIJIE_EXECUTION_TOKEN_ISSUER_ENABLED !== "true") {
    return res.status(503).json({
      ok: false,
      error: "Dijie execution token issuer is not enabled.",
    });
  }

  const ttlSeconds = parseTtlSeconds(process.env.DIJIE_EXECUTION_TOKEN_TTL_SECONDS);
  if (!ttlSeconds) {
    return res.status(503).json({
      ok: false,
      error: "DIJIE_EXECUTION_TOKEN_TTL_SECONDS must be between 30 and 900 seconds.",
    });
  }

  const executionRequest: EntitlementVerificationInput = {
    actorId,
    roleListingId: stringField(body, "roleListingId")!,
    entitlementId: stringField(body, "entitlementId")!,
    deviceId: stringField(body, "deviceId")!,
    workspaceRef: stringField(body, "workspaceRef")!,
    localGatewayId: stringField(body, "localGatewayId")!,
  };

  const entitlement = await verifyEntitlement(executionRequest);
  if (!entitlement.ok) {
    return res.status(entitlement.status).json({
      ok: false,
      error: entitlement.error,
    });
  }

  const signed = createDijieExecutionToken(
    {
      executionId: randomUUID(),
      actorId,
      roleListingId: executionRequest.roleListingId,
      packageId: entitlement.packageId,
      packageVersion: entitlement.packageVersion,
      developerRef: entitlement.developerRef,
      listingOwnerRef: entitlement.listingOwnerRef,
      billingBeneficiaryRef: entitlement.billingBeneficiaryRef,
      entitlementId: executionRequest.entitlementId,
      deviceId: executionRequest.deviceId,
      workspaceRef: executionRequest.workspaceRef,
      localGatewayId: executionRequest.localGatewayId,
      pricing: entitlement.pricing,
      roleTokenPricing: entitlement.roleTokenPricing,
      scopes: entitlement.scopes,
      ttlSeconds,
    },
    process.env.DIJIE_EXECUTION_TOKEN_PRIVATE_KEY_PEM,
  );
  if (!signed.ok) {
    return res.status(503).json({
      ok: false,
      error: signed.error,
    });
  }

  return res.status(200).json({
    ok: true,
    grant: {
      executionId: signed.claims.executionId,
      roleListingId: signed.claims.roleListingId,
      packageId: signed.claims.packageId,
      packageVersion: signed.claims.packageVersion,
      developerRef: signed.claims.developerRef,
      listingOwnerRef: signed.claims.listingOwnerRef,
      billingBeneficiaryRef: signed.claims.billingBeneficiaryRef,
      entitlementId: signed.claims.entitlementId,
      deviceId: signed.claims.deviceId,
      workspaceRef: signed.claims.workspaceRef,
      localGatewayId: signed.claims.localGatewayId,
      token: signed.token,
      issuedAt: new Date(signed.claims.iat * 1000).toISOString(),
      expiresAt: new Date(signed.claims.exp * 1000).toISOString(),
      pricing: signed.claims.pricing,
      roleTokenPricing: signed.claims.roleTokenPricing,
      scopes: signed.claims.scopes,
    },
  });
}
