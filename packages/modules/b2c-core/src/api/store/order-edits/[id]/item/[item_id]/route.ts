import { orderEditUpdateItemQuantityWorkflow } from '@medusajs/core-flows';
import {
  AuthenticatedMedusaRequest,
  MedusaResponse
} from '@medusajs/framework/http';

export const DELETE = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const { id, item_id } = req.params;

  const { result } = await orderEditUpdateItemQuantityWorkflow(req.scope).run({
    input: {
      order_id: id,
      items: [
        {
          quantity: 0,
          id: item_id
        }
      ]
    }
  });

  res.json({
    order_preview: result
  });
};
