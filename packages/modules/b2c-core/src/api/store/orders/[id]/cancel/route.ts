import {
  AuthenticatedMedusaRequest,
  MedusaResponse
} from '@medusajs/framework';
import {
  ContainerRegistrationKeys,
  remoteQueryObjectFromString
} from '@medusajs/framework/utils';
import { cancelOrderWorkflow } from '@medusajs/medusa/core-flows';

export const POST = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const remoteQuery = req.scope.resolve(ContainerRegistrationKeys.REMOTE_QUERY);

  await cancelOrderWorkflow(req.scope).run({
    input: {
      order_id: req.params.id,
      canceled_by: req.auth_context.actor_id
    }
  });

  const queryObject = remoteQueryObjectFromString({
    entryPoint: 'order',
    variables: { id: req.params.id },
    fields: req.queryConfig.fields
  });

  const [order] = await remoteQuery(queryObject);

  res.status(200).json({ order });
};
