import { AuthenticatedMedusaRequest, MedusaResponse } from '@medusajs/framework'
import { ContainerRegistrationKeys } from '@medusajs/framework/utils'

import { updateSellerWorkflow } from '../../../../workflows/seller/workflows'
import { AdminUpdateSellerType } from '../validators'

export async function GET(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
): Promise<void> {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const {
    data: [seller]
  } = await query.graph(
    {
      entity: 'seller',
      fields: req.queryConfig.fields,
      filters: {
        id: req.params.id
      }
    },
    { throwIfKeyNotFound: true }
  )

  res.json({
    seller
  })
}

export const POST = async (
  req: AuthenticatedMedusaRequest<AdminUpdateSellerType>,
  res: MedusaResponse
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { id } = req.params

  await updateSellerWorkflow(req.scope).run({
    input: {
      id,
      ...req.validatedBody
    }
  })

  const {
    data: [seller]
  } = await query.graph({
    entity: 'seller',
    fields: req.queryConfig.fields,
    filters: { id }
  })

  res.json({ seller })
}
