import { MedusaRequest, MedusaResponse } from '@medusajs/framework'
import { ContainerRegistrationKeys } from '@medusajs/framework/utils'

export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { data: stockLocations, metadata } = await query.graph({
    entity: 'stock_location',
    fields: ['seller.*', ...req.queryConfig.fields],
    filters: req.filterableFields,
    pagination: req.queryConfig.pagination
  })

  const filteredStockLocations = stockLocations.filter(
    (stockLocation) => !stockLocation.seller
  )

  res.json({
    stock_locations: filteredStockLocations,
    count: metadata?.count,
    offset: metadata?.skip,
    limit: metadata?.take
  })
}
