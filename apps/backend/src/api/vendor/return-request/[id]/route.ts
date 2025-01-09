import { AuthenticatedMedusaRequest, MedusaResponse } from '@medusajs/framework'
import {
  ContainerRegistrationKeys,
  MedusaError
} from '@medusajs/framework/utils'

import { updateOrderReturnRequestWorkflow } from '../../../../workflows/order-return-request/workflows'
import { VendorUpdateOrderReturnRequestType } from '../validators'

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const {
    data: [orderReturnRequest]
  } = await query.graph({
    entity: 'order_return_request',
    fields: req.remoteQueryConfig.fields,
    filters: {
      id: req.params.id
    }
  })

  res.json({ orderReturnRequest })
}

export const POST = async (
  req: AuthenticatedMedusaRequest<VendorUpdateOrderReturnRequestType>,
  res: MedusaResponse
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const {
    data: [request]
  } = await query.graph({
    entity: 'order_return_request',
    fields: req.remoteQueryConfig.fields,
    filters: {
      id: req.params.id,
      status: 'pending'
    }
  })

  if (!request) {
    throw new MedusaError(
      MedusaError.Types.INVALID_ARGUMENT,
      'Request is not in pending state!'
    )
  }

  const orderReturnRequest = await updateOrderReturnRequestWorkflow.run({
    input: {
      id: req.params.id,
      ...req.validatedBody,
      vendor_reviewer_id: req.auth_context.actor_id,
      vendor_review_date: new Date()
    },
    container: req.scope
  })

  res.json({ orderReturnRequest })
}
