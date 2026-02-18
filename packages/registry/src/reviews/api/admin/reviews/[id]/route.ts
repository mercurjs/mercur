import { AuthenticatedMedusaRequest, MedusaResponse } from '@medusajs/framework'
import { ContainerRegistrationKeys } from '@medusajs/framework/utils'

export async function GET(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
): Promise<void> {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const {
    data: [review]
  } = await query.graph({
    entity: 'review',
    fields: req.queryConfig.fields,
    filters: {
      id: req.params.id
    }
  })

  res.json({ review })
}
