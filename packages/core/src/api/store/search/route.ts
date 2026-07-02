import { MedusaResponse, MedusaStoreRequest } from "@medusajs/framework/http"
import { MedusaPricingContext } from "@medusajs/framework/types"
import { MercurModules, SearchResults } from "@mercurjs/types"

import SearchModuleService from "../../../modules/search/services/search-module-service"
import { StoreSearchType } from "./validators"

type StoreSearchRequest = MedusaStoreRequest<StoreSearchType> & {
  pricingContext?: MedusaPricingContext
}

export const POST = async (
  req: StoreSearchRequest,
  res: MedusaResponse
) => {
  const search = req.scope.resolve<SearchModuleService>(MercurModules.SEARCH)
  const body = req.validatedBody

  const result: SearchResults = await search.search({
    q: body.q,
    limit: body.limit,
    offset: body.offset,
    // Pricing context is built by middleware (`setSearchPricingContext`),
    // inspired by the `/store/products` chain — not trusted from the raw body.
    // The provider projects each hit's `calculated_price` from it.
    context: req.pricingContext,
    // Passed through to the active provider verbatim. Suspended/unpublished
    // content is excluded at index time (`reindexAll`), not query-time.
    filters: body.filters,
  })

  res.json({
    hits: result.hits,
    count: result.count,
    limit: body.limit,
    offset: body.offset,
    facets: result.facets,
  })
}
