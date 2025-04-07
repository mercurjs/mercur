import { createOrderShipmentWorkflow } from '@medusajs/core-flows'
import {
  AuthenticatedMedusaRequest,
  MedusaResponse
} from '@medusajs/framework/http'
import { ContainerRegistrationKeys } from '@medusajs/framework/utils'

import { VendorOrderCreateShipmentType } from '../../../../validators'

export const POST = async (
  req: AuthenticatedMedusaRequest<VendorOrderCreateShipmentType>,
  res: MedusaResponse
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  await createOrderShipmentWorkflow.run({
    container: req.scope,
    input: {
      ...req.validatedBody,
      order_id: req.params.id,
      fulfillment_id: req.params.fulfillment_id,
      labels: req.validatedBody.labels ?? []
    }
  })

  const {
    data: [order]
  } = await query.graph({
    entity: 'order',
    fields: req.queryConfig.fields,
    filters: {
      id: req.params.id
    }
  })

  res.json({ order })
}
