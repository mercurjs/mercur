import { AuthenticatedMedusaRequest, MedusaResponse } from '@medusajs/framework'
import { ContainerRegistrationKeys } from '@medusajs/framework/utils'

import sellerPromotion from '../../../links/seller-promotion'
import { fetchSellerByAuthActorId } from '../../../shared/infra/http/utils'
import { createVendorPromotionWorkflow } from '../../../workflows/promotions/workflows'
import { VendorCreatePromotionType } from './validators'

/**
 * @oas [get] /vendor/promotions
 * operationId: "VendorListPromotions"
 * summary: "List Promotions"
 * description: "Retrieves a list of promotions for the authenticated vendor."
 * x-authenticated: true
 * parameters:
 *   - name: offset
 *     in: query
 *     schema:
 *       type: number
 *     required: false
 *     description: The number of items to skip before starting to collect the result set.
 *   - name: limit
 *     in: query
 *     schema:
 *       type: number
 *     required: false
 *     description: The number of items to return.
 *   - name: fields
 *     in: query
 *     schema:
 *       type: string
 *     required: false
 *     description: Comma-separated fields to include in the response.
 * responses:
 *   "200":
 *     description: OK
 *     content:
 *       application/json:
 *         schema:
 *           type: object
 *           properties:
 *             promotions:
 *               type: array
 *               items:
 *                 $ref: "#/components/schemas/VendorPromotion"
 *             count:
 *               type: integer
 *               description: The total number of items available
 *             offset:
 *               type: integer
 *               description: The number of items skipped before these items
 *             limit:
 *               type: integer
 *               description: The number of items per page
 * tags:
 *   - Vendor Promotions
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 */
export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data: promotions, metadata } = await query.graph({
    entity: sellerPromotion.entryPoint,
    fields: req.queryConfig.fields.map((field) => `promotion.${field}`),
    filters: {
      ...req.filterableFields,
      deleted_at: {
        $eq: null
      }
    },
    pagination: req.queryConfig.pagination
  })

  res.json({
    promotions: promotions.map((relation) => relation.promotion),
    count: metadata?.count,
    offset: metadata?.skip,
    limit: metadata?.take
  })
}

/**
 * @oas [post] /vendor/promotions
 * operationId: "VendorCreatePromotion"
 * summary: "Create promotion"
 * description: "Creates a new promotion for the authenticated vendor."
 * x-authenticated: true
 * requestBody:
 *   content:
 *     application/json:
 *       schema:
 *         $ref: "#/components/schemas/VendorCreatePromotion"
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
  req: AuthenticatedMedusaRequest<VendorCreatePromotionType>,
  res: MedusaResponse
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const seller = await fetchSellerByAuthActorId(
    req.auth_context?.actor_id,
    req.scope
  )

  const { result } = await createVendorPromotionWorkflow.run({
    container: req.scope,
    input: { promotion: req.validatedBody, seller_id: seller.id }
  })

  const {
    data: [promotion]
  } = await query.graph({
    entity: 'promotion',
    fields: req.queryConfig.fields,
    filters: {
      id: result[0].id
    }
  })

  res.status(201).json({ promotion })
}
