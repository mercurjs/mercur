import { MedusaRequest, MedusaResponse } from '@medusajs/framework'
import {
  ContainerRegistrationKeys,
  QueryContext
} from '@medusajs/framework/utils'
import {
  ALGOLIA_MODULE,
  IAlgoliaModuleService,
  IndexType
} from '@mercurjs/framework'

import { StoreSearchProductsType } from '../validators'

type AlgoliaHit = {
  id: string
}

/**
 * @oas [post] /store/products/search
 * operationId: "StoreSearchProducts"
 * summary: "Search products"
 * description: "Searches products using Algolia and returns hydrated product data from the database. Only product IDs are retrieved from Algolia to avoid the 10KB response limit, all product data is fetched from the database."
 * requestBody:
 *   content:
 *     application/json:
 *       schema:
 *         type: object
 *         properties:
 *           query:
 *             type: string
 *             description: The search query string
 *           page:
 *             type: number
 *             description: The page number (0-indexed)
 *           hitsPerPage:
 *             type: number
 *             description: Number of results per page
 *           filters:
 *             type: string
 *             description: Algolia filter string
 *           facets:
 *             type: array
 *             items:
 *               type: string
 *             description: Array of facet attributes to retrieve
 *           maxValuesPerFacet:
 *             type: number
 *             description: Maximum number of facet values to return per facet
 *           currency_code:
 *             type: string
 *             description: Currency code for price calculation
 *           region_id:
 *             type: string
 *             description: Region ID for price calculation
 * responses:
 *   "200":
 *     description: OK
 *     content:
 *       application/json:
 *         schema:
 *           type: object
 *           properties:
 *             products:
 *               type: array
 *               items:
 *                 type: object
 *             nbHits:
 *               type: number
 *               description: Total number of matching products
 *             page:
 *               type: number
 *               description: Current page number
 *             nbPages:
 *               type: number
 *               description: Total number of pages
 *             hitsPerPage:
 *               type: number
 *               description: Number of results per page
 *             facets:
 *               type: object
 *               description: Facet values and counts
 *             processingTimeMS:
 *               type: number
 *               description: Algolia processing time in milliseconds
 * tags:
 *   - Store Products
 */
export const POST = async (
  req: MedusaRequest<StoreSearchProductsType>,
  res: MedusaResponse
) => {
  const algoliaService = req.scope.resolve<IAlgoliaModuleService>(ALGOLIA_MODULE)
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const {
    query: searchQuery,
    page,
    hitsPerPage,
    filters,
    facets,
    maxValuesPerFacet,
    currency_code,
    region_id
  } = req.validatedBody

  const searchParams: Record<string, unknown> = {
    query: searchQuery,
    page,
    hitsPerPage,
    attributesToRetrieve: ['id'],
    attributesToHighlight: []
  }

  if (filters) {
    searchParams.filters = filters
  }
  if (facets) {
    searchParams.facets = facets
  }
  if (maxValuesPerFacet) {
    searchParams.maxValuesPerFacet = maxValuesPerFacet
  }

  const algoliaResult = await algoliaService.search<AlgoliaHit>(
    IndexType.PRODUCT,
    searchParams
  )

  const productIds = algoliaResult.hits.map((hit) => hit.id)

  if (productIds.length === 0) {
    return res.json({
      products: [],
      nbHits: algoliaResult.nbHits,
      page: algoliaResult.page,
      nbPages: algoliaResult.nbPages,
      hitsPerPage: algoliaResult.hitsPerPage,
      facets: algoliaResult.facets,
      facets_stats: algoliaResult.facets_stats,
      processingTimeMS: algoliaResult.processingTimeMS,
      query: algoliaResult.query
    })
  }

  const contextParams: Record<string, unknown> = {}
  if (currency_code || region_id) {
    contextParams.variants = {
      calculated_price: QueryContext({
        ...(currency_code && { currency_code }),
        ...(region_id && { region_id })
      })
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
      ...(currency_code || region_id
        ? ['variants.calculated_price.*']
        : []),
      'categories.*',
      'collection.*',
      'type.*',
      'tags.*',
      'seller.*'
    ],
    filters: {
      id: productIds
    },
    ...(Object.keys(contextParams).length > 0 && { context: contextParams })
  })

  const productMap = new Map(products.map((p) => [p.id, p]))
  const orderedProducts = productIds
    .map((id) => productMap.get(id))
    .filter(Boolean)

  res.json({
    products: orderedProducts,
    nbHits: algoliaResult.nbHits,
    page: algoliaResult.page,
    nbPages: algoliaResult.nbPages,
    hitsPerPage: algoliaResult.hitsPerPage,
    facets: algoliaResult.facets,
    facets_stats: algoliaResult.facets_stats,
    processingTimeMS: algoliaResult.processingTimeMS,
    query: algoliaResult.query
  })
}

