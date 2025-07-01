import { MedusaRequest, MedusaResponse } from '@medusajs/framework'
import { ContainerRegistrationKeys } from '@medusajs/framework/utils'

import { createConfigurationRuleWorkflow } from '../../../workflows/configuration/workflows'
import { AdminCreateRuleType } from './validators'

/**
 * @oas [get] /admin/configuration
 * operationId: "AdminListRules"
 * summary: "List rules"
 * description: "Retrieves rules list"
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
 *             configuration_rules:
 *               type: array
 *               items:
 *                 $ref: "#/components/schemas/ConfigurationRule"
 *             count:
 *               type: integer
 *               description: The total number of requests
 *             offset:
 *               type: integer
 *               description: The number of requests skipped
 *             limit:
 *               type: integer
 *               description: The number of requests per page
 * tags:
 *   - Admin Configuration
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 */
export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data: configuration_rules, metadata } = await query.graph({
    entity: 'configuration_rule',
    fields: ['id', 'rule_type', 'is_enabled'],
    pagination: req.queryConfig.pagination
  })

  res.json({
    configuration_rules,
    count: metadata?.count,
    offset: metadata?.skip,
    limit: metadata?.take
  })
}

/**
 * @oas [post] /admin/configuration
 * operationId: "AdminCreateRule"
 * summary: "Create a configuration rule"
 * description: "Creates a request to admin to accept new resource"
 * x-authenticated: true
 * requestBody:
 *   content:
 *     application/json:
 *       schema:
 *         $ref: "#/components/schemas/AdminCreateRule"
 * responses:
 *   "201":
 *     description: Created
 *     content:
 *       application/json:
 *         schema:
 *           type: object
 *           properties:
 *             configuration_rule:
 *               $ref: "#/components/schemas/ConfigurationRule"
 * tags:
 *   - Admin Configuration
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 */
export const POST = async (
  req: MedusaRequest<AdminCreateRuleType>,
  res: MedusaResponse
) => {
  const { result: configuration_rule } =
    await createConfigurationRuleWorkflow.run({
      container: req.scope,
      input: req.validatedBody
    })

  res.status(201).json({ configuration_rule })
}
