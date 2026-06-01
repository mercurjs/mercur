import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { listDijieInstalledRoles } from "../../../lib/dijie/role-listings";

type UnknownRecord = Record<string, unknown>;

function asRecord(value: unknown): UnknownRecord {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as UnknownRecord)
    : {};
}

function stringField(record: UnknownRecord, field: string): string | undefined {
  const value = record[field];
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function actorIdFromRequest(req: MedusaRequest): string | undefined {
  const authContext = (req as MedusaRequest & { auth_context?: UnknownRecord }).auth_context;
  return authContext ? stringField(authContext, "actor_id") : undefined;
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const actorId = actorIdFromRequest(req);
  if (!actorId) {
    return res.status(401).json({
      ok: false,
      error: "读取我的岗位需要先登录迭界AI账号。",
    });
  }

  const query = req.scope.resolve("query");
  try {
    const roles = await listDijieInstalledRoles({
      actorId,
      queryGraph: (queryInput) => query.graph(queryInput),
    });
    return res.status(200).json({
      ok: true,
      roles,
    });
  } catch {
    return res.status(502).json({
      ok: false,
      error: "迭界AI岗位商场暂时无法读取我的岗位。",
    });
  }
}
