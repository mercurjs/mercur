import { AuthenticatedMedusaRequest, MedusaResponse } from '@medusajs/framework'

import { listSellerReturnShippingOptionsForOrderWorkflow } from '../../../../workflows/cart/workflows'
import { StoreGetReturnShippingOptionsParamsType } from '../validators'

/**
 * @oas [get] /store/shipping-options/return
 * operationId: "GetReturnShippingOptions"
 * summary: "Get Return Shipping Options"
 * description: "Retrieves a list of return shipping options for a specific order"
 * tags:
 *   - Store Shipping Options
 * parameters:
 *   - name: order_id
 *     in: query
 *     required: true
 *     schema:
 *       type: string
 *     description: The ID of the order to get return shipping options for
 * responses:
 *   200:
 *     description: Successfully retrieved return shipping options
 *     content:
 *       application/json:
 *         schema:
 *           type: object
 *           properties:
 *             shipping_options:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     description: The ID of the shipping option
 *                   name:
 *                     type: string
 *                     description: The name of the shipping option
 *                   price_type:
 *                     type: string
 *                     description: The type of price calculation
 *                     enum: [flat_rate, calculated]
 *                   amount:
 *                     type: number
 *                     description: The amount to charge for the shipping option
 *                   data:
 *                     type: object
 *                     description: Additional data about the shipping option
 *                   requirements:
 *                     type: object
 *                     description: Requirements for the shipping option
 */
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
