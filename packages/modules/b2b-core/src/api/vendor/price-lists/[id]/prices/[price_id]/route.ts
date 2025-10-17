import { AuthenticatedMedusaRequest, MedusaResponse } from '@medusajs/framework'
import {
  ContainerRegistrationKeys,
  MedusaError
} from '@medusajs/framework/utils'
import { batchPriceListPricesWorkflow } from '@medusajs/medusa/core-flows'

/**
 * @oas [delete] /vendor/price-lists/{id}/prices/{price_id}
 * operationId: "VendorDeletePriceListPriceById"
 * summary: "Deletes price list price"
 * description: "Deletes price list price by id."
 * x-authenticated: true
 * parameters:
 * - in: path
 *   name: id
 *   required: true
 *   description: The ID of the price list.
 *   schema:
 *     type: string
 * - in: path
 *   name: price_id
 *   required: true
 *   description: The ID of the price.
 *   schema:
 *     type: string
 * responses:
 *   "200":
 *     description: OK
 *     content:
 *       application/json:
 *         schema:
 *           type: object
 *           properties:
 *             id:
 *               type: string
 *               description: The ID of the deleted Price
 *             object:
 *               type: string
 *               description: The type of the object that was deleted
 *             deleted:
 *               type: boolean
 *               description: Whether or not the items were deleted
 * tags:
 *   - Vendor Price Lists
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 */
export const DELETE = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const {
    data: [price]
  } = await query.graph({
    entity: 'price',
    fields: ['price_list_id'],
    filters: {
      id: req.params.price_id
    }
  })

  if (price.price_list_id !== req.params.id) {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, 'Invalid price_id!')
  }

  await batchPriceListPricesWorkflow.run({
    container: req.scope,
    input: {
      data: {
        delete: [req.params.price_id]
      }
    }
  })

  res.status(200).json({
    id: req.params.price_id,
    object: 'price',
    deleted: true
  })
}
