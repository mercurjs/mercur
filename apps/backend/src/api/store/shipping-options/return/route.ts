import { AuthenticatedMedusaRequest, MedusaResponse } from '@medusajs/framework'

import { listSellerReturnShippingOptionsForOrderWorkflow } from '../../../../workflows/cart/workflows'
import { StoreGetReturnShippingOptionsParamsType } from '../validators'

export const GET = async (
  req: AuthenticatedMedusaRequest<StoreGetReturnShippingOptionsParamsType>,
  res: MedusaResponse
) => {
  const { order_id } = req.validatedQuery

  const { result: shippingOptions } =
    await listSellerReturnShippingOptionsForOrderWorkflow.run({
      container: req.scope,
      input: {
        order_id
      }
    })

  res.json({
    shipping_options: shippingOptions
  })
}
