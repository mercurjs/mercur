import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework";
import { deleteCustomersWorkflow } from "@medusajs/medusa/core-flows";

export const DELETE = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const customerId = req.auth_context.actor_id;
  await deleteCustomersWorkflow.run({
    container: req.scope,
    input: {
      ids: [customerId],
    },
  });

  res.status(200).json({ id: customerId, object: "customer", deleted: true });
};
