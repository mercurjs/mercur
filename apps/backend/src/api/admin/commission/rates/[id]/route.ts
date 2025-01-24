import { MedusaRequest, MedusaResponse } from '@medusajs/framework'
import { ContainerRegistrationKeys } from '@medusajs/framework/utils'

import {
  deleteCommissionRateWorkflow,
  updateCommissionRateWorkflow
} from '../../../../../workflows/commission/workflows'
import { AdminUpdateCommissionRateType } from '../../validators'

export async function POST(
  req: MedusaRequest<AdminUpdateCommissionRateType>,
  res: MedusaResponse
): Promise<void> {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  await updateCommissionRateWorkflow.run({
    input: { ...req.validatedBody, id: req.params.id },
    container: req.scope
  })

  const {
    data: [commission_rate]
  } = await query.graph({
    entity: 'commission_rate',
    fields: req.remoteQueryConfig.fields,
    filters: {
      id: req.params.id
    }
  })

  res.status(200).json({
    commission_rate
  })
}

export async function DELETE(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  const { result } = await deleteCommissionRateWorkflow.run({
    input: req.params.id,
    container: req.scope
  })

  res.json({
    id: result,
    object: 'commission_rate',
    deleted: true
  })
}

export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const {
    data: [commission_rate]
  } = await query.graph({
    entity: 'commission_rate',
    fields: req.remoteQueryConfig.fields,
    filters: {
      id: req.params.id
    }
  })

  res.json({
    commission_rate
  })
}
