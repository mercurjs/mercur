import { beginOrderEditOrderWorkflow } from '@medusajs/core-flows';
import {
  AuthenticatedMedusaRequest,
  MedusaResponse
} from '@medusajs/framework/http';
import { StorePostOrderEditsReqSchemaType } from './validators';

export const POST = async (
  req: AuthenticatedMedusaRequest<StorePostOrderEditsReqSchemaType>,
  res: MedusaResponse
) => {
  const { result } = await beginOrderEditOrderWorkflow(req.scope).run({
    input: req.validatedBody
  });

  res.json({
    order_change: result
  });
};
