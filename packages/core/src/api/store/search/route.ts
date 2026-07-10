import { MedusaResponse, MedusaStoreRequest } from "@medusajs/framework/http"
import { promiseAll } from "@medusajs/framework/utils"
import { MercurModules } from "@mercurjs/types"

import type SearchModuleService from "../../../modules/search/service"
import {
  buildSearchFilters,
  buildSearchSort,
} from "../../../modules/search/utils"
import { SearchQueryFilters } from "../../../modules/search/validators"
import { StoreGetSearchParamsType } from "./validators"

export const GET = async (
  req: MedusaStoreRequest<StoreGetSearchParamsType>,
  res: MedusaResponse
) => {
  const searchService = req.scope.resolve<SearchModuleService>(
    MercurModules.SEARCH
  )

  const query = req.filterableFields as unknown as SearchQueryFilters
  const filters = buildSearchFilters(query)
  const sort = buildSearchSort(req.queryConfig.pagination.order)

  const skip = req.queryConfig.pagination.skip ?? 0
  const take = req.queryConfig.pagination.take ?? 20

  const searchResult = searchService.search({
    q: query.q,
    region_id: query.region_id,
    filters,
    sort,
    pagination: { skip, take },
  })
  const facetsResult = searchService.getFacets({
    q: query.q,
    region_id: query.region_id,
    filters,
  })

  await promiseAll([searchResult, facetsResult])
  const { products, count } = await searchResult
  const facets = await facetsResult

  res.json({
    products,
    count,
    offset: skip,
    limit: take,
    facets,
  })
}
