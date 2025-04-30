import { batchInventoryItemLevelsWorkflow } from '@medusajs/core-flows'
import {
  AuthenticatedMedusaRequest,
  MedusaResponse
} from '@medusajs/framework/http'

import { fetchSellerByAuthActorId } from '../../../../../../shared/infra/http/utils'
import { validateOwnership } from '../../../utils'
import { VendorBatchInventoryItemLocationsLevelType } from '../../../validators'

/**
 * @oas [post] /vendor/inventory-items/{id}/location-levels/batch
 * operationId: "VendorBatchInventoryItemLocationsLevels"
 * summary: "Update inventory item levels"
 * description: "Batch updates InventoryItem levels"
 * x-authenticated: true
 * parameters:
 *   - in: path
 *     name: id
 *     required: true
 *     description: The ID of the InventoryItem.
 *     schema:
 *       type: string
 * requestBody:
 *   content:
 *     application/json:
 *       schema:
 *         $ref: "#/components/schemas/VendorBatchInventoryItemLocationsLevel"
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
  req: AuthenticatedMedusaRequest<VendorBatchInventoryItemLocationsLevelType>,
  res: MedusaResponse
) => {
  const { id } = req.params

  const batchInput = {
    input: {
      delete: req.validatedBody.delete ?? [],
      create:
        req.validatedBody.create?.map((c) => ({
          ...c,
          inventory_item_id: id
        })) ?? [],
      update:
        req.validatedBody.update?.map((u) => ({
          ...u,
          inventory_item_id: id
        })) ?? [],
      force: req.validatedBody.force ?? false
    }
  }

  const seller = await fetchSellerByAuthActorId(
    req.auth_context.actor_id,
    req.scope
  )
  await validateOwnership(req.scope, seller.id, batchInput.input)

  const output = await batchInventoryItemLevelsWorkflow.run({
    container: req.scope,
    ...batchInput
  })

  res.status(200).json({
    created: output.result.created,
    updated: output.result.updated,
    deleted: output.result.deleted
  })
}
