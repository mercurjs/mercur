import { MedusaRequest, MedusaResponse } from '@medusajs/framework'
import { ContainerRegistrationKeys, QueryContext } from '@medusajs/framework/utils'

import { MEILISEARCH_MODULE, MeilisearchModuleService } from '../../../../../modules/meilisearch'
import { StoreMeilisearchSearchType } from './validators'

export const POST = async (
  req: MedusaRequest<StoreMeilisearchSearchType>,
  res: MedusaResponse
) => {
  const meilisearchService =
    req.scope.resolve<MeilisearchModuleService>(MEILISEARCH_MODULE)
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const {
    query: searchQuery,
    page,
    hitsPerPage,
    filters,
    currency_code,
    region_id,
    customer_id,
    customer_group_id,
  } = req.validatedBody

  // Build filter string server-side — seller.status = "active" is always enforced (FR-003)
  const filterParts: string[] = ['seller.status = "active"']

  if (filters?.categories?.length) {
    const ids = filters.categories.map((c) => `"${c}"`).join(', ')
    filterParts.push(`categories.id IN [${ids}]`)
  }
  if (filters?.price_min !== undefined) {
    filterParts.push(`variants.prices.amount >= ${filters.price_min}`)
  }
  if (filters?.price_max !== undefined) {
    filterParts.push(`variants.prices.amount <= ${filters.price_max}`)
  }
  if (filters?.seller_handle) {
    filterParts.push(`seller.handle = "${filters.seller_handle}"`)
  }

  const filter = filterParts.join(' AND ')

  const searchResult = await meilisearchService.search(searchQuery, {
    filter,
    page,
    hitsPerPage,
    attributesToRetrieve: ['id'],
  })

  const productIds = searchResult.hits.map((hit) => hit.id)

  if (!productIds.length) {
    return res.json({
      products: [],
      totalHits: searchResult.totalHits,
      page: searchResult.page,
      totalPages: searchResult.totalPages,
      hitsPerPage: searchResult.hitsPerPage,
      processingTimeMs: searchResult.processingTimeMs,
      query: searchResult.query,
    })
  }

  const hasPricingContext =
    currency_code || region_id || customer_id || customer_group_id

  const contextParams: Record<string, unknown> = {}
  if (hasPricingContext) {
    contextParams.variants = {
      calculated_price: QueryContext({
        ...(currency_code && { currency_code }),
        ...(region_id && { region_id }),
        ...(customer_id && { customer_id }),
        ...(customer_group_id && { customer_group_id }),
      }),
    }
  }

  const { data: products } = await query.graph({
    entity: 'product',
    fields: [
      '*',
      'images.*',
      'options.*',
      'options.values.*',
      'variants.*',
      'variants.options.*',
      'variants.prices.*',
      ...(hasPricingContext ? ['variants.calculated_price.*'] : []),
      'categories.*',
      'collection.*',
      'type.*',
      'tags.*',
      'seller.*',
    ],
    filters: { id: productIds },
    ...(Object.keys(contextParams).length > 0 && { context: contextParams }),
  })

  const productMap = new Map(products.map((p) => [p.id, p]))
  const orderedProducts = productIds.map((id) => productMap.get(id)).filter(Boolean)

  return res.json({
    products: orderedProducts,
    totalHits: searchResult.totalHits,
    page: searchResult.page,
    totalPages: searchResult.totalPages,
    hitsPerPage: searchResult.hitsPerPage,
    processingTimeMs: searchResult.processingTimeMs,
    query: searchResult.query,
    facetDistribution: searchResult.facetDistribution,
  })
}
