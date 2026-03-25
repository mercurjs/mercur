import { MeiliSearch } from 'meilisearch'

import { IndexType, MeilisearchEntity, MeilisearchSearchResult } from './types'

type ModuleOptions = {
  host: string
  apiKey: string
}

const SEARCHABLE_ATTRIBUTES = [
  'title',
  'subtitle',
  'description',
  'tags.value',
  'type.value',
  'categories.name',
  'collection.title',
  'variants.title',
  'seller.name',
  'seller.handle',
]

const FILTERABLE_ATTRIBUTES = [
  'seller.status',
  'seller.handle',
  'categories.id',
  'categories.name',
  'variants.prices.amount',
  'status',
]

const SORTABLE_ATTRIBUTES = ['title', 'variants.prices.amount']

class MeilisearchModuleService {
  private client_: MeiliSearch

  constructor(_: unknown, options: ModuleOptions) {
    if (!options?.host || !options?.apiKey) {
      const missing = [
        !options?.host && 'MEILISEARCH_HOST',
        !options?.apiKey && 'MEILISEARCH_API_KEY',
      ]
        .filter(Boolean)
        .join(', ')
      throw new Error(
        `[meilisearch block] Missing required environment variables: ${missing}`
      )
    }
    this.client_ = new MeiliSearch({
      host: options.host,
      apiKey: options.apiKey,
    })
  }

  getHost(): string {
    return (this.client_ as any).config?.host ?? ''
  }

  async getStatus(): Promise<{ documentCount: number; isHealthy: boolean }> {
    try {
      const index = this.client_.index(IndexType.PRODUCT)
      const stats = await index.getStats()
      return { documentCount: stats.numberOfDocuments, isHealthy: true }
    } catch {
      return { documentCount: 0, isHealthy: false }
    }
  }

  async batchUpsert(documents: MeilisearchEntity[]): Promise<void> {
    if (!documents.length) {
      return
    }
    const index = this.client_.index(IndexType.PRODUCT)
    await index.addDocuments(documents, { primaryKey: 'id' })
  }

  async batchDelete(ids: string[]): Promise<void> {
    if (!ids.length) {
      return
    }
    const index = this.client_.index(IndexType.PRODUCT)
    await index.deleteDocuments(ids)
  }

  async search(
    query: string,
    options: Record<string, unknown>
  ): Promise<MeilisearchSearchResult> {
    const index = this.client_.index(IndexType.PRODUCT)
    const result = await index.search(query, options)
    return {
      hits: (result.hits ?? []) as Array<{ id: string }>,
      totalHits: result.totalHits ?? result.estimatedTotalHits ?? 0,
      page: result.page ?? 0,
      totalPages: result.totalPages ?? 0,
      hitsPerPage: result.hitsPerPage ?? 0,
      processingTimeMs: result.processingTimeMs,
      query: result.query,
      facetDistribution: result.facetDistribution,
    }
  }

  async ensureSettings(): Promise<void> {
    const index = this.client_.index(IndexType.PRODUCT)
    await index.updateSettings({
      searchableAttributes: SEARCHABLE_ATTRIBUTES,
      filterableAttributes: FILTERABLE_ATTRIBUTES,
      sortableAttributes: SORTABLE_ATTRIBUTES,
    })
  }
}

export default MeilisearchModuleService
