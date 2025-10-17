import { MedusaRequest, MedusaResponse } from '@medusajs/framework'

import { updateConfigurationRuleWorkflow } from '../../../../workflows/configuration/workflows'
import { AdminUpdateRuleType } from '../validators'

/**
 * @oas [post] /admin/configuration/{id}
 * operationId: "AdminUpdateRule"
 * summary: "Update a configuration rule"
 * description: "Updates a rule"
 * x-authenticated: true
 * parameters:
 *   - in: path
 *     name: id
 *     required: true
 *     description: The ID of the Rule.
 *     schema:
 *       type: string
 * requestBody:
 *   content:
 *     application/json:
 *       schema:
 *         $ref: "#/components/schemas/AdminUpdateRule"
 * responses:
 *   "200":
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
  req: MedusaRequest<AdminUpdateRuleType>,
  res: MedusaResponse
) => {
  const { result: configuration_rule } =
    await updateConfigurationRuleWorkflow.run({
      container: req.scope,
      input: { ...req.validatedBody, id: req.params.id }
    })

  res.json({ configuration_rule })
}
