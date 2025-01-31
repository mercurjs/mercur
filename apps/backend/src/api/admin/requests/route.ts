import { MedusaRequest, MedusaResponse } from '@medusajs/framework'
import { ContainerRegistrationKeys } from '@medusajs/framework/utils'

export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data: requests, metadata } = await query.graph({
    entity: 'request',
    fields: req.remoteQueryConfig.fields,
    filters: req.filterableFields
  })

  res.json({
    requests,
    count: metadata?.count,
    offset: metadata?.skip,
    limit: metadata?.take
  })
}
