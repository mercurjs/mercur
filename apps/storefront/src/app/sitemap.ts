import type { MetadataRoute } from "next"

import { listCategories } from "@/lib/data/categories"
import { listCollections } from "@/lib/data/collections"
import { listProducts } from "@/lib/data/products"
import { listRegions } from "@/lib/data/regions"
import { listSellers } from "@/lib/data/seller"
import {
  buildCatalogSitemapEntries,
  resolveBaseUrl,
  type CatalogHandle,
} from "@/lib/helpers/seo"
import {
  getStorefrontLocales,
  resolveXDefaultLocale,
} from "@/lib/helpers/hreflang"

const PAGE_SIZE = 100
const MAX_PAGES = 50

const paginateHandles = async (
  fetchPage: (
    page: number
  ) => Promise<{ items: CatalogHandle[]; nextPage: number | null }>
): Promise<CatalogHandle[]> => {
  const handles: CatalogHandle[] = []
  let page = 1

  while (page <= MAX_PAGES) {
    const { items, nextPage } = await fetchPage(page)
    handles.push(...items)
    if (!nextPage) {
      break
    }
    page = nextPage
  }

  return handles
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = resolveBaseUrl()

  let locales: string[] = []
  try {
    locales = getStorefrontLocales(await listRegions())
  } catch {
    locales = []
  }

  if (!locales.length) {
    locales = [resolveXDefaultLocale([])]
  }

  const countryCode = locales[0]

  const [products, categories, collections, sellers] = await Promise.all([
    paginateHandles(async (page) => {
      const { response, nextPage } = await listProducts({
        countryCode,
        pageParam: page,
        queryParams: { limit: PAGE_SIZE, fields: "handle,updated_at" },
      })
      return {
        items: response.products
          .filter((product) => Boolean(product.handle))
          .map((product) => ({
            handle: product.handle as string,
            updatedAt: product.updated_at,
          })),
        nextPage,
      }
    }).catch(() => [] as CatalogHandle[]),
    listCategories()
      .then(({ parentCategories, categories: nested }) => {
        const all = [...parentCategories, ...nested]
        return all
          .filter((category) => Boolean(category.handle))
          .map((category) => ({ handle: category.handle }))
      })
      .catch(() => [] as CatalogHandle[]),
    listCollections({ limit: "100" })
      .then(({ collections: rows }) =>
        rows
          .filter((collection) => Boolean(collection.handle))
          .map((collection) => ({
            handle: collection.handle as string,
            updatedAt: collection.updated_at,
          }))
      )
      .catch(() => [] as CatalogHandle[]),
    paginateHandles(async (page) => {
      const offset = (page - 1) * PAGE_SIZE
      const { sellers: rows, count } = await listSellers({
        limit: PAGE_SIZE,
        offset,
      })
      return {
        items: rows
          .filter((seller) => Boolean(seller.handle))
          .map((seller) => ({ handle: seller.handle })),
        nextPage: count > offset + PAGE_SIZE ? page + 1 : null,
      }
    }).catch(() => [] as CatalogHandle[]),
  ])

  return buildCatalogSitemapEntries({
    baseUrl,
    locales,
    products,
    categories,
    collections,
    sellers,
  })
}
