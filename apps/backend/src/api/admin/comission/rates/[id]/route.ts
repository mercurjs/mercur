import { MedusaRequest, MedusaResponse } from '@medusajs/framework'
import { ContainerRegistrationKeys } from '@medusajs/framework/utils'

import {
  deleteComissionRateWorkflow,
  updateComissionRateWorkflow
} from '../../../../../workflows/comission/workflows'
import { AdminUpdateComissionRateType } from '../../validators'

export async function POST(
  req: MedusaRequest<AdminUpdateComissionRateType>,
  res: MedusaResponse
): Promise<void> {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  await updateComissionRateWorkflow.run({
    input: { ...req.validatedBody, id: req.params.id },
    container: req.scope
  })

  const {
    data: [comission_rate]
  } = await query.graph({
    entity: 'comission_rate',
    fields: req.remoteQueryConfig.fields,
    filters: {
      id: req.params.id
    }
  })

  res.status(200).json({
    comission_rate
  })
}

export async function DELETE(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  const { result } = await deleteComissionRateWorkflow.run({
    input: req.params.id,
    container: req.scope
  })

  res.json({
    id: result,
    object: 'comission_rate',
    deleted: true
  })
}

export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const {
    data: [comission_rate]
  } = await query.graph({
    entity: 'comission_rate',
    fields: req.remoteQueryConfig.fields,
    filters: {
      id: req.params.id
    }
  })

  res.json({
    comission_rate
  })
}
