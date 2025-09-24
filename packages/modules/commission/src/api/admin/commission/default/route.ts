import { MedusaRequest, MedusaResponse } from '@medusajs/framework'
import {
  ContainerRegistrationKeys,
  MedusaError
} from '@medusajs/framework/utils'

import {
  listCommissionRulesWorkflow,
  upsertDefaultCommissionRuleWorkflow
} from '../../../../workflows/commission/workflows'
import {
  AdminUpsertDefaultCommissionRuleType,
  validateCommissionRate
} from '../validators'

/**
 * @oas [post] /admin/commission/default
 * operationId: "AdminUpsertDefaultCommissionRule"
 * summary: "Upsert default CommissionRule"
 * description: "Creates or updates default commission rule."
 * x-authenticated: true
 * requestBody:
 *   content:
 *     application/json:
 *       schema:
 *         $ref: "#/components/schemas/AdminUpsertDefaultCommissionRule"
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
  req: MedusaRequest<AdminUpsertDefaultCommissionRuleType>,
  res: MedusaResponse
): Promise<void> {
  validateCommissionRate(req.validatedBody.rate)
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  await upsertDefaultCommissionRuleWorkflow.run({
    container: req.scope,
    input: req.validatedBody
  })

  const {
    data: [default_rule]
  } = await query.graph({
    entity: 'commission_rule',
    fields: ['id'],
    filters: {
      reference: 'site'
    }
  })

  const {
    result: {
      commission_rules: [commission_rule]
    }
  } = await listCommissionRulesWorkflow.run({
    container: req.scope,
    input: {
      ids: [default_rule.id]
    }
  })

  res.json({
    commission_rule
  })
}

/**
 * @oas [get] /admin/commission/default
 * operationId: "AdminGetDefaultCommissionRule"
 * summary: "Get default commission rule"
 * description: "Retrieves a commission rule with 'site' reference type."
 * x-authenticated: true
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
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const {
    data: [default_rule]
  } = await query.graph({
    entity: 'commission_rule',
    fields: ['id'],
    filters: {
      reference: 'site'
    }
  })

  if (!default_rule) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, 'Rule not found!')
  }

  const {
    result: {
      commission_rules: [commission_rule]
    }
  } = await listCommissionRulesWorkflow.run({
    container: req.scope,
    input: {
      ids: [default_rule.id]
    }
  })

  res.json({
    commission_rule
  })
}
