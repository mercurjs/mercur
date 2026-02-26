import { cancelBeginOrderEditWorkflow } from '@medusajs/core-flows';
import {
  AuthenticatedMedusaRequest,
  MedusaResponse
} from '@medusajs/framework/http';

export const DELETE = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  await cancelBeginOrderEditWorkflow(req.scope).run({
    input: {
      order_id: req.params.id
    }
  });

  res.status(200).json({
    id: req.params.id,
    object: 'order-edit',
    deleted: true
  });
};
