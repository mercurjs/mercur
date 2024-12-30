import { MedusaRequest, MedusaResponse } from '@medusajs/framework'
import { ContainerRegistrationKeys } from '@medusajs/framework/utils'

import { createComissionRateWorkflow } from '../../../../workflows/comission/workflows'
import { AdminCreateComissionRateType } from '../validators'

export async function POST(
  req: MedusaRequest<AdminCreateComissionRateType>,
  res: MedusaResponse
): Promise<void> {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { result } = await createComissionRateWorkflow.run({
    input: req.validatedBody,
    container: req.scope
  })

  const {
    data: [comission_rate]
  } = await query.graph({
    entity: 'comission_rate',
    fields: req.remoteQueryConfig.fields,
    filters: {
      id: result.id
    }
  })

  res.status(201).json({
    comission_rate
  })
}

export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data: comission_rates, metadata } = await query.graph({
    entity: 'comission_rate',
    fields: req.remoteQueryConfig.fields,
    pagination: req.remoteQueryConfig.pagination
  })

  res.json({
    comission_rates,
    count: metadata!.count,
    offset: metadata!.skip,
    limit: metadata!.take
  })
}
