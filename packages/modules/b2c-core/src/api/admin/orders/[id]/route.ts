import { getOrderDetailWorkflow } from '@medusajs/core-flows';
import {
  AuthenticatedMedusaRequest,
  MedusaResponse
} from '@medusajs/framework/http';
import { AdminOrder, HttpTypes } from '@medusajs/framework/types';
import { AdminGetOrdersOrderParamsType } from '@medusajs/medusa/api/admin/claims/validators';
import {
  attachManagedByToOrderItems,
  attachStockLocationOwnerToFulfillments
} from '../../../../utils/stock-locations';
import { ContainerRegistrationKeys } from '@medusajs/framework/utils';
import { updateOrderWithEventsWorkflow } from '../../../../workflows';

export const GET = async (
  req: AuthenticatedMedusaRequest<AdminGetOrdersOrderParamsType>,
  res: MedusaResponse<HttpTypes.AdminOrderResponse>
) => {
  const workflow = getOrderDetailWorkflow(req.scope);
  const { result } = (await workflow.run({
    input: {
      fields: req.queryConfig.fields,
      order_id: req.params.id,
      version: req.validatedQuery.version as number
    }
  })) as { result: HttpTypes.AdminOrder };

  await attachStockLocationOwnerToFulfillments(
    req.scope,
    result.fulfillments ?? []
  );

  await attachManagedByToOrderItems(req.scope, result.items ?? []);

  res.status(200).json({ order: result });
};

export const POST = async (
  req: AuthenticatedMedusaRequest<
    HttpTypes.AdminUpdateOrder,
    HttpTypes.AdminGetOrderDetailsParams
  >,
  res: MedusaResponse<HttpTypes.AdminOrderResponse>
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);

  await updateOrderWithEventsWorkflow(req.scope).run({
    input: {
      ...req.validatedBody,
      user_id: req.auth_context.actor_id,
      id: req.params.id
    }
  });

  const result = await query.graph({
    entity: 'order',
    filters: { id: req.params.id },
    fields: req.queryConfig.fields
  });

  res.status(200).json({ order: result.data[0] as AdminOrder });
};
