import { confirmOrderEditRequestWorkflow } from '@medusajs/core-flows';
import {
  AuthenticatedMedusaRequest,
  MedusaResponse
} from '@medusajs/framework/http';

export const POST = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const { result } = await confirmOrderEditRequestWorkflow(req.scope).run({
    input: {
      order_id: req.params.id,
      confirmed_by: req.auth_context.actor_id
    }
  });

  res.json({
    order_preview: result
  });
};
