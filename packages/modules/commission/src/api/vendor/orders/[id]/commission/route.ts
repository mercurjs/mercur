import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework";
import { listOrderCommissionLinesWorkflow } from "../../../../../workflows";

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const { id } = req.params;

  const { result: commission } = await listOrderCommissionLinesWorkflow(
    req.scope
  ).run({
    input: {
      order_id: id,
    },
  });

  res.json({ commission });
};
