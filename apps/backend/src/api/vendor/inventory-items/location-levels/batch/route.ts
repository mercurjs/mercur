import { batchInventoryItemLevelsWorkflow } from '@medusajs/core-flows'
import { AuthenticatedMedusaRequest, MedusaResponse } from '@medusajs/framework'

import { fetchSellerByAuthActorId } from '../../../../../shared/infra/http/utils'
import { validateOwnership } from '../../utils'
import { VendorBatchInventoryItemLevelsType } from '../../validators'

/**
 * @oas [post] /vendor/inventory-items/location-levels/batch
 * operationId: "VendorBatchInventoryItemLevels"
 * summary: "Update inventory item levels"
 * description: "Batch updates InventoryItem levels"
 * x-authenticated: true
 * requestBody:
 *   content:
 *     application/json:
 *       schema:
 *         $ref: "#/components/schemas/VendorBatchInventoryItemLevels"
 * responses:
 *   "200":
 *     description: Ok
 * tags:
 *   - Product
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 */
export const POST = async (
  req: AuthenticatedMedusaRequest<VendorBatchInventoryItemLevelsType>,
  res: MedusaResponse
) => {
  const seller = await fetchSellerByAuthActorId(
    req.auth_context.actor_id,
    req.scope
  )
  await validateOwnership(req.scope, seller.id, req.validatedBody)

  const output = await batchInventoryItemLevelsWorkflow.run({
    container: req.scope,
    input: req.validatedBody
  })

  res.json({
    created: output.result.created,
    updated: output.result.updated,
    deleted: output.result.deleted
  })
}
