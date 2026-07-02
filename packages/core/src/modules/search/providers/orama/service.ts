import {
  AnyOrama,
  create,
  insertMultiple,
  removeMultiple,
  search as oramaSearch,
} from "@orama/orama"
import {
  SearchDoc,
  SearchFacetAttribute,
  SearchFacetValue,
  SearchResults,
} from "@mercurjs/types"

import { AbstractSearchProvider } from "../../abstract-search-provider"
import { OramaSearchQuery } from "./types"

const SEARCH_SCHEMA = {
  type: "enum",
  title: "string",
  description: "string",
  handle: "string",
  sku: "string",
  seller_handle: "enum",
  collection_id: "enum",
  category_ids: "enum[]",
  product_id: "enum",
  variant_id: "enum",
  attribute_tokens: "enum[]",
} as const

const SEARCHABLE_PROPERTIES = ["title", "description", "handle", "sku"]

// In-memory index living in the API process's RAM — it starts empty and needs a
// reindex to populate. id → label maps are kept at index time so `search` can
// label facets without a second lookup.
export class OramaSearchProvider extends AbstractSearchProvider {
  static identifier = "search-orama"

  protected readonly db_: AnyOrama

  protected readonly collectionLabels_ = new Map<string, string>()
  protected readonly categoryLabels_ = new Map<string, string>()
  protected readonly attributeHandleLabels_ = new Map<string, string>()
  protected readonly attributeValueLabels_ = new Map<string, string>()

  constructor() {
    super()
    this.db_ = create({ schema: SEARCH_SCHEMA })
  }

  private recordLabels_(docs: SearchDoc[]): void {
    for (const doc of docs) {
      if (doc.collection_id && doc.collection) {
        this.collectionLabels_.set(doc.collection_id, doc.collection)
      }
      const ids = doc.category_ids ?? []
      const labels = doc.categories ?? []
      ids.forEach((id, i) => {
        if (labels[i]) {
          this.categoryLabels_.set(id, labels[i])
        }
      })
      for (const attribute of doc.attributes ?? []) {
        this.attributeHandleLabels_.set(attribute.handle, attribute.name)
        for (const value of attribute.values) {
          this.attributeValueLabels_.set(value.id, value.name)
        }
      }
    }
  }

  async index(docs: SearchDoc[]): Promise<void> {
    if (!docs.length) {
      return
    }
    this.recordLabels_(docs)
    await removeMultiple(
      this.db_,
      docs.map((doc) => doc.id)
    )
    await insertMultiple(
      this.db_,
      docs as unknown as Parameters<typeof insertMultiple>[1]
    )
  }

  async remove(ids: string[]): Promise<void> {
    if (!ids.length) {
      return
    }
    await removeMultiple(this.db_, ids)
  }

  async search(query: OramaSearchQuery): Promise<SearchResults> {
    const filters = query.filters ?? {}
    const term = query.q?.trim()

    const where: Record<string, unknown> = {}
    if (filters.type) {
      where.type = { eq: filters.type }
    }
    if (filters.seller_handle) {
      where.seller_handle = { eq: filters.seller_handle }
    }
    if (filters.collection_ids?.length) {
      where.collection_id = { in: filters.collection_ids }
    }
    if (filters.category_ids?.length) {
      where.category_ids = { containsAny: filters.category_ids }
    }
    if (filters.attributes) {
      const tokens = Object.entries(filters.attributes).flatMap(
        ([handle, valueIds]) =>
          valueIds.map((valueId) => `attr:${handle}:${valueId}`)
      )
      if (tokens.length) {
        where.attribute_tokens = { containsAny: tokens }
      }
    }

    const result = await oramaSearch(this.db_, {
      term: term || undefined,
      properties: term ? SEARCHABLE_PROPERTIES : undefined,
      where: where as never,
      limit: query.limit ?? 12,
      offset: query.offset ?? 0,
      threshold: 0,
      facets: {
        collection_id: { limit: 200 },
        category_ids: { limit: 200 },
        attribute_tokens: { limit: 1000 },
      } as never,
    })

    const regionId = (query.context?.region_id ?? undefined) as
      | string
      | undefined
    const hits = result.hits.map((hit) => {
      const doc = hit.document as unknown as SearchDoc
      const price =
        regionId && doc.prices?.[regionId] ? doc.prices[regionId] : null
      return { ...doc, calculated_price: price }
    })

    return {
      hits,
      count: result.count,
      facets: {
        collections: this.toFacetValues_(
          result.facets?.collection_id?.values,
          this.collectionLabels_
        ),
        categories: this.toFacetValues_(
          result.facets?.category_ids?.values,
          this.categoryLabels_
        ),
        attributes: this.toAttributeFacets_(
          result.facets?.attribute_tokens?.values
        ),
      },
    }
  }

  private toFacetValues_(
    values: Record<string, number> | undefined,
    labels: Map<string, string>
  ): SearchFacetValue[] {
    return Object.entries(values ?? {}).map(([id, count]) => ({
      id,
      label: labels.get(id) ?? id,
      count,
    }))
  }

  private toAttributeFacets_(
    values: Record<string, number> | undefined
  ): SearchFacetAttribute[] {
    const byHandle = new Map<string, SearchFacetValue[]>()

    for (const [token, count] of Object.entries(values ?? {})) {
      const [, handle, valueId] = token.split(":")
      if (!handle || !valueId) {
        continue
      }
      const group = byHandle.get(handle) ?? []
      group.push({
        id: valueId,
        label: this.attributeValueLabels_.get(valueId) ?? valueId,
        count,
      })
      byHandle.set(handle, group)
    }

    return [...byHandle.entries()].map(([handle, valuesForHandle]) => ({
      handle,
      label: this.attributeHandleLabels_.get(handle) ?? handle,
      values: valuesForHandle,
    }))
  }
}
