import { MedusaRequest, MedusaResponse } from '@medusajs/framework'
import { ContainerRegistrationKeys } from '@medusajs/framework/utils'

import {
  deleteCommissionRuleWorkflow,
  updateCommissionRuleWorkflow
} from '../../../../../workflows/commission/workflows'
import { AdminUpdateCommissionRuleType } from '../../validators'

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
    fields: req.remoteQueryConfig.fields,
    filters: {
      id: req.params.id
    }
  })

  res.status(200).json({
    commission_rule
  })
}

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

export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const {
    data: [comission_rule]
  } = await query.graph({
    entity: 'commission_rule',
    fields: req.remoteQueryConfig.fields,
    filters: {
      id: req.params.id
    }
  })

  res.json({
    comission_rule
  })
}
