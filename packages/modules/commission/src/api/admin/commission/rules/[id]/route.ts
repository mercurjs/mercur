import { MedusaRequest, MedusaResponse } from '@medusajs/framework'
import {
  ContainerRegistrationKeys,
  MedusaError
} from '@medusajs/framework/utils'

import {
  deleteCommissionRuleWorkflow,
  listCommissionRulesWorkflow,
  updateCommissionRuleWorkflow
} from '../../../../../workflows/commission/workflows'
import { AdminUpdateCommissionRuleType } from '../../validators'

/**
 * @oas [post] /admin/commission/rules/{id}
 * operationId: "AdminUpdateCommissionRuleById"
 * summary: "Update CommissionRule"
 * description: "Updates commission rule by id."
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
 *         $ref: "#/components/schemas/AdminUpdateCommissionRule"
 * responses:
 *   "200":
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
  req: MedusaRequest<AdminUpdateCommissionRuleType>,
  res: MedusaResponse
): Promise<void> {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  await updateCommissionRuleWorkflow.run({
    input: { ...req.validatedBody, id: req.params.id },
    container: req.scope
  })

  const {
    data: [commission_rule]
  } = await query.graph({
    entity: 'commission_rule',
    fields: req.queryConfig.fields,
    filters: {
      id: req.params.id
    }
  })

  res.status(200).json({
    commission_rule
  })
}

/**
 * @oas [delete] /admin/commission/rules/{id}
 * operationId: "AdminDeleteCommissionRuleById"
 * summary: "Delete a Commission Rule"
 * description: "Deletes a commission rule by id."
 * x-authenticated: true
 * parameters:
 *   - in: path
 *     name: id
 *     required: true
 *     description: The ID of the rule.
 *     schema:
 *       type: string
 * responses:
 *   "200":
 *     description: OK
 *     content:
 *       application/json:
 *         schema:
 *           type: object
 *           properties:
 *             id:
 *               type: string
 *               description: The ID of the deleted rule
 *             object:
 *               type: string
 *               description: The type of the object that was deleted
 *             deleted:
 *               type: boolean
 *               description: Whether or not the items were deleted
 * tags:
 *   - Admin Commission
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 */
export async function DELETE(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  const { result } = await deleteCommissionRuleWorkflow.run({
    input: req.params.id,
    container: req.scope
  })

  res.json({
    id: result,
    object: 'commission_rule',
    deleted: true
  })
}

/**
 * @oas [get] /admin/commission/rules/{id}
 * operationId: "AdminGetCommissionRuleById"
 * summary: "Get commission rule by id"
 * description: "Retrieves a commission rule by id."
 * x-authenticated: true
 * parameters:
 * - in: path
 *   name: id
 *   required: true
 *   description: The ID of the Rule.
 *   schema:
 *     type: string
 * responses:
 *   "200":
 *     description: OK
 *     content:
 *       application/json:
 *         schema:
 *           type: object
 *           properties:
 *             commission_rule:
 *               $ref: "#/components/schemas/AdminCommissionAggregate"
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
  const {
    result: {
      commission_rules: [commission_rule]
    }
  } = await listCommissionRulesWorkflow.run({
    container: req.scope,
    input: {
      ids: [req.params.id]
    }
  })

  if (!commission_rule) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, 'Rule not found!')
  }

  res.json({
    commission_rule
  })
}
