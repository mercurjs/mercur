import { MedusaContainer } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { MercurModules } from "@mercurjs/types"

import SearchModuleService from "../services/search-module-service"
import {
  buildOfferDocs,
  buildProductDocs,
  SearchProductRow,
  SearchRegion,
  searchOfferFields,
  searchProductFields,
} from "./build-docs"

const PAGE_SIZE = 100

const loadRegions = async (
  container: MedusaContainer
): Promise<SearchRegion[]> => {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const { data } = await query.graph({
    entity: "region",
    fields: ["id", "currency_code", "automatic_taxes", "countries.iso_2"],
  })
  return data as SearchRegion[]
}

// Requires the app container (cross-module `query.graph` + the resolved search
// module), so it runs from a route/subscriber/script, not module init.
export const reindexAll = async (container: MedusaContainer): Promise<void> => {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const search = container.resolve<SearchModuleService>(MercurModules.SEARCH)

  const regions = await loadRegions(container)

  let skip = 0
  for (;;) {
    const { data: products, metadata } = await query.graph({
      entity: "product",
      fields: searchProductFields,
      filters: { status: "published" },
      pagination: { skip, take: PAGE_SIZE },
    })

    if (!products.length) {
      break
    }

    await indexProductPage(
      container,
      search,
      products as SearchProductRow[],
      regions
    )

    skip += PAGE_SIZE
    const count = metadata?.count ?? 0
    if (skip >= count) {
      break
    }
  }
}

export const indexProductPage = async (
  container: MedusaContainer,
  search: SearchModuleService,
  products: SearchProductRow[],
  regions: SearchRegion[]
): Promise<void> => {
  const { docs: productDocs, attributesByProduct } = await buildProductDocs(
    container,
    products,
    regions
  )

  if (!productDocs.length) {
    return
  }

  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const productIds = productDocs.map((doc) => doc.id)
  const productById = new Map<string, SearchProductRow>(
    products.map((product) => [product.id, product])
  )

  const { data: offers } = await query.graph({
    entity: "offer",
    fields: searchOfferFields,
    filters: { product_id: productIds },
  })

  const offerDocs = await buildOfferDocs(container, offers, regions, {
    productById,
    attributesByProduct,
  })

  await search.index([...productDocs, ...offerDocs])
}
