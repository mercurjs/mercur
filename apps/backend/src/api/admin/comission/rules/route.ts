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
    count: metadata!.count,
    offset: metadata!.skip,
    limit: metadata!.take
  })
}
