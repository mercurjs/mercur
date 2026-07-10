import {
  InjectManager,
  MedusaContext,
  MedusaService,
} from "@medusajs/framework/utils"
import { Context } from "@medusajs/framework/types"
import { SqlEntityManager } from "@medusajs/framework/mikro-orm/postgresql"

import { SearchProduct, SearchProductPrice } from "./models"
import { computeFacets, searchProducts } from "./repositories/search"
import {
  FacetParams,
  FacetResult,
  SearchParams,
  SearchProductInput,
  SearchResult,
} from "./types"

// MedusaService types model.json() columns as Record<string, unknown>; our
// jsonb columns hold arrays/maps, so write payloads are cast through this shape.
type SearchProductWritePayload = Record<string, unknown>

class SearchModuleService extends MedusaService({
  SearchProduct,
  SearchProductPrice,
}) {
  private getKnex(sharedContext: Context) {
    const { baseRepository_ } = this as unknown as {
      baseRepository_: { getActiveManager<T>(context?: Context): T }
    }
    const manager =
      baseRepository_.getActiveManager<SqlEntityManager>(sharedContext)
    return manager.getKnex()
  }

  @InjectManager()
  async search(
    params: SearchParams,
    @MedusaContext() sharedContext: Context = {}
  ): Promise<SearchResult> {
    return searchProducts(this.getKnex(sharedContext), params)
  }

  @InjectManager()
  async getFacets(
    params: FacetParams,
    @MedusaContext() sharedContext: Context = {}
  ): Promise<FacetResult> {
    return computeFacets(this.getKnex(sharedContext), params)
  }

  @InjectManager()
  async upsertProducts(
    inputs: SearchProductInput[],
    @MedusaContext() sharedContext: Context = {}
  ): Promise<void> {
    if (!inputs.length) {
      return
    }

    const productIds = inputs.map((input) => input.product_id)
    const existing = await this.listSearchProducts(
      { product_id: productIds },
      { select: ["id", "product_id"] },
      sharedContext
    )
    const existingByProductId = new Map(
      existing.map((row) => [row.product_id, row.id])
    )

    for (const input of inputs) {
      const prices = input.prices ?? []
      const amounts = prices.flatMap((p) => [p.min_amount, p.max_amount])
      const doc = {
        product_id: input.product_id,
        title: input.title,
        handle: input.handle,
        description: input.description ?? null,
        thumbnail: input.thumbnail ?? null,
        status: input.status,
        collection_id: input.collection_id ?? null,
        type_id: input.type_id ?? null,
        category_ids: input.category_ids ?? [],
        tag_ids: input.tag_ids ?? [],
        seller_ids: input.seller_ids ?? [],
        variant_skus: input.variant_skus ?? [],
        attributes: input.attributes ?? {},
        search_text: (input.variant_skus ?? []).join(" "),
        min_amount: amounts.length ? Math.min(...amounts) : null,
        max_amount: amounts.length ? Math.max(...amounts) : null,
        metadata: input.metadata ?? null,
      }

      const existingId = existingByProductId.get(input.product_id)
      let searchProductId: string

      if (existingId) {
        await this.updateSearchProducts(
          { id: existingId, ...doc } as unknown as SearchProductWritePayload,
          sharedContext
        )
        searchProductId = existingId
        await this.deleteSearchProductPricesByProductId_(
          existingId,
          sharedContext
        )
      } else {
        const created = await this.createSearchProducts(
          doc as unknown as SearchProductWritePayload,
          sharedContext
        )
        searchProductId = created.id
      }

      if (prices.length) {
        await this.createSearchProductPrices(
          prices.map((price) => ({
            product_id: searchProductId,
            region_id: price.region_id,
            currency_code: price.currency_code,
            min_amount: price.min_amount,
            max_amount: price.max_amount,
          })),
          sharedContext
        )
      }
    }
  }

  @InjectManager()
  async deleteProducts(
    productIds: string[],
    @MedusaContext() sharedContext: Context = {}
  ): Promise<void> {
    if (!productIds.length) {
      return
    }
    const existing = await this.listSearchProducts(
      { product_id: productIds },
      { select: ["id"] },
      sharedContext
    )
    if (!existing.length) {
      return
    }
    await this.deleteSearchProducts(
      existing.map((row) => row.id),
      sharedContext
    )
  }

  private async deleteSearchProductPricesByProductId_(
    searchProductId: string,
    sharedContext: Context
  ): Promise<void> {
    const prices = await this.listSearchProductPrices(
      { product_id: searchProductId },
      { select: ["id"] },
      sharedContext
    )
    if (prices.length) {
      await this.deleteSearchProductPrices(
        prices.map((row) => row.id),
        sharedContext
      )
    }
  }
}

export default SearchModuleService
