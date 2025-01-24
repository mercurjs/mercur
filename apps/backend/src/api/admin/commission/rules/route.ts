import { MedusaRequest, MedusaResponse } from '@medusajs/framework'
import { ContainerRegistrationKeys } from '@medusajs/framework/utils'

import { createCommissionRuleWorkflow } from '../../../../workflows/commission/workflows'
import { AdminCreateCommissionRuleType } from '../validators'

export async function POST(
  req: MedusaRequest<AdminCreateCommissionRuleType>,
  res: MedusaResponse
): Promise<void> {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { result } = await createCommissionRuleWorkflow.run({
    input: req.validatedBody,
    container: req.scope,
    throwOnError: true
  })

  const {
    data: [commission_rule]
  } = await query.graph({
    entity: 'commission_rule',
    fields: req.remoteQueryConfig.fields,
    filters: {
      id: result.id
    }
  })

  res.status(201).json({
    commission_rule
  })
}

/**
 * @oas [get] /admin/commission/rules
 * operationId: "AdminListCommissionRules"
 * summary: "List Commission rules"
 * description: "Retrieves a list of commission rules."
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
 *             commission_rules:
 *               type: array
 *               items:
 *                 $ref: "#/components/schemas/AdminCommissionRule"
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
 *   - Admin
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 */
export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data: commission_rules, metadata } = await query.graph({
    entity: 'commission_rule',
    fields: req.remoteQueryConfig.fields,
    pagination: req.remoteQueryConfig.pagination
  })

  res.json({
    commission_rules,
    count: metadata?.count,
    offset: metadata?.skip,
    limit: metadata?.take
  })
}
