import { requestOrderEditRequestWorkflow } from '@medusajs/core-flows';

import {
  AuthenticatedMedusaRequest,
  MedusaResponse
} from '@medusajs/framework/http';

export const POST = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const { result } = await requestOrderEditRequestWorkflow(req.scope).run({
    input: {
      order_id: req.params.id,
      requested_by: req.auth_context.actor_id
    }
  });

  res.json({
    order_preview: result
  });
};
