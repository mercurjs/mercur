import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { verifyDijieEntitlement } from "../../../../lib/dijie/entitlement-verifier";

type UnknownRecord = Record<string, unknown>;

const REQUIRED_FIELDS = [
  "actorId",
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

function bearerFromRequest(req: MedusaRequest): string | undefined {
  const authorization = req.headers.authorization;
  if (Array.isArray(authorization)) {
    return undefined;
  }
  const match = authorization?.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim();
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const internalBearer = process.env.DIJIE_INTERNAL_BRIDGE_BEARER?.trim();
  if (!internalBearer) {
    return res.status(503).json({
      ok: false,
      error: "DIJIE_INTERNAL_BRIDGE_BEARER is required for entitlement verification.",
    });
  }

  if (bearerFromRequest(req) !== internalBearer) {
    return res.status(401).json({
      ok: false,
      error: "Dijie entitlement verifier requires an internal bridge bearer.",
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

  const query = req.scope.resolve("query");
  const result = await verifyDijieEntitlement(
    {
      actorId: stringField(body, "actorId")!,
      roleListingId: stringField(body, "roleListingId")!,
      entitlementId: stringField(body, "entitlementId")!,
      deviceId: stringField(body, "deviceId")!,
      workspaceRef: stringField(body, "workspaceRef")!,
      localGatewayId: stringField(body, "localGatewayId")!,
    },
    (queryInput) => query.graph(queryInput),
  );

  return res.status(result.ok ? 200 : result.status).json(result);
}
