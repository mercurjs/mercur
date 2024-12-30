import { MedusaRequest, MedusaResponse } from '@medusajs/framework'
import { ContainerRegistrationKeys } from '@medusajs/framework/utils'

import {
  deleteComissionRuleWorkflow,
  updateComissionRuleWorkflow
} from '../../../../../workflows/comission/workflows'
import { AdminUpdateComissionRuleType } from '../../validators'

export async function POST(
  req: MedusaRequest<AdminUpdateComissionRuleType>,
  res: MedusaResponse
): Promise<void> {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  await updateComissionRuleWorkflow.run({
    input: { ...req.validatedBody, id: req.params.id },
    container: req.scope
  })

  const {
    data: [comission_rule]
  } = await query.graph({
    entity: 'comission_rule',
    fields: req.remoteQueryConfig.fields,
    filters: {
      id: req.params.id
    }
  })

  res.status(200).json({
    comission_rule
  })
}

export async function DELETE(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  const { result } = await deleteComissionRuleWorkflow.run({
    input: req.params.id,
    container: req.scope
  })

  res.json({
    id: result,
    object: 'comission_rule',
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
    entity: 'comission_rule',
    fields: req.remoteQueryConfig.fields,
    filters: {
      id: req.params.id
    }
  })

  res.json({
    comission_rule
  })
}
