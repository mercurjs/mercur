import { AuthenticatedMedusaRequest, MedusaResponse } from '@medusajs/framework'
import { updateInventoryLevelsWorkflow } from '@medusajs/medusa/core-flows'

import { VendorUpdateInventoryLevel } from '../../../../validators'

/**
 * @oas [post] /vendor/products/{id}/variants/{variantId}/stock
 * operationId: "VendorUpdateInventoryLevel"
 * summary: "Update inventory level"
 * description: "Updates inventory level of InventoryItem that belongs to specified Variant/Product"
 * x-authenticated: true
 * parameters:
 *   - in: path
 *     name: id
 *     required: true
 *     description: The ID of the Product.
 *     schema:
 *       type: string
 *   - in: path
 *     name: variantId
 *     required: true
 *     description: The ID of the Product Variant.
 *     schema:
 *       type: string
 * requestBody:
 *   content:
 *     application/json:
 *       schema:
 *         $ref: "#/components/schemas/VendorUpdateInventoryLevel"
 * responses:
 *   "202":
 *     description: Accepted
 * tags:
 *   - Product
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 */
export const POST = async (
  req: AuthenticatedMedusaRequest<VendorUpdateInventoryLevel>,
  res: MedusaResponse
) => {
  console.log(req.validatedBody)
  await updateInventoryLevelsWorkflow.run({
    input: {
      updates: [req.validatedBody]
    },
    container: req.scope
  })

  res.status(202).end()
}
