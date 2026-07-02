import { MedusaContainer } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { MercurModules } from "@mercurjs/types"

import type SearchModuleService from "../services/search-module-service"
import { searchProductFields, SearchProductRow } from "./build-docs"
import { indexProductPage, loadRegions } from "./reindex"

const resolveSearch = (container: MedusaContainer): SearchModuleService =>
  container.resolve<SearchModuleService>(MercurModules.SEARCH)

const uniq = (ids: (string | undefined | null)[]): string[] =>
  Array.from(new Set(ids.filter((id): id is string => Boolean(id))))

const offerIdsForProducts = async (
  container: MedusaContainer,
  productIds: string[]
): Promise<string[]> => {
  if (!productIds.length) {
    return []
  }
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const { data: offers } = await query.graph({
    entity: "offer",
    fields: ["id"],
    filters: { product_id: productIds },
  })
  return offers.map((o: { id: string }) => o.id)
}

export const removeProductAndOffers = async (
  container: MedusaContainer,
  productIds: string[],
  search: SearchModuleService = resolveSearch(container)
): Promise<void> => {
  const ids = uniq(productIds)
  if (!ids.length) {
    return
  }
  const offerIds = await offerIdsForProducts(container, ids)
  await search.remove([...ids, ...offerIds])
}

export const removeOfferDocs = async (
  container: MedusaContainer,
  offerIds: string[],
  search: SearchModuleService = resolveSearch(container)
): Promise<void> => {
  const ids = uniq(offerIds)
  if (ids.length) {
    await search.remove(ids)
  }
}

export const reindexProductsById = async (
  container: MedusaContainer,
  productIds: string[],
  search: SearchModuleService = resolveSearch(container)
): Promise<void> => {
  const ids = uniq(productIds)
  if (!ids.length) {
    return
  }

  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const { data: products } = await query.graph({
    entity: "product",
    fields: searchProductFields,
    filters: { id: ids, status: "published" },
  })

  const publishedIds = new Set(products.map((p: { id: string }) => p.id))
  const staleIds = ids.filter((id) => !publishedIds.has(id))

  if (products.length) {
    const regions = await loadRegions(container)
    await indexProductPage(
      container,
      search,
      products as SearchProductRow[],
      regions
    )
  }

  if (staleIds.length) {
    await removeProductAndOffers(container, staleIds, search)
  }
}

export const offersForSeller = async (
  container: MedusaContainer,
  sellerId: string
): Promise<{ offerIds: string[]; productIds: string[] }> => {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const { data: offers } = await query.graph({
    entity: "offer",
    fields: ["id", "product_id"],
    filters: { seller_id: sellerId },
  })
  return {
    offerIds: uniq(offers.map((o: { id: string }) => o.id)),
    productIds: uniq(
      offers.map((o: { product_id?: string }) => o.product_id)
    ),
  }
}
