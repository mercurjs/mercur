import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { authenticateUserWorkflow } from "../../workflows/authenticate-callback";

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const data: any = {
    url: req.url,
    headers: req.headers,
    query: req.query,
    body: req.body,
    protocol: req.protocol,
  };
  const { result } = await authenticateUserWorkflow(req.scope).run({
    input: data,
  });

  res.send(result);
}
