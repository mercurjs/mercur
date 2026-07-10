import { MedusaResponse, MedusaStoreRequest } from "@medusajs/framework/http"
import { MercurModules } from "@mercurjs/types"

import type SearchModuleService from "../../../modules/search/service"
import { SearchQueryFilters } from "../../../modules/search/types"
import {
  buildSearchFilters,
  buildSearchSort,
} from "../../../modules/search/utils"
import { StoreGetSearchParamsType } from "./validators"

export const GET = async (
  req: MedusaStoreRequest<StoreGetSearchParamsType>,
  res: MedusaResponse
) => {
  const searchService = req.scope.resolve<SearchModuleService>(
    MercurModules.SEARCH
  )

  // z.infer over the createFindParams-merged validator widens fields to
  // `unknown`, so (like the offers/products routes) read the structured
  // filterable fields and let the module map them.
  const query = req.filterableFields as unknown as SearchQueryFilters & {
    facets?: boolean
  }
  const filters = buildSearchFilters(query)
  const sort = buildSearchSort(req.queryConfig.pagination.order)

  const skip = req.queryConfig.pagination.skip ?? 0
  const take = req.queryConfig.pagination.take ?? 20

  const { products, count } = await searchService.search({
    q: query.q,
    region_id: query.region_id,
    filters,
    sort,
    pagination: { skip, take },
  })

  const body: Record<string, unknown> = {
    products,
    count,
    offset: skip,
    limit: take,
  }

  if (query.facets) {
    body.facets = await searchService.getFacets({
      q: query.q,
      region_id: query.region_id,
      filters,
    })
  }

  res.json(body)
}
