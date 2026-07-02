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

import { promiseAll } from "@medusajs/framework/utils"

import { AbstractSearchProvider } from "../../abstract-search-provider"
import { OramaSearchQuery } from "./types"

type SearchFilters = NonNullable<OramaSearchQuery["filters"]>

type FacetSkip = {
  collection?: boolean
  category?: boolean
  attrHandle?: string
  allAttributes?: boolean
}

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
const FACET_LIMIT = 200
const ATTRIBUTE_FACET_LIMIT = 1000

const attributeToken = (handle: string, valueId: string): string =>
  `attr:${handle}:${valueId}`

// The in-memory index starts empty and is populated by a reindex; id → label
// maps back the labelled facets, since Orama's facet distributions are id-keyed.
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
    const term = query.q?.trim() || undefined
    const regionId = (query.context?.region_id ?? undefined) as
      | string
      | undefined

    const result = await oramaSearch(this.db_, {
      term,
      properties: term ? SEARCHABLE_PROPERTIES : undefined,
      where: this.buildWhere_(filters, {}) as never,
      limit: query.limit ?? 12,
      offset: query.offset ?? 0,
      threshold: 0,
    })

    const hits = result.hits.map((hit) => {
      const doc = hit.document as unknown as SearchDoc
      const price =
        regionId && doc.prices?.[regionId] ? doc.prices[regionId] : null
      return { ...doc, calculated_price: price }
    })

    const [collections, categories, attributes] = await promiseAll([
      this.facetValues_(
        term,
        filters,
        { collection: true },
        "collection_id"
      ).then((values) => this.toFacetValues_(values, this.collectionLabels_)),
      this.facetValues_(term, filters, { category: true }, "category_ids").then(
        (values) => this.toFacetValues_(values, this.categoryLabels_)
      ),
      this.attributeFacets_(term, filters),
    ])

    return {
      hits,
      count: result.count,
      facets: { collections, categories, attributes },
    }
  }

  // One `containsAny` clause per attribute handle under `and` gives OR within a
  // handle and AND across handles (Orama `and` intersects its clauses). `skip`
  // drops a facet's own clause for disjunctive faceting.
  private buildWhere_(
    filters: SearchFilters,
    skip: FacetSkip
  ): Record<string, unknown> {
    const clauses: Record<string, unknown>[] = []

    if (filters.type) {
      clauses.push({ type: { eq: filters.type } })
    }
    if (filters.seller_handle) {
      clauses.push({ seller_handle: { eq: filters.seller_handle } })
    }
    if (!skip.collection && filters.collection_ids?.length) {
      clauses.push({ collection_id: { in: filters.collection_ids } })
    }
    if (!skip.category && filters.category_ids?.length) {
      clauses.push({ category_ids: { containsAny: filters.category_ids } })
    }
    if (filters.attributes && !skip.allAttributes) {
      for (const [handle, valueIds] of Object.entries(filters.attributes)) {
        if (skip.attrHandle === handle || !valueIds.length) {
          continue
        }
        clauses.push({
          attribute_tokens: {
            containsAny: valueIds.map((valueId) =>
              attributeToken(handle, valueId)
            ),
          },
        })
      }
    }

    if (!clauses.length) {
      return {}
    }
    if (clauses.length === 1) {
      return clauses[0]
    }
    return { and: clauses }
  }

  private async facetValues_(
    term: string | undefined,
    filters: SearchFilters,
    skip: FacetSkip,
    field: "collection_id" | "category_ids" | "attribute_tokens"
  ): Promise<Record<string, number>> {
    const limit =
      field === "attribute_tokens" ? ATTRIBUTE_FACET_LIMIT : FACET_LIMIT
    // Facets are computed over the whole matched set regardless of `limit`, so a
    // single hit keeps the payload minimal.
    const result = await oramaSearch(this.db_, {
      term,
      properties: term ? SEARCHABLE_PROPERTIES : undefined,
      where: this.buildWhere_(filters, skip) as never,
      limit: 1,
      threshold: 0,
      facets: { [field]: { limit } } as never,
    })
    return (result.facets?.[field]?.values ?? {}) as Record<string, number>
  }

  private async attributeFacets_(
    term: string | undefined,
    filters: SearchFilters
  ): Promise<SearchFacetAttribute[]> {
    const universe = await this.facetValues_(
      term,
      filters,
      { allAttributes: true },
      "attribute_tokens"
    )
    const handles = new Set<string>()
    for (const token of Object.keys(universe)) {
      const [, handle] = token.split(":")
      if (handle) {
        handles.add(handle)
      }
    }

    const facets = await promiseAll(
      [...handles].map(async (handle) => {
        const values = await this.facetValues_(
          term,
          filters,
          { attrHandle: handle },
          "attribute_tokens"
        )
        const facetValues: SearchFacetValue[] = []
        for (const [token, count] of Object.entries(values)) {
          const [, tokenHandle, valueId] = token.split(":")
          if (tokenHandle !== handle || !valueId) {
            continue
          }
          facetValues.push({
            id: valueId,
            label: this.attributeValueLabels_.get(valueId) ?? valueId,
            count,
          })
        }
        return {
          handle,
          label: this.attributeHandleLabels_.get(handle) ?? handle,
          values: facetValues,
        }
      })
    )

    return facets.filter((facet) => facet.values.length)
  }

  private toFacetValues_(
    values: Record<string, number>,
    labels: Map<string, string>
  ): SearchFacetValue[] {
    // Docs without a collection/category are bucketed under an empty enum key;
    // drop that bucket so it never surfaces as a blank facet option.
    return Object.entries(values)
      .filter(([id]) => id)
      .map(([id, count]) => ({
        id,
        label: labels.get(id) ?? id,
        count,
      }))
  }
}
