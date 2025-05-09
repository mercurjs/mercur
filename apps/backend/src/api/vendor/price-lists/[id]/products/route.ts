import { AuthenticatedMedusaRequest, MedusaResponse } from '@medusajs/framework'
import { ContainerRegistrationKeys } from '@medusajs/framework/utils'

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { id } = req.params
  const {
    data: [priceList]
  } = await query.graph({
    entity: 'price_list',
    fields: ['prices.price_set.variant.id'],
    filters: {
      id
    }
  })

  const variantIds: string[] = []

  priceList.prices?.forEach((price) => {
    const variantId = price.price_set?.variant?.id

    if (variantId) {
      variantIds.push(variantId)
    }
  })

  const { data: products, metadata } = await query.graph({
    entity: 'product',
    fields: req.queryConfig.fields,
    filters: {
      variants: {
        id: variantIds
      }
    },
    pagination: req.queryConfig.pagination
  })

  res.json({
    products,
    count: metadata?.count,
    offset: metadata?.skip,
    limit: metadata?.take
  })
}
