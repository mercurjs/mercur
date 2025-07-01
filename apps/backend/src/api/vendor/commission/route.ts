import { AuthenticatedMedusaRequest, MedusaResponse } from '@medusajs/framework'

import { fetchSellerByAuthActorId } from '../../../shared/infra/http/utils'
import { listCommissionLinesWorkflow } from '../../../workflows/commission/workflows'

/**
 * @oas [get] /vendor/commission
 * operationId: "VendorListCommissionLines"
 * summary: "List Commission Lines"
 * description: "Retrieves a list of commission lines for the authenticated vendor/seller with optional filtering."
 * x-authenticated: true
 * parameters:
 *   - name: offset
 *     in: query
 *     schema:
 *       type: number
 *       default: 0
 *     required: false
 *     description: The number of items to skip before starting to collect the result set.
 *   - name: limit
 *     in: query
 *     schema:
 *       type: number
 *       default: 20
 *     required: false
 *     description: The number of items to return.
 *   - name: start_date
 *     in: query
 *     schema:
 *       type: string
 *       format: date-time
 *     required: false
 *     description: Filter commission lines created on or after this date.
 *   - name: end_date
 *     in: query
 *     schema:
 *       type: string
 *       format: date-time
 *     required: false
 *     description: Filter commission lines created on or before this date.
 * responses:
 *   "200":
 *     description: OK
 *     content:
 *       application/json:
 *         schema:
 *           type: object
 *           properties:
 *             commission_lines:
 *               type: array
 *               items:
 *                 $ref: "#/components/schemas/VendorCommissionLine"
 *             count:
 *               type: integer
 *               description: The total number of commission lines available
 *             offset:
 *               type: integer
 *               description: The number of items skipped before these items
 *             limit:
 *               type: integer
 *               description: The number of items per page
 *   "401":
 *     description: Unauthorized
 *     content:
 *       application/json:
 *         schema:
 *           type: object
 *           properties:
 *             message:
 *               type: string
 *               example: "Unauthorized"
 *   "403":
 *     description: Forbidden
 *     content:
 *       application/json:
 *         schema:
 *           type: object
 *           properties:
 *             message:
 *               type: string
 *               example: "Forbidden"
 * tags:
 *   - Vendor Commission
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 */
export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const seller = await fetchSellerByAuthActorId(
    req.auth_context.actor_id,
    req.scope
  )

  const {
    result: { lines: commission_lines, count }
  } = await listCommissionLinesWorkflow(req.scope).run({
    input: {
      expand: true,
      pagination: {
        skip: req.queryConfig.pagination.skip,
        take: req.queryConfig.pagination.take || 20
      },
      filters: {
        ...req.filterableFields,
        seller_id: seller.id
      }
    }
  })

  res.json({
    commission_lines,
    count,
    offset: req.queryConfig.pagination.skip,
    limit: req.queryConfig.pagination.take
  })
}
