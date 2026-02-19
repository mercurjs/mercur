import {
  AuthenticatedMedusaRequest,
  MedusaResponse
} from '@medusajs/framework';
import { HttpTypes } from '@medusajs/framework/types';
import { getOrderDetailWorkflow } from '@medusajs/core-flows';
import { acceptOrderTransferWithEventsWorkflow } from '../../../../../../workflows';

export const POST = async (
  req: AuthenticatedMedusaRequest<
    HttpTypes.StoreAcceptOrderTransfer,
    HttpTypes.SelectParams
  >,
  res: MedusaResponse<HttpTypes.StoreOrderResponse>
) => {
  await acceptOrderTransferWithEventsWorkflow(req.scope).run({
    input: {
      order_id: req.params.id,
      token: req.validatedBody.token
    }
  });

  const { result } = await getOrderDetailWorkflow(req.scope).run({
    input: {
      fields: req.queryConfig.fields,
      order_id: req.params.id
    }
  });

  res.status(200).json({ order: result as HttpTypes.StoreOrder });
};
