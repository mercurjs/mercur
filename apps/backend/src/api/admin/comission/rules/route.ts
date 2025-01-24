import { MedusaRequest, MedusaResponse } from '@medusajs/framework'
import { ContainerRegistrationKeys } from '@medusajs/framework/utils'

import { createComissionRuleWorkflow } from '../../../../workflows/comission/workflows'
import { AdminCreateComissionRuleType } from '../validators'

export async function POST(
  req: MedusaRequest<AdminCreateComissionRuleType>,
  res: MedusaResponse
): Promise<void> {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { result } = await createComissionRuleWorkflow.run({
    input: req.validatedBody,
    container: req.scope,
    throwOnError: true
  })

  const {
    data: [comission_rule]
  } = await query.graph({
    entity: 'comission_rule',
    fields: req.remoteQueryConfig.fields,
    filters: {
      id: result.id
    }
  })

  res.status(201).json({
    comission_rule
  })
}

/**
 * @oas [get] /admin/comission/rules
 * operationId: "AdminListComissionRules"
 * summary: "List Comission rules"
 * description: "Retrieves a list of comission rules."
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
 *             comission_rules:
 *               type: array
 *               items:
 *                 $ref: "#/components/schemas/AdminComissionRule"
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

  const { data: comission_rules, metadata } = await query.graph({
    entity: 'comission_rule',
    fields: req.remoteQueryConfig.fields,
    pagination: req.remoteQueryConfig.pagination
  })

  res.json({
    comission_rules,
    count: metadata?.count,
    offset: metadata?.skip,
    limit: metadata?.take
  })
}
