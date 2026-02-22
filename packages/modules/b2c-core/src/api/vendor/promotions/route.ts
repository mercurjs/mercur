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
 * description: "Retrieves a list of promotions for the authenticated vendor. Supports search, filtering, sorting, and pagination."
 * x-authenticated: true
 * parameters:
 *   - name: q
 *     in: query
 *     schema:
 *       type: string
 *     required: false
 *     description: Search term to filter promotions by searchable fields.
 *   - name: id
 *     in: query
 *     schema:
 *       oneOf:
 *         - type: string
 *         - type: array
 *           items:
 *             type: string
 *     required: false
 *     description: Filter by promotion ID(s).
 *   - name: code
 *     in: query
 *     schema:
 *       oneOf:
 *         - type: string
 *         - type: array
 *           items:
 *             type: string
 *     required: false
 *     description: Filter by promotion code(s).
 *   - name: campaign_id
 *     in: query
 *     schema:
 *       oneOf:
 *         - type: string
 *         - type: array
 *           items:
 *             type: string
 *     required: false
 *     description: Filter by campaign ID(s).
 *   - name: status
 *     in: query
 *     schema:
 *       oneOf:
 *         - type: string
 *           enum: [draft, active, inactive]
 *         - type: array
 *           items:
 *             type: string
 *             enum: [draft, active, inactive]
 *     required: false
 *     description: Filter by promotion status.
 *   - name: is_automatic
 *     in: query
 *     schema:
 *       type: boolean
 *     required: false
 *     description: Filter by whether the promotion is automatic.
 *   - name: type
 *     in: query
 *     schema:
 *       oneOf:
 *         - type: string
 *           enum: [standard, buyget]
 *         - type: array
 *           items:
 *             type: string
 *             enum: [standard, buyget]
 *     required: false
 *     description: Filter by promotion type.
 *   - name: created_at
 *     in: query
 *     schema:
 *       type: object
 *     required: false
 *     description: Filter by creation date using operator map (e.g., $gt, $lt, $gte, $lte).
 *   - name: updated_at
 *     in: query
 *     schema:
 *       type: object
 *     required: false
 *     description: Filter by update date using operator map (e.g., $gt, $lt, $gte, $lte).
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
 *   - name: order
 *     in: query
 *     schema:
 *       type: string
 *     required: false
 *     description: The field to sort by and in which order (e.g., "created_at" for ascending, "-created_at" for descending).
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

  const { seller_id, q, ...promotionFilters } = req.filterableFields

  const { data: sellerPromotions } = await query.graph({
    entity: sellerPromotion.entryPoint,
    fields: ['promotion_id'],
    filters: {
      seller_id,
      deleted_at: {
        $eq: null
      }
    }
  })

  const promotionIds = sellerPromotions.map((rel) => rel.promotion_id)

  if (promotionIds.length === 0) {
    return res.json({
      promotions: [],
      count: 0,
      offset: req.queryConfig.pagination?.skip ?? 0,
      limit: req.queryConfig.pagination?.take ?? 50
    })
  }

  const filters: Record<string, unknown> = {
    ...promotionFilters,
    id: promotionIds,
    deleted_at: {
      $eq: null
    }
  }

  if (q) {
    filters.code = { $ilike: `%${q}%` }
  }

  const { data: promotions, metadata } = await query.graph({
    entity: 'promotion',
    fields: req.queryConfig.fields,
    filters,
    pagination: req.queryConfig.pagination
  })

  res.json({
    promotions,
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
