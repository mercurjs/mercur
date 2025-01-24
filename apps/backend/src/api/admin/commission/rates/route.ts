import { MedusaRequest, MedusaResponse } from '@medusajs/framework'
import { ContainerRegistrationKeys } from '@medusajs/framework/utils'

import { createCommissionRateWorkflow } from '../../../../workflows/commission/workflows'
import { AdminCreateCommissionRateType } from '../validators'

export async function POST(
  req: MedusaRequest<AdminCreateCommissionRateType>,
  res: MedusaResponse
): Promise<void> {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { result } = await createCommissionRateWorkflow.run({
    input: req.validatedBody,
    container: req.scope
  })

  const {
    data: [comission_rate]
  } = await query.graph({
    entity: 'commission_rate',
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

  const { data: commission_rates, metadata } = await query.graph({
    entity: 'commission_rate',
    fields: req.remoteQueryConfig.fields,
    pagination: req.remoteQueryConfig.pagination
  })

  res.json({
    commission_rates,
    count: metadata!.count,
    offset: metadata!.skip,
    limit: metadata!.take
  })
}
