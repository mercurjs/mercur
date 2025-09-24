import { MedusaRequest, MedusaResponse } from '@medusajs/framework'

import { listCommissionLinesWorkflow } from '../../../../workflows/commission/workflows'
import { AdminGetCommissionLinesParamsType } from '../validators'

/**
 * @oas [get] /admin/commission/commission-lines
 * operationId: "AdminListCommissionLines"
 * summary: "List Commission Lines"
 * description: "Retrieves a list of commission lines with optional filtering and expansion."
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
 *   - name: start_date
 *     in: query
 *     schema:
 *       type: string
 *       format: date-time
 *     required: false
 *     description: Filter commission lines created after this date.
 *   - name: end_date
 *     in: query
 *     schema:
 *       type: string
 *       format: date-time
 *     required: false
 *     description: Filter commission lines created before this date.
 *   - name: seller_id
 *     in: query
 *     schema:
 *       type: string
 *     required: false
 *     description: Filter commission lines by seller ID.
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
 *                 $ref: "#/components/schemas/AdminCommissionLine"
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
 *   - Admin Commission
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 */
export async function GET(
  req: MedusaRequest<AdminGetCommissionLinesParamsType>,
  res: MedusaResponse
): Promise<void> {
  const {
    result: { lines: commission_lines, count }
  } = await listCommissionLinesWorkflow(req.scope).run({
    input: {
      expand: true,
      pagination: {
        skip: req.queryConfig.pagination.skip,
        take: req.queryConfig.pagination.take || 20
      },
      filters: req.filterableFields
    }
  })

  res.json({
    commission_lines,
    count,
    offset: req.queryConfig.pagination.skip,
    limit: req.queryConfig.pagination.take
  })
}
