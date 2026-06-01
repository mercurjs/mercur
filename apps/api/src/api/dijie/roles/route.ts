import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { listDijieRoleListings } from "../../../lib/dijie/role-listings";

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const query = req.scope.resolve("query");

  try {
    const roles = await listDijieRoleListings((queryInput) => query.graph(queryInput));
    return res.status(200).json({
      ok: true,
      roles,
    });
  } catch {
    return res.status(502).json({
      ok: false,
      error: "迭界AI岗位商场暂时无法读取岗位商品。",
    });
  }
}
