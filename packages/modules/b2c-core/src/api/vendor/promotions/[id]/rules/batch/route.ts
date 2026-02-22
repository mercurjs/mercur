import {
  AuthenticatedMedusaRequest,
  MedusaResponse
} from '@medusajs/framework/http'
import { ContainerRegistrationKeys, RuleType } from '@medusajs/framework/utils'

import { fetchSellerByAuthActorId } from '../../../../../../shared/infra/http/utils'
import { batchVendorPromotionRulesWorkflow } from '../../../../../../workflows/promotions/workflows'
import { VendorBatchPromotionRulesType } from '../../../validators'

/**
 * @oas [post] /vendor/promotions/{id}/rules/batch
 * operationId: "VendorBatchRules"
 * summary: "Batch rules"
 * description: "Performs batch create/delete operation on rules"
 * x-authenticated: true
 * parameters:
 *   - in: path
 *     name: id
 *     required: true
 *     description: The ID of the promotion.
 *     schema:
 *       type: string
 * requestBody:
 *   content:
 *     application/json:
 *       schema:
 *         $ref: "#/components/schemas/VendorBatchPromotionRule"
 * responses:
 *   "201":
 *     description: Created
 *     content:
 *       application/json:
 *         schema:
 *           type: object
 *           properties:
 *             promotion:
 *               $ref: "#/components/schemas/VendorPromotion"
 * tags:
 *   - Vendor Promotions
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 */
export const POST = async (
  req: AuthenticatedMedusaRequest<VendorBatchPromotionRulesType>,
  res: MedusaResponse
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const id = req.params.id

  const seller = await fetchSellerByAuthActorId(
    req.auth_context.actor_id,
    req.scope
  )

  await batchVendorPromotionRulesWorkflow(req.scope).run({
    input: {
      data: {
        id,
        rule_type: RuleType.RULES,
        create: req.validatedBody.create,
        delete: req.validatedBody.delete
      },
      seller_id: seller.id
    }
  })

  const {
    data: [promotion]
  } = await query.graph({
    entity: 'promotion',
    fields: req.queryConfig.fields,
    filters: {
      id: req.params.id
    }
  })

  res.json({ promotion })
}
