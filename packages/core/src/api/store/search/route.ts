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

  const page = body.page
  const hitsPerPage = body.hitsPerPage

  const result: SearchResults = await search.search({
    q: body.query,
    limit: hitsPerPage,
    offset: (page - 1) * hitsPerPage,
    // Pricing context is built by middleware (`setSearchPricingContext`),
    // inspired by the `/store/products` chain — not trusted from the raw body.
    // The provider projects each hit's `calculated_price` from it.
    context: req.pricingContext,
    // Force the seller-status invariant server-side, independent of any client
    // filter — suspended-seller content never surfaces.
    filters: { ...(body.filters ?? {}), seller_status: "open" },
  })

  res.json({
    hits: result.hits,
    count: result.count,
    page,
    hitsPerPage,
    query: body.query,
    facets: result.facets,
  })
}
