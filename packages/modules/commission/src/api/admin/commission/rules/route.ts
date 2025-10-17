import { MedusaRequest, MedusaResponse } from '@medusajs/framework'
import { ContainerRegistrationKeys } from '@medusajs/framework/utils'

import {
  createCommissionRuleWorkflow,
  listCommissionRulesWorkflow
} from '../../../../workflows/commission/workflows'
import {
  AdminCreateCommissionRuleType,
  validateCommissionRate,
  validateCommissionRule
} from '../validators'

/**
 * @oas [post] /admin/commission/rules
 * operationId: "AdminCreateCommissionRule"
 * summary: "Create a CommissionRule"
 * description: "Creates a new commission rule."
 * x-authenticated: true
 * requestBody:
 *   content:
 *     application/json:
 *       schema:
 *         $ref: "#/components/schemas/AdminCreateCommissionRule"
 * responses:
 *   "201":
 *     description: Created
 *     content:
 *       application/json:
 *         schema:
 *           type: object
 *           properties:
 *             commission_rule:
 *               $ref: "#/components/schemas/AdminCommissionRule"
 * tags:
 *   - Admin Commission
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 */
export async function POST(
  req: MedusaRequest<AdminCreateCommissionRuleType>,
  res: MedusaResponse
): Promise<void> {
  validateCommissionRate(req.validatedBody.rate)
  validateCommissionRule(req.validatedBody)
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
    fields: req.queryConfig.fields,
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
 *                 $ref: "#/components/schemas/AdminCommissionAggregate"
 *             count:
 *               type: integer
 *               description: The total number of items available
 *             offset:
 *               type: integer
 *               description: The number of items skipped before these items
 *             limit:
 *               type: integer
 *               description: The number of items per page
 *
 * tags:
 *   - Admin Commission
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 */
export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  const { result } = await listCommissionRulesWorkflow.run({
    container: req.scope,
    input: { pagination: req.queryConfig.pagination }
  })

  res.json({
    commission_rules: result.commission_rules,
    count: result.count,
    offset: req.queryConfig.pagination.skip,
    limit: req.queryConfig.pagination.take
  })
}
