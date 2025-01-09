import { AuthenticatedMedusaRequest, MedusaResponse } from '@medusajs/framework'
import { ContainerRegistrationKeys } from '@medusajs/framework/utils'

import sellerOrder from '../../../links/seller-order'
import { createOrderReturnRequestWorkflow } from '../../../workflows/order-return-request/workflows'
import { StoreCreateReturnRequestType } from './validators'

export async function GET(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
): Promise<void> {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data: orderReturnRequests, metadata } = await query.graph({
    entity: 'order_return_request',
    fields: req.remoteQueryConfig.fields,
    filters: {
      ...req.filterableFields,
      customer_id: req.auth_context.actor_id
    },
    pagination: req.remoteQueryConfig.pagination
  })

  res.json({
    orderReturnRequests,
    count: metadata!.count,
    offset: metadata!.skip,
    limit: metadata!.take
  })
}

export async function POST(
  req: AuthenticatedMedusaRequest<StoreCreateReturnRequestType>,
  res: MedusaResponse
): Promise<void> {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const {
    data: [resource]
  } = await query.graph({
    entity: sellerOrder.entryPoint,
    fields: ['seller_id'],
    filters: {
      order_id: req.validatedBody.order_id
    }
  })

  const orderReturnRequest = await createOrderReturnRequestWorkflow.run({
    input: {
      data: { ...req.validatedBody, customer_id: req.auth_context.actor_id },
      seller_id: resource.seller_id
    }
  })

  res.json({ orderReturnRequest })
}
